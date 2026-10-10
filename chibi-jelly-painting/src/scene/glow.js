import { Color } from 'three/webgpu'
import { uniform, uv, pow, smoothstep, length } from 'three/tsl'

import { light } from '../materials/painted.js'

/**
 * A soft round glow for sprites and flat decals. `lamp` ties its strength to
 * the room's desk lamp ('on') or to the lamp's absence ('off').
 */
export function glowMaterial( Material, color, { strength = 1, power = 1.5, lamp = null } = {} )
{
    const m = new Material( { transparent: true, depthWrite: false } )
    m.colorNode = uniform( new Color( color ) )
    const radial = pow( smoothstep( 0, 1, length( uv().mul( 2 ).sub( 1 ) ) ).oneMinus(), power ).mul( strength )
    m.opacityNode = lamp === 'on' ? radial.mul( light.lamp ) : lamp === 'off' ? radial.mul( light.lamp.oneMinus() ) : radial
    return m
}
