import { scene } from '../art'

/** The dusk beach behind everything: sky, sea, rolling waves, sand, and a few things living there. */
export function Scene() {
  return (
    <div className="scene" aria-hidden>
      <img className="sky" src={scene.bgSky} alt="" />
      <img className="sea" src={scene.bgSea} alt="" />
      <div className="waves waves-back" style={{ backgroundImage: `url("${scene.bgWaves}")` }} />
      <div className="waves waves-front" style={{ backgroundImage: `url("${scene.bgWaves}")` }} />
      <img className="sand" src={scene.bgSand} alt="" />
      <div className="shoreline" style={{ backgroundImage: `url("${scene.bgShoreline}")` }} />

      <img className="palm" src={scene.palm} alt="" />
      <img className="deco rock" src={scene.rock} alt="" />
      <img className="deco shell-1" src={scene.shell1} alt="" />
      <img className="deco shell-2" src={scene.shell2} alt="" />
      <img className="deco shell-3" src={scene.shell3} alt="" />
      <img className="deco starfish" src={scene.starfish} alt="" />

      {/* Two gulls drifting across the sky, flapping by swapping wing frames. */}
      {[0, 1].map((i) => (
        <div key={i} className={`gull gull-${i}`}>
          <img className="flap-a" src={scene.gullUp} alt="" />
          <img className="flap-b" src={scene.gullDown} alt="" />
        </div>
      ))}

      {/* A crab that scuttles along the sand now and then. */}
      <div className="crab">
        <img className="flap-a" src={scene.crab1} alt="" />
        <img className="flap-b" src={scene.crab2} alt="" />
      </div>
    </div>
  )
}
