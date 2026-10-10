import {
    Group, Mesh, SphereGeometry, CapsuleGeometry, CylinderGeometry, PlaneGeometry, TubeGeometry, LatheGeometry,
    ShapeGeometry, Shape, Vector2, Vector3, CatmullRomCurve3, Sprite, SpriteNodeMaterial, MeshBasicNodeMaterial, Color
} from 'three/webgpu'
import { uniform, normalView, positionLocal, mix, smoothstep, mx_noise_float } from 'three/tsl'

import { paintedMaterial, light } from '../materials/painted.js'
import {
    mesh, v3, sphereDir, skullRadius, skullGeometry, orient, spikeGeometry, onTorso, stroke,
    TORSO, TORSO_DEPTH, HAIR_RADIUS, UP, Z, deg
} from './character.js'
import { glowMaterial } from './glow.js'
import { voidLook } from './void.js'

// Gojo Satoru, after his Nendoroid and the Jujutsu High teacher's uniform:
// messy snow-white hair, pale blue Six Eyes, a dark navy jacket zipped up to a
// tall collar. He hovers over an Infinity sign, the figure-eight his Blue and
// Red orbs run around.
export const palette = {
    skin: '#ffe2d0',
    hair: '#f7f8ff',
    jacket: '#2c3b9a',
    collar: '#24318a',
    trousers: '#2a2c4c',
    boot: '#1c1a32',
    zip: '#d4dbf8',
    sclera: '#f6f8ff',
    iris: '#4cbcff',
    irisLow: '#b4f0ff',
    pupil: '#12204e',
    lash: '#5c68b8',
    brow: '#e6e8ff',
    mouth: '#c04466',
    blush: '#ff9fa4',
}

function makeMaterials()
{
    return {
        skin: paintedMaterial( { color: palette.skin, shade: '#ee9ea2', rim: 0.6, gloss: 0.25, scale: 2.4 } ),
        hair: paintedMaterial( { color: palette.hair, shade: '#8f9ce4', highlight: '#ffffff', rim: 0.8, gloss: 0.6, scale: 3.2, terminator: 0.5 } ),
        brow: paintedMaterial( { color: palette.brow, shade: '#aab2ec', rim: 0, gloss: 0, brush: 0.3, haze: 0.3 } ),
        jacket: paintedMaterial( { color: palette.jacket, shade: '#101760', highlight: '#7690ec', rim: 0.8, gloss: 0.35, scale: 3 } ),
        collar: paintedMaterial( { color: palette.collar, shade: '#0c1250', highlight: '#6a82e4', rim: 0.8, gloss: 0.35, scale: 3 } ),
        trousers: paintedMaterial( { color: palette.trousers, shade: '#12132c', highlight: '#6c72b8', rim: 0.7, scale: 3 } ),
        boot: paintedMaterial( { color: palette.boot, shade: '#0a0a1c', highlight: '#7a78b8', gloss: 0.8, rim: 0.7, scale: 3 } ),
        zip: paintedMaterial( { color: palette.zip, shade: '#8a96d8', highlight: '#ffffff', gloss: 1, scale: 3, rim: 0.4 } ),
        sclera: paintedMaterial( { color: palette.sclera, shade: '#c4cdf4', rim: 0, gloss: 0, brush: 0.2, haze: 0 } ),
        iris: paintedMaterial( { color: palette.iris, unlit: true } ),
        irisLow: paintedMaterial( { color: palette.irisLow, unlit: true } ),
        pupil: paintedMaterial( { color: palette.pupil, unlit: true } ),
        lash: paintedMaterial( { color: palette.lash, shade: '#2c3578', rim: 0, gloss: 0, brush: 0.3, haze: 0.2 } ),
        white: paintedMaterial( { color: '#ffffff', unlit: true } ),
        mouth: paintedMaterial( { color: palette.mouth, shade: '#6a1a3c', rim: 0, gloss: 0, brush: 0.3, haze: 0.3 } ),
        blush: paintedMaterial( { color: palette.blush, shade: '#f07e8c', rim: 0, gloss: 0, brush: 0.4 } ),
    }
}

function buildHair( head, mat )
{
    const hair = new Group()
    head.add( hair )

    // a close cap that wraps over the crown and leaves the face clear
    const cap = mesh( new SphereGeometry( HAIR_RADIUS + 0.03, 48, 32, 0, Math.PI * 2, 0, 1.8 ), mat, hair )
    cap.rotation.x = - 0.78

    const spikes = []
    const add = ( base, direction, length, radius, bend, curl, { inset = 0.45, flat = 0.55, fullness = 0.75 } = {} ) =>
    {
        const pivot = new Group()
        pivot.position.copy( base.clone().multiplyScalar( inset ) )
        orient( pivot, direction, curl )
        hair.add( pivot )
        mesh( spikeGeometry( length, radius, bend, flat, fullness ), mat, pivot )
        spikes.push( { pivot, rest: pivot.quaternion.clone(), weight: length } )
    }
    const at = ( yaw, pitch ) => sphereDir( yaw * deg, pitch * deg )
    const LEFT = v3( - 1, 0, 0 )
    const RIGHT = v3( 1, 0, 0 )

    // Messy tufts all over the crown, tall in the middle and swept toward one side,
    // with a few thin strays standing up between them.
    add( at( 8, 82 ), v3( 0.25, 1, 0.1 ), 0.68, 0.2, 0.34, RIGHT )
    add( at( - 24, 74 ), v3( - 0.3, 1, 0.15 ), 0.62, 0.2, 0.28, LEFT )
    add( at( - 52, 62 ), v3( - 0.8, 0.9, 0.1 ), 0.52, 0.19, 0.26, LEFT )
    add( at( 40, 70 ), v3( 0.7, 1, 0 ), 0.56, 0.2, 0.28, RIGHT )
    add( at( 66, 52 ), v3( 1, 0.6, 0 ), 0.46, 0.18, 0.3, UP )
    add( at( - 80, 36 ), v3( - 1, 0.4, - 0.05 ), 0.42, 0.17, 0.28, UP )
    add( at( - 10, 88 ), v3( - 0.5, 1, 0.3 ), 0.4, 0.09, 0.3, LEFT, { flat: 0.6 } )
    add( at( 24, 86 ), v3( 0.6, 1, - 0.2 ), 0.42, 0.09, 0.3, RIGHT, { flat: 0.6 } )
    add( at( - 100, 8 ), v3( - 0.8, - 0.3, - 0.25 ), 0.38, 0.16, 0.28, UP )
    add( at( 100, 6 ), v3( 0.8, - 0.35, - 0.25 ), 0.38, 0.16, 0.28, UP )

    // The back: rows of locks that lie down along the skull and only flick out
    // at the tips, so from behind it reads as layered hair rather than a burr.
    const lock = ( yaw, pitch, length, radius, out ) =>
    {
        const n = at( yaw, pitch )
        const down = UP.clone().sub( n.clone().multiplyScalar( n.y ) ).normalize().negate()
        add( n, down.add( n.clone().multiplyScalar( out ) ), length, radius, 0.2, n, { inset: 0.55, flat: 0.42, fullness: 0.7 } )
    }
    for( const yaw of [ 122, 148, 172, - 164, - 138 ] ) lock( yaw, 66, 0.56, 0.24, 0.75 )
    for( const yaw of [ 112, 136, 160, - 176, - 150, - 124 ] ) lock( yaw, 34, 0.54, 0.24, 0.6 )
    for( const yaw of [ 126, 152, 178, - 154, - 128 ] ) lock( yaw, 2, 0.46, 0.22, 0.5 )
    for( const yaw of [ 140, 166, - 168, - 142 ] ) lock( yaw, - 24, 0.36, 0.2, 0.35 )

    // Bangs lie on the forehead (tangent to the cap, nudged inward so the tips
    // hug the skin), a few of them hanging between the eyes.
    const bangs = [
        [ - 58, 50, 0.36, 0.14, - 1 ], [ - 40, 57, 0.5, 0.17, - 1 ], [ - 22, 62, 0.58, 0.14, - 1 ], [ - 6, 66, 0.68, 0.1, - 1 ],
        [ 8, 66, 0.64, 0.1, 1 ], [ 24, 62, 0.54, 0.16, 1 ], [ 44, 56, 0.44, 0.16, 1 ], [ 62, 47, 0.32, 0.13, 1 ],
    ]
    for( const [ yaw, pitch, length, radius, side ] of bangs )
    {
        const n = at( yaw, pitch )
        const down = UP.clone().sub( n.clone().multiplyScalar( n.y ) ).normalize().negate()
        const dir = down.clone().sub( n.clone().multiplyScalar( 0.45 ) ).add( v3( side * 0.1, 0, 0 ) )
        add( n, dir, length, radius, 0.14, v3( side, 0, 0 ), { inset: 0.6, flat: 0.38, fullness: 0.55 } )
    }

    // locks in front of the ears
    for( const side of [ - 1, 1 ] )
        add( at( side * 76, 10 ), v3( side * 0.3, - 1, 0.2 ), 0.42, 0.13, 0.22, v3( side, 0, 0 ), { inset: 0.52, flat: 0.5 } )

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
        // Six Eyes: a big pale blue iris with a lighter rim along the bottom
        const eye = new Group()
        part( m.sclera, [ 0.1, 0.112, 0.05 ], [ 0, 0, 0 ], eye )
        part( m.iris, [ 0.076, 0.092, 0.03 ], [ 0, - 0.004, 0.026 ], eye )
        part( m.irisLow, [ 0.056, 0.03, 0.02 ], [ 0, - 0.05, 0.05 ], eye )
        part( m.pupil, [ 0.034, 0.044, 0.02 ], [ 0, 0.004, 0.056 ], eye )
        part( m.white, [ 0.027, 0.032, 0.015 ], [ side * 0.026, 0.036, 0.07 ], eye )
        part( m.white, [ 0.011, 0.011, 0.01 ], [ - side * 0.03, - 0.034, 0.072 ], eye )

        // a soft upper lash line that runs out past the corner, thickest at the outside
        const lash = [ [ - 0.104, 0.024 ], [ - 0.05, 0.088 ], [ 0.04, 0.104 ], [ 0.13, 0.06 ] ].map( ( [ x, y ] ) => v3( x * side, y, 0.016 ) )
        eye.add( new Mesh( new TubeGeometry( new CatmullRomCurve3( lash ), 24, 0.022, 8 ), m.lash ) )

        place( eye, side * 0.33, - 0.08, 0.018, side * 0.05 )
        eyes.push( eye )

        const brow = [ [ - 0.09, - 0.01 ], [ 0, 0.018 ], [ 0.1, 0.014 ] ].map( ( [ x, y ] ) => v3( x * side, y, 0 ) )
        place( new Mesh( new TubeGeometry( new CatmullRomCurve3( brow ), 16, 0.014, 8 ), m.brow ), side * 0.34, 0.22, 0.004 )

        part( m.blush, [ 0.075, 0.035, 0.02 ], [ 0, 0, 0 ], place( new Group(), side * 0.56, - 0.23, 0.01 ) )

        const ear = new Mesh( sphere, m.skin )
        ear.scale.set( 0.07, 0.12, 0.09 )
        ear.position.set( side * 0.56, - 0.06, - 0.03 )
        head.add( ear )
    }

    // an easy, pleased smile that climbs a little higher on one side
    const smile = new Shape()
    smile.moveTo( - 0.07, 0.014 )
    smile.quadraticCurveTo( 0.0, - 0.052, 0.08, 0.026 )
    smile.quadraticCurveTo( 0.006, - 0.014, - 0.07, 0.014 )
    place( new Mesh( new ShapeGeometry( smile, 16 ), m.mouth ), 0.03, - 0.27, - 0.004 )

    const nose = new Mesh( sphere, m.skin )
    nose.scale.set( 0.03, 0.024, 0.026 )
    place( nose, 0, - 0.11, 0.012 )

    return { eyes }
}

// outer wall of the collar, bottom to top, then back down the inside
const COLLAR = [ [ 0.2, 0.95 ], [ 0.31, 1.0 ], [ 0.385, 1.1 ], [ 0.41, 1.2 ], [ 0.37, 1.22 ], [ 0.33, 1.12 ], [ 0.2, 1.02 ] ]
const COLLAR_DEPTH = 0.9

/** How far the front of the collar's outside stands out from the neck at a height. */
function collarFront( y )
{
    for( let i = 1; i < 4; i++ )
    {
        const [ r0, y0 ] = COLLAR[ i - 1 ]
        const [ r1, y1 ] = COLLAR[ i ]
        if( y <= y1 ) return ( r0 + ( r1 - r0 ) * ( y - y0 ) / ( y1 - y0 ) ) * COLLAR_DEPTH + 0.014
    }
    return COLLAR[ 3 ][ 0 ] * COLLAR_DEPTH + 0.014
}

// The forearm is longer than the others': his hand has to reach his cheek.
const FOREARM = 0.36

// Sleeves are wide and run to the wrist. `kind` decides the hand: the raised
// one makes the two-finger sign, the other grips his collar.
function buildArm( side, kind, parent, m )
{
    const shoulder = new Group()
    shoulder.position.set( side * 0.31, 0.92, 0 )
    parent.add( shoulder )

    mesh( new SphereGeometry( 0.14, 24, 16 ), m.jacket, shoulder, v3( 0, - 0.03, 0 ), v3( 1, 1.1, 1 ) )
    mesh( new CapsuleGeometry( 0.095, 0.15, 6, 12 ), m.jacket, shoulder, v3( 0, - 0.17, 0 ) )

    const elbow = new Group()
    elbow.position.set( 0, - 0.27, 0 )
    shoulder.add( elbow )
    mesh( new CapsuleGeometry( 0.092, 0.2, 6, 12 ), m.jacket, elbow, v3( 0, - 0.12, 0 ) )
    mesh( new CylinderGeometry( 0.092, 0.084, 0.06, 20 ), m.collar, elbow, v3( 0, - 0.268, 0 ) )

    const hand = new Group()
    hand.position.set( 0, - FOREARM, 0.005 )
    elbow.add( hand )
    mesh( new SphereGeometry( 0.088, 20, 16 ), m.skin, hand, null, v3( 1, 1.05, 0.95 ) )

    hand.scale.setScalar( 1.15 )

    if( kind === 'sign' )
    {
        // Index and middle finger up and apart, the others folded into the palm and
        // the thumb over them. The hand is turned palm-out so both fingers stand side
        // by side on screen instead of one hiding the other.
        hand.rotation.y = 2.5
        for( const [ x, length, tilt ] of [ [ - 0.04, 0.11, 0.2 ], [ 0.042, 0.125, - 0.18 ] ] )
        {
            const finger = mesh( new CapsuleGeometry( 0.03, length, 6, 10 ), m.skin, hand, v3( x, - 0.07 - length / 2 - 0.03, 0.01 ) )
            finger.rotation.z = tilt
        }
        mesh( new SphereGeometry( 0.034, 12, 10 ), m.skin, hand, v3( 0.075, - 0.045, 0.03 ) )
        mesh( new SphereGeometry( 0.032, 12, 10 ), m.skin, hand, v3( 0.07, - 0.01, 0.045 ) )
        mesh( new CapsuleGeometry( 0.028, 0.04, 6, 10 ), m.skin, hand, v3( - 0.07, - 0.03, 0.05 ) ).rotation.z = 0.5
    }
    else
    {
        // a loose fist with the knuckles toward the viewer
        for( let i = 0; i < 4; i++ )
            mesh( new SphereGeometry( 0.032, 12, 10 ), m.skin, hand, v3( - 0.054 + i * 0.036, - 0.05, 0.062 - Math.abs( i - 1.5 ) * 0.006 ) )
        mesh( new CapsuleGeometry( 0.029, 0.045, 6, 10 ), m.skin, hand, v3( - 0.085 * side, 0.0, 0.05 ) ).rotation.z = - side * 0.4
    }

    return { shoulder, elbow, hand }
}

export function createGojo()
{
    const m = makeMaterials()

    const root = new Group()
    root.name = 'gojo'
    const body = new Group()
    root.add( body )

    for( const side of [ - 1, 1 ] )
    {
        mesh( new CylinderGeometry( 0.125, 0.115, 0.44, 24 ), m.trousers, body, v3( side * 0.125, 0.28, 0 ) )
        mesh( new CylinderGeometry( 0.125, 0.12, 0.1, 24 ), m.boot, body, v3( side * 0.13, 0.1, 0 ) )
        mesh( new SphereGeometry( 1, 24, 16 ), m.boot, body, v3( side * 0.135, 0.06, 0.05 ), v3( 0.14, 0.085, 0.21 ) )
    }
    mesh( new SphereGeometry( 0.3, 32, 20 ), m.jacket, body, v3( 0, 0.5, 0 ), v3( 1, 0.55, 0.84 ) )

    const torso = mesh( new LatheGeometry( TORSO.map( ( [ r, y ] ) => new Vector2( r, y ) ), 40 ), m.jacket, body )
    torso.scale.set( 1, 1, TORSO_DEPTH )

    // zip pull at the belly
    mesh( new SphereGeometry( 0.026, 12, 10 ), m.zip, body, onTorso( 0, 0.54, 1, 0.026 ), v3( 1, 1.2, 0.7 ) )

    // The tall collar. The head is too big to hide behind, so it flares into a
    // funnel that cradles the chin; the zip runs up its front.
    const collar = mesh( new LatheGeometry( COLLAR.map( ( [ r, y ] ) => new Vector2( r, y ) ), 36 ), m.collar, body )
    collar.scale.set( 1, 1, COLLAR_DEPTH )

    stroke( [ v3( 0, 1.16, collarFront( 1.16 ) ), v3( 0, 1.08, collarFront( 1.08 ) ), v3( 0, 1.0, collarFront( 1.0 ) ), ...[ 0.9, 0.78, 0.62, 0.48 ].map( ( y ) => onTorso( 0, y, 1, 0.016 ) ) ], 0.012, m.zip, body )

    mesh( new CylinderGeometry( 0.1, 0.11, 0.2, 20 ), m.skin, body, v3( 0, 1.1, 0 ) )

    const arms = { left: buildArm( - 1, 'sign', body, m ), right: buildArm( 1, 'collar', body, m ) }

    const neck = new Group()
    neck.position.set( 0, 1.16, 0 )
    body.add( neck )
    const head = new Group()
    head.position.set( 0, 0.48, 0.02 )
    neck.add( head )
    mesh( skullGeometry(), m.skin, head )

    const { hair, spikes } = buildHair( head, m.hair )
    const { eyes } = buildFace( head, m )

    // Right hand up in the two-finger sign, left hand at his collar. The wave
    // belongs to the collar hand, so the sign stays put.
    const armRest = {
        left: { shoulderX: - 1.6, shoulderZ: - 0.6, elbowX: - 1.1 },
        right: { shoulderX: - 1.05, shoulderZ: 0.1, elbowX: - 1.5 },
    }

    const pickables = []
    root.traverse( ( o ) => { if( o.isMesh ) pickables.push( o ) } )

    return {
        root, body, neck, head, hair, spikes, eyes, arms, tail: null, armRest, pickables, materials: m,
        waveSide: 1, bobScale: 0.8, jumpScale: 1,
        // held out to the side: straight up the arm would hide behind his head
        wavePose: { shoulderZ: 2.05, shoulderX: - 0.1, elbowX: - 1 }
    }
}

// ── the Infinity sign he floats over ─────────────────────────────────────────

const LOOP = { a: 1.4, tilt: 0.75, y: - 0.14 }

/** A point on a lemniscate (a figure eight lying on the floor), tipped up toward the viewer. */
function lemniscate( theta, target = new Vector3() )
{
    const s = Math.sin( theta )
    const d = 1 + s * s
    const x = LOOP.a * Math.cos( theta ) / d
    const w = LOOP.a * s * Math.cos( theta ) / d
    return target.set( x, LOOP.y + w * Math.sin( LOOP.tilt ), w * Math.cos( LOOP.tilt ) )
}

const smooth = ( t ) => t * t * ( 3 - 2 * t )

export function createInfinity()
{
    const group = new Group()
    group.name = 'infinity'

    const loopMaterial = paintedMaterial( { color: '#9fd8ff', shade: '#4a56ec', highlight: '#f2fbff', gloss: 1, rim: 0.9, scale: 3 } )
    const points = Array.from( { length: 96 }, ( _, i ) => lemniscate( ( i / 96 ) * Math.PI * 2 ) )
    const loop = mesh( new TubeGeometry( new CatmullRomCurve3( points, true ), 220, 0.055, 10, true ), loopMaterial, group )

    // a soft pool of light on the "floor" so the sign has something to hover over
    const pool = mesh( new PlaneGeometry( 3.4, 3.4 ).rotateX( - Math.PI / 2 ), glowMaterial( MeshBasicNodeMaterial, '#7a8cff', { strength: 0.55, power: 1.2 } ), group, v3( 0, LOOP.y - 0.14, 0 ) )
    pool.renderOrder = 1

    const orbMaker = ( { color, shade, highlight, glow, size } ) =>
    {
        const orb = new Group()
        const ball = mesh( new SphereGeometry( size, 28, 20 ), paintedMaterial( { color, shade, highlight, gloss: 1, rim: 0.9, scale: 2.5, terminator: 0.35 } ), orb )
        const halo = new Sprite( glowMaterial( SpriteNodeMaterial, glow, { strength: 0.7, power: 1.4 } ) )
        halo.scale.setScalar( size * 5 )
        orb.add( halo )
        group.add( orb )
        return { orb, ball, size }
    }
    const blue = orbMaker( { color: '#46a8ff', shade: '#2036d0', highlight: '#e4f7ff', glow: '#5cb8ff', size: 0.2 } )
    const red = orbMaker( { color: '#ff4060', shade: '#a00e2c', highlight: '#ffd6da', glow: '#ff5070', size: 0.18 } )

    // Hollow Purple is energy, not a ball: white-hot where it faces you, deep
    // violet at the rim, churning, with sparks thrown around it.
    const purple = { orb: new Group() }
    group.add( purple.orb )
    const energy = new MeshBasicNodeMaterial()
    const facing = normalView.z.clamp( 0, 1 ).add( mx_noise_float( positionLocal.mul( 7 ).add( light.time.mul( 1.4 ) ) ).mul( 0.22 ) )
    energy.colorNode = mix(
        mix( uniform( new Color( '#3a0c8e' ) ), uniform( new Color( '#a84cff' ) ), smoothstep( 0.05, 0.5, facing ) ),
        uniform( new Color( '#fbeaff' ) ),
        smoothstep( 0.62, 0.95, facing )
    )
    purple.ball = mesh( new SphereGeometry( 0.3, 32, 24 ), energy, purple.orb )
    const aura = new Sprite( glowMaterial( SpriteNodeMaterial, '#b45cff', { strength: 0.9, power: 1.3 } ) )
    aura.scale.setScalar( 1.6 )
    purple.orb.add( aura )

    const sparkMaterial = paintedMaterial( { color: '#f4dcff', unlit: true } )
    const sparks = Array.from( { length: 9 }, ( _, i ) =>
    {
        const spark = mesh( new SphereGeometry( 1, 10, 8 ), sparkMaterial, purple.orb )
        spark.scale.setScalar( 0.022 + ( i % 3 ) * 0.012 )
        const axis = v3( Math.sin( i * 2.4 ), Math.cos( i * 1.7 ), Math.sin( i * 3.1 + 1 ) ).normalize()
        const start = v3( 1, 0, 0 ).cross( axis ).normalize()
        return { spark, axis, start, radius: 0.38 + ( i % 4 ) * 0.05, speed: 2.2 + ( i % 5 ) * 0.6 }
    } )

    // Hollow Purple hangs over the fingertips of his raised hand once Blue and Red have met
    const MERGE = v3( - 0.98, 2.12, 0.5 )
    const here = new Vector3()
    const swirlOffset = new Vector3()

    function update( t )
    {
        const m = smooth( voidLook.purple.value )

        for( const [ { orb, ball }, phase ] of [ [ blue, 0 ], [ red, Math.PI ] ] )
        {
            lemniscate( t * 0.9 + phase, here )
            // they spiral in on each other and settle into one point
            const swirl = ( 1 - m ) * 0.22
            const a = t * 5 + phase
            orb.position.lerpVectors( here, MERGE, m ).add( swirlOffset.set( Math.cos( a ) * swirl, Math.sin( a ) * swirl, 0 ) )
            orb.scale.setScalar( 1 - m * 0.55 )
            ball.rotation.y = t
        }

        const grow = smooth( Math.max( 0, ( m - 0.55 ) / 0.45 ) )
        purple.orb.position.copy( MERGE )
        purple.orb.position.y += Math.sin( t * 1.6 ) * 0.04
        purple.orb.scale.setScalar( Math.max( grow, 1e-3 ) * ( 1 + Math.sin( t * 6 ) * 0.04 ) )
        for( const { spark, axis, start, radius, speed } of sparks )
            spark.position.copy( start ).applyAxisAngle( axis, t * speed ).multiplyScalar( radius )
        purple.orb.visible = grow > 0.002
    }

    const pickables = [ loop, blue.ball, red.ball, purple.ball ]
    return { group, main: loop, tail: null, pickables, update, material: loopMaterial }
}
