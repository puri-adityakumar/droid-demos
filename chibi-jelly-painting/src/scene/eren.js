import {
    Group, Mesh, SphereGeometry, CapsuleGeometry, CylinderGeometry, TorusGeometry, ConeGeometry, BoxGeometry,
    LatheGeometry, TubeGeometry, ShapeGeometry, Shape, Vector2, Vector3, CatmullRomCurve3, Quaternion,
    Sprite, SpriteNodeMaterial, MeshBasicNodeMaterial, Color, DoubleSide, MathUtils
} from 'three/webgpu'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { uniform } from 'three/tsl'

import { paintedMaterial } from '../materials/painted.js'
import {
    mesh, v3, sphereDir, skullRadius, skullGeometry, orient, spikeGeometry, onTorso, stroke,
    TORSO, TORSO_DEPTH, HAIR_RADIUS, UP, Z, deg
} from './character.js'
import { glowMaterial } from './glow.js'
import { seeded, smooth } from './parts.js'

// Eren Yeager of the Survey Corps, and the Attack Titan he turns into.
//
// As a scout: messy dark-brown hair with a fringe over a furious glare, teal-
// green eyes, a tan cropped jacket open over his shirt with the Wings of
// Freedom on the chest, white trousers strapped by the ODM harness, knee-high
// boots, the gear's blade boxes and gas tanks on his hips, a blade in each
// hand, the green Survey Corps cloak with the wings on its back, and his
// father's basement key on a string round his neck.
//
// As the Attack Titan: a chibi giant with long dark hair to the shoulders,
// glowing green eyes sunk under a heavy brow, pointed ears, a lipless mouth
// that bares its teeth back to the cheek muscles, and a lean, muscled body
// that never stops steaming.
//
// The mood switch is the transformation. Going titan he bites his hand, a
// bolt of gold lightning strikes him, steam explodes out and the titan grows
// out of it, then roars; going back, the titan sinks into its own steam and
// Eren drops out of it. Both forms share one skeleton so the rig drives
// either, and the whole figure is scaled up for the titan.

/** The world's mood says which form he should be in; the theme driver writes `goal`. */
export const erenLook = { goal: 0 }

const TITAN_SCALE = 1.8

export const palette = {
    skin: '#ffdcc4',
    hair: '#4a2f24',
    jacket: '#c99862',
    shirt: '#ece4d8',
    pants: '#f6f2ea',
    boot: '#4a2c22',
    strap: '#5c3626',
    metal: '#aeb6c4',
    blade: '#e8eef6',
    cloak: '#3e6a4c',
    wingBlue: '#3c5cae',
    wingWhite: '#f6f4ee',
    brass: '#d9b25a',
    iris: '#33b29c',
    titanSkin: '#efb898',
    titanHair: '#3a241e',
    muscle: '#c8404a',
    titanEye: '#7cf0a0',
}

function makeMaterials()
{
    const m = {
        skin: paintedMaterial( { color: palette.skin, shade: '#ea9a8c', highlight: '#fff2e8', rim: 0.6, gloss: 0.25, scale: 2.4 } ),
        hair: paintedMaterial( { color: palette.hair, shade: '#21130f', highlight: '#9a6a52', rim: 0.7, gloss: 0.55, scale: 3.2, terminator: 0.48 } ),
        jacket: paintedMaterial( { color: palette.jacket, shade: '#80523a', highlight: '#f2cc96', rim: 0.55, gloss: 0.35, scale: 3 } ),
        seam: paintedMaterial( { color: '#8a5a3a', shade: '#4a2c1e', highlight: '#c08a5e', rim: 0.2, gloss: 0.1, scale: 3 } ),
        shirt: paintedMaterial( { color: palette.shirt, shade: '#aaa0b4', highlight: '#ffffff', rim: 0.45, gloss: 0.2, scale: 3 } ),
        pants: paintedMaterial( { color: palette.pants, shade: '#b2aac0', highlight: '#ffffff', rim: 0.5, gloss: 0.2, scale: 3 } ),
        boot: paintedMaterial( { color: palette.boot, shade: '#1e100c', highlight: '#946048', rim: 0.5, gloss: 0.6, scale: 3 } ),
        strap: paintedMaterial( { color: palette.strap, shade: '#24120c', highlight: '#9a6a4c', rim: 0.3, gloss: 0.4, scale: 3 } ),
        metal: paintedMaterial( { color: palette.metal, shade: '#545c70', highlight: '#ffffff', rim: 0.7, gloss: 1, scale: 2 } ),
        blade: paintedMaterial( { color: palette.blade, shade: '#7c8aa2', highlight: '#ffffff', rim: 0.9, gloss: 1, scale: 1.5 } ),
        cloak: paintedMaterial( { color: palette.cloak, shade: '#1c3a2c', highlight: '#86b07e', rim: 0.55, gloss: 0.25, scale: 2.6 } ),
        wingBlue: paintedMaterial( { color: palette.wingBlue, shade: '#22327a', highlight: '#7c9ae8', rim: 0.2, gloss: 0.2, brush: 0.4 } ),
        wingWhite: paintedMaterial( { color: palette.wingWhite, shade: '#b8b4c8', highlight: '#ffffff', rim: 0.2, gloss: 0.2, brush: 0.4 } ),
        brass: paintedMaterial( { color: palette.brass, shade: '#8a5a24', highlight: '#fff0b0', rim: 0.6, gloss: 1, scale: 2 } ),
        sclera: paintedMaterial( { color: '#ffffff', shade: '#d8d2e4', rim: 0, gloss: 0, brush: 0.2, haze: 0 } ),
        irisRing: paintedMaterial( { color: '#16534c', unlit: true } ),
        iris: paintedMaterial( { color: palette.iris, unlit: true } ),
        irisLow: paintedMaterial( { color: '#9cf0d4', unlit: true } ),
        pupil: paintedMaterial( { color: '#0e1e1c', unlit: true } ),
        white: paintedMaterial( { color: '#ffffff', unlit: true } ),
        lash: paintedMaterial( { color: '#2a1a16', shade: '#120a08', rim: 0, gloss: 0, brush: 0.3, haze: 0.2 } ),
        mouth: paintedMaterial( { color: '#6e1e28', shade: '#3a0c14', rim: 0, gloss: 0, brush: 0.3, haze: 0.25 } ),
        tongue: paintedMaterial( { color: '#e8707c', shade: '#b04656', rim: 0, gloss: 0, brush: 0.3, haze: 0.25 } ),
        blush: paintedMaterial( { color: '#f4a090', shade: '#e07a74', rim: 0, gloss: 0, brush: 0.4 } ),

        titanSkin: paintedMaterial( { color: palette.titanSkin, shade: '#a2524a', highlight: '#ffe0c8', rim: 0.65, gloss: 0.35, scale: 2.2 } ),
        titanLine: paintedMaterial( { color: '#8c4038', shade: '#5a2020', rim: 0, gloss: 0, brush: 0.4, scale: 3 } ),
        titanHair: paintedMaterial( { color: palette.titanHair, shade: '#160a08', highlight: '#7a5040', rim: 0.65, gloss: 0.5, scale: 3, terminator: 0.48 } ),
        muscle: paintedMaterial( { color: palette.muscle, shade: '#5e1018', highlight: '#ff8c80', rim: 0.4, gloss: 0.7, scale: 4 } ),
        fiber: paintedMaterial( { color: '#f08c88', shade: '#a8404a', highlight: '#ffc4b8', rim: 0.2, gloss: 0.6, scale: 4 } ),
        socket: paintedMaterial( { color: '#3c1814', shade: '#1c0806', rim: 0, gloss: 0, brush: 0.4, haze: 0.2 } ),
        titanEye: paintedMaterial( { color: palette.titanEye, unlit: true } ),
        titanPupil: paintedMaterial( { color: '#0c2a16', unlit: true } ),
        teeth: paintedMaterial( { color: '#fff6ea', shade: '#c8b0a0', highlight: '#ffffff', rim: 0.3, gloss: 0.5, scale: 4 } ),
        maw: paintedMaterial( { color: '#3a0a10', unlit: true } ),
        steam: paintedMaterial( { color: '#f6f2ee', shade: '#c4b8c8', highlight: '#ffffff', rim: 0.7, gloss: 0.15, scale: 1.6, haze: 0.5 } ),
    }
    m.jacket.side = DoubleSide
    m.cloak.side = DoubleSide
    return m
}

const clamp01 = ( x ) => Math.min( 1, Math.max( 0, x ) )
const ease = ( x ) => smooth( clamp01( x ) )
const easeOutBack = ( x ) =>
{
    const c = 1.9
    const u = clamp01( x ) - 1
    return 1 + ( c + 1 ) * u * u * u + c * u * u
}

/** A point on a lathed surface (profile of [radius, y], squashed in depth), on its front or back. */
function radiusAt( profile, y )
{
    for( let i = 1; i < profile.length; i++ )
    {
        const [ r0, y0 ] = profile[ i - 1 ]
        const [ r1, y1 ] = profile[ i ]
        if( y <= y1 && y >= y0 && y1 > y0 ) return r0 + ( r1 - r0 ) * ( y - y0 ) / ( y1 - y0 )
    }
    return profile[ y < profile[ 0 ][ 1 ] ? 0 : profile.length - 1 ][ 0 ]
}

function onProfile( profile, depth, x, y, face = 1, lift = 0.004 )
{
    const r = radiusAt( profile, y )
    return v3( x, y, face * ( depth * Math.sqrt( Math.max( 0, r * r - x * x ) ) + lift ) )
}

/** Bends a flat shape onto a surface: `toSurface(x, y)` maps shape coordinates to a point. */
function decal( shape, toSurface, material, parent, segments = 10 )
{
    const g = new ShapeGeometry( shape, segments )
    const pos = g.attributes.position
    for( let i = 0; i < pos.count; i++ )
    {
        const p = toSurface( pos.getX( i ), pos.getY( i ) )
        pos.setXYZ( i, p.x, p.y, p.z )
    }
    g.computeVertexNormals()
    return mesh( g, material, parent )
}

// one wing of the Wings of Freedom, tip up and to the right, feathers scalloped down its trailing edge
const WING = [
    [ 0.02, - 0.62 ], [ - 0.08, - 0.12 ], [ 0.02, 0.36 ], [ 0.4, 0.74 ], [ 0.36, 0.46 ], [ 0.54, 0.38 ],
    [ 0.38, 0.18 ], [ 0.52, 0.08 ], [ 0.34, - 0.1 ], [ 0.44, - 0.22 ], [ 0.22, - 0.34 ], [ 0.26, - 0.5 ],
]

function wingShape( side, offset )
{
    const s = new Shape()
    WING.forEach( ( [ x, y ], i ) => i ? s.lineTo( offset + x * side, y ) : s.moveTo( offset + x * side, y ) )
    s.closePath()
    return s
}

/** The Survey Corps emblem: a white wing crossed by a blue one, mapped onto a surface. */
function wingsOfFreedom( m, parent, place, size )
{
    decal( wingShape( - 1, 0.13 ), ( x, y ) => place( x * size, y * size, 0 ), m.wingWhite, parent )
    decal( wingShape( 1, - 0.13 ), ( x, y ) => place( x * size, y * size, 0.004 ), m.wingBlue, parent )
}

function makeSpikes( hair, mat )
{
    const spikes = []
    const add = ( base, direction, length, radius, bend, curl, { inset = 0.45, flat = 0.55, fullness = 0.75, weight = length } = {} ) =>
    {
        const pivot = new Group()
        pivot.position.copy( base.clone().multiplyScalar( inset ) )
        orient( pivot, direction, curl )
        hair.add( pivot )
        mesh( spikeGeometry( length, radius, bend, flat, fullness ), mat, pivot )
        spikes.push( { pivot, rest: pivot.quaternion.clone(), weight } )
    }
    return { spikes, add }
}

const at = ( yaw, pitch ) => sphereDir( yaw * deg, pitch * deg )
const LEFT = v3( - 1, 0, 0 )
const RIGHT = v3( 1, 0, 0 )

/** A fringe lock lying on the forehead and flicking sideways, as in character.js. */
function bang( add, yaw, pitch, length, radius, side, { tilt = 0.45, spread = 0.07, inset = 0.6 } = {} )
{
    const n = at( yaw, pitch )
    const down = UP.clone().sub( n.clone().multiplyScalar( n.y ) ).normalize().negate()
    const dir = down.clone().sub( n.clone().multiplyScalar( tilt ) ).add( v3( side * spread, 0, 0 ) )
    add( n, dir, length, radius, 0.2, v3( side, 0, 0 ), { inset, flat: 0.42, fullness: 0.55 } )
}

function buildScoutHair( head, m )
{
    const hair = new Group()
    head.add( hair )
    const cap = mesh( new SphereGeometry( HAIR_RADIUS, 48, 32, 0, Math.PI * 2, 0, 1.8 ), m.hair, hair )
    cap.rotation.x = - 0.7
    const { spikes, add } = makeSpikes( hair, m.hair )

    // a messy crown: short tufts kicking up and back
    add( at( 6, 80 ), v3( 0.15, 1, - 0.55 ), 0.4, 0.2, 0.22, LEFT )
    add( at( - 32, 68 ), v3( - 0.55, 0.85, - 0.45 ), 0.42, 0.2, 0.24, UP )
    add( at( 34, 66 ), v3( 0.6, 0.8, - 0.45 ), 0.4, 0.2, 0.24, UP )
    add( at( 180, 62 ), v3( 0, 0.55, - 1 ), 0.46, 0.24, 0.24, UP )
    add( at( - 150, 50 ), v3( - 0.6, 0.35, - 1 ), 0.44, 0.22, 0.26, UP )
    add( at( 150, 50 ), v3( 0.6, 0.35, - 1 ), 0.44, 0.22, 0.26, UP )

    // sides falling over the ears and a short shaggy nape
    for( const side of [ - 1, 1 ] )
    {
        add( at( side * 78, 22 ), v3( side * 0.3, - 1, 0.08 ), 0.46, 0.2, 0.2, v3( side, 0, 0 ), { inset: 0.52, flat: 0.5 } )
        add( at( side * 102, 14 ), v3( side * 0.36, - 1, - 0.22 ), 0.5, 0.22, 0.22, v3( side, 0, 0 ), { inset: 0.5, flat: 0.5 } )
        add( at( side * 132, 8 ), v3( side * 0.34, - 1, - 0.6 ), 0.48, 0.22, 0.2, UP, { inset: 0.5, flat: 0.5 } )
        add( at( side * 160, 18 ), v3( side * 0.2, - 0.9, - 0.75 ), 0.46, 0.22, 0.2, UP, { inset: 0.5, flat: 0.5 } )
    }
    add( at( 180, 26 ), v3( 0, - 0.85, - 0.8 ), 0.46, 0.24, 0.2, UP, { inset: 0.5, flat: 0.5 } )

    // the fringe: uneven locks hanging into his eyes, parted a little off centre
    for( const [ yaw, pitch, length, radius, side ] of [
        [ - 52, 50, 0.42, 0.15, - 1 ], [ - 33, 57, 0.5, 0.17, - 1 ], [ - 14, 61, 0.54, 0.17, - 1 ],
        [ 6, 62, 0.48, 0.16, 1 ], [ 24, 59, 0.54, 0.17, 1 ], [ 44, 53, 0.44, 0.16, 1 ], [ 62, 44, 0.36, 0.14, 1 ],
    ] ) bang( add, yaw, pitch, length, radius, side )

    return { hair, spikes }
}

function buildTitanHair( head, m )
{
    const hair = new Group()
    head.add( hair )
    // only the crown is covered; the cap tips back so the brow shows under the parting
    const cap = mesh( new SphereGeometry( HAIR_RADIUS + 0.012, 48, 32, 0, Math.PI * 2, 0, 1.3 ), m.titanHair, hair )
    cap.rotation.x = - 0.72
    const { spikes, add } = makeSpikes( hair, m.titanHair )
    const lank = { inset: 0.5, flat: 0.5, fullness: 0.7, weight: 0.35 }

    for( const side of [ - 1, 1 ] )
    {
        // heavy locks falling from the centre parting and framing the face down to the jaw
        bang( add, side * 6, 70, 0.72, 0.19, side, { tilt: 0.32, spread: 0.5, inset: 0.56 } )
        bang( add, side * 20, 64, 0.8, 0.2, side, { tilt: 0.3, spread: 0.42, inset: 0.56 } )
        bang( add, side * 36, 56, 0.86, 0.19, side, { tilt: 0.26, spread: 0.32, inset: 0.55 } )
        bang( add, side * 52, 46, 0.86, 0.17, side, { tilt: 0.2, spread: 0.24, inset: 0.54 } )

        // lank, shoulder-length hair all round the sides and back
        for( const [ yaw, pitch, len, r ] of [
            [ 66, 36, 0.86, 0.17 ], [ 80, 30, 0.92, 0.18 ], [ 94, 30, 0.96, 0.18 ], [ 108, 28, 1.0, 0.18 ],
            [ 122, 30, 1.0, 0.18 ], [ 136, 32, 1.02, 0.18 ], [ 150, 34, 1.02, 0.18 ], [ 166, 36, 1.02, 0.18 ],
            [ 88, 50, 0.92, 0.15 ], [ 118, 52, 0.96, 0.15 ], [ 148, 54, 1.0, 0.15 ],
        ] )
        {
            const n = at( side * yaw, pitch )
            add( n, v3( n.x * 0.32, - 1, n.z * 0.34 ), len, r, 0.06, v3( side, 0, 0 ), lank )
        }
    }
    add( at( 180, 36 ), v3( 0, - 1, - 0.34 ), 1.02, 0.19, 0.05, UP, lank )
    add( at( 180, 56 ), v3( 0, - 0.9, - 0.5 ), 1.0, 0.17, 0.05, UP, lank )

    return { hair, spikes }
}
function placer( parent )
{
    return ( object, yaw, pitch, inset = 0, spin = 0, target = parent ) =>
    {
        const dir = sphereDir( yaw, pitch )
        object.position.copy( dir.clone().multiplyScalar( skullRadius( dir ) - inset ) )
        object.quaternion.setFromUnitVectors( Z, dir )
        if( spin ) object.rotateZ( spin )
        target.add( object )
        return object
    }
}

function faceStroke( parent, points, radius, material )
{
    return stroke( points.map( ( [ yaw, pitch, lift = 0.006 ] ) =>
    {
        const d = sphereDir( yaw, pitch )
        return d.multiplyScalar( skullRadius( d ) + lift )
    } ), radius, material, parent )
}

const SPHERE = new SphereGeometry( 1, 28, 20 )
const part = ( material, [ sx, sy, sz ], [ x, y, z ], parent ) =>
{
    const p = new Mesh( SPHERE, material )
    p.scale.set( sx, sy, sz )
    p.position.set( x, y, z )
    parent.add( p )
    return p
}

function buildScoutFace( head, m )
{
    const place = placer( head )
    const eyes = []
    for( const side of [ - 1, 1 ] )
    {
        // big teal-green eyes under a hard, furious lid line
        const eye = new Group()
        part( m.sclera, [ 0.106, 0.122, 0.048 ], [ 0, 0, 0 ], eye )
        part( m.irisRing, [ 0.084, 0.102, 0.03 ], [ side * 0.004, - 0.01, 0.024 ], eye )
        part( m.iris, [ 0.07, 0.088, 0.03 ], [ side * 0.004, - 0.014, 0.032 ], eye )
        part( m.irisLow, [ 0.05, 0.034, 0.02 ], [ side * 0.004, - 0.052, 0.048 ], eye )
        part( m.pupil, [ 0.032, 0.044, 0.02 ], [ side * 0.004, - 0.006, 0.052 ], eye )
        part( m.white, [ 0.028, 0.032, 0.015 ], [ side * 0.03, 0.034, 0.066 ], eye )
        part( m.white, [ 0.012, 0.012, 0.01 ], [ - side * 0.03, - 0.046, 0.066 ], eye )
        const lid = [ [ - 0.118, 0.03 ], [ - 0.05, 0.088 ], [ 0.04, 0.118 ], [ 0.112, 0.104 ], [ 0.146, 0.124 ] ]
            .map( ( [ x, y ] ) => v3( x * side, y, 0.022 ) )
        eye.add( new Mesh( new TubeGeometry( new CatmullRomCurve3( lid ), 28, 0.021, 8 ), m.lash ) )
        const lower = [ [ - 0.06, - 0.096 ], [ 0.02, - 0.104 ], [ 0.094, - 0.08 ] ].map( ( [ x, y ] ) => v3( x * side, y, 0.016 ) )
        eye.add( new Mesh( new TubeGeometry( new CatmullRomCurve3( lower ), 12, 0.007, 6 ), m.lash ) )
        place( eye, side * 0.33, - 0.07, 0.018, - side * 0.04 )
        eyes.push( eye )

        // brows slammed down toward the nose
        const brow = [ [ - 0.1, - 0.045 ], [ - 0.01, 0.0 ], [ 0.09, 0.028 ] ].map( ( [ x, y ] ) => v3( x * side, y, 0 ) )
        place( new Mesh( new TubeGeometry( new CatmullRomCurve3( brow ), 18, 0.019, 8 ), m.lash ), side * 0.31, 0.15, 0.002 )
        // the crease of a scowl between them
        faceStroke( head, [ [ side * 0.06, 0.13 ], [ side * 0.05, 0.07 ] ], 0.006, m.lash )

        const blush = new Mesh( SPHERE, m.blush )
        blush.scale.set( 0.06, 0.026, 0.02 )
        place( blush, side * 0.55, - 0.24, 0.01 )

        const ear = new Mesh( SPHERE, m.skin )
        ear.scale.set( 0.07, 0.12, 0.09 )
        ear.position.set( side * 0.56, - 0.06, - 0.03 )
        head.add( ear )
    }

    const nose = new Mesh( SPHERE, m.skin )
    nose.scale.set( 0.028, 0.022, 0.025 )
    place( nose, 0, - 0.13, 0.012 )

    // mid-yell: an open, squared-off mouth with the top teeth showing
    const w = 0.078
    const h = 0.08
    const yell = new Shape()
    yell.moveTo( - w, 0.012 )
    yell.quadraticCurveTo( 0, 0.03, w, 0.012 )
    yell.bezierCurveTo( w * 0.86, - h * 0.95, - w * 0.86, - h * 0.95, - w, 0.012 )
    const teeth = new Shape()
    teeth.moveTo( - w * 0.84, 0.01 )
    teeth.quadraticCurveTo( 0, 0.026, w * 0.84, 0.01 )
    teeth.lineTo( w * 0.74, - 0.012 )
    teeth.quadraticCurveTo( 0, 0.002, - w * 0.74, - 0.012 )
    teeth.closePath()
    const tongue = new Shape()
    tongue.moveTo( - w * 0.5, - h * 0.5 )
    tongue.bezierCurveTo( - w * 0.2, - h * 0.3, w * 0.2, - h * 0.3, w * 0.5, - h * 0.5 )
    tongue.bezierCurveTo( w * 0.3, - h * 0.72, - w * 0.3, - h * 0.72, - w * 0.5, - h * 0.5 )
    const mouth = place( new Group(), 0, - 0.27, - 0.004 )
    mesh( new ShapeGeometry( yell, 16 ), m.mouth, mouth )
    mesh( new ShapeGeometry( teeth, 12 ), m.white, mouth, v3( 0, 0, 0.002 ) )
    mesh( new ShapeGeometry( tongue, 12 ), m.tongue, mouth, v3( 0, 0, 0.001 ) )

    return { eyes }
}

function buildTitanFace( head, m )
{
    const place = placer( head )
    const eyes = []
    for( const side of [ - 1, 1 ] )
    {
        // glowing green eyes deep in dark sockets under a heavy, scowling brow
        const socket = new Mesh( SPHERE, m.socket )
        socket.scale.set( 0.15, 0.085, 0.035 )
        place( socket, side * 0.31, - 0.05, 0.016, - side * 0.16 )

        const eye = new Group()
        part( m.titanEye, [ 0.08, 0.05, 0.03 ], [ 0, 0, 0.012 ], eye )
        part( m.titanPupil, [ 0.022, 0.036, 0.02 ], [ side * 0.006, 0, 0.034 ], eye )
        part( m.white, [ 0.014, 0.014, 0.01 ], [ side * 0.026, 0.016, 0.04 ], eye )
        place( eye, side * 0.31, - 0.055, 0.006, - side * 0.16 )
        eyes.push( eye )

        const ridge = new Mesh( new CapsuleGeometry( 0.04, 0.22, 6, 12 ).rotateZ( Math.PI / 2 ), m.titanSkin )
        place( ridge, side * 0.29, 0.07, 0.006, side * 0.34 )
        faceStroke( head, [ [ side * 0.12, 0.05, 0.03 ], [ side * 0.28, 0.1, 0.034 ], [ side * 0.44, 0.13, 0.026 ] ], 0.014, m.titanLine )

        // the hard lines that run down from his eyes
        faceStroke( head, [ [ side * 0.2, - 0.13 ], [ side * 0.24, - 0.2 ], [ side * 0.27, - 0.25 ] ], 0.011, m.titanLine )
        faceStroke( head, [ [ side * 0.36, - 0.14 ], [ side * 0.42, - 0.19 ], [ side * 0.5, - 0.21 ] ], 0.011, m.titanLine )
        // nose-to-mouth creases
        faceStroke( head, [ [ side * 0.07, - 0.17 ], [ side * 0.13, - 0.22 ], [ side * 0.16, - 0.26 ] ], 0.008, m.titanLine )

        // lipless cheeks: a patch of raw muscle from the corner of the mouth back toward the ear
        const cheek = new Mesh( SPHERE, m.muscle )
        cheek.scale.set( 0.2, 0.07, 0.028 )
        place( cheek, side * 0.6, - 0.27, 0.012, side * 0.12 )
        for( const dp of [ - 0.04, 0, 0.04 ] )
            faceStroke( head, [ [ side * 0.44, - 0.27 + dp, 0.014 ], [ side * 0.6, - 0.27 + dp + 0.012, 0.018 ], [ side * 0.78, - 0.25 + dp, 0.012 ] ], 0.007, m.fiber )

        // pointed ears poking out through the hair
        const ear = new Group()
        ear.position.set( side * 0.58, - 0.02, - 0.04 )
        ear.rotation.set( - 0.2, 0, - side * 0.75 )
        head.add( ear )
        mesh( new ConeGeometry( 0.08, 0.32, 12 ), m.titanSkin, ear, v3( 0, 0.13, 0 ), v3( 1, 1, 0.5 ) )
    }

    // a long, straight nose
    const bridge = new Mesh( new CapsuleGeometry( 0.026, 0.09, 6, 10 ), m.titanSkin )
    place( bridge, 0, - 0.08, 0.004, 0 )
    bridge.rotateX( 0.25 )
    const nose = new Mesh( SPHERE, m.titanSkin )
    nose.scale.set( 0.038, 0.032, 0.034 )
    place( nose, 0, - 0.15, 0.012 )
    for( const side of [ - 1, 1 ] )
    {
        const nostril = new Mesh( SPHERE, m.socket )
        nostril.scale.set( 0.01, 0.007, 0.007 )
        place( nostril, side * 0.028, - 0.18, - 0.016 )
    }

    // the mouth: a grin with no lips, teeth running back into the cheeks around a dark gap
    const maw = new Mesh( SPHERE, m.maw )
    maw.scale.set( 0.3, 0.032, 0.05 )
    place( maw, 0, - 0.285, 0.024 )
    maw.userData.restY = maw.position.y
    const jaw = new Group()
    head.add( jaw )
    // a longer jaw than Eren's, which drops with the bottom teeth
    mesh( SPHERE, m.titanSkin, jaw, v3( 0, - 0.4, 0.27 ), v3( 0.3, 0.17, 0.27 ) )
    const tooth = new BoxGeometry( 0.034, 0.05, 0.02 )
    const TEETH = 16
    for( let i = 0; i < TEETH; i++ )
    {
        const u = ( i + 0.5 ) / TEETH - 0.5
        const yaw = u * 1.3
        // smaller molars toward the back
        const s = 1 - Math.abs( u ) * 0.6
        place( new Mesh( tooth, m.teeth ), yaw, - 0.255, 0.004 ).scale.set( s, s, 1 )
        place( new Mesh( tooth, m.teeth ), yaw, - 0.315, 0.004, 0, jaw ).scale.set( s, s, 1 )
    }

    return { eyes, jaw, maw }
}
// torso profile for his jacket, cut short at the ribs like the Survey Corps one
const JACKET = [ [ 0.356, 0.75 ], [ 0.362, 0.8 ], [ 0.33, 0.93 ], [ 0.232, 1.02 ], [ 0.142, 1.06 ] ]
// the cloak hangs from the shoulders (its pivot) and flares as it falls
const CLOAK_TOP = 1.05
const CLOAK = [ [ 0.48, 0.3 ], [ 0.44, 0.52 ], [ 0.41, 0.76 ], [ 0.38, 0.94 ], [ 0.3, 1.02 ], [ 0.2, 1.06 ] ]
const CLOAK_DEPTH = 0.86
// a broader, more muscled build for the titan
const TITAN_TORSO = [ [ 0.0, 0.42 ], [ 0.27, 0.42 ], [ 0.26, 0.54 ], [ 0.31, 0.68 ], [ 0.37, 0.82 ], [ 0.365, 0.92 ], [ 0.27, 1.01 ], [ 0.15, 1.07 ], [ 0.0, 1.07 ] ]
const TITAN_DEPTH = 0.78

function buildScoutBody( body, m )
{
    const g = new Group()
    body.add( g )

    // trousers, thigh straps and knee-high boots
    for( const side of [ - 1, 1 ] )
    {
        mesh( new CylinderGeometry( 0.14, 0.16, 0.3, 24 ), m.pants, g, v3( side * 0.13, 0.36, 0 ) )
        const thigh = mesh( new TorusGeometry( 0.152, 0.016, 8, 28 ), m.strap, g, v3( side * 0.13, 0.38, 0 ) )
        thigh.rotation.set( Math.PI / 2 + 0.18, 0, 0 )
        mesh( new CylinderGeometry( 0.148, 0.138, 0.22, 24 ), m.boot, g, v3( side * 0.135, 0.15, 0 ) )
        const cuff = mesh( new TorusGeometry( 0.146, 0.018, 8, 28 ), m.boot, g, v3( side * 0.135, 0.26, 0 ) )
        cuff.rotation.x = Math.PI / 2
        mesh( new SphereGeometry( 1, 24, 16 ), m.boot, g, v3( side * 0.14, 0.06, 0.05 ), v3( 0.145, 0.085, 0.215 ) )
    }
    mesh( new SphereGeometry( 0.3, 32, 20 ), m.pants, g, v3( 0, 0.5, 0 ), v3( 1, 0.55, 0.84 ) )

    // shirt, with the cropped jacket open over it
    const shirt = mesh( new LatheGeometry( TORSO.map( ( [ r, y ] ) => new Vector2( r, y ) ), 40 ), m.shirt, g )
    shirt.scale.set( 1, 1, TORSO_DEPTH )
    const gap = 0.38
    const jacket = mesh( new LatheGeometry( JACKET.map( ( [ r, y ] ) => new Vector2( r, y ) ), 40, gap, Math.PI * 2 - gap * 2 ), m.jacket, g )
    jacket.scale.set( 1, 1, TORSO_DEPTH )
    const onJacket = ( x, y, lift = 0.006 ) => onProfile( JACKET, TORSO_DEPTH, x, y, 1, lift )
    for( const side of [ - 1, 1 ] )
    {
        // lapels folded back along the opening, and the hem's seam
        const edge = Math.sin( gap )
        stroke( [ 0.77, 0.86, 0.95, 1.03 ].map( ( y ) => { const r = radiusAt( JACKET, y ); return onJacket( side * r * edge * 1.02, y, 0.012 ) } ), 0.022, m.jacket, g )
    }
    const hem = mesh( new TorusGeometry( 0.356, 0.014, 8, 48, Math.PI * 2 - gap * 2 ), m.seam, g, v3( 0, 0.752, 0 ) )
    hem.rotation.set( Math.PI / 2, 0, Math.PI / 2 + gap )
    hem.scale.set( 1, TORSO_DEPTH, 1 )
    // turned-down collar round the neck
    const collar = mesh( new TorusGeometry( 0.15, 0.04, 10, 32 ), m.jacket, g, v3( 0, 1.05, - 0.01 ) )
    collar.rotation.x = Math.PI / 2 + 0.2

    // Wings of Freedom on the chest pocket
    wingsOfFreedom( m, g, ( x, y, lift ) => onJacket( 0.16 + x, 0.875 + y, 0.012 + lift ), 0.07 )

    // ODM harness: a strap round the chest under the jacket, braces down to the belt
    const chest = mesh( new TorusGeometry( 0.338, 0.02, 8, 48 ), m.strap, g, v3( 0, 0.72, 0 ) )
    chest.rotation.x = Math.PI / 2
    chest.scale.set( 1, TORSO_DEPTH, 1 )
    for( const side of [ - 1, 1 ] )
        stroke( [ 0.72, 0.64, 0.56 ].map( ( y ) => onTorso( side * 0.13, y, 1, 0.012 ) ), 0.018, m.strap, g )
    const belt = mesh( new TorusGeometry( 0.322, 0.036, 10, 48 ), m.strap, g, v3( 0, 0.55, 0 ) )
    belt.rotation.x = Math.PI / 2
    belt.scale.set( 1, 0.83, 1 )
    mesh( new RoundedBoxGeometry( 0.08, 0.06, 0.03, 2, 0.01 ), m.metal, g, v3( 0, 0.55, 0.272 ) )

    // the gear: blade boxes and gas tanks slung on the hips, the reel unit at the small of the back
    for( const side of [ - 1, 1 ] )
    {
        const rig = new Group()
        rig.position.set( side * 0.4, 0.46, - 0.04 )
        rig.rotation.set( 0.22, side * 0.12, 0 )
        g.add( rig )
        mesh( new RoundedBoxGeometry( 0.12, 0.17, 0.5, 3, 0.03 ), m.metal, rig )
        for( const z of [ 0.12, - 0.06 ] ) mesh( new BoxGeometry( 0.124, 0.02, 0.012 ), m.strap, rig, v3( 0, 0.03, z ) )
        const tank = mesh( new CapsuleGeometry( 0.046, 0.34, 4, 12 ), m.metal, rig, v3( - side * 0.02, 0.13, - 0.06 ) )
        tank.rotation.x = Math.PI / 2
    }
    mesh( new RoundedBoxGeometry( 0.22, 0.13, 0.1, 2, 0.02 ), m.metal, g, v3( 0, 0.55, - 0.3 ) )
    for( const side of [ - 1, 1 ] )
    {
        const reel = mesh( new CylinderGeometry( 0.05, 0.05, 0.04, 16 ), m.metal, g, v3( side * 0.13, 0.55, - 0.3 ) )
        reel.rotation.z = Math.PI / 2
    }

    // the basement key on its string
    const string = [ [ - 0.09, 1.02 ], [ - 0.05, 0.94 ], [ 0, 0.885 ], [ 0.05, 0.94 ], [ 0.09, 1.02 ] ].map( ( [ x, y ] ) => onTorso( x, y, 1, 0.02 ) )
    stroke( string, 0.006, m.lash, g )
    const key = new Group()
    key.position.copy( onTorso( 0, 0.865, 1, 0.032 ) )
    key.rotation.x = - 0.25
    g.add( key )
    mesh( new TorusGeometry( 0.022, 0.007, 8, 18 ), m.brass, key )
    mesh( new CylinderGeometry( 0.007, 0.007, 0.08, 8 ), m.brass, key, v3( 0, - 0.06, 0 ) )
    mesh( new BoxGeometry( 0.02, 0.012, 0.008 ), m.brass, key, v3( 0.01, - 0.088, 0 ) )
    mesh( new BoxGeometry( 0.014, 0.01, 0.008 ), m.brass, key, v3( 0.007, - 0.07, 0 ) )

    mesh( new CylinderGeometry( 0.1, 0.11, 0.14, 20 ), m.skin, g, v3( 0, 1.08, 0 ) )

    // the green cloak, its hood bunched behind the neck and the wings on its back
    const cloak = new Group()
    cloak.position.y = CLOAK_TOP
    g.add( cloak )
    const half = 1.5
    const drape = mesh( new LatheGeometry( CLOAK.map( ( [ r, y ] ) => new Vector2( r, y - CLOAK_TOP ) ), 36, Math.PI - half, half * 2 ), m.cloak, cloak )
    drape.scale.set( 1, 1, CLOAK_DEPTH )
    mesh( SPHERE, m.cloak, cloak, v3( 0, 0.02, - 0.22 ), v3( 0.24, 0.1, 0.13 ) )
    wingsOfFreedom( m, cloak, ( x, y, lift ) => onProfile( CLOAK.map( ( [ r, yy ] ) => [ r, yy - CLOAK_TOP ] ), CLOAK_DEPTH, - x, 0.72 - CLOAK_TOP + y, - 1, 0.008 + lift ), 0.13 )

    return { group: g, cloak }
}

function buildTitanBody( body, m )
{
    const g = new Group()
    body.add( g )
    const on = ( x, y, lift = 0 ) => onProfile( TITAN_TORSO, TITAN_DEPTH, x, y, 1, lift )
    const line = ( pts, r = 0.009 ) => stroke( pts.map( ( [ x, y ] ) => on( x, y, 0.006 ) ), r, m.titanLine, g )

    // legs: thighs with a bulging quad, knees, calves and bare feet with toes
    for( const side of [ - 1, 1 ] )
    {
        const x = side * 0.14
        mesh( new CylinderGeometry( 0.17, 0.13, 0.26, 24 ), m.titanSkin, g, v3( x, 0.32, 0 ) )
        mesh( SPHERE, m.titanSkin, g, v3( x + side * 0.02, 0.34, 0.07 ), v3( 0.12, 0.15, 0.1 ) )
        mesh( SPHERE, m.titanSkin, g, v3( x, 0.19, 0.04 ), v3( 0.11, 0.08, 0.1 ) )
        mesh( new CylinderGeometry( 0.12, 0.095, 0.16, 20 ), m.titanSkin, g, v3( x, 0.12, 0 ) )
        mesh( SPHERE, m.titanSkin, g, v3( x, 0.13, - 0.06 ), v3( 0.1, 0.1, 0.08 ) )
        mesh( SPHERE, m.titanSkin, g, v3( x, 0.035, 0.06 ), v3( 0.12, 0.055, 0.2 ) )
        for( let i = 0; i < 4; i++ ) mesh( SPHERE, m.titanSkin, g, v3( x + ( i - 1.5 ) * 0.045, 0.03, 0.24 ), v3( 0.026, 0.026, 0.03 ) )
    }
    mesh( new SphereGeometry( 0.3, 32, 20 ), m.titanSkin, g, v3( 0, 0.45, 0 ), v3( 1, 0.5, 0.8 ) )

    // a lean V of a torso: broad chest, narrow waist
    const torso = mesh( new LatheGeometry( TITAN_TORSO.map( ( [ r, y ] ) => new Vector2( r, y ) ), 44 ), m.titanSkin, g )
    torso.scale.set( 1, 1, TITAN_DEPTH )

    for( const side of [ - 1, 1 ] )
    {
        // pecs, with a hard line under each
        mesh( SPHERE, m.titanSkin, g, on( side * 0.14, 0.84, - 0.07 ), v3( 0.17, 0.105, 0.1 ) )
        line( [ [ side * 0.02, 0.8 ], [ side * 0.12, 0.76 ], [ side * 0.24, 0.78 ], [ side * 0.31, 0.85 ] ], 0.011 )
        // six-pack and obliques
        for( const y of [ 0.69, 0.61, 0.53 ] ) mesh( SPHERE, m.titanSkin, g, on( side * 0.062, y, - 0.032 ), v3( 0.056, 0.038, 0.04 ) )
        for( const y of [ 0.65, 0.57 ] ) line( [ [ side * 0.015, y ], [ side * 0.11, y + 0.004 ] ], 0.006 )
        line( [ [ side * 0.13, 0.72 ], [ side * 0.14, 0.6 ], [ side * 0.12, 0.47 ] ], 0.007 )
        // ribs along the side
        for( const y of [ 0.76, 0.7, 0.64 ] ) line( [ [ side * 0.22, y ], [ side * 0.27, y + 0.03 ] ], 0.007 )
        // collarbones and the traps rising to the neck
        line( [ [ side * 0.04, 0.99 ], [ side * 0.15, 1.0 ], [ side * 0.27, 0.97 ] ], 0.009 )
        mesh( SPHERE, m.titanSkin, g, v3( side * 0.15, 1.02, - 0.05 ), v3( 0.15, 0.08, 0.13 ) )
        // neck tendons
        stroke( [ v3( side * 0.07, 1.16, 0.08 ), v3( side * 0.05, 1.1, 0.12 ), v3( side * 0.02, 1.04, 0.13 ) ], 0.014, m.titanSkin, g )
        // shoulder blades on the back
        mesh( SPHERE, m.titanSkin, g, onProfile( TITAN_TORSO, TITAN_DEPTH, side * 0.15, 0.86, - 1, - 0.06 ), v3( 0.14, 0.12, 0.08 ) )
    }
    line( [ [ 0, 0.94 ], [ 0, 0.78 ], [ 0, 0.5 ] ], 0.008 )
    stroke( [ 0.95, 0.75, 0.55 ].map( ( y ) => onProfile( TITAN_TORSO, TITAN_DEPTH, 0, y, - 1, 0.006 ) ), 0.008, m.titanLine, g )

    mesh( new CylinderGeometry( 0.13, 0.16, 0.18, 20 ), m.titanSkin, g, v3( 0, 1.09, 0 ) )

    return { group: g }
}
function buildArm( side, body, m )
{
    const shoulder = new Group()
    shoulder.position.set( side * 0.31, 0.92, 0 )
    body.add( shoulder )
    const elbow = new Group()
    elbow.position.set( 0, - 0.27, 0 )
    shoulder.add( elbow )

    // the scout: jacket sleeves, bare hands, a blade in each
    const scoutUpper = new Group()
    const scoutLower = new Group()
    shoulder.add( scoutUpper )
    elbow.add( scoutLower )
    mesh( new SphereGeometry( 0.13, 24, 16 ), m.jacket, scoutUpper, v3( 0, - 0.03, 0 ), v3( 1, 1.1, 1 ) )
    mesh( new CapsuleGeometry( 0.074, 0.16, 6, 12 ), m.jacket, scoutUpper, v3( 0, - 0.17, 0 ) )
    mesh( new CapsuleGeometry( 0.07, 0.12, 6, 12 ), m.jacket, scoutLower, v3( 0, - 0.08, 0 ) )
    const cuff = mesh( new TorusGeometry( 0.07, 0.016, 8, 24 ), m.seam, scoutLower, v3( 0, - 0.18, 0 ) )
    cuff.rotation.x = Math.PI / 2
    mesh( new SphereGeometry( 0.085, 20, 16 ), m.skin, scoutLower, v3( 0, - 0.26, 0.005 ), v3( 1, 1.05, 0.95 ) )

    const blade = new Group()
    blade.position.set( 0, - 0.27, 0.02 )
    blade.rotation.set( 0.95, 0, side * 0.35 )
    scoutLower.add( blade )
    mesh( new CylinderGeometry( 0.026, 0.03, 0.17, 12 ), m.metal, blade, v3( 0, 0.02, 0 ) )
    mesh( new BoxGeometry( 0.07, 0.03, 0.05 ), m.metal, blade, v3( 0, - 0.07, 0 ) )
    mesh( new BoxGeometry( 0.012, 0.84, 0.07 ), m.blade, blade, v3( 0, - 0.5, 0.008 ) )
    // the score lines where a dulled segment snaps off
    for( let i = 1; i < 6; i++ ) mesh( new BoxGeometry( 0.014, 0.006, 0.072 ), m.metal, blade, v3( 0, - 0.08 - i * 0.135, 0.008 ) )
    const tip = mesh( new ConeGeometry( 0.036, 0.12, 4 ), m.blade, blade, v3( 0, - 0.98, 0.008 ) )
    tip.rotation.x = Math.PI
    tip.scale.set( 0.34, 1, 1 )

    // the titan: shoulders set wider than the scout's, a big deltoid, biceps and a heavy fist
    const titanUpper = new Group()
    const titanLower = new Group()
    titanUpper.position.x = side * 0.06
    titanLower.position.x = side * 0.06
    shoulder.add( titanUpper )
    elbow.add( titanLower )
    mesh( new SphereGeometry( 0.16, 24, 16 ), m.titanSkin, titanUpper, v3( side * 0.02, - 0.02, 0 ), v3( 1, 1.05, 1 ) )
    mesh( new CapsuleGeometry( 0.098, 0.14, 6, 14 ), m.titanSkin, titanUpper, v3( 0, - 0.17, 0 ) )
    mesh( SPHERE, m.titanSkin, titanUpper, v3( 0, - 0.16, 0.05 ), v3( 0.085, 0.105, 0.075 ) )
    mesh( SPHERE, m.titanSkin, titanUpper, v3( 0, - 0.14, - 0.045 ), v3( 0.08, 0.11, 0.07 ) )
    mesh( new CapsuleGeometry( 0.09, 0.12, 6, 14 ), m.titanSkin, titanLower, v3( 0, - 0.1, 0 ) )
    mesh( SPHERE, m.titanSkin, titanLower, v3( side * 0.02, - 0.04, 0.02 ), v3( 0.1, 0.09, 0.09 ) )
    const fist = new Group()
    fist.position.set( 0, - 0.28, 0.01 )
    titanLower.add( fist )
    mesh( SPHERE, m.titanSkin, fist, null, v3( 0.125, 0.115, 0.125 ) )
    for( let i = 0; i < 4; i++ ) mesh( SPHERE, m.titanSkin, fist, v3( ( i - 1.5 ) * 0.054, - 0.065, 0.075 ), v3( 0.034, 0.036, 0.036 ) )
    mesh( SPHERE, m.titanSkin, fist, v3( - side * 0.09, - 0.01, 0.065 ), v3( 0.036, 0.055, 0.036 ) )
    return { shoulder, elbow, blade, scout: [ scoutUpper, scoutLower ], titan: [ titanUpper, titanLower ] }
}

/** A jagged bolt from the sky down to his hand: an outer gold glow and a white core. */
function boltGeometry( rand, radius )
{
    const pieces = []
    const segment = ( a, b, r ) =>
    {
        const dir = b.clone().sub( a )
        const len = dir.length()
        const g = new CylinderGeometry( r, r, len, 6, 1, true )
        g.applyQuaternion( new Quaternion().setFromUnitVectors( UP, dir.normalize() ) )
        g.translate( ( a.x + b.x ) / 2, ( a.y + b.y ) / 2, ( a.z + b.z ) / 2 )
        pieces.push( g )
    }
    const fork = ( start, end, steps, r, depth ) =>
    {
        let prev = start
        for( let i = 1; i <= steps; i++ )
        {
            const u = i / steps
            const p = start.clone().lerp( end, u )
            if( i < steps ) p.add( v3( ( rand() - 0.5 ) * 0.7, ( rand() - 0.5 ) * 0.3, ( rand() - 0.5 ) * 0.5 ) )
            segment( prev, p, r * ( 1 - u * 0.4 ) )
            if( depth > 0 && i < steps - 1 && rand() < 0.3 )
                fork( p, p.clone().add( v3( ( rand() - 0.5 ) * 3, - 1.5 - rand() * 2, ( rand() - 0.5 ) * 1.5 ) ), 4, r * 0.5, depth - 1 )
            prev = p
        }
    }
    fork( v3( 0.9, 16, - 1.2 ), v3( 0.05, 1.25, 0.3 ), 14, radius, 1 )
    return mergeGeometries( pieces )
}

function flatMaterial( color )
{
    const mat = new MeshBasicNodeMaterial()
    mat.colorNode = uniform( new Color( color ) )
    return mat
}

export function createEren()
{
    const m = makeMaterials()
    const rand = seeded( 61 )

    const root = new Group()
    root.name = 'eren'
    const body = new Group()
    root.add( body )

    const scout = buildScoutBody( body, m )
    const titan = buildTitanBody( body, m )
    const arms = { left: buildArm( - 1, body, m ), right: buildArm( 1, body, m ) }

    const neck = new Group()
    neck.position.set( 0, 1.1, 0 )
    body.add( neck )
    const head = new Group()
    head.position.set( 0, 0.48, 0.02 )
    neck.add( head )

    const scoutHead = new Group()
    const titanHead = new Group()
    head.add( scoutHead, titanHead )
    // the titan's head sits smaller on its body than the chibi scout's does
    titanHead.scale.setScalar( 0.88 )
    titanHead.position.y = - 0.06
    const skull = skullGeometry()
    mesh( skull, m.skin, scoutHead )
    mesh( skull, m.titanSkin, titanHead )
    const scoutHair = buildScoutHair( scoutHead, m )
    const titanHair = buildTitanHair( titanHead, m )
    const scoutFace = buildScoutFace( scoutHead, m )
    const titanFace = buildTitanFace( titanHead, m )

    const forms = [
        [ scout.group, scoutHead, ...arms.left.scout, ...arms.right.scout ],
        [ titan.group, titanHead, ...arms.left.titan, ...arms.right.titan ],
    ]

    // ── transformation effects, in world space so the growing body doesn't scale them ──
    const fx = new Group()
    fx.name = 'titan-shift'
    const boltGold = flatMaterial( '#ffd23c' )
    const boltCore = flatMaterial( '#fffbe6' )
    const bolts = []
    for( let i = 0; i < 3; i++ )
    {
        const holder = new Group()
        const seed = seeded( 300 + i * 17 )
        holder.add( new Mesh( boltGeometry( seed, 0.11 ), boltGold ) )
        holder.add( new Mesh( boltGeometry( seeded( 300 + i * 17 ), 0.04 ), boltCore ) )
        holder.visible = false
        fx.add( holder )
        bolts.push( holder )
    }
    const flash = new Sprite( glowMaterial( SpriteNodeMaterial, '#fff0a0', { strength: 1, power: 1.1 } ) )
    flash.position.set( 0, 1.3, 0.4 )
    flash.visible = false
    fx.add( flash )

    const puffGeometry = new SphereGeometry( 1, 16, 12 )
    const puffs = []
    for( let i = 0; i < 80; i++ )
    {
        const p = new Mesh( puffGeometry, m.steam )
        p.visible = false
        fx.add( p )
        puffs.push( { mesh: p, age: 0, life: - 1, size: 0, vel: new Vector3() } )
    }
    let nextPuff = 0
    function puff( position, velocity, size, life )
    {
        const p = puffs[ nextPuff ]
        nextPuff = ( nextPuff + 1 ) % puffs.length
        p.mesh.position.copy( position )
        p.vel.copy( velocity )
        p.size = size
        p.age = 0
        p.life = life
        p.mesh.visible = true
        p.mesh.scale.setScalar( 1e-3 )
    }
    // a blast of steam bursting out of him, sized to the body it comes from
    function burst( count, scale, power )
    {
        for( let i = 0; i < count; i++ )
        {
            const a = rand() * Math.PI * 2
            const out = ( 0.8 + rand() * 1.8 ) * power
            puff(
                v3( Math.cos( a ) * 0.25 * scale, ( 0.2 + rand() * 1.5 ) * scale, Math.sin( a ) * 0.25 * scale ),
                v3( Math.cos( a ) * out, ( 0.5 + rand() * 1.6 ) * power, Math.sin( a ) * out * 0.8 ),
                ( 0.1 + rand() * 0.17 ) * Math.sqrt( scale ),
                0.7 + rand() * 0.8
            )
        }
    }

    // ── state ───────────────────────────────────────────────────────────────
    let form = null
    let seq = null
    let growth = 1
    let roarAge = - 1
    let roarIn = 4
    let wisp = 0
    let flicker = 0

    const view = { y: 1.08, zoom: 1.2, polar: 1.43 }
    const REST = [
        { left: { shoulderX: - 0.12, shoulderZ: - 0.55, elbowX: - 0.42 }, right: { shoulderX: - 0.12, shoulderZ: 0.55, elbowX: - 0.42 } },
        { left: { shoulderX: - 0.22, shoulderZ: - 0.4, elbowX: - 0.8 }, right: { shoulderX: - 0.22, shoulderZ: 0.4, elbowX: - 0.8 } },
    ]
    const armRest = { left: { ...REST[ 0 ].left }, right: { ...REST[ 0 ].right } }
    const BITE = { shoulderX: - 2.05, shoulderZ: - 0.5, elbowX: - 0.75 }
    const ROAR = { shoulderX: 0.25, shoulderZ: 0.95, elbowX: - 1.1 }

    function setForm( f )
    {
        form = f
        forms[ 0 ].forEach( ( o ) => { o.visible = f === 0 } )
        forms[ 1 ].forEach( ( o ) => { o.visible = f === 1 } )
        Object.assign( armRest.left, REST[ f ].left )
        Object.assign( armRest.right, REST[ f ].right )
    }

    function setView()
    {
        const s = clamp01( ( growth - 1 ) / ( TITAN_SCALE - 1 ) )
        view.y = MathUtils.lerp( 1.08, 2.0, s )
        view.zoom = MathUtils.lerp( 1.2, 0.6, s )
        view.polar = MathUtils.lerp( 1.43, 1.44, s )
    }

    /** Jump straight to the form the mood asks for, with no transformation (thumbnails, first frame). */
    function snap()
    {
        seq = null
        setForm( erenLook.goal >= 0.5 ? 1 : 0 )
        growth = form ? TITAN_SCALE : 1
        roarAge = - 1
        for( const p of puffs ) { p.life = - 1; p.mesh.visible = false }
        for( const b of bolts ) b.visible = false
        flash.visible = false
        root.scale.setScalar( growth )
        setView()
    }

    function roar()
    {
        if( form === 1 && roarAge < 0 ) roarAge = 0
    }

    function update( t, dt )
    {
        if( form === null || dt >= 1 ) snap()
        const goal = erenLook.goal >= 0.5 ? 1 : 0
        if( ! seq && goal !== form ) seq = { dir: goal ? 1 : - 1, t: 0, struck: false, burst: false, swapped: false, roared: false }

        let bite = 0
        let strike = false
        let flashK = 0
        if( seq )
        {
            seq.t += dt
            const T = seq.t
            if( seq.dir > 0 )
            {
                // bite, lightning, steam, and the titan grows out of it
                bite = ease( T / 0.3 ) * ( 1 - ease( ( T - 0.6 ) / 0.1 ) )
                strike = T >= 0.48 && T < 0.9
                flashK = T >= 0.48 ? Math.max( 0, 1 - ( T - 0.48 ) / 0.5 ) : 0
                if( T >= 0.52 && ! seq.burst ) { seq.burst = true; burst( 40, 1, 1.1 ) }
                if( T >= 0.66 && ! seq.swapped ) { seq.swapped = true; setForm( 1 ) }
                if( seq.swapped ) growth = MathUtils.lerp( 0.5 * TITAN_SCALE, TITAN_SCALE, easeOutBack( ( T - 0.66 ) / 0.8 ) )
                if( T >= 0.8 && T < 1.4 && rand() < dt * 14 ) burst( 1, TITAN_SCALE, 0.7 )
                if( T >= 1.5 && ! seq.roared ) { seq.roared = true; roarAge = 0 }
                if( T >= 2.1 ) seq = null
            }
            else
            {
                // the titan sinks into its own steam and Eren drops out of it
                if( ! seq.burst ) { seq.burst = true; burst( 30, 1.3, 1.1 ) }
                if( ! seq.swapped ) growth = MathUtils.lerp( TITAN_SCALE, 0.7 * TITAN_SCALE, ease( T / 0.5 ) )
                if( T >= 0.5 && ! seq.swapped ) { seq.swapped = true; setForm( 0 ) }
                if( seq.swapped ) growth = MathUtils.lerp( 0.45, 1, easeOutBack( ( T - 0.5 ) / 0.6 ) )
                if( T >= 1.3 ) seq = null
            }
        }
        root.scale.setScalar( growth )
        setView()

        // lightning flickers between a few bolt shapes while it strikes
        flicker -= dt
        if( flicker <= 0 )
        {
            flicker = 0.05
            const pick = Math.floor( rand() * bolts.length )
            bolts.forEach( ( b, i ) => { b.visible = strike && i === pick && rand() > 0.15 } )
        }
        if( ! strike ) bolts.forEach( ( b ) => { b.visible = false } )
        flash.visible = flashK > 0.01
        if( flash.visible ) flash.scale.setScalar( 4 * Math.pow( flashK, 0.7 ) )

        // the titan steams on its own, and roars every so often (or when tapped)
        if( form === 1 && ! seq )
        {
            roarIn -= dt
            if( roarIn <= 0 ) { roar(); roarIn = 6 + rand() * 4 }
            wisp -= dt
            if( wisp <= 0 )
            {
                wisp = 0.4
                const side = rand() < 0.5 ? - 1 : 1
                // off the shoulders, the nape and the crown, never across the face or chest
                const spot = [ v3( side * 0.36, 1.0, - 0.05 ), v3( side * 0.16, 1.12, - 0.16 ), v3( side * 0.34, 1.86, - 0.2 ), v3( side * 0.1, 2.02, - 0.18 ) ][ Math.floor( rand() * 4 ) ]
                puff( spot.multiplyScalar( growth ), v3( side * 0.25, 0.8 + rand() * 0.5, - 0.15 - rand() * 0.15 ), 0.045 + rand() * 0.05, 1.1 + rand() * 0.6 )
            }
        }
        let roarK = 0
        if( roarAge >= 0 )
        {
            roarAge += dt
            roarK = ease( roarAge / 0.22 ) * ( 1 - ease( ( roarAge - 1.1 ) / 0.35 ) )
            if( roarAge > 1.5 ) roarAge = - 1
        }

        for( const p of puffs )
        {
            if( p.life < 0 ) continue
            p.age += dt
            const u = p.age / p.life
            if( u >= 1 ) { p.life = - 1; p.mesh.visible = false; continue }
            p.vel.multiplyScalar( Math.exp( - dt * 2.2 ) )
            p.vel.y += dt * 0.6
            p.mesh.position.addScaledVector( p.vel, dt )
            const s = p.size * ( 0.35 + 0.65 * ease( u / 0.15 ) ) * ( 1 + u * 0.7 ) * ( 1 - ease( ( u - 0.55 ) / 0.45 ) )
            p.mesh.scale.setScalar( Math.max( 1e-3, s ) )
        }

        // the rig has already posed him for this frame; lay the bite and the roar over it
        const k = 1 - Math.exp( - dt * 10 )
        for( const side of [ 'left', 'right' ] )
        {
            const a = arms[ side ]
            const sign = side === 'left' ? - 1 : 1
            a.blade.scale.setScalar( Math.max( 1e-3, 1 - ( side === 'right' ? bite : 0 ) ) )
            if( side === 'right' && bite > 0 )
            {
                a.shoulder.rotation.x = MathUtils.lerp( a.shoulder.rotation.x, BITE.shoulderX, bite )
                a.shoulder.rotation.z = MathUtils.lerp( a.shoulder.rotation.z, BITE.shoulderZ, bite )
                a.elbow.rotation.x = MathUtils.lerp( a.elbow.rotation.x, BITE.elbowX, bite )
            }
            if( roarK > 0 )
            {
                a.shoulder.rotation.x = MathUtils.lerp( a.shoulder.rotation.x, ROAR.shoulderX, roarK )
                a.shoulder.rotation.z = MathUtils.lerp( a.shoulder.rotation.z, ROAR.shoulderZ * sign, roarK )
                a.elbow.rotation.x = MathUtils.lerp( a.elbow.rotation.x, ROAR.elbowX, roarK )
            }
        }
        head.rotation.x += bite * 0.32 - roarK * 0.42
        body.rotation.x = MathUtils.lerp( body.rotation.x, bite * 0.12 - roarK * 0.1, k )
        titanFace.jaw.position.y = - 0.004 - roarK * 0.075
        // the mouth gapes downward with the jaw rather than up over the nose
        titanFace.maw.scale.y = 0.03 + roarK * 0.042
        titanFace.maw.position.y = titanFace.maw.userData.restY - roarK * 0.04

        scout.cloak.rotation.x = 0.05 + Math.sin( t * 1.4 ) * 0.035
        scout.cloak.rotation.z = Math.sin( t * 0.9 ) * 0.02
    }

    update( 0, 1 )

    const pickables = []
    root.traverse( ( o ) => { if( o.isMesh ) pickables.push( o ) } )

    return {
        root, body, neck, head, eyes: [ ...scoutFace.eyes, ...titanFace.eyes ],
        spikes: [ ...scoutHair.spikes, ...titanHair.spikes ],
        arms, tail: null, armRest, pickables, materials: m, fx, view,
        bobScale: 0.6, jumpScale: 1,
        update, snap,
        // tapping the titan makes it roar
        nextPose: roar,
        get form() { return form },
        get growth() { return growth },
    }
}
