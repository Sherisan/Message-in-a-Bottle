using System.Security.Cryptography;
using Worldiator.Server.Domain;

namespace Worldiator.Server.Application;

/// <summary>Result of attempting to catch the beach crab.</summary>
public sealed record CrabCatchResult(bool Caught, decimal BonusMultiplier, decimal BonusWin, decimal? Balance);

/// <summary>Tracks the one crab attempt allowed for each bottle round.</summary>
public interface ICrabBonusService
{
    void Register(GameDefinition game, PlayerSession player, PlayResult result);
    CrabCatchResult? TryCatch(GameDefinition game, PlayerSession player, string roundId);
}

/// <summary>
/// Process-local side-bonus state for the instant game. The wallet credit remains
/// idempotent, so retries cannot pay the crab bonus twice.
/// </summary>
public sealed class CrabBonusService : ICrabBonusService
{
    private const string GameId = "message-in-a-bottle";
    private const decimal BonusMultiplier = 2m;
    // TEMPORARY TEST MODE: guarantee a successful catch so the bonus flow can be viewed.
    // Restore this to 55 after testing the caught-crab experience.
    private const int CatchChancePercent = 100;
    private readonly object gate = new();
    private readonly Dictionary<string, PendingCrab> rounds = new();

    public void Register(GameDefinition game, PlayerSession player, PlayResult result)
    {
        if (!string.Equals(game.GameId, GameId, StringComparison.OrdinalIgnoreCase)) return;
        lock (gate)
        {
            rounds[Key(player, result.RoundId)] = new PendingCrab(result.Stake, result.Multiplier, result.Win, game.MaxWin);
        }
    }

    public CrabCatchResult? TryCatch(GameDefinition game, PlayerSession player, string roundId)
    {
        if (!string.Equals(game.GameId, GameId, StringComparison.OrdinalIgnoreCase)) return null;
        lock (gate)
        {
            if (!rounds.TryGetValue(Key(player, roundId), out var round)) return null;
            if (round.Resolved is not null) return round.Resolved;

            var caught = RandomNumberGenerator.GetInt32(100) < CatchChancePercent;
            var bonus = caught && round.BaseMultiplier > 0 ? BonusMultiplier : 1m;
            var grossBonus = caught ? round.Stake * round.BaseMultiplier * (bonus - 1m) : 0m;
            var bonusWin = Math.Min(Math.Round(grossBonus, 2, MidpointRounding.ToZero),
                Math.Max(0m, round.MaxWin - round.BaseWin));
            round.Resolved = new CrabCatchResult(caught, bonus, bonusWin, null);
            return round.Resolved;
        }
    }

    private static string Key(PlayerSession player, string roundId) => $"{player.PlayerId}:{roundId}";

    private sealed class PendingCrab(decimal stake, decimal baseMultiplier, decimal baseWin, decimal maxWin)
    {
        public decimal Stake { get; } = stake;
        public decimal BaseMultiplier { get; } = baseMultiplier;
        public decimal BaseWin { get; } = baseWin;
        public decimal MaxWin { get; } = maxWin;
        public CrabCatchResult? Resolved { get; set; }
    }
}
