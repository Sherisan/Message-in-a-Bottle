using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Worldiator.Server.Application;
using Worldiator.Server.Contracts;
using Worldiator.Server.Domain;

namespace Worldiator.Server.Presentation.Controllers;

/// <summary>
/// Frontend-facing play API for games that use this API's RNG (crash / slot / prediction).
/// The game is the one the player's session token was launched for — never a client parameter.
/// </summary>
[ApiController]
[Route("api/play")]
[Authorize]
public class PlayController(IGameRegistry games, IGameRngService rng, PlayService play, WalletService wallet, ICrabBonusService crab) : ControllerBase
{
    /// <summary>What the frontend needs to render the game: model, limits, paytable/options, fairness.</summary>
    [HttpGet("info")]
    public IActionResult Info()
    {
        var (player, game, error) = Resolve();
        if (error != null) return error;

        var settings = game!.Rng!;
        var (hash, previous) = rng.GetSeedInfo(game);
        return Ok(new
        {
            game.GameId,
            game.Name,
            Type      = game.Type.ToString(),
            Model     = settings.Model.ToString(),
            game.MinBet,
            game.MaxBet,
            game.MaxWin,
            Rtp       = Math.Round(settings.Rtp, 4),
            Currency  = player!.Currency,
            Outcomes  = settings.Model == RngModel.Multiplier ? settings.Outcomes.Select(o => o.Multiplier).Order() : null,
            Options   = settings.Model == RngModel.Pick ? settings.Options.Select(o => new { o.Key, o.Payout }) : null,
            MaxTarget = settings.Model == RngModel.Target ? settings.MaxMultiplier : (decimal?)null,
            Card      = settings.Card,
            Stakes    = settings.Stakes.Length > 0 ? settings.Stakes : null,
            // Published odds for the help screen: each prize and its chance per card.
            PrizeTable = settings.Model == RngModel.Multiplier
                ? settings.Outcomes.Where(o => o.Multiplier > 0).OrderBy(o => o.Multiplier).Select(o => new
                  {
                      o.Multiplier,
                      Chance = Math.Round((decimal)o.Weight / settings.Outcomes.Sum(x => (decimal)x.Weight), 8),
                  })
                : null,
            Fairness  = new { CurrentServerSeedHash = hash, PreviousServerSeed = previous },
        });
    }

    [HttpPost]
    public async Task<IActionResult> Play([FromBody] PlayRequest body)
    {
        var (player, game, error) = Resolve();
        if (error != null) return error;

        var (result, failure) = await play.PlayAsync(game!, player!, body);
        if (result != null) crab.Register(game!, player!, result);
        return result != null ? Ok(result) : WalletController.ErrorResponse(this, failure!);
    }

    /// <summary>Attempts the one crab catch for a settled bottle round.</summary>
    [HttpPost("crab/catch")]
    public async Task<IActionResult> CatchCrab([FromBody] CrabCatchRequest body)
    {
        var (player, game, error) = Resolve();
        if (error != null) return error;
        if (string.IsNullOrWhiteSpace(body.RoundId))
            return BadRequest(new { error = "roundId is required.", code = "INVALID_ROUND" });

        var outcome = crab.TryCatch(game!, player!, body.RoundId);
        if (outcome == null)
            return NotFound(new { error = "That bottle round is no longer available for a crab catch.", code = "ROUND_NOT_FOUND" });

        if (outcome.BonusWin > 0)
        {
            var credit = await wallet.CreditAsync(game!, player!, body.RoundId,
                $"{body.RoundId}-crab", outcome.BonusWin);
            if (!credit.Ok) return WalletController.ErrorResponse(this, credit);
            return Ok(outcome with { Balance = credit.Balance });
        }

        return Ok(outcome);
    }

    private (PlayerSession? Player, GameDefinition? Game, IActionResult? Error) Resolve()
    {
        var player = SessionTokenService.FromPrincipal(User);
        if (player == null) return (null, null, Unauthorized());

        var game = games.Find(player.GameId);
        // Only Instant games play per-request; live / Margin Call games draw from the same RNG inside their engines.
        if (game?.Rng == null || game.Engine != EngineKind.Instant)
            return (null, null, NotFound(new { error = "This game doesn't play through this API.", code = "NOT_PLAYABLE" }));
        return (player, game, null);
    }
}

/// <summary>Identifies the bottle round whose crab is being caught.</summary>
public sealed record CrabCatchRequest(string RoundId);
