import {
    Group, Mesh, Object3D, SphereGeometry, CapsuleGeometry, CylinderGeometry, TorusGeometry,
    LatheGeometry, TubeGeometry, CircleGeometry, ShapeGeometry, BoxGeometry, PlaneGeometry,
    Shape, Vector2, CatmullRomCurve3, Sprite, SpriteNodeMaterial, MeshBasicNodeMaterial,
    DoubleSide, Color
} from 'three/webgpu'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { uniform, positionLocal, normalLocal, normalView, mix, smoothstep, mx_noise_float } from 'three/tsl'

import { paintedMaterial, light } from '../materials/painted.js'
import {
    mesh, v3, sphereDir, skullRadius, skullGeometry, orient, spikeGeometry, onTorso, stroke,
    TORSO, TORSO_DEPTH, HAIR_RADIUS, UP, Z, deg
} from './character.js'
import { glowMaterial } from './glow.js'

// Nezuko Kamado, after her Demon Slayer anime design and Nendoroid: long black
// hair that turns flame-orange toward the tips, a small pink ribbon, pink eyes
// with slit pupils, the bamboo muzzle tied with red cloth, a pale pink asanoha
// (hemp-leaf) kimono with a red-and-white checkered obi, an orange obijime and
// a green obiage, a long dark-brown haori, black kyahan leg wraps, white tabi
// and pink-strapped zori. She runs along a path lined with wisteria trees (the
// flower demons cannot bear); in the Exploding Blood mood her Blood Demon Art
// sets pink flames burning around her feet as she goes.

export const wisteriaLook = {
    // 0 at sunrise, 1 when Exploding Blood is burning
    blood: uniform( 0 ),
    flame: uniform( new Color( '#ff4fa0' ) ),
    blossom: uniform( new Color( '#d6b4ff' ) ),
    orb: uniform( new Color( '#fff0c8' ) ),
}

// her stride, read by the rig; `speed` is how fast the path streams back under it
export const RUN = { cadence: 1.6, bounce: 0.09, lean: 0.15, arms: 0.95, legs: 0.82, kick: 1.1, speed: 2.0 }

export const palette = {
    skin: '#ffe8de',
    hair: '#1c1620',
    tips: '#ff7a3c',
    ribbon: '#ff8fb8',
    kimono: '#f9bfd0',
    kimonoDeep: '#e98aa8',
    lining: '#fff0f4',
    haori: '#5c3a2e',
    haoriEdge: '#2e1c1c',
    obiRed: '#d8344a',
    obiWhite: '#fff6f0',
    obijime: '#ff9a3a',
    obiage: '#7ec46a',
    bamboo: '#7cb85a',
    bambooEnd: '#e6e2a2',
    cloth: '#c8283a',
    kyahan: '#2a2632',
    tabi: '#ffffff',
    zori: '#c89a6a',
    sclera: '#fff8fa',
    iris: '#e8508c',
    irisLow: '#ffb4d0',
    pupil: '#5e0c30',
    lash: '#1e1426',
    blush: '#ff9ab0',
}

function makeMaterials()
{
    const haori = paintedMaterial( { color: palette.haori, shade: '#2a1a1e', highlight: '#a8765c', rim: 0.55, gloss: 0.3, scale: 2.8 } )
    // the haori hangs open in front, so its inside shows
    haori.side = DoubleSide

    return {
        skin: paintedMaterial( { color: palette.skin, shade: '#eea4a2', rim: 0.55, gloss: 0.25, scale: 2.4 } ),
        hair: paintedMaterial( { color: palette.hair, shade: '#0a070e', highlight: '#56506e', rim: 0.7, gloss: 0.6, scale: 3.0, terminator: 0.48 } ),
        tips: paintedMaterial( { color: palette.tips, shade: '#e0502a', highlight: '#ffc884', rim: 0.6, gloss: 0.55, scale: 3 } ),
        ribbon: paintedMaterial( { color: palette.ribbon, shade: '#d65a8a', highlight: '#ffe0ec', gloss: 0.6, rim: 0.6, scale: 2.6 } ),
        kimono: paintedMaterial( { color: palette.kimono, shade: '#d4709a', highlight: '#fff2f6', rim: 0.55, gloss: 0.3, scale: 2.8, terminator: 0.44 } ),
        kimonoDeep: paintedMaterial( { color: palette.kimonoDeep, shade: '#b04a78', highlight: '#ffc4d8', rim: 0.3, gloss: 0.1, brush: 0.4, scale: 3 } ),
        lining: paintedMaterial( { color: palette.lining, shade: '#d8a8c4', highlight: '#ffffff', rim: 0.4, scale: 3 } ),
        haori,
        haoriEdge: paintedMaterial( { color: palette.haoriEdge, shade: '#140c10', highlight: '#6a4a40', rim: 0.5, scale: 3 } ),
        obiRed: paintedMaterial( { color: palette.obiRed, shade: '#8a1430', highlight: '#ff8a8a', rim: 0.5, gloss: 0.4, scale: 3 } ),
        obiWhite: paintedMaterial( { color: palette.obiWhite, shade: '#d4b0c0', highlight: '#ffffff', rim: 0.5, gloss: 0.4, scale: 3 } ),
        obijime: paintedMaterial( { color: palette.obijime, shade: '#c45a24', highlight: '#ffd28a', gloss: 0.6, scale: 3 } ),
        obiage: paintedMaterial( { color: palette.obiage, shade: '#3e7a4a', highlight: '#d2f4a8', gloss: 0.4, scale: 3 } ),
        bamboo: paintedMaterial( { color: palette.bamboo, shade: '#3e7a3a', highlight: '#d6f0a0', gloss: 0.8, rim: 0.6, scale: 2.4 } ),
        bambooNode: paintedMaterial( { color: '#5e9a46', shade: '#2e5a2e', highlight: '#b4e08a', gloss: 0.6, scale: 2.4 } ),
        bambooEnd: paintedMaterial( { color: palette.bambooEnd, shade: '#a8a060', highlight: '#ffffe0', scale: 2.4 } ),
        cloth: paintedMaterial( { color: palette.cloth, shade: '#7a1428', highlight: '#ff7a7a', rim: 0.5, gloss: 0.3, scale: 3 } ),
        kyahan: paintedMaterial( { color: palette.kyahan, shade: '#100e18', highlight: '#66628a', rim: 0.5, scale: 3 } ),
        tabi: paintedMaterial( { color: palette.tabi, shade: '#b8b4dc', highlight: '#ffffff', rim: 0.4, scale: 3 } ),
        zori: paintedMaterial( { color: palette.zori, shade: '#7a5034', highlight: '#f0d0a0', scale: 3 } ),
        sclera: paintedMaterial( { color: palette.sclera, shade: '#e4c8dc', rim: 0, gloss: 0, brush: 0.2, haze: 0 } ),
        iris: paintedMaterial( { color: palette.iris, unlit: true } ),
        irisLow: paintedMaterial( { color: palette.irisLow, unlit: true } ),
        pupil: paintedMaterial( { color: palette.pupil, unlit: true } ),
        lash: paintedMaterial( { color: palette.lash, shade: '#0e0a14', rim: 0, gloss: 0, brush: 0.3, haze: 0.2 } ),
        white: paintedMaterial( { color: '#ffffff', unlit: true } ),
        blush: paintedMaterial( { color: palette.blush, shade: '#f07c92', rim: 0, gloss: 0, brush: 0.4 } ),
    }
}

/**
 * Six-pointed asanoha marks pinned flat to a surface: three crossed bars each,
 * oriented by the surface normal so the pattern lies on the cloth.
 */
function asanoha( placements, size, material, parent )
{
    const dummy = new Object3D()
    const geoms = []
    for( const { p, n } of placements )
    {
        dummy.position.copy( p )
        dummy.lookAt( p.clone().add( n ) )
        dummy.updateMatrix()
        for( let k = 0; k < 3; k++ )
        {
            const bar = new BoxGeometry( size, size * 0.13, 0.004 )
            bar.rotateZ( k * Math.PI / 3 + Math.PI / 6 )
            bar.applyMatrix4( dummy.matrix )
            geoms.push( bar )
        }
    }
    return mesh( mergeGeometries( geoms ), material, parent )
}

function buildHair( head, m )
{
    const hair = new Group()
    head.add( hair )

    const cap = mesh( new SphereGeometry( HAIR_RADIUS + 0.03, 48, 32, 0, Math.PI * 2, 0, 1.8 ), m.hair, hair )
    cap.rotation.x = - 0.74
    // full mass of hair at the back of the head, hiding where the cap ends and the long locks begin
    mesh( new SphereGeometry( 1, 40, 28 ), m.hair, hair, v3( 0, - 0.12, - 0.2 ), v3( 0.63, 0.62, 0.5 ) )

    const spikes = []
    // `tip` > 0 makes a two-tone lock: a full flame-orange blade with a slightly
    // larger black blade over its upper part, so the orange licks up the edges
    const add = ( base, direction, length, radius, bend, curl, { inset = 0.5, flat = 0.5, fullness = 0.7, weight = length, tip = 0 } = {} ) =>
    {
        const pivot = new Group()
        pivot.position.copy( base.clone().multiplyScalar( inset ) )
        orient( pivot, direction, curl )
        hair.add( pivot )
        if( tip > 0 )
        {
            const f = 1 - tip
            mesh( spikeGeometry( length, radius, bend, flat, fullness ), m.tips, pivot )
            mesh( spikeGeometry( length * f, radius * 1.08, bend * f, flat * 1.04, fullness * 0.75 ), m.hair, pivot )
        }
        else mesh( spikeGeometry( length, radius, bend, flat, fullness ), m.hair, pivot )
        spikes.push( { pivot, rest: pivot.quaternion.clone(), weight } )
        return pivot
    }
    const at = ( yaw, pitch ) => sphereDir( yaw * deg, pitch * deg )

    // Full, softly side-swept bangs down to the brows
    const bangs = [
        [ - 60, 44, 0.48, 0.15, - 1, 0.22 ],
        [ - 40, 55, 0.56, 0.16, - 1, 0.2 ],
        [ - 20, 62, 0.6, 0.16, - 1, 0.1 ],
        [ 2, 64, 0.58, 0.16, 1, 0.14 ],
        [ 22, 61, 0.58, 0.16, 1, 0.2 ],
        [ 42, 54, 0.54, 0.16, 1, 0.24 ],
        [ 61, 44, 0.48, 0.15, 1, 0.26 ],
    ]
    for( const [ yaw, pitch, length, radius, side, sweep ] of bangs )
    {
        const n = at( yaw, pitch )
        const down = UP.clone().sub( n.clone().multiplyScalar( n.y ) ).normalize().negate()
        const dir = down.clone().sub( n.clone().multiplyScalar( 0.4 ) ).add( v3( side * sweep + 0.06, 0, 0 ) )
        add( n, dir, length, radius, 0.2, v3( side, 0, 0 ), { inset: 0.61, flat: 0.4, fullness: 0.58, weight: 0.45 } )
    }

    // Long face-framing locks falling over the chest, orange at the ends
    for( const side of [ - 1, 1 ] )
    {
        add(
            at( side * 58, 8 ),
            v3( side * 0.05, - 1, 0.1 ),
            1.0, 0.13, 0.12, v3( - side, 0, 0.3 ),
            { inset: 0.56, flat: 0.45, fullness: 0.62, weight: 0.6, tip: 0.38 }
        )
    }

    // Sides: long locks over the ears that fall behind the shoulders
    for( const side of [ - 1, 1 ] )
    {
        add(
            at( side * 96, 18 ),
            v3( side * 0.3, - 1, - 0.28 ),
            1.08, 0.2, 0.1, v3( 0, 0, - 1 ),
            { inset: 0.5, flat: 0.48, fullness: 0.62, weight: 0.55, tip: 0.34 }
        )
    }

    // Back: a long, full fall of black hair down her back, flame-orange at the ends
    const back = [
        [ 180, 30, 1.52, 0.3 ],
        [ 160, 30, 1.48, 0.3 ],
        [ - 160, 30, 1.48, 0.3 ],
        [ 140, 30, 1.42, 0.29 ],
        [ - 140, 30, 1.42, 0.29 ],
        [ 120, 30, 1.32, 0.27 ],
        [ - 120, 30, 1.32, 0.27 ],
    ]
    for( const [ yaw, pitch, length, radius ] of back )
    {
        const n = at( yaw, pitch )
        // rooted deep in the head so no blade top shows, and bent back in toward
        // her so the hair falls along the haori rather than off it
        add( n, v3( n.x * 0.3, - 1, - 0.22 ), length, radius, - 0.06, n, { inset: 0.35, flat: 0.5, fullness: 0.56, weight: 0.5, tip: 0.24 } )
    }

    // Small pink ribbon on the left of her head
    const bow = new Group()
    const dir = at( 46, 48 )
    bow.position.copy( dir.clone().multiplyScalar( HAIR_RADIUS + 0.03 ) )
    bow.quaternion.setFromUnitVectors( Z, dir )
    bow.rotateZ( - 0.5 )
    hair.add( bow )
    for( const s of [ - 1, 1 ] )
    {
        const loop = mesh( new SphereGeometry( 1, 18, 12 ), m.ribbon, bow, v3( s * 0.085, 0, 0.02 ), v3( 0.085, 0.06, 0.028 ) )
        loop.rotation.z = s * 0.25
        const tail = mesh( spikeGeometry( 0.12, 0.03, 0.02, 0.4, 0.8 ), m.ribbon, bow, v3( s * 0.02, - 0.02, 0.02 ) )
        tail.rotation.z = Math.PI + s * 0.45
    }
    mesh( new SphereGeometry( 0.034, 14, 10 ), m.ribbon, bow, v3( 0, 0, 0.03 ), v3( 1, 1, 0.8 ) )

    return { hair, spikes }
}

function buildFace( head, m )
{
    const place = ( object, yaw, pitch, inset = 0, spin = 0 ) =>
    {
        const dir = sphereDir( yaw, pitch )
        object.position.copy( dir.clone().multiplyScalar( skullRadius( dir ) - inset ) )
        object.quaternion.setFromUnitVectors( Z, dir )
        if( spin ) object.rotateZ( spin )
        head.add( object )
        return object
    }

    const sphere = new SphereGeometry( 1, 32, 24 )
    const part = ( material, [ sx, sy, sz ], [ x, y, z ], parent ) =>
    {
        const p = new Mesh( sphere, material )
        p.scale.set( sx, sy, sz )
        p.position.set( x, y, z )
        parent.add( p )
        return p
    }

    const eyes = []
    for( const side of [ - 1, 1 ] )
    {
        // Big round pink eyes, paler at the bottom, with a demon's slit pupil
        const eye = new Group()
        part( m.sclera, [ 0.108, 0.115, 0.05 ], [ 0, 0, 0 ], eye )
        part( m.iris, [ 0.086, 0.1, 0.03 ], [ 0, - 0.006, 0.026 ], eye )
        part( m.irisLow, [ 0.064, 0.036, 0.02 ], [ 0, - 0.052, 0.05 ], eye )
        part( m.pupil, [ 0.016, 0.058, 0.02 ], [ 0, 0.004, 0.056 ], eye )
        part( m.white, [ 0.03, 0.034, 0.015 ], [ side * 0.03, 0.04, 0.07 ], eye )
        part( m.white, [ 0.013, 0.013, 0.01 ], [ - side * 0.032, - 0.036, 0.072 ], eye )

        // Long, dark upper lashes that flick out at the corner
        const lash = [
            [ - 0.112, 0.036 ],
            [ - 0.05, 0.1 ],
            [ 0.04, 0.106 ],
            [ 0.115, 0.07 ],
            [ 0.158, 0.098 ],
        ].map( ( [ x, y ] ) => v3( x * side, y, 0.018 ) )
        eye.add( new Mesh( new TubeGeometry( new CatmullRomCurve3( lash ), 28, 0.026, 8 ), m.lash ) )
        const lower = [ [ 0.06, - 0.1 ], [ 0.11, - 0.06 ] ].map( ( [ x, y ] ) => v3( x * side, y, 0.016 ) )
        eye.add( new Mesh( new TubeGeometry( new CatmullRomCurve3( lower ), 8, 0.01, 6 ), m.lash ) )

        place( eye, side * 0.33, - 0.08, 0.018, - side * 0.04 )
        eyes.push( eye )

        const brow = [ [ - 0.07, 0.004 ], [ 0, 0.018 ], [ 0.075, 0.004 ] ].map( ( [ x, y ] ) => v3( x * side, y, 0 ) )
        place( new Mesh( new TubeGeometry( new CatmullRomCurve3( brow ), 16, 0.012, 8 ), m.lash ), side * 0.33, 0.21, 0.004 )

        part( m.blush, [ 0.075, 0.034, 0.02 ], [ 0, 0, 0 ], place( new Group(), side * 0.55, - 0.22, 0.01 ) )
    }

    const nose = new Mesh( sphere, m.skin )
    nose.scale.set( 0.026, 0.02, 0.024 )
    place( nose, 0, - 0.12, 0.012 )

    // Bamboo muzzle held in her mouth: a green tube with nodes and pale cut ends
    const gag = place( new Group(), 0, - 0.34, - 0.014 )
    const tube = new Group()
    tube.rotation.z = Math.PI / 2
    gag.add( tube )
    mesh( new CylinderGeometry( 0.046, 0.046, 0.54, 20 ), [ m.bamboo, m.bambooEnd, m.bambooEnd ], tube )
    for( const y of [ - 0.14, 0.14 ] )
        mesh( new CylinderGeometry( 0.051, 0.051, 0.018, 20 ), m.bambooNode, tube, v3( 0, y, 0 ) )
    for( const y of [ - 0.22, 0.22 ] )
        mesh( new CylinderGeometry( 0.054, 0.054, 0.045, 20 ), m.cloth, tube, v3( 0, y, 0 ) )

    // Red cloth ties running from the tube's ends around her cheeks to the back of her head
    for( const side of [ - 1, 1 ] )
    {
        const end = v3( side * 0.22, 0, 0 ).applyQuaternion( gag.quaternion ).add( gag.position )
        const points = [ end ]
        for( const yaw of [ 38, 62, 90, 120, 150, 178 ] )
        {
            const d = sphereDir( side * yaw * deg, - 0.3 )
            points.push( d.multiplyScalar( skullRadius( d ) + 0.022 ) )
        }
        stroke( points, 0.022, m.cloth, head )
    }

    return { eyes }
}

function buildArm( side, parent, m )
{
    const shoulder = new Group()
    shoulder.position.set( side * 0.31, 0.92, 0 )
    parent.add( shoulder )

    // dark haori sleeve over the upper arm
    mesh( new SphereGeometry( 0.14, 24, 16 ), m.haori, shoulder, v3( 0, - 0.03, 0 ), v3( 1, 1.1, 1 ) )
    mesh( new CapsuleGeometry( 0.092, 0.15, 6, 12 ), m.haori, shoulder, v3( 0, - 0.17, 0 ) )

    const elbow = new Group()
    elbow.position.set( 0, - 0.27, 0 )
    shoulder.add( elbow )
    // the pink kimono sleeve flaring out beneath it, with its pale lining at the cuff
    mesh( new CylinderGeometry( 0.096, 0.12, 0.2, 24 ), m.kimono, elbow, v3( 0, - 0.1, 0 ) )
    mesh( new TorusGeometry( 0.116, 0.014, 8, 28 ), m.lining, elbow, v3( 0, - 0.2, 0 ) ).rotation.x = Math.PI / 2
    const marks = []
    for( let k = 0; k < 6; k++ )
    {
        const a = ( k / 6 ) * Math.PI * 2 + 0.3
        const y = k % 2 ? - 0.07 : - 0.14
        const r = 0.1 + ( - y - 0.0 ) * 0.11
        marks.push( { p: v3( Math.sin( a ) * r, y, Math.cos( a ) * r ), n: v3( Math.sin( a ), 0.1, Math.cos( a ) ) } )
    }
    asanoha( marks, 0.05, m.kimonoDeep, elbow )
    mesh( new SphereGeometry( 0.08, 20, 16 ), m.skin, elbow, v3( 0, - 0.26, 0.005 ), v3( 1, 1.05, 0.95 ) )

    return { shoulder, elbow }
}

// knee-length kimono skirt, waist (0.58) to hem (0.28)
const SKIRT = [
    [ 0.0, 0.28 ], [ 0.4, 0.28 ], [ 0.385, 0.38 ], [ 0.355, 0.48 ], [ 0.32, 0.58 ], [ 0.0, 0.58 ]
]
const SKIRT_DEPTH = 0.85

// long haori from the collar to just below the knees (shorter than her calf-length
// one so the running legs show), open in front
const HAORI = [
    [ 0.46, 0.27 ], [ 0.475, 0.3 ], [ 0.46, 0.36 ], [ 0.42, 0.5 ], [ 0.39, 0.64 ], [ 0.38, 0.78 ],
    [ 0.37, 0.9 ], [ 0.33, 1.0 ], [ 0.24, 1.06 ], [ 0.12, 1.09 ]
]
const HAORI_DEPTH = 0.86
const HAORI_GAP = 0.72

function profileRadius( profile, y )
{
    for( let i = 1; i < profile.length; i++ )
    {
        const [ r0, y0 ] = profile[ i - 1 ]
        const [ r1, y1 ] = profile[ i ]
        if( y >= Math.min( y0, y1 ) && y <= Math.max( y0, y1 ) && y1 !== y0 ) return r0 + ( r1 - r0 ) * ( y - y0 ) / ( y1 - y0 )
    }
    return 0
}

export function createNezuko()
{
    const m = makeMaterials()

    const root = new Group()
    root.name = 'nezuko'
    const body = new Group()
    root.add( body )

    // Legs jointed at hip and knee for running: black kyahan leg wraps, white tabi
    // and zori with pink thong straps
    const legs = {}
    for( const side of [ - 1, 1 ] )
    {
        const hip = new Group()
        hip.position.set( side * 0.125, 0.32, 0 )
        body.add( hip )
        mesh( new CylinderGeometry( 0.092, 0.098, 0.18, 20 ), m.kyahan, hip, v3( 0, - 0.08, 0 ) )
        mesh( new TorusGeometry( 0.097, 0.008, 6, 24 ), m.haoriEdge, hip, v3( 0, - 0.1, 0 ) ).rotation.x = Math.PI / 2

        const knee = new Group()
        knee.position.set( 0, - 0.16, 0 )
        hip.add( knee )
        mesh( new SphereGeometry( 0.094, 18, 12 ), m.kyahan, knee )
        mesh( new CylinderGeometry( 0.098, 0.088, 0.12, 24 ), m.kyahan, knee, v3( 0, - 0.03, 0 ) )
        mesh( new TorusGeometry( 0.094, 0.008, 6, 24 ), m.haoriEdge, knee, v3( 0, - 0.02, 0 ) ).rotation.x = Math.PI / 2
        mesh( new SphereGeometry( 1, 24, 16 ), m.tabi, knee, v3( side * 0.005, - 0.095, 0.045 ), v3( 0.11, 0.07, 0.18 ) )
        mesh( new RoundedBoxGeometry( 0.2, 0.03, 0.36, 2, 0.012 ), m.zori, knee, v3( side * 0.005, - 0.148, 0.05 ) )
        stroke( [ v3( - 0.085, - 0.12, 0.0 ), v3( 0, - 0.045, 0.15 ), v3( 0.085, - 0.12, 0.0 ) ], 0.016, m.ribbon, knee )

        legs[ side < 0 ? 'left' : 'right' ] = { hip, knee }
    }

    // Kimono skirt with its pale lining at the hem
    const skirt = mesh( new LatheGeometry( SKIRT.map( ( [ r, y ] ) => new Vector2( r, y ) ), 40 ), m.kimono, body )
    skirt.scale.set( 1, 1, SKIRT_DEPTH )
    const hem = mesh( new TorusGeometry( 0.4, 0.016, 10, 44 ), m.lining, body, v3( 0, 0.29, 0 ) )
    hem.rotation.x = Math.PI / 2
    hem.scale.set( 1, SKIRT_DEPTH, 1 )

    const torso = mesh( new LatheGeometry( TORSO.map( ( [ r, y ] ) => new Vector2( r, y ) ), 40 ), m.kimono, body )
    torso.scale.set( 1, 1, TORSO_DEPTH )

    // Asanoha marks on the kimono where the open haori shows it
    const marks = []
    for( const [ phi, y ] of [ [ - 0.42, 0.36 ], [ 0.05, 0.42 ], [ 0.46, 0.35 ], [ - 0.18, 0.5 ], [ 0.3, 0.5 ] ] )
    {
        const r = profileRadius( SKIRT, y ) + 0.004
        marks.push( { p: v3( r * Math.sin( phi ), y, r * Math.cos( phi ) * SKIRT_DEPTH ), n: v3( Math.sin( phi ), 0.2, Math.cos( phi ) ) } )
    }
    for( const [ x, y ] of [ [ - 0.19, 0.86 ], [ 0.19, 0.86 ], [ - 0.2, 0.98 ], [ 0.21, 0.97 ] ] )
    {
        const p = onTorso( x, y, 1, 0.006 )
        marks.push( { p, n: v3( x * 2, 0.2, 1 ) } )
    }
    asanoha( marks, 0.06, m.kimonoDeep, body )

    // Crossed collar: white under-collar inside the pink lapels
    for( const side of [ - 1, 1 ] )
    {
        stroke( [ onTorso( side * 0.1, 1.03, 1, 0.01 ), onTorso( side * 0.06, 0.92, 1, 0.012 ), onTorso( side * 0.005, 0.79, 1, 0.012 ) ], 0.022, m.lining, body )
        stroke( [ onTorso( side * 0.15, 1.0, 1, 0.012 ), onTorso( side * 0.105, 0.9, 1, 0.014 ), onTorso( side * 0.045, 0.79, 1, 0.014 ) ], 0.02, m.kimonoDeep, body )
    }

    // Red-and-white checkered obi, green obiage above it, orange obijime cord across it
    const OBI_R = 0.352
    const obi = { red: [], white: [] }
    const rows = 3
    const cols = 32
    const bottom = 0.54
    const height = 0.225
    for( let row = 0; row < rows; row++ )
    {
        for( let col = 0; col < cols; col++ )
        {
            const cell = new CylinderGeometry( OBI_R, OBI_R, height / rows, 3, 1, true, ( col / cols ) * Math.PI * 2, Math.PI * 2 / cols )
            cell.translate( 0, bottom + ( row + 0.5 ) * height / rows, 0 )
            ;( ( row + col ) % 2 ? obi.white : obi.red ).push( cell )
        }
    }
    for( const [ key, mat ] of [ [ 'red', m.obiRed ], [ 'white', m.obiWhite ] ] )
        mesh( mergeGeometries( obi[ key ] ), mat, body ).scale.set( 1, 1, 0.84 )
    const ring = ( radius, tube, y, mat ) =>
    {
        const r = mesh( new TorusGeometry( radius, tube, 10, 48 ), mat, body, v3( 0, y, 0 ) )
        r.rotation.x = Math.PI / 2
        r.scale.set( 1, 0.84, 1 )
        return r
    }
    ring( 0.348, 0.02, 0.775, m.obiage )
    ring( 0.36, 0.016, 0.65, m.obijime )
    mesh( new SphereGeometry( 0.032, 14, 10 ), m.obijime, body, v3( 0, 0.65, 0.305 ), v3( 1.4, 1, 0.7 ) )

    // Long dark-brown haori, open down the front, with a darker band along its
    // edges; it hangs from a pivot at the shoulders so it can flap as she runs
    const coatPivot = new Group()
    coatPivot.position.y = 1.05
    body.add( coatPivot )
    const coat = new Group()
    coat.position.y = - 1.05
    coatPivot.add( coat )
    const haori = mesh(
        new LatheGeometry( HAORI.map( ( [ r, y ] ) => new Vector2( r, y ) ), 48, HAORI_GAP, Math.PI * 2 - HAORI_GAP * 2 ),
        m.haori, coat
    )
    haori.scale.set( 1, 1, HAORI_DEPTH )
    for( const side of [ - 1, 1 ] )
    {
        const phi = side * HAORI_GAP
        const edge = HAORI.slice( 1 ).map( ( [ r, y ] ) => v3( r * Math.sin( phi ) * 1.01, y, r * Math.cos( phi ) * HAORI_DEPTH * 1.01 ) )
        stroke( edge, 0.022, m.haoriEdge, coat )
    }
    const hemPoints = []
    for( let i = 0; i <= 28; i++ )
    {
        const phi = HAORI_GAP + ( i / 28 ) * ( Math.PI * 2 - HAORI_GAP * 2 )
        hemPoints.push( v3( 0.468 * Math.sin( phi ), 0.285, 0.468 * Math.cos( phi ) * HAORI_DEPTH ) )
    }
    stroke( hemPoints, 0.02, m.haoriEdge, coat )

    mesh( new CylinderGeometry( 0.1, 0.11, 0.16, 20 ), m.skin, body, v3( 0, 1.1, 0 ) )

    const arms = { left: buildArm( - 1, body, m ), right: buildArm( 1, body, m ) }

    const neck = new Group()
    neck.position.set( 0, 1.12, 0 )
    body.add( neck )
    const head = new Group()
    head.position.set( 0, 0.48, 0.02 )
    neck.add( head )
    mesh( skullGeometry(), m.skin, head )

    const { hair, spikes } = buildHair( head, m )
    const { eyes } = buildFace( head, m )

    // elbows bent for running; the rig pumps them against her stride
    const armRest = {
        left: { shoulderX: - 0.1, shoulderZ: - 0.26, elbowX: - 1.25 },
        right: { shoulderX: - 0.1, shoulderZ: 0.26, elbowX: - 1.25 },
    }

    // the haori's hem kicks back twice a stride
    const flap = RUN.cadence * Math.PI * 4
    function update( t )
    {
        coatPivot.rotation.x = 0.07 + Math.sin( t * flap ) * 0.025
    }

    const pickables = []
    root.traverse( ( o ) => { if( o.isMesh ) pickables.push( o ) } )

    return {
        root, body, neck, head, hair, spikes, eyes, arms, legs, tail: null, armRest, pickables, materials: m,
        run: RUN, update, waveSide: - 1, bobScale: 0.3, jumpScale: 0.95,
        wavePose: { shoulderZ: 2.15, shoulderX: - 0.15, elbowX: - 0.85 }
    }
}

// ── A wisteria-lined path she runs along, and Exploding Blood ──────────────

const seeded = ( seed ) => () => ( seed = ( seed * 16807 ) % 2147483647 ) / 2147483647

const wobbly = ( amount, speed, frequency ) => positionLocal.add(
    normalLocal.mul( mx_noise_float( positionLocal.mul( frequency ).add( light.time.mul( speed ) ) ).mul( amount ) )
)

// a wide, gently domed meadow that rolls away to the horizon
const GROUND_R = 10
const GROUND_SQUASH = 0.05
const groundY = ( x, z ) => GROUND_SQUASH * ( Math.sqrt( Math.max( 0, GROUND_R * GROUND_R - x * x - z * z ) ) - GROUND_R )

// everything on the path streams from just below the frame back into the haze, then wraps
const PATH_FRONT = 3.4
const PATH_BACK = - 8.6
const PATH_SPAN = PATH_FRONT - PATH_BACK

const smooth = ( t ) => t * t * ( 3 - 2 * t )

/** A hanging wisteria raceme: pale open flowers on top, darker buds toward the tip. */
function addRaceme( parts, x, y, z, length )
{
    const n = Math.max( 6, Math.round( length / 0.045 ) )
    for( let k = 0; k < n; k++ )
    {
        const t = k / ( n - 1 )
        const r = 0.068 * ( 1 - t * 0.62 )
        const a = k * 2.4
        const g = new SphereGeometry( r, 10, 8 )
        g.translate( x + Math.sin( a ) * r * 0.7, y - t * length, z + Math.cos( a ) * r * 0.7 )
        ;( t < 0.55 ? parts.pale : parts.deep ).push( g )
    }
}

function buildTree( rand, mats )
{
    const tree = new Group()
    const lean = ( rand() - 0.5 ) * 0.35
    stroke( [ v3( 0, - 0.05, 0 ), v3( lean * 0.4, 0.7, 0.06 ), v3( lean, 1.4, - 0.04 ) ], 0.075, mats.trunk, tree )

    const leaves = []
    for( let k = 0; k < 7; k++ )
    {
        const g = new SphereGeometry( 0.2 + rand() * 0.12, 16, 12 )
        g.scale( 1, 0.8, 1 )
        g.translate( lean + ( rand() - 0.5 ) * 0.8, 1.52 + rand() * 0.28, ( rand() - 0.5 ) * 0.55 )
        leaves.push( g )
    }
    mesh( mergeGeometries( leaves ), mats.leaf, tree )

    const parts = { pale: [], deep: [] }
    for( let k = 0; k < 16; k++ )
    {
        const a = ( k / 16 ) * Math.PI * 2 + rand() * 0.4
        const r = k % 2 ? 0.2 + rand() * 0.15 : 0.42 + rand() * 0.18
        addRaceme( parts, lean + Math.cos( a ) * r, 1.5 + rand() * 0.1, Math.sin( a ) * r * 0.85, 0.45 + rand() * 0.5 )
    }
    mesh( mergeGeometries( parts.pale ), mats.pale, tree )
    mesh( mergeGeometries( parts.deep ), mats.deep, tree )
    return tree
}

/** Pink flame tongues and trailing embers of her Blood Demon Art. */
function buildFlames( parent, rand )
{
    const flameMat = new MeshBasicNodeMaterial()
    const facing = normalView.z.clamp( 0, 1 ).add( mx_noise_float( positionLocal.mul( 7 ).add( light.time.mul( 2.2 ) ) ).mul( 0.25 ) )
    flameMat.colorNode = mix(
        mix( uniform( new Color( '#b0125e' ) ), wisteriaLook.flame, smoothstep( 0.1, 0.5, facing ) ),
        uniform( new Color( '#ffd6ea' ) ),
        smoothstep( 0.82, 1.05, facing )
    )

    const flames = new Group()
    parent.add( flames )

    const tongue = spikeGeometry( 1, 0.2, 0.28, 0.75, 0.5 )
    const tongues = []
    const count = 20
    for( let i = 0; i < count; i++ )
    {
        const a = ( i / count ) * Math.PI * 2 + rand() * 0.2
        const r = 0.7 + rand() * 0.16
        const x = Math.sin( a ) * r
        const z = Math.cos( a ) * r * 0.9
        const backness = ( 1 - Math.cos( a ) ) / 2
        const pivot = new Group()
        // streaming back as she runs into them
        pivot.position.set( x, groundY( x, z ) - 0.03, z )
        pivot.rotation.set( Math.cos( a ) * 0.18 - 0.25, rand() * Math.PI * 2, - Math.sin( a ) * 0.18 )
        flames.add( pivot )
        const flame = mesh( tongue, flameMat, pivot )
        // low in front so she stays in view, tall behind and at her sides
        tongues.push( { flame, height: 0.2 + backness ** 1.4 * 0.85 + rand() * 0.12, width: 0.75 + backness * 0.4 + rand() * 0.3, phase: rand() * Math.PI * 2 } )
    }

    const aura = new Sprite( glowMaterial( SpriteNodeMaterial, '#ff4fa0', { strength: 0.9, power: 1.1 } ) )
    aura.material.colorNode = wisteriaLook.flame
    aura.position.set( 0, 0.9, - 0.3 )
    flames.add( aura )

    const ember = new SphereGeometry( 0.028, 10, 8 )
    const embers = []
    for( let i = 0; i < 24; i++ )
    {
        const e = mesh( ember, flameMat, flames )
        embers.push( { mesh: e, angle: rand() * Math.PI * 2, radius: 0.45 + rand() * 0.55, speed: 0.3 + rand() * 0.3, offset: rand(), size: 0.6 + rand() * 0.8 } )
    }

    return { flames, tongues, aura, embers }
}

export function createWisteriaPath( camera = null )
{
    const rand = seeded( 61 )

    // the rig bounces and squashes \`group\`, so it only holds what sits right at
    // her feet; the wide ground and everything streaming past live in \`ground\`
    const group = new Group()
    group.name = 'nezuko-feet'
    const ground = new Group()
    ground.name = 'wisteria-path'

    const shadowMat = new MeshBasicNodeMaterial( { transparent: true, depthWrite: false } )
    shadowMat.colorNode = uniform( new Color( '#283a52' ) )
    shadowMat.opacityNode = uniform( 0.22 )
    const shadow = new Mesh( new CircleGeometry( 0.4, 32 ), shadowMat )
    shadow.rotation.x = - Math.PI / 2
    shadow.scale.set( 1, 0.75, 1 )
    shadow.position.y = 0.018
    group.add( shadow )

    const fire = buildFlames( group, rand )

    const grass = paintedMaterial( {
        color: '#5aae62', shade: '#22604e', highlight: '#a8ea98', rim: 0.4, gloss: 0.25, scale: 1.6, terminator: 0.42,
        positionNode: wobbly( 0.008, 0.3, 1.6 ),
    } )
    const meadowGeom = new SphereGeometry( GROUND_R, 96, 40, 0, Math.PI * 2, 0, Math.PI / 2 )
    meadowGeom.scale( 1, GROUND_SQUASH, 1 )
    meadowGeom.translate( 0, - GROUND_R * GROUND_SQUASH, 0 )
    const meadow = mesh( meadowGeom, grass, ground )

    // a dirt path that follows the dome and narrows into the distance
    const dirt = paintedMaterial( { color: '#e2bf94', shade: '#a2705e', highlight: '#fff2d6', rim: 0.3, gloss: 0.15, scale: 2.2, terminator: 0.42 } )
    const pathGeom = new PlaneGeometry( 1.6, PATH_SPAN + 2, 8, 120 )
    pathGeom.rotateX( - Math.PI / 2 )
    pathGeom.translate( 0, 0, ( PATH_FRONT + PATH_BACK ) / 2 )
    const pos = pathGeom.attributes.position
    for( let i = 0; i < pos.count; i++ )
    {
        const z = pos.getZ( i )
        const narrow = 0.45 + 0.55 * Math.min( 1, Math.max( 0, ( z - PATH_BACK + 1 ) / 5 ) )
        const x = pos.getX( i ) * narrow * ( 1 + 0.1 * Math.sin( z * 1.1 ) )
        pos.setXYZ( i, x, groundY( x, z ) + 0.012, z )
    }
    pathGeom.computeVertexNormals()
    mesh( pathGeom, dirt, ground )

    // things that stream past: petals and pebbles on the path, grass and wisteria beside it
    const movers = []
    const add = ( object, x, z, scale = 1, lift = 0, clear = false ) =>
    {
        ground.add( object )
        object.rotation.y = rand() * Math.PI * 2
        movers.push( { object, x, z, scale, lift, clear } )
    }

    const paleMat = paintedMaterial( { color: '#e4ccff', shade: '#9a7ad8', highlight: '#ffffff', rim: 0.6, gloss: 0.45, scale: 3, terminator: 0.4 } )
    const deepMat = paintedMaterial( { color: '#a77ae4', shade: '#5a3aa0', highlight: '#e0ccff', rim: 0.6, gloss: 0.45, scale: 3, terminator: 0.4 } )
    const stoneMat = paintedMaterial( { color: '#b4aec8', shade: '#5c5680', highlight: '#f0ecff', rim: 0.4, scale: 2.4 } )
    const bladeMat = paintedMaterial( { color: '#3c8a4a', shade: '#1a4a3a', highlight: '#8ad48a', rim: 0.5, scale: 3 } )
    const trunkMat = paintedMaterial( { color: '#6a4a3a', shade: '#2e1c22', highlight: '#a8826a', rim: 0.5, scale: 2.6 } )
    const leafMat = paintedMaterial( { color: '#5aa860', shade: '#24604a', highlight: '#b4e898', rim: 0.5, gloss: 0.3, scale: 2.4 } )

    const petal = new SphereGeometry( 1, 8, 6 )
    petal.scale( 0.04, 0.009, 0.028 )
    for( let i = 0; i < 34; i++ )
        add( new Mesh( petal, i % 3 ? paleMat : deepMat ), ( rand() - 0.5 ) * 1.3, PATH_BACK + rand() * PATH_SPAN, 0.8 + rand() * 0.5, 0.018 )

    const pebble = new SphereGeometry( 1, 10, 8 )
    pebble.scale( 0.06, 0.03, 0.05 )
    for( let i = 0; i < 16; i++ )
    {
        const side = i % 2 ? 1 : - 1
        add( new Mesh( pebble, stoneMat ), side * ( 0.72 + rand() * 0.22 ), PATH_BACK + rand() * PATH_SPAN, 0.7 + rand() * 0.7, 0.01 )
    }

    const tuft = mergeGeometries( [ - 1, 0, 1 ].map( ( b ) =>
    {
        const blade = spikeGeometry( 0.15, 0.024, 0.03, 0.4, 0.9 )
        blade.rotateZ( b * 0.42 )
        blade.rotateY( b * 1.1 )
        return blade
    } ) )
    for( let i = 0; i < 30; i++ )
    {
        const side = i % 2 ? 1 : - 1
        add( new Mesh( tuft, bladeMat ), side * ( 0.9 + rand() * 1.4 ), PATH_BACK + rand() * PATH_SPAN, 0.8 + rand() * 0.6, - 0.01 )
    }

    const treeMats = { trunk: trunkMat, leaf: leafMat, pale: paleMat, deep: deepMat }
    const TREES = 5
    for( const side of [ - 1, 1 ] )
    {
        for( let i = 0; i < TREES; i++ )
        {
            const z = PATH_BACK + ( ( i + ( side > 0 ? 0.5 : 0 ) ) / TREES ) * PATH_SPAN + ( rand() - 0.5 ) * 0.6
            add( buildTree( rand, treeMats ), side * ( 1.95 + rand() * 0.6 ), z, 0.9 + rand() * 0.25, - 0.02, true )
        }
    }

    // drifting petals in the air, kept off to the sides so none cross her face
    const petalMat = new MeshBasicNodeMaterial( { side: DoubleSide } )
    petalMat.colorNode = wisteriaLook.blossom
    const petalShape = new Shape()
    petalShape.moveTo( 0, - 0.05 )
    petalShape.quadraticCurveTo( 0.04, 0, 0, 0.06 )
    petalShape.quadraticCurveTo( - 0.04, 0, 0, - 0.05 )
    const petalGeom = new ShapeGeometry( petalShape, 8 )
    const drifting = []
    for( let i = 0; i < 22; i++ )
    {
        const side = i % 2 ? 1 : - 1
        const p = new Mesh( petalGeom, petalMat )
        p.scale.setScalar( 0.8 + rand() * 0.9 )
        ground.add( p )
        drifting.push( { mesh: p, x: side * ( 0.95 + rand() * 2.2 ), z: PATH_BACK + rand() * PATH_SPAN, speed: 0.6 + rand() * 0.7, offset: rand(), phase: rand() * Math.PI * 2, spin: ( rand() - 0.5 ) * 2 } )
    }

    // Backdrop: a low sun (or moon) that turns with the camera so it stays in the sky behind her
    const backdrop = new Group()
    backdrop.name = 'wisteria-sky'
    const orbMat = new MeshBasicNodeMaterial()
    orbMat.colorNode = wisteriaLook.orb
    const orb = new Mesh( new CircleGeometry( 0.36, 40 ), orbMat )
    orb.position.set( 1.85, 1.5, - 3.4 )
    backdrop.add( orb )
    const orbGlow = new Sprite( glowMaterial( SpriteNodeMaterial, '#fff0c8', { strength: 0.6, power: 1.4 } ) )
    orbGlow.material.colorNode = wisteriaLook.orb
    orbGlow.scale.setScalar( 2.0 )
    orbGlow.position.set( 1.85, 1.5, - 3.45 )
    backdrop.add( orbGlow )

    const wrap = ( z ) => PATH_BACK + ( ( ( z - PATH_BACK ) % PATH_SPAN ) + PATH_SPAN ) % PATH_SPAN

    function update( t )
    {
        if( camera ) backdrop.rotation.y = Math.atan2( camera.position.x, camera.position.z )

        const travel = t * RUN.speed
        // direction toward the camera on the ground, for trees that would pass between it and her
        const cx = camera ? camera.position.x : 0
        const cz = camera ? camera.position.z : 1
        const cl = Math.hypot( cx, cz ) || 1
        for( const mv of movers )
        {
            const z = wrap( mv.z - travel )
            mv.object.position.set( mv.x, groundY( mv.x, z ) + mv.lift, z )
            // grow in as they come up from below the frame, so nothing pops
            let s = smooth( Math.min( 1, ( PATH_FRONT - z ) / 0.9 ) )
            if( mv.clear )
            {
                // trees bow out of the way while they would hide her from the camera
                const toward = ( mv.x * cx + z * cz ) / cl
                const lateral = Math.abs( mv.x * cz - z * cx ) / cl
                if( toward > 0.2 ) s *= smooth( Math.min( 1, Math.max( 0, ( lateral - 0.9 ) / 0.7 ) ) )
            }
            mv.object.scale.setScalar( mv.scale * Math.max( 1e-3, s ) )
        }
        for( const p of drifting )
        {
            const fall = ( t * 0.07 * p.speed + p.offset ) % 1
            p.mesh.position.set( p.x + Math.sin( t * p.speed + p.phase ) * 0.3, 2.6 - fall * 2.7, wrap( p.z - travel * 0.85 ) )
            p.mesh.rotation.z = Math.sin( t * p.speed * 1.3 + p.phase ) * 0.8
            p.mesh.rotation.y = t * p.spin + p.phase
        }

        const grow = smooth( Math.max( 0, ( smooth( wisteriaLook.blood.value ) - 0.05 ) / 0.95 ) )
        fire.flames.visible = grow > 0.003
        if( ! fire.flames.visible ) return
        for( const f of fire.tongues )
        {
            const flicker = 0.82 + Math.sin( t * 9 + f.phase ) * 0.12 + Math.sin( t * 14.3 + f.phase * 2 ) * 0.08
            const w = f.width * ( 0.9 + Math.sin( t * 7 + f.phase ) * 0.1 ) * grow
            f.flame.scale.set( w, Math.max( 1e-3, f.height * flicker * grow ), w )
            f.flame.rotation.z = Math.sin( t * 5 + f.phase ) * 0.12
        }
        fire.aura.scale.setScalar( ( 2.8 + Math.sin( t * 4 ) * 0.14 ) * grow )
        for( const e of fire.embers )
        {
            const life = ( t * e.speed + e.offset ) % 1
            const a = e.angle + t * 0.7 + life * 1.5
            // embers rise and trail off behind her
            e.mesh.position.set( Math.sin( a ) * e.radius, 0.05 + life * 2.1, Math.cos( a ) * e.radius * 0.9 - life * 1.6 )
            e.mesh.scale.setScalar( Math.max( 1e-3, e.size * grow * Math.sin( life * Math.PI ) ) )
        }
    }

    return {
        group, main: shadow, tail: null, ground, backdrop, update, material: grass,
        // the path stays put under her; tapping it does nothing
        grounded: true, baseY: 0, pickables: [],
    }
}
