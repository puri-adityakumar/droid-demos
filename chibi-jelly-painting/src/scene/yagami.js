import {
    Group, Mesh, SphereGeometry, CapsuleGeometry, CylinderGeometry, BoxGeometry, TorusGeometry,
    LatheGeometry, TubeGeometry, ShapeGeometry, PlaneGeometry, Shape, Vector2, CatmullRomCurve3
} from 'three/webgpu'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

import { paintedMaterial } from '../materials/painted.js'
import {
    mesh, v3, sphereDir, skullRadius, skullGeometry, orient, spikeGeometry, onTorso,
    TORSO, TORSO_DEPTH, HAIR_RADIUS, UP, Z, deg
} from './character.js'

// Light Yagami, after his Nendoroid: honey-brown bowl cut with a long swept
// fringe, narrow sly eyes, a crooked smirk, the tan school jacket and red tie.
export const palette = {
    skin: '#ffdfc8',
    hair: '#cf9456',
    jacket: '#dcbb82',
    jacketEdge: '#c79e66',
    shirt: '#fffaf0',
    tie: '#d8323c',
    trousers: '#5c6a64',
    shoe: '#4a342e',
    book: '#1f1d29',
    pages: '#f6ead0',
    eye: '#34201a',
    brow: '#9a6038',
    mouth: '#b23a4a',
    blush: '#ff9b8e',
}

function makeMaterials()
{
    return {
        skin: paintedMaterial( { color: palette.skin, shade: '#ee9e92', rim: 0.6, gloss: 0.25, scale: 2.4 } ),
        hair: paintedMaterial( { color: palette.hair, shade: '#a8623c', highlight: '#f6d596', rim: 0.75, gloss: 0.6, scale: 3.2, terminator: 0.5 } ),
        brow: paintedMaterial( { color: palette.brow, shade: '#6b3a2c', rim: 0, gloss: 0, brush: 0.3, haze: 0.3 } ),
        jacket: paintedMaterial( { color: palette.jacket, shade: '#b9825f', highlight: '#fff0c4', scale: 3 } ),
        jacketEdge: paintedMaterial( { color: palette.jacketEdge, shade: '#9a6a52', highlight: '#f0d29a', scale: 3 } ),
        shirt: paintedMaterial( { color: palette.shirt, shade: '#d9c8d8', highlight: '#ffffff', scale: 3, rim: 0.3 } ),
        tie: paintedMaterial( { color: palette.tie, shade: '#8a1830', highlight: '#ff8a78', gloss: 0.8, scale: 2.4 } ),
        trousers: paintedMaterial( { color: palette.trousers, shade: '#3a4358', highlight: '#9bb0a8', scale: 3 } ),
        shoe: paintedMaterial( { color: palette.shoe, shade: '#2c1f2e', highlight: '#a0746a', gloss: 0.8, scale: 3 } ),
        book: paintedMaterial( { color: palette.book, shade: '#17141f', highlight: '#7a78a8', gloss: 0.9, scale: 2, rim: 0.7 } ),
        pen: paintedMaterial( { color: '#2a2638', shade: '#0e0c18', highlight: '#8a86b4', gloss: 0.9, scale: 3, rim: 0.6 } ),
        gold: paintedMaterial( { color: '#e6b655', shade: '#8a5a3a', highlight: '#fff0b0', gloss: 1, scale: 3, rim: 0.6 } ),
        pages: paintedMaterial( { color: palette.pages, shade: '#cdb9c9', highlight: '#ffffff', scale: 3, rim: 0.2 } ),
        eye: paintedMaterial( { color: palette.eye, shade: '#1d0f10', highlight: '#6a4038', rim: 0, gloss: 0, brush: 0.3, haze: 0 } ),
        white: paintedMaterial( { color: '#ffffff', unlit: true } ),
        kira: paintedMaterial( { color: '#ff5a4e', unlit: true } ),
        mouth: paintedMaterial( { color: palette.mouth, shade: '#6a1a2c', rim: 0, gloss: 0, brush: 0.3, haze: 0.3 } ),
        blush: paintedMaterial( { color: palette.blush, shade: '#f07e7a', rim: 0, gloss: 0, brush: 0.4 } ),
    }
}

function buildHair( head, mat )
{
    const hair = new Group()
    head.add( hair )

    // A puffy cap that wraps low over the nape and leaves the face clear.
    const cap = mesh( new SphereGeometry( HAIR_RADIUS + 0.06, 48, 32, 0, Math.PI * 2, 0, 1.85 ), mat, hair )
    cap.rotation.x = - 0.7

    const spikes = []
    const add = ( base, direction, length, radius, bend, curl, { inset = 0.55, flat = 0.5, fullness = 0.7 } = {} ) =>
    {
        const pivot = new Group()
        pivot.position.copy( base.clone().multiplyScalar( inset ) )
        orient( pivot, direction, curl )
        hair.add( pivot )
        mesh( spikeGeometry( length, radius, bend, flat, fullness ), mat, pivot )
        spikes.push( { pivot, rest: pivot.quaternion.clone(), weight: length } )
    }
    const at = ( yaw, pitch ) => sphereDir( yaw * deg, pitch * deg )

    // The fringe: flat locks that lie on the forehead and all sweep to one side.
    const fringe = ( yaw, pitch, length, radius, sweep ) =>
    {
        const n = at( yaw, pitch )
        const down = UP.clone().sub( n.clone().multiplyScalar( n.y ) ).normalize().negate()
        const dir = down.clone().sub( n.clone().multiplyScalar( 0.45 ) ).add( v3( sweep, 0, 0 ) )
        add( n, dir, length, radius, 0.22, v3( 1, 0, 0 ), { inset: 0.6, flat: 0.38, fullness: 0.6 } )
    }
    fringe( - 46, 60, 0.58, 0.2, 0.5 )
    fringe( - 24, 66, 0.72, 0.22, 0.75 )
    fringe( 0, 68, 0.78, 0.23, 0.95 )
    fringe( 26, 64, 0.72, 0.21, 1.1 )
    fringe( 52, 54, 0.56, 0.17, 0.6 )

    // side locks framing the face, tips pointing down
    for( const side of [ - 1, 1 ] )
    {
        add( at( side * 76, 14 ), v3( side * 0.18, - 1, 0.22 ), 0.5, 0.15, 0.12, v3( side, 0, 0 ), { inset: 0.55, flat: 0.45, fullness: 0.6 } )
        add( at( side * 100, - 4 ), v3( side * 0.5, - 1, - 0.1 ), 0.46, 0.16, 0.22, v3( side, 0, 0 ), { inset: 0.5, flat: 0.4, fullness: 0.75 } )
    }

    // a skirt of locks around the nape that flick outward
    for( const [ yaw, pitch, length ] of [
        [ 180, 30, 0.6 ], [ 150, 20, 0.58 ], [ - 150, 20, 0.58 ], [ 180, 5, 0.6 ],
        [ 125, 8, 0.5 ], [ - 125, 8, 0.5 ], [ 160, - 12, 0.5 ], [ - 160, - 12, 0.5 ],
    ] )
    {
        const n = at( yaw, pitch )
        const outward = v3( n.x, 0, n.z ).normalize()
        add( n, v3( 0, - 1, 0 ).add( outward.clone().multiplyScalar( 0.25 ) ), length, 0.2, 0.2, outward, { inset: 0.5, flat: 0.4, fullness: 0.75 } )
    }

    // one big lock sweeping over the crown, and a few low layers at the back of it
    fringe( - 14, 80, 0.62, 0.24, 1 )
    for( const [ yaw, pitch, dx, dz ] of [ [ 120, 66, 0.5, - 0.9 ], [ - 120, 66, - 0.5, - 0.9 ], [ 180, 72, 0, - 1 ] ] )
        add( at( yaw, pitch ), v3( dx, 0.45, dz ), 0.32, 0.2, 0.2, v3( dx, 0, dz ), { inset: 0.55, flat: 0.45, fullness: 0.7 } )

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
    const eyes = []
    for( const side of [ - 1, 1 ] )
    {
        const eye = new Group()
        const ball = new Mesh( sphere, m.eye )
        ball.scale.set( 0.095, 0.088, 0.05 )
        eye.add( ball )

        // heavy, slanted upper lid that runs past the outer corner
        const lid = [ [ - 0.105, 0.062 ], [ 0, 0.092 ], [ 0.135, 0.078 ] ].map( ( [ x, y ] ) => v3( x * side, y, 0.014 ) )
        eye.add( new Mesh( new TubeGeometry( new CatmullRomCurve3( lid ), 24, 0.021, 8 ), m.eye ) )

        const glint = new Mesh( sphere, m.white )
        glint.scale.set( 0.028, 0.034, 0.02 )
        glint.position.set( side * 0.026, 0.03, 0.04 )
        eye.add( glint )
        const kira = new Mesh( sphere, m.kira )
        kira.scale.setScalar( 0.012 )
        kira.position.set( - side * 0.034, - 0.036, 0.042 )
        eye.add( kira )
        place( eye, side * 0.33, - 0.08, 0.018, side * 0.12 )
        eyes.push( eye )

        // brow: low at the nose, rising to the outside
        const brow = [ [ - 0.085, - 0.022 ], [ 0, 0.008 ], [ 0.1, 0.03 ] ].map( ( [ x, y ] ) => v3( x * side, y, 0 ) )
        const browMesh = new Mesh( new TubeGeometry( new CatmullRomCurve3( brow ), 16, 0.016, 8 ), m.brow )
        place( browMesh, side * 0.34, 0.2, 0.004 )

        const blush = new Mesh( sphere, m.blush )
        blush.scale.set( 0.075, 0.035, 0.02 )
        place( blush, side * 0.56, - 0.23, 0.01 )

        const ear = new Mesh( sphere, m.skin )
        ear.scale.set( 0.07, 0.12, 0.09 )
        ear.position.set( side * 0.56, - 0.06, - 0.03 )
        head.add( ear )
    }

    // a smirk: a thin crescent that climbs toward one cheek
    const smirk = new Shape()
    smirk.moveTo( - 0.06, 0.006 )
    smirk.quadraticCurveTo( 0.005, - 0.05, 0.088, 0.032 )
    smirk.quadraticCurveTo( 0.025, 0.002, - 0.06, 0.006 )
    place( new Mesh( new ShapeGeometry( smirk, 16 ), m.mouth ), 0.05, - 0.27, - 0.004 )

    const nose = new Mesh( sphere, m.skin )
    nose.scale.set( 0.03, 0.024, 0.026 )
    place( nose, 0, - 0.11, 0.012 )

    return { eyes }
}

const lerpTable = ( table, y ) =>
{
    for( let i = 1; i < table.length; i++ )
    {
        const [ y0, w0 ] = table[ i - 1 ]
        const [ y1, w1 ] = table[ i ]
        if( y <= y0 && y >= y1 ) return w0 + ( w1 - w0 ) * ( y0 - y ) / ( y0 - y1 )
    }
    return 0
}

// a flat strip pinned to the front of the jacket; `half` gives its half-width at a height
function torsoPatch( half, yTop, yBottom, lift, material, parent )
{
    const g = new PlaneGeometry( 1, 1, 6, 20 )
    const pos = g.attributes.position
    for( let i = 0; i < pos.count; i++ )
    {
        const y = yBottom + ( pos.getY( i ) + 0.5 ) * ( yTop - yBottom )
        const p = onTorso( pos.getX( i ) * 2 * half( y ), y, 1, lift )
        pos.setXYZ( i, p.x, p.y, p.z )
    }
    g.computeVertexNormals()
    return mesh( g, material, parent )
}

const TIE = [ [ 1.0, 0.03 ], [ 0.94, 0.024 ], [ 0.9, 0.046 ], [ 0.78, 0.062 ], [ 0.66, 0.05 ], [ 0.6, 0 ] ]

function buildArm( side, parent, m )
{
    const shoulder = new Group()
    shoulder.position.set( side * 0.31, 0.92, 0 )
    parent.add( shoulder )

    mesh( new SphereGeometry( 0.135, 24, 16 ), m.jacket, shoulder, v3( 0, - 0.03, 0 ), v3( 1, 1.1, 1 ) )
    mesh( new CapsuleGeometry( 0.088, 0.15, 6, 12 ), m.jacket, shoulder, v3( 0, - 0.17, 0 ) )

    const elbow = new Group()
    elbow.position.set( 0, - 0.27, 0 )
    shoulder.add( elbow )
    mesh( new CapsuleGeometry( 0.082, 0.1, 6, 12 ), m.jacket, elbow, v3( 0, - 0.07, 0 ) )
    mesh( new CylinderGeometry( 0.078, 0.078, 0.05, 20 ), m.shirt, elbow, v3( 0, - 0.165, 0 ) )
    mesh( new SphereGeometry( 0.088, 20, 16 ), m.skin, elbow, v3( 0, - 0.26, 0.005 ), v3( 1, 1.05, 0.95 ) )

    return { shoulder, elbow }
}

export function createLight()
{
    const m = makeMaterials()

    const root = new Group()
    root.name = 'light'
    const body = new Group()
    root.add( body )

    for( const side of [ - 1, 1 ] )
    {
        mesh( new CylinderGeometry( 0.14, 0.13, 0.44, 24 ), m.trousers, body, v3( side * 0.13, 0.28, 0 ) )
        mesh( new SphereGeometry( 1, 24, 16 ), m.shoe, body, v3( side * 0.14, 0.06, 0.05 ), v3( 0.145, 0.085, 0.21 ) )
    }
    mesh( new SphereGeometry( 0.3, 32, 20 ), m.jacket, body, v3( 0, 0.5, 0 ), v3( 1, 0.55, 0.84 ) )

    const torso = mesh( new LatheGeometry( TORSO.map( ( [ r, y ] ) => new Vector2( r, y ) ), 40 ), m.jacket, body )
    torso.scale.set( 1, 1, TORSO_DEPTH )

    // white shirt in the V of the jacket, then the tie over it
    torsoPatch( ( y ) => 0.02 + ( y - 0.62 ) / 0.41 * 0.105, 1.03, 0.62, 0.008, m.shirt, body )
    torsoPatch( ( y ) => lerpTable( TIE, y ), 1.0, 0.6, 0.016, m.tie, body )
    const knot = mesh( new SphereGeometry( 0.04, 16, 12 ), m.tie, body, onTorso( 0, 0.985, 1, 0.022 ), v3( 1, 0.85, 0.7 ) )
    knot.rotation.x = 0.2

    for( const side of [ - 1, 1 ] )
    {
        const points = [ [ 0.125, 1.0 ], [ 0.09, 0.9 ], [ 0.05, 0.78 ], [ 0.02, 0.64 ] ]
        mesh( new TubeGeometry( new CatmullRomCurve3( points.map( ( [ x, y ] ) => onTorso( x * side, y, 1, 0.02 ) ) ), 24, 0.028, 8 ), m.jacketEdge, body )
        mesh( new SphereGeometry( 0.024, 12, 10 ), m.book, body, onTorso( side * 0.05, 0.52, 1, 0.012 ) )
    }

    const collar = mesh( new TorusGeometry( 0.128, 0.03, 10, 36 ), m.jacketEdge, body, v3( 0, 1.05, 0 ) )
    collar.rotation.x = Math.PI / 2
    const shirtCollar = mesh( new TorusGeometry( 0.115, 0.022, 10, 36 ), m.shirt, body, v3( 0, 1.078, 0 ) )
    shirtCollar.rotation.x = Math.PI / 2

    mesh( new CylinderGeometry( 0.1, 0.11, 0.14, 20 ), m.skin, body, v3( 0, 1.08, 0 ) )

    const arms = { left: buildArm( - 1, body, m ), right: buildArm( 1, body, m ) }

    // A pen in the right hand, tip down toward the page. In the elbow's frame
    // -y is out in front and -z is down, with the forearm held level.
    const nib = v3( 0, - 0.864, - 0.503 )
    const pen = new Group()
    pen.position.set( 0, - 0.26, 0.005 ).addScaledVector( nib, 0.03 )
    pen.quaternion.setFromUnitVectors( UP, nib )
    arms.right.elbow.add( pen )
    mesh( new CylinderGeometry( 0.02, 0.02, 0.3, 12 ), m.pen, pen, v3( 0, - 0.04, 0 ) )
    mesh( new CylinderGeometry( 0.024, 0.024, 0.03, 12 ), m.gold, pen, v3( 0, 0.065, 0 ) )
    mesh( new CylinderGeometry( 0.004, 0.02, 0.09, 12 ), m.gold, pen, v3( 0, 0.14, 0 ) )

    const neck = new Group()
    neck.position.set( 0, 1.1, 0 )
    body.add( neck )
    const head = new Group()
    head.position.set( 0, 0.48, 0.02 )
    neck.add( head )
    mesh( skullGeometry(), m.skin, head )

    const { hair, spikes } = buildHair( head, m.hair )
    const { eyes } = buildFace( head, m )

    // He sits at a desk: the rig holds both forearms out over the notebook (the
    // right one scribbling) instead of letting them hang, bobs him only a
    // little and hops him only a little. His free left hand does the waving.
    const armRest = {
        left: { shoulderX: - 0.2, shoulderZ: - 0.1, elbowX: - 1.1 },
        right: { shoulderX: - 0.2, shoulderZ: 0.04, elbowX: - 1.2, scribble: 1 },
    }

    const pickables = []
    root.traverse( ( o ) => { if( o.isMesh ) pickables.push( o ) } )

    return {
        root, body, neck, head, hair, spikes, eyes, arms, tail: null, armRest, pickables, materials: m,
        waveSide: - 1, bobScale: 0.3, jumpScale: 0.45
    }
}

// Block capitals for the cover, as strokes in a cell 1 wide and 1.5 tall.
// [ x0, y0, x1, y1 ] is a bar; [ x0, y0, x1, y1, true ] is a diagonal stroke.
const S = 0.28
const H = 1.5
const MID = [ 0, ( H - S ) / 2, 1, ( H + S ) / 2 ]
const GLYPHS = {
    D: [ [ 0, 0, S, H ], [ 0, H - S, 0.8, H ], [ 0, 0, 0.8, S ], [ 1 - S, 0.25, 1, H - 0.25 ] ],
    E: [ [ 0, 0, S, H ], [ 0, H - S, 1, H ], [ 0, 0, 1, S ], [ 0, MID[ 1 ], 0.85, MID[ 3 ] ] ],
    A: [ [ 0, 0, S, H - 0.2 ], [ 1 - S, 0, 1, H - 0.2 ], [ 0.1, H - S, 0.9, H ], MID ],
    T: [ [ 0, H - S, 1, H ], [ 0.5 - S / 2, 0, 0.5 + S / 2, H - S ] ],
    H: [ [ 0, 0, S, H ], [ 1 - S, 0, 1, H ], MID ],
    N: [ [ 0, 0, S, H ], [ 1 - S, 0, 1, H ], [ S / 2, H, 1 - S / 2, 0, true ] ],
    O: [ [ 0, 0, S, H ], [ 1 - S, 0, 1, H ], [ 0, H - S, 1, H ], [ 0, 0, 1, S ] ],
}

/**
 * White block lettering lying flat in the x/z plane, one merged geometry.
 * The tops of the letters point to -z, away from the viewer.
 */
function lettering( words, { width, pitch, gap, stretch = 1 } )
{
    const height = width * H
    const k = width
    const thin = 0.012
    const parts = []
    words.forEach( ( word, row ) =>
    {
        const z0 = ( row - ( words.length - 1 ) / 2 ) * ( height + gap )
        const left = - ( ( word.length - 1 ) * pitch + width ) / 2
        for( let i = 0; i < word.length; i++ )
        {
            const ox = left + i * pitch
            for( const [ x0, y0, x1, y1, diagonal ] of GLYPHS[ word[ i ] ] )
            {
                if( diagonal )
                {
                    const dx = ( x1 - x0 ) * k
                    const dz = ( y0 - y1 ) * k
                    const bar = new BoxGeometry( Math.hypot( dx, dz ), thin, S * k * 0.9 )
                    bar.rotateY( - Math.atan2( dz, dx ) )
                    bar.translate( ox + ( x0 + x1 ) / 2 * k, 0, z0 - ( ( y0 + y1 ) / 2 - H / 2 ) * k )
                    parts.push( bar )
                    continue
                }
                const bar = new BoxGeometry( ( x1 - x0 ) * k, thin, ( y1 - y0 ) * k )
                bar.translate( ox + ( x0 + x1 ) / 2 * k, 0, z0 - ( ( y0 + y1 ) / 2 - H / 2 ) * k )
                parts.push( bar )
            }
        }
    } )
    const merged = mergeGeometries( parts )
    merged.scale( 1, 1, stretch )
    return merged
}

const NOTE = { halfWidth: 0.75, depth: 1.0, cover: 0.03, pages: 0.05 }

/**
 * The Death Note lying open on his desk: the inside of the front cover on the
 * left, white lettering on black, and the first pages on the right, where he is
 * writing. It plays the part Goku's cloud does for the rig: `group` bounces and
 * squashes about its origin (the desk top, at `y`), `tail` sways (the bookmark
 * ribbon) and `pickables` are what a tap can hit.
 */
export function createDeathNote( { y, z, writingZ } )
{
    const m = {
        cover: paintedMaterial( { color: palette.book, shade: '#0b0a10', highlight: '#5a5886', gloss: 0.9, scale: 1.6, rim: 0.5, terminator: 0.4 } ),
        pages: paintedMaterial( { color: palette.pages, shade: '#cdb9c9', highlight: '#ffffff', scale: 2.4, rim: 0.2 } ),
        ribbon: paintedMaterial( { color: palette.tie, shade: '#8a1830', highlight: '#ff8a78', scale: 2 } ),
        ink: paintedMaterial( { color: '#2c2640', unlit: true } ),
        white: paintedMaterial( { color: '#ffffff', unlit: true } ),
    }

    const { halfWidth: W, depth: D, cover: C, pages: P } = NOTE

    const group = new Group()
    group.name = 'death-note'
    group.position.set( 0, y, z )

    const half = W + 0.03
    const main = mesh( mergeGeometries( [
        new RoundedBoxGeometry( half, C, D + 0.04, 3, 0.012 ).translate( - half / 2, C / 2, 0 ),
        new RoundedBoxGeometry( half, C, D + 0.04, 3, 0.012 ).translate( half / 2, C / 2, 0 ),
        new RoundedBoxGeometry( 0.1, C + 0.014, D + 0.04, 3, 0.02 ).translate( 0, ( C + 0.014 ) / 2, 0 ),
    ] ), m.cover, group )

    const pages = mesh( new RoundedBoxGeometry( W - 0.06, P, D - 0.06, 2, 0.012 ), m.pages, group, v3( 0.03 + ( W - 0.06 ) / 2, C + P / 2, 0 ) )

    // names in a small hand on the right page, rows run toward him; the last one is still being written
    const ink = []
    const top = C + P + 0.002
    const rows = 7
    for( let i = 0; i < rows; i++ )
    {
        const rowZ = writingZ + ( rows - 1 - i ) * 0.07
        const length = i === rows - 1 ? 0.26 : 0.44 + ( ( i * 37 ) % 11 ) / 11 * 0.12
        ink.push( new BoxGeometry( length, 0.004, 0.018 ).translate( 0.1 + length / 2, top, rowZ ) )
    }
    mesh( mergeGeometries( ink ), m.ink, group )

    // the cover's own print: the title, then the rules in tiny type
    mesh( lettering( [ 'DEATH', 'NOTE' ], { width: 0.085, pitch: 0.125, gap: 0.05, stretch: 1.5 } ), m.white, group, v3( - 0.4, C + 0.007, - 0.05 ) )
    const print = []
    for( let i = 0; i < 4; i++ )
    {
        const length = ( 0.36 + ( ( i * 53 ) % 7 ) / 7 * 0.25 ) * ( i === 3 ? 0.5 : 1 )
        print.push( new BoxGeometry( length, 0.004, 0.014 ).translate( - 0.69 + length / 2, C + 0.003, 0.26 + i * 0.065 ) )
    }
    mesh( mergeGeometries( print ), m.white, group )

    // The bookmark ribbon slips out from under the pages and lies on the desk; the
    // rig swings it about this pivot's y axis.
    const ribbon = new Group()
    ribbon.position.set( 0.3, 0.026, D / 2 - 0.2 )
    group.add( ribbon )
    const tie = new Shape()
    tie.moveTo( - 0.045, 0 )
    tie.lineTo( 0.045, 0 )
    tie.lineTo( 0.045, - 0.66 )
    tie.lineTo( 0, - 0.58 )
    tie.lineTo( - 0.045, - 0.66 )
    const strip = mesh( new ShapeGeometry( tie ).rotateX( - Math.PI / 2 ), m.ribbon, ribbon )

    return { group, main, tail: ribbon, pickables: [ main, pages, strip ], grounded: true, baseY: y }
}

/** Ryuk's favourite snack, left on the cover. */
export function createApple()
{
    const red = paintedMaterial( { color: '#e03a3a', shade: '#8f1c3a', highlight: '#ff9a82', gloss: 1, scale: 2.4, rim: 0.7 } )
    const wood = paintedMaterial( { color: '#6b4a35', shade: '#3a2530', scale: 3 } )
    const leaf = paintedMaterial( { color: '#6fbf5a', shade: '#2e7a55', highlight: '#c8f0a0', scale: 3 } )

    const apple = new Group()
    const profile = [
        [ 0, - 0.12 ], [ 0.06, - 0.118 ], [ 0.11, - 0.09 ], [ 0.14, - 0.03 ], [ 0.14, 0.03 ],
        [ 0.11, 0.09 ], [ 0.065, 0.115 ], [ 0.025, 0.105 ], [ 0, 0.085 ],
    ].map( ( [ r, y ] ) => new Vector2( r, y ) )
    mesh( new LatheGeometry( profile, 28 ), red, apple )
    const stem = mesh( new CylinderGeometry( 0.012, 0.016, 0.07, 8 ), wood, apple, v3( 0.008, 0.125, 0 ) )
    stem.rotation.z = - 0.25
    const blade = mesh( new SphereGeometry( 1, 14, 8 ), leaf, apple, v3( 0.05, 0.14, 0 ), v3( 0.07, 0.012, 0.035 ) )
    blade.rotation.z = 0.35
    apple.scale.setScalar( 1.3 )
    return apple
}
