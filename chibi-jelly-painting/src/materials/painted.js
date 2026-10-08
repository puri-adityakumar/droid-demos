import { MeshBasicNodeMaterial, Color, Vector3 } from 'three/webgpu'
import {
    Fn, uniform, normalWorld, positionGeometry, positionWorld, cameraPosition,
    dot, mix, smoothstep, clamp, normalize, mx_noise_vec3, mx_noise_float
} from 'three/tsl'

// Shared "studio" for every painted surface. Themes write into these.
export const light = {
    dir: uniform( new Vector3( - 0.5, 0.78, 0.55 ).normalize() ),
    rimDir: uniform( new Vector3( 0.7, 0.35, - 0.6 ).normalize() ),
    rimColor: uniform( new Color( '#fff2cf' ) ),
    bounce: uniform( new Color( '#ffd36b' ) ),
    shadowTint: uniform( new Color( '#6c63c9' ) ),
    shadowTintAmount: uniform( 0.22 ),
    haze: uniform( new Color( '#c8d4ff' ) ),
    hazeAmount: uniform( 0.14 ),
    time: uniform( 0 ),
}

const tmp = { h: 0, s: 0, l: 0 }

function deriveShade( hex )
{
    const c = new Color( hex )
    c.getHSL( tmp )
    // Painters cool and saturate shadows instead of just darkening them.
    const hue = tmp.h + ( ( 0.72 - tmp.h ) * 0.2 )
    return new Color().setHSL( hue, Math.min( 1, tmp.s * 1.05 ), tmp.l * 0.6 )
}

function deriveHighlight( hex )
{
    const c = new Color( hex )
    c.getHSL( tmp )
    const hue = tmp.h + ( ( 0.12 - tmp.h ) * 0.1 )
    return new Color().setHSL( hue, tmp.s * 0.92, Math.min( 0.96, tmp.l + ( 1 - tmp.l ) * 0.42 ) )
}

/**
 * Painted lighting: the shading normal is pushed around by object-space brush
 * noise (a procedural stand-in for a hand-painted normal map), then lit with
 * hard, noise-wobbled bands so surfaces break into flat painted planes.
 */
export function paintedMaterial( {
    color,
    shade = null,
    highlight = null,
    rim = 0.55,
    gloss = 0.5,
    brush = 1,
    scale = 3,
    terminator = 0.44,
    unlit = false,
    haze = 1,
    positionNode = null,
} = {} )
{
    const material = new MeshBasicNodeMaterial()

    const uBase = uniform( new Color( color ) )
    const uShade = uniform( shade ? new Color( shade ) : deriveShade( color ) )
    const uHighlight = uniform( highlight ? new Color( highlight ) : deriveHighlight( color ) )

    material.userData.paint = { base: uBase, shade: uShade, highlight: uHighlight }

    if( positionNode ) material.positionNode = positionNode

    if( unlit )
    {
        material.colorNode = uBase
        return material
    }

    material.colorNode = Fn( () =>
    {
        const n = normalWorld.normalize().toVar()
        const p = positionGeometry.mul( scale )

        const np = normalize( n.add( mx_noise_vec3( p ).mul( 0.3 * brush ) ) ).toVar()
        const wobble = mx_noise_float( positionGeometry.mul( scale * 3.3 ).add( 7.1 ) ).mul( 0.07 * brush )

        const wrap = dot( np, light.dir ).mul( 0.5 ).add( 0.5 ).add( wobble ).toVar()

        const lit = smoothstep( terminator - 0.025, terminator + 0.025, wrap )
        const core = smoothstep( terminator - 0.24, terminator - 0.18, wrap )
        const hi = smoothstep( 0.87, 0.9, wrap ).mul( gloss )

        const shadow = mix( uShade, light.shadowTint, light.shadowTintAmount )
        const color = mix( shadow.mul( 0.82 ), shadow, core.mul( 0.55 ).add( 0.45 ) ).toVar()
        color.assign( mix( color, uBase, lit ) )
        color.assign( mix( color, uHighlight, hi ) )

        // Uneven pigment: gives the screen-space strokes something to pick up
        // inside otherwise flat color regions.
        const pigment = mx_noise_float( positionGeometry.mul( scale * 0.8 ).add( 31.7 ) )
        color.mulAssign( pigment.mul( 0.09 * brush ).add( 1 ) )

        const down = clamp( np.y.negate(), 0, 1 )
        color.addAssign( light.bounce.mul( down.mul( lit.oneMinus() ).mul( 0.2 ) ) )

        const view = normalize( cameraPosition.sub( positionWorld ) )
        const fresnel = clamp( dot( n, view ), 0, 1 ).oneMinus()
        const rimMask = smoothstep( 0.58, 0.72, fresnel.add( wobble ) )
            .mul( smoothstep( - 0.15, 0.35, dot( n, light.rimDir ) ) )
            .mul( rim )
        color.assign( mix( color, mix( uHighlight, light.rimColor, 0.55 ), rimMask ) )

        // Air between the eye and the subject: lifts the darks and pulls every
        // material toward one pastel key, strongest on grazing surfaces.
        color.assign( mix( color, light.haze, light.hazeAmount.mul( fresnel.mul( 0.7 ).add( 0.3 ) ).mul( haze ) ) )

        return color
    } )()

    return material
}
