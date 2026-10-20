import {
    Group, Mesh, SphereGeometry, CylinderGeometry, ConeGeometry, BoxGeometry, TorusGeometry, LatheGeometry,
    TubeGeometry, CircleGeometry, RingGeometry, BufferGeometry, Float32BufferAttribute,
    Vector2, Vector3, CatmullRomCurve3, Color,
    Sprite, SpriteNodeMaterial, MeshBasicNodeMaterial, DoubleSide
} from 'three/webgpu'
import { uniform } from 'three/tsl'

import { paintedMaterial } from '../materials/painted.js'
import { glowMaterial } from './glow.js'
import { seeded, smooth, trs, Parts } from './parts.js'

/** The Fuga mood sets the whole domain alight; the theme driver eases `fire`. */
export const shrineLook = { fire: 0 }

// Sukuna's Domain Expansion, Malevolent Shrine (Fukuma Mizushi). A warped
// Buddhist zushi enshrining demons: it squats on a mound of ox skulls, its four
// doorways are huge mouths with human teeth and lolling tongues, its hip-and-
// gable roof sprouts bull horns and is crowned by a small ox skull, small fanged
// mouths sit in the gables and door corners, human skulls hang from the eave
// corners and four gnarled stumps stand around it. Everything stands in a still
// pool of blood, with the domain's sure-hit Dismantle and Cleave slashes
// flickering through the air. The domain answers Sukuna's pose: a mound of
// skulls rises out of the blood for him to sit on, the shrine roars when he
// forms the Enmaten sign, and the embers turn to fire for Fuga.

const G = {
    sphere: new SphereGeometry( 1, 18, 12 ),
    dome: new SphereGeometry( 1, 36, 14, 0, Math.PI * 2, 0, Math.PI / 2 ),
    box: new BoxGeometry( 1, 1, 1 ),
    cyl: new CylinderGeometry( 1, 1, 1, 14 ),
    snout: new CylinderGeometry( 0.6, 1, 1, 14 ),
    trunk: new CylinderGeometry( 0.5, 1, 1, 10 ),
    cone: new ConeGeometry( 1, 1, 10 ),
    prism: new CylinderGeometry( 1, 1, 1, 3 ),
    disc: new CircleGeometry( 1, 40 ),
    lipRing: new TorusGeometry( 1, 0.11, 10, 56 ),
}

/** A tube along `points` that thins to a point at the far end, for horns and branches. */
function hornGeometry( points, radius, tubular = 24, radial = 8 )
{
    const curve = new CatmullRomCurve3( points )
    const g = new TubeGeometry( curve, tubular, radius, radial, false )
    const pos = g.attributes.position
    const c = new Vector3()
    for( let i = 0; i <= tubular; i++ )
    {
        const u = i / tubular
        curve.getPointAt( u, c )
        const taper = Math.max( 0.03, Math.pow( 1 - u, 0.8 ) )
        for( let j = 0; j <= radial; j++ )
        {
            const idx = i * ( radial + 1 ) + j
            pos.setXYZ( idx, c.x + ( pos.getX( idx ) - c.x ) * taper, c.y + ( pos.getY( idx ) - c.y ) * taper, c.z + ( pos.getZ( idx ) - c.z ) * taper )
        }
    }
    g.computeVertexNormals()
    return g
}

const OX_HORN = [ 1, - 1 ].map( ( side ) => hornGeometry( [
    [ 0.2, 0.13, - 0.04 ], [ 0.4, 0.18, - 0.02 ], [ 0.56, 0.31, 0.03 ], [ 0.6, 0.52, 0.09 ],
].map( ( [ x, y, z ] ) => new Vector3( x * side, y, z ) ), 0.075 ) )

/** Water-buffalo skull facing +z, Enmaten's mount: about 0.7 wide without the horns. */
function oxSkull( P, M )
{
    const at = ( p, r, s ) => M.clone().multiply( trs( p, r, s ) )
    P.add( 'bone', G.sphere, at( [ 0, 0.06, - 0.06 ], [ 0, 0, 0 ], [ 0.34, 0.27, 0.3 ] ) )
    P.add( 'bone', G.sphere, at( [ 0, 0.17, 0.06 ], [ 0, 0, 0 ], [ 0.3, 0.08, 0.2 ] ) )
    P.add( 'bone', G.snout, at( [ 0, - 0.06, 0.27 ], [ Math.PI / 2 + 0.32, 0, 0 ], [ 0.17, 0.48, 0.14 ] ) )
    P.add( 'bone', G.sphere, at( [ 0, - 0.14, 0.49 ], [ 0, 0, 0 ], [ 0.11, 0.09, 0.1 ] ) )
    for( const side of [ - 1, 1 ] )
    {
        P.add( 'dark', G.sphere, at( [ side * 0.17, 0.07, 0.17 ], [ 0, side * 0.5, 0 ], [ 0.085, 0.075, 0.06 ] ) )
        P.add( 'dark', G.sphere, at( [ side * 0.045, - 0.15, 0.585 ], [ 0, 0, 0 ], [ 0.03, 0.03, 0.03 ] ) )
    }
    P.add( 'horn', OX_HORN[ 0 ], M )
    P.add( 'horn', OX_HORN[ 1 ], M )
}

/** Human skull facing +z, about 0.42 tall. */
function humanSkull( P, M )
{
    const at = ( p, r, s ) => M.clone().multiply( trs( p, r, s ) )
    P.add( 'bone', G.sphere, at( [ 0, 0.07, - 0.01 ], [ 0, 0, 0 ], [ 0.2, 0.2, 0.22 ] ) )
    P.add( 'bone', G.sphere, at( [ 0, - 0.05, 0.07 ], [ 0, 0, 0 ], [ 0.15, 0.13, 0.14 ] ) )
    P.add( 'bone', G.box, at( [ 0, - 0.15, 0.07 ], [ 0, 0, 0 ], [ 0.16, 0.06, 0.13 ] ) )
    for( const side of [ - 1, 1 ] )
        P.add( 'dark', G.sphere, at( [ side * 0.07, - 0.01, 0.18 ], [ 0, 0, 0 ], [ 0.056, 0.05, 0.035 ] ) )
    P.add( 'dark', G.sphere, at( [ 0, - 0.077, 0.205 ], [ 0, 0, 0 ], [ 0.022, 0.03, 0.02 ] ) )
    P.add( 'dark', G.box, at( [ 0, - 0.125, 0.137 ], [ 0, 0, 0 ], [ 0.12, 0.012, 0.02 ] ) )
}

/**
 * A grotesque mouth facing +z: dark gullet, fat lips, a row of human teeth
 * top and bottom with two fangs, and a tongue lolling over the lower lip.
 * The lower teeth and tongue live on `jaw` so the mouth can breathe and roar.
 */
function buildMouth( m, w, h, { teeth = 9, tongue = true } = {} )
{
    const group = new Group()
    const jaw = new Group()
    group.add( jaw )
    const top = new Parts()
    const low = new Parts()
    const thin = Math.min( w, h )

    top.add( 'dark', G.disc, trs( [ 0, 0, 0 ], [ 0, 0, 0 ], [ w, h, 1 ] ) )
    top.add( 'throat', G.disc, trs( [ 0, - h * 0.12, 0.004 ], [ 0, 0, 0 ], [ w * 0.52, h * 0.42, 1 ] ) )
    top.add( 'lip', G.lipRing, trs( [ 0, 0, 0.01 ], [ 0, 0, 0 ], [ w, h, thin ] ) )

    const toothWidth = ( Math.PI * w * 0.68 ) / teeth * 0.78
    for( let i = 0; i < teeth; i++ )
    {
        const u = ( i + 0.5 ) / teeth
        const len = h * ( 0.22 + 0.08 * Math.sin( u * Math.PI ) )
        for( const [ parts, a0, a1 ] of [ [ top, 0.16, 0.84 ], [ low, 1.16, 1.84 ] ] )
        {
            const th = Math.PI * ( a0 + ( a1 - a0 ) * u )
            parts.add( 'tooth', G.box, trs( [ Math.cos( th ) * w * 0.8, Math.sin( th ) * h * 0.78, 0.03 ], [ 0, 0, th - Math.PI / 2 ], [ toothWidth, len, thin * 0.12 ] ) )
        }
    }
    for( const th of [ Math.PI * 0.12, Math.PI * 0.88 ] )
        top.add( 'tooth', G.cone, trs( [ Math.cos( th ) * w * 0.72, Math.sin( th ) * h * 0.62, 0.035 ], [ 0, 0, th + Math.PI / 2 ], [ toothWidth * 0.55, h * 0.5, thin * 0.1 ] ) )

    if( tongue )
        low.add( 'tongue', G.sphere, trs( [ 0, - h * 0.72, 0.1 ], [ - 0.5, 0, 0 ], [ w * 0.36, h * 0.52, h * 0.16 ] ) )

    top.build( m, group )
    low.build( m, jaw )
    return { group, jaw, h, phase: 0 }
}

/** A square hip roof with concave, flared slopes: Lathe with four sides, turned to sit square. */
function hipRoof( halfWidth, innerHalf, height )
{
    const r0 = halfWidth / Math.SQRT1_2
    const r1 = innerHalf / Math.SQRT1_2
    const points = [ new Vector2( 0.001, - 0.07 ), new Vector2( r0, - 0.07 ), new Vector2( r0 + 0.05, 0 ) ]
    for( let i = 1; i <= 8; i++ )
    {
        const t = i / 8
        points.push( new Vector2( r0 + ( r1 - r0 ) * t, height * Math.pow( t, 1.7 ) ) )
    }
    points.push( new Vector2( 0.001, height ) )
    return new LatheGeometry( points, 4, Math.PI / 4 )
}

function makeMaterials()
{
    return {
        blood: paintedMaterial( { color: '#32050c', shade: '#140105', highlight: '#c8344c', rim: 0.3, gloss: 0.7, brush: 0.8, scale: 0.9, terminator: 0.4, haze: 0.5 } ),
        bone: paintedMaterial( { color: '#ecdcc0', shade: '#9c7468', highlight: '#fff8ea', rim: 0.6, gloss: 0.35, scale: 3.2 } ),
        horn: paintedMaterial( { color: '#d9c6a4', shade: '#6e4a46', highlight: '#fff4dc', rim: 0.6, gloss: 0.5, scale: 3 } ),
        dark: paintedMaterial( { color: '#170409', unlit: true } ),
        flesh: paintedMaterial( { color: '#2e0c12', shade: '#100306', highlight: '#7a2a38', rim: 0.4, gloss: 0.3, scale: 2 } ),
        wood: paintedMaterial( { color: '#2c1218', shade: '#0c0407', highlight: '#7a4652', rim: 0.5, gloss: 0.45, scale: 2.6 } ),
        lacquer: paintedMaterial( { color: '#4a1420', shade: '#1a0408', highlight: '#c44a5e', rim: 0.7, gloss: 0.6, scale: 2.4 } ),
        roof: paintedMaterial( { color: '#22101a', shade: '#080306', highlight: '#7a3c52', rim: 0.75, gloss: 0.55, scale: 2.2, terminator: 0.42 } ),
        lip: paintedMaterial( { color: '#c63c54', shade: '#5c0c1e', highlight: '#ffa4b0', rim: 0.5, gloss: 0.8, scale: 3 } ),
        tooth: paintedMaterial( { color: '#fff3e2', shade: '#c4a08e', highlight: '#ffffff', rim: 0.4, gloss: 0.4, scale: 4 } ),
        tongue: paintedMaterial( { color: '#da5470', shade: '#7a1830', highlight: '#ffb0bc', rim: 0.4, gloss: 0.7, scale: 3 } ),
        throat: paintedMaterial( { color: '#4a0814', unlit: true } ),
        stump: paintedMaterial( { color: '#3c2226', shade: '#12080a', highlight: '#8a5a5a', rim: 0.5, gloss: 0.2, scale: 2.4 } ),
    }
}

// how high the skull mound lifts the shrine; everything above it is built relative to `LIFT`
const MOUND = 1.9
const LIFT = 0.88

function buildShrine( m, rand )
{
    const shrine = new Group()
    shrine.name = 'fukuma-mizushi'
    const P = new Parts()
    // parts of the shrine itself sit on top of the mound
    const up = ( [ x, y, z ], r, s ) => trs( [ x, y + LIFT, z ], r, s )

    // ── the high mound of ox skulls it squats on ───────────────────────────
    P.add( 'flesh', G.trunk, trs( [ 0, MOUND / 2, 0 ], [], [ 2.1, MOUND, 1.7 ] ) )
    const layers = [
        { n: 18, y: 0.14, s: 1.0 },
        { n: 16, y: 0.55, s: 0.95 },
        { n: 15, y: 0.95, s: 0.9 },
        { n: 13, y: 1.35, s: 0.85 },
        { n: 12, y: 1.72, s: 0.78 },
    ]
    layers.forEach( ( L, li ) =>
    {
        // hug the sloped side of the mound, which narrows from 2.1 to 1.05 wide
        const r = 2.1 - 1.05 * ( L.y / MOUND ) + 0.08
        for( let i = 0; i < L.n; i++ )
        {
            const a = ( ( i + li * 0.5 ) / L.n ) * Math.PI * 2 + ( rand() - 0.5 ) * 0.15
            const at = [ Math.sin( a ) * r, L.y + rand() * 0.06, Math.cos( a ) * r * 0.81 ]
            const rot = [ - 0.25 + rand() * 0.3, a + ( rand() - 0.5 ) * 0.6, ( rand() - 0.5 ) * 0.5 ]
            const s = L.s * ( 0.85 + rand() * 0.3 )
            if( ( i + li ) % 3 === 0 ) humanSkull( P, trs( at, rot, s * 1.45 ) )
            else oxSkull( P, trs( at, rot, s ) )
        }
    } )

    // ── plinth, lacquered body, pillars, lintel and eave brackets ──────────
    P.add( 'wood', G.box, up( [ 0, 1.1, 0 ], [], [ 2.6, 0.18, 2.1 ] ) )
    P.add( 'wood', G.box, up( [ 0, 1.24, 0 ], [], [ 2.3, 0.12, 1.85 ] ) )
    P.add( 'lacquer', G.box, up( [ 0, 1.94, 0 ], [], [ 1.9, 1.3, 1.5 ] ) )
    for( const sx of [ - 1, 1 ] )
        for( const sz of [ - 1, 1 ] )
            P.add( 'wood', G.cyl, up( [ sx * 0.95, 1.94, sz * 0.75 ], [], [ 0.085, 1.34, 0.085 ] ) )
    P.add( 'wood', G.box, up( [ 0, 2.66, 0 ], [], [ 2.12, 0.14, 1.72 ] ) )
    for( let i = 0; i < 5; i++ )
    {
        const x = ( i / 4 - 0.5 ) * 1.9
        for( const sz of [ - 1, 1 ] ) P.add( 'wood', G.box, up( [ x, 2.79, sz * 0.82 ], [], [ 0.16, 0.12, 0.16 ] ) )
    }
    for( let i = 0; i < 4; i++ )
    {
        const z = ( i / 3 - 0.5 ) * 1.5
        for( const sx of [ - 1, 1 ] ) P.add( 'wood', G.box, up( [ sx * 1.02, 2.79, z ], [], [ 0.16, 0.12, 0.16 ] ) )
    }

    // ── two-tier hip-and-gable roof ─────────────────────────────────────────
    const ROOF_DEPTH = 0.86
    P.add( 'roof', hipRoof( 1.62, 0.66, 0.6 ), up( [ 0, 2.86, 0 ], [], [ 1, 1, ROOF_DEPTH ] ) )
    P.add( 'lacquer', G.box, up( [ 0, 3.62, 0 ], [], [ 1.24, 0.4, 1.04 ] ) )
    P.add( 'roof', hipRoof( 1.05, 0.5, 0.34 ), up( [ 0, 3.82, 0 ], [], [ 1, 1, ROOF_DEPTH ] ) )
    // gable: a triangular prism running front to back, apex up
    P.add( 'roof', G.prism, up( [ 0, 4.38, 0 ], [ - Math.PI / 2, 0, 0 ], [ 0.62, 1.02, 0.5 ] ) )

    // crowned with a small ox skull at the front of the ridge
    oxSkull( P, up( [ 0, 4.84, 0.4 ], [ - 0.25, 0, 0 ], 0.55 ) )

    // great bull horns bursting out of the upper tier, and smaller ones off the lower corners
    for( const side of [ - 1, 1 ] )
    {
        P.add( 'horn', hornGeometry( [
            [ 0.55, 3.6, 0 ], [ 1.1, 3.78, 0.1 ], [ 1.5, 4.25, 0.15 ], [ 1.56, 4.85, 0.05 ], [ 1.36, 5.28, - 0.05 ],
        ].map( ( [ x, y, z ] ) => new Vector3( x * side, y, z ) ), 0.15, 32, 10 ), trs( [ 0, LIFT, 0 ] ) )
        for( const sz of [ - 1, 1 ] )
        {
            P.add( 'horn', hornGeometry( [
                [ 1.45, 2.86, 1.22 ], [ 1.82, 3.0, 1.4 ], [ 2.0, 3.36, 1.5 ], [ 1.94, 3.68, 1.42 ],
            ].map( ( [ x, y, z ] ) => new Vector3( x * side, y, z * sz ) ), 0.09 ), trs( [ 0, LIFT, 0 ] ) )
        }
    }

    // human skulls hanging from the four eave corners
    for( const sx of [ - 1, 1 ] )
    {
        for( const sz of [ - 1, 1 ] )
        {
            const x = sx * 1.58
            const z = sz * 1.58 * ROOF_DEPTH
            P.add( 'wood', G.cyl, up( [ x, 2.62, z ], [], [ 0.016, 0.36, 0.016 ] ) )
            humanSkull( P, up( [ x, 2.3, z ], [ 0.15, Math.atan2( x, z ), 0 ], 0.95 ) )
        }
    }

    // gnarled stumps at the four corners
    for( const sx of [ - 1, 1 ] )
    {
        for( const sz of [ - 1, 1 ] )
        {
            const M = trs( [ sx * ( 2.25 + rand() * 0.15 ), 0, sz * ( 1.8 + rand() * 0.15 ) ], [ 0, rand() * 6, 0 ], 0.9 + rand() * 0.25 )
            P.add( 'stump', G.trunk, M.clone().multiply( trs( [ 0, 0.55, 0 ], [], [ 0.24, 1.1, 0.24 ] ) ) )
            for( let b = 0; b < 3; b++ )
            {
                const a = ( b / 3 ) * Math.PI * 2 + rand()
                const c = Math.cos( a ), s = Math.sin( a )
                P.add( 'stump', hornGeometry( [
                    [ 0, 0.95, 0 ], [ c * 0.25, 1.22, s * 0.25 ], [ c * 0.52, 1.36, s * 0.52 + 0.1 ], [ c * 0.66, 1.7, s * 0.6 ],
                ].map( ( p ) => new Vector3( ...p ) ), 0.075, 16, 7 ), M )
            }
        }
    }

    const meshes = P.build( m, shrine )

    // the four doorways are mouths; the gables and door corners have small fanged ones
    const mouths = []
    const addMouth = ( w, h, position, yaw, options ) =>
    {
        const mouth = buildMouth( m, w, h, options )
        mouth.group.position.set( ...position )
        mouth.group.rotation.y = yaw
        mouth.phase = rand() * Math.PI * 2
        shrine.add( mouth.group )
        mouths.push( mouth )
        return mouth
    }
    addMouth( 0.66, 0.48, [ 0, 2.82, 0.752 ], 0 )
    addMouth( 0.66, 0.48, [ 0, 2.82, - 0.752 ], Math.PI )
    addMouth( 0.54, 0.46, [ 0.952, 2.82, 0 ], Math.PI / 2 )
    addMouth( 0.54, 0.46, [ - 0.952, 2.82, 0 ], - Math.PI / 2 )
    addMouth( 0.2, 0.11, [ 0, 5.18, 0.512 ], 0, { teeth: 6, tongue: false } )
    addMouth( 0.2, 0.11, [ 0, 5.18, - 0.512 ], Math.PI, { teeth: 6, tongue: false } )
    for( const sx of [ - 1, 1 ] )
        addMouth( 0.09, 0.055, [ sx * 0.78, 3.34, 0.756 ], 0, { teeth: 4, tongue: false } )

    const pickables = []
    shrine.traverse( ( o ) => { if( o.isMesh ) pickables.push( o ) } )

    return { group: shrine, mouths, pickables, meshes }
}

/** The mound of skulls Sukuna lounges on, which rises out of the blood for his throne pose. */
function buildSkullThrone( m, rand )
{
    const seat = new Group()
    seat.name = 'skull-throne'
    const P = new Parts()
    P.add( 'flesh', G.dome, trs( [ 0, 0, 0 ], [], [ 0.74, 0.36, 0.64 ] ) )
    for( let i = 0; i < 10; i++ )
    {
        const a = ( i / 10 ) * Math.PI * 2
        humanSkull( P, trs( [ Math.sin( a ) * 0.66, 0.08, Math.cos( a ) * 0.56 ], [ - 0.15, a, ( rand() - 0.5 ) * 0.4 ], 1.1 ) )
    }
    for( let i = 0; i < 5; i++ )
    {
        const a = ( ( i + 0.5 ) / 5 ) * Math.PI * 2
        oxSkull( P, trs( [ Math.sin( a ) * 0.46, 0.24, Math.cos( a ) * 0.4 ], [ - 0.3, a, 0 ], 0.55 ) )
    }
    for( let i = 0; i < 4; i++ )
    {
        const a = ( i / 4 ) * Math.PI * 2 + 0.4
        humanSkull( P, trs( [ Math.sin( a ) * 0.22, 0.3, Math.cos( a ) * 0.2 ], [ - 0.7, a, 0 ], 0.85 ) )
    }
    P.build( m, seat )
    return seat
}

/** A thin pointed kite, the shape of a single sure-hit slash. */
function kite( length, width )
{
    const g = new BufferGeometry()
    const L = length / 2
    g.setAttribute( 'position', new Float32BufferAttribute( [
        - L, 0, 0, 0, width, 0, L, 0, 0,
        - L, 0, 0, L, 0, 0, 0, - width, 0,
    ], 3 ) )
    return g
}

function flatMaterial( color, opacity = null )
{
    const mat = new MeshBasicNodeMaterial( { side: DoubleSide, transparent: opacity !== null, depthWrite: opacity === null } )
    mat.colorNode = uniform( new Color( color ) )
    if( opacity !== null ) mat.opacityNode = opacity
    return mat
}

export function createMalevolentShrine( camera = null, kid = null )
{
    const rand = seeded( 97 )
    const m = makeMaterials()

    // the rig squashes `group`, so it only holds the ripples at his feet; the
    // pool and throne live in `ground`, the shrine and its flotsam in `backdrop`
    // (turned to stay behind him), and the slashes in `fx` (facing the camera)
    const group = new Group()
    group.name = 'sukuna-feet'
    const ground = new Group()
    ground.name = 'blood-pool'
    const backdrop = new Group()
    backdrop.name = 'malevolent-shrine'
    const fx = new Group()
    fx.name = 'domain-slashes'

    const pool = new Mesh( new CircleGeometry( 40, 96 ), m.blood )
    pool.rotation.x = - Math.PI / 2
    ground.add( pool )

    const ripples = []
    for( let i = 0; i < 3; i++ )
    {
        const opacity = uniform( 0 )
        const ring = new Mesh( new RingGeometry( 0.9, 1, 64 ), flatMaterial( '#ff5a6e', opacity ) )
        ring.rotation.x = - Math.PI / 2
        ring.position.y = 0.012
        group.add( ring )
        ripples.push( { ring, opacity, offset: i / 3 } )
    }

    const waveOpacity = uniform( 0 )
    const shockwave = new Mesh( new RingGeometry( 0.94, 1, 128 ), flatMaterial( '#ff8090', waveOpacity ) )
    shockwave.rotation.x = - Math.PI / 2
    shockwave.position.y = 0.015
    shockwave.visible = false
    ground.add( shockwave )

    const throne = buildSkullThrone( m, rand )
    ground.add( throne )

    const shrine = buildShrine( m, rand )
    shrine.group.position.set( 0, 0, - 5.4 )
    backdrop.add( shrine.group )

    // skulls half sunk in the blood around him
    const flotsam = new Parts()
    for( const [ x, z, kind, s ] of [
        [ - 2.6, - 1.1, 'ox', 0.8 ], [ 2.8, - 0.5, 'human', 1.2 ], [ - 3.4, 0.7, 'human', 1.1 ], [ 3.3, 1.2, 'ox', 0.75 ],
        [ - 1.9, - 2.5, 'human', 1.3 ], [ 2.1, - 2.7, 'ox', 0.9 ], [ - 4.3, - 2.1, 'ox', 1.0 ], [ 4.4, - 1.8, 'human', 1.3 ],
    ] )
    {
        const M = trs( [ x, - 0.06, z ], [ - 0.2 + rand() * 0.3, rand() * Math.PI * 2, ( rand() - 0.5 ) * 0.4 ], s )
        if( kind === 'ox' ) oxSkull( flotsam, M )
        else humanSkull( flotsam, M )
    }
    flotsam.build( m, backdrop )

    // a crimson halo behind the shrine so its silhouette reads against the dark
    const crimson = new Color( '#d01c3c' )
    const fire = new Color( '#ff7a1c' )
    const aura = new Sprite( glowMaterial( SpriteNodeMaterial, '#d01c3c', { strength: 0.55, power: 1.2 } ) )
    aura.position.set( 0, 3.4, - 6.3 )
    aura.scale.setScalar( 11 )
    backdrop.add( aura )
    const auraCore = new Sprite( glowMaterial( SpriteNodeMaterial, '#ff5a6a', { strength: 0.32, power: 1.6 } ) )
    auraCore.position.set( 0, 3.0, - 6.1 )
    auraCore.scale.setScalar( 5.5 )
    backdrop.add( auraCore )

    // cursed embers drifting up out of the blood, kept clear of Sukuna himself
    const emberMaterial = glowMaterial( SpriteNodeMaterial, '#ff3a54', { strength: 1, power: 1.6 } )
    const embers = []
    while( embers.length < 30 )
    {
        const x = ( rand() * 2 - 1 ) * 4.6
        const z = - 5 + rand() * 6.2
        if( Math.abs( x ) < 1.1 && z > - 1.6 ) continue
        const sprite = new Sprite( emberMaterial )
        backdrop.add( sprite )
        embers.push( { sprite, x, z, y0: rand() * 4.5, speed: 0.25 + rand() * 0.35, size: 0.12 + rand() * 0.16, sway: rand() * 6 } )
    }

    // Dismantle and Cleave: thin crimson cuts with white-hot cores that sweep
    // through the air behind him, vanish and strike again somewhere else
    const slashEdge = flatMaterial( '#ff2a4a' )
    const slashCore = flatMaterial( '#fff0f2' )
    const slashes = []
    const respawn = ( s, first = false ) =>
    {
        s.life = first ? rand() : 0
        s.period = 0.7 + rand() * 0.9
        s.angle = ( rand() - 0.5 ) * Math.PI * 0.9 + ( rand() < 0.5 ? Math.PI / 2 : 0 )
        s.x = ( rand() * 2 - 1 ) * 2.6
        s.y = ( rand() * 2 - 1 ) * 1.7
        s.holder.position.set( s.x, s.y, - 1.3 - rand() * 1.2 )
        s.holder.rotation.z = s.angle
        s.holder.scale.setScalar( 0.7 + rand() * 0.7 )
    }
    for( let i = 0; i < 16; i++ )
    {
        const holder = new Group()
        fx.add( holder )
        const edge = new Mesh( kite( 2.2, 0.05 ), slashEdge )
        const core = new Mesh( kite( 2.0, 0.018 ), slashCore )
        core.position.z = 0.002
        holder.add( edge, core )
        const s = { holder, edge, core }
        respawn( s, true )
        slashes.push( s )
    }

    // ── domain state, driven by Sukuna's pose ──────────────────────────────
    const state = { throne: 0, power: 0.6, fire: 0, roar: 0, wave: - 1 }
    let lastPose = kid?.pose ?? 1
    let lit = false
    const fireGoal = ( pose ) => Math.max( pose === 3 ? 1 : 0, shrineLook.fire )

    function expand()
    {
        state.wave = 0
        state.roar = 1
    }

    function update( t, dt )
    {
        if( camera )
        {
            backdrop.rotation.y = Math.atan2( camera.position.x, camera.position.z )
            fx.quaternion.copy( camera.quaternion )
        }
        fx.position.set( 0, 1.5, 0 )

        const pose = kid?.pose ?? 1
        if( pose !== lastPose && pose === 1 ) expand()
        lastPose = pose
        // the mouths roar whenever the mood flips between the shrine and Fuga
        const nowLit = shrineLook.fire > 0.5
        if( nowLit !== lit ) { lit = nowLit; expand() }
        const k = 1 - Math.exp( - dt * 4 )
        state.throne += ( ( pose === 0 ? 1 : 0 ) - state.throne ) * k
        state.power += ( ( pose === 1 || pose === 2 ? 1 : pose === 3 ? 0.3 : 0.55 ) - state.power ) * k
        state.fire += ( fireGoal( pose ) - state.fire ) * k
        state.roar = Math.max( 0, state.roar - dt * 0.7 )

        // the skull throne surfaces from the blood
        throne.visible = state.throne > 0.01
        throne.position.y = ( smooth( state.throne ) - 1 ) * 0.8
        throne.rotation.y = Math.sin( t * 0.3 ) * 0.04

        for( const r of ripples )
        {
            const life = ( t * 0.45 + r.offset ) % 1
            r.ring.scale.setScalar( 0.25 + life * 1.35 )
            r.opacity.value = ( 1 - life ) ** 1.5 * 0.45
        }

        shockwave.visible = state.wave >= 0
        if( state.wave >= 0 )
        {
            state.wave += dt / 1.6
            const w = Math.min( 1, state.wave )
            shockwave.scale.setScalar( 0.3 + ( 1 - ( 1 - w ) ** 3 ) * 16 )
            waveOpacity.value = ( 1 - w ) * 0.75
            if( state.wave >= 1 ) state.wave = - 1
        }

        // the mouths breathe, and gape when the domain opens
        const roar = smooth( Math.min( 1, state.roar * 1.4 ) )
        for( const mouth of shrine.mouths )
        {
            const breath = 0.5 + 0.5 * Math.sin( t * 1.2 + mouth.phase )
            mouth.jaw.position.y = - mouth.h * ( 0.04 + breath * 0.08 + roar * 0.42 )
        }

        const flare = 1 + roar * 0.35
        aura.scale.setScalar( 11 * flare * ( 0.97 + Math.sin( t * 1.6 ) * 0.03 ) )
        auraCore.scale.setScalar( 5.5 * flare )
        aura.material.colorNode.value.lerpColors( crimson, fire, state.fire * 0.7 )
        emberMaterial.colorNode.value.lerpColors( crimson, fire, state.fire )

        for( const e of embers )
        {
            const y = ( e.y0 + t * e.speed * ( 1 + state.fire ) ) % 4.5
            e.sprite.position.set( e.x + Math.sin( t * 0.8 + e.sway ) * 0.15, y, e.z )
            e.sprite.scale.setScalar( Math.max( 1e-3, e.size * Math.sin( ( y / 4.5 ) * Math.PI ) * ( 1 + state.fire * 0.6 ) ) )
        }

        for( const s of slashes )
        {
            s.life += dt / s.period
            if( s.life >= 1 ) respawn( s )
            const sweep = smooth( Math.min( 1, s.life / 0.14 ) )
            const thin = 1 - smooth( Math.min( 1, Math.max( 0, ( s.life - 0.2 ) / 0.3 ) ) )
            const on = thin > 0.001 && state.power > 0.05
            s.holder.visible = on
            if( ! on ) continue
            const strength = state.power * ( 1 + roar * 0.6 )
            s.edge.scale.set( Math.max( 1e-3, sweep ), Math.max( 1e-3, thin * strength ), 1 )
            s.core.scale.set( Math.max( 1e-3, sweep * 0.96 ), Math.max( 1e-3, thin * strength ), 1 )
            const travel = ( sweep - 0.5 ) * 0.5
            s.edge.position.x = travel
            s.core.position.x = travel
        }
    }

    function snap()
    {
        state.fire = fireGoal( kid?.pose ?? 1 )
        lit = shrineLook.fire > 0.5
        state.roar = 0
        state.wave = - 1
    }

    return {
        group, main: null, tail: null, ground, backdrop, fx, update, snap,
        // tapping the shrine opens the domain again
        onTap: expand,
        grounded: true, baseY: 0,
        pickables: shrine.pickables,
    }
}
