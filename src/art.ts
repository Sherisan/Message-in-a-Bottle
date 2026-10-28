// Every art file, imported once so Vite fingerprints and bundles it.
import bgSky from './assets/art/bg-sky.svg'
import bgSea from './assets/art/bg-sea.svg'
import bgWaves from './assets/art/bg-waves.svg'
import bgShoreline from './assets/art/bg-shoreline.svg'
import bgSand from './assets/art/bg-sand.svg'
import palm from './assets/art/deco-palm-corner.svg'
import shell1 from './assets/art/deco-shell-1.svg'
import shell2 from './assets/art/deco-shell-2.svg'
import shell3 from './assets/art/deco-shell-3.svg'
import starfish from './assets/art/deco-starfish.svg'
import rock from './assets/art/deco-rock.svg'
import gullUp from './assets/art/ambient-seagull-up.svg'
import gullDown from './assets/art/ambient-seagull-down.svg'
import crab1 from './assets/art/ambient-crab-1.svg'
import crab2 from './assets/art/ambient-crab-2.svg'

import bottleGreen from './assets/art/bottle-green.svg'
import bottleBlue from './assets/art/bottle-blue.svg'
import bottleAmber from './assets/art/bottle-amber.svg'
import bottleClear from './assets/art/bottle-clear.svg'
import bottleViolet from './assets/art/bottle-violet.svg'
import bottleGreenOpen from './assets/art/bottle-green-open.svg'
import bottleBlueOpen from './assets/art/bottle-blue-open.svg'
import bottleAmberOpen from './assets/art/bottle-amber-open.svg'
import bottleClearOpen from './assets/art/bottle-clear-open.svg'
import bottleVioletOpen from './assets/art/bottle-violet-open.svg'

import scrollRolled from './assets/art/scroll-rolled.svg'
import scrollPlain from './assets/art/scroll-plain.svg'
import scrollSilver from './assets/art/scroll-silver.svg'
import scrollGold from './assets/art/scroll-gold.svg'
import treasureMap from './assets/art/treasure-map.svg'
import treasureChest from './assets/art/treasure-chest.svg'
import lossCrab from './assets/art/loss-crab.svg'
import lossSeaweed from './assets/art/loss-seaweed.svg'
import lossSand from './assets/art/loss-sand.svg'

import corkPop from './assets/art/fx-cork-pop.svg'
import splashSm from './assets/art/fx-splash-sm.svg'
import splashMd from './assets/art/fx-splash-md.svg'
import splashLg from './assets/art/fx-splash-lg.svg'
import sparkle from './assets/art/fx-sparkle.svg'
import coin from './assets/art/fx-coin.svg'
import coinEdge from './assets/art/fx-coin-edge.svg'
import lightRays from './assets/art/fx-light-rays.svg'
import bannerBig from './assets/art/banner-big.svg'
import bannerMega from './assets/art/banner-mega.svg'
import bannerTreasure from './assets/art/banner-treasure.svg'

import logoHorizontal from './assets/art/logo-horizontal.svg'
import logoStacked from './assets/art/logo-stacked.svg'
import chipStake from './assets/art/chip-stake.svg'
import btnMain from './assets/art/btn-main.svg'
import panelFrame from './assets/art/panel-frame.svg'
import iconQuickpick from './assets/art/icon-quickpick.svg'
import iconAuto from './assets/art/icon-auto.svg'
import iconInfo from './assets/art/icon-info.svg'
import iconHistory from './assets/art/icon-history.svg'
import iconSoundOn from './assets/art/icon-sound-on.svg'
import iconSoundOff from './assets/art/icon-sound-off.svg'
import iconMenu from './assets/art/icon-menu.svg'

import type { LossItem, PrizeArt } from './game/rules'
import type { WinTier } from './game/rules'

export const scene = { bgSky, bgSea, bgWaves, bgShoreline, bgSand, palm, shell1, shell2, shell3, starfish, rock, gullUp, gullDown, crab1, crab2 }

/** Bottle colours in screen order, left to right. */
export const bottles = [
  { color: 'green', closed: bottleGreen, open: bottleGreenOpen },
  { color: 'blue', closed: bottleBlue, open: bottleBlueOpen },
  { color: 'amber', closed: bottleAmber, open: bottleAmberOpen },
  { color: 'clear', closed: bottleClear, open: bottleClearOpen },
  { color: 'violet', closed: bottleViolet, open: bottleVioletOpen },
]

export const prizeArt: Record<Exclude<PrizeArt, 'loss'>, string> = {
  plain: scrollPlain,
  silver: scrollSilver,
  gold: scrollGold,
  map: treasureMap,
  chest: treasureMap,
}
export const lossArt: Record<LossItem, string> = { crab: lossCrab, seaweed: lossSeaweed, sand: lossSand }
export const extras = { scrollRolled, treasureChest }

export const fx = { corkPop, splashSm, splashMd, splashLg, sparkle, coin, coinEdge, lightRays }
export const banners: Record<WinTier, string> = { big: bannerBig, mega: bannerMega, treasure: bannerTreasure }

export const ui = {
  logoHorizontal, logoStacked, chipStake, btnMain, panelFrame,
  iconQuickpick, iconAuto, iconInfo, iconHistory, iconSoundOn, iconSoundOff, iconMenu,
}
