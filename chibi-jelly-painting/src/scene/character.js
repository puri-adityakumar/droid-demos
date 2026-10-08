import {
    Group, Mesh, SphereGeometry, CapsuleGeometry, CylinderGeometry, ConeGeometry,
    TorusGeometry, LatheGeometry, TubeGeometry, CircleGeometry, ShapeGeometry, Shape,
    Vector2, Vector3, Matrix4, EllipseCurve, CatmullRomCurve3
} from 'three/webgpu'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'

import { paintedMaterial } from '../materials/painted.js'

export const palette = {
    skin: '#ffdcc2',
    hair: '#3a3558',
    gi: '#ff8c3f',
    blue: '#4f78e2',
    boot: '#3d4f9e',
    tail: '#9c6441',
    staff: '#d9342c',
    gold: '#f0b531',
    eye: '#1f1a33',
    mouth: '#7e2733',
    tongue: '#ff8a7e',
    blush: '#ff9b8e',
    patch: '#fff7ea',
}

function makeMaterials()
{
    return {
        skin: paintedMaterial( { color: palette.skin, shade: '#ee9e92', rim: 0.6, gloss: 0.25, scale: 2.4 } ),
        hair: paintedMaterial( { color: palette.hair, shade: '#28224a', highlight: '#7f86c9', rim: 0.75, gloss: 0.6, scale: 3.2, terminator: 0.5 } ),
        gi: paintedMaterial( { color: palette.gi, shade: '#e0565a', highlight: '#ffc27e', scale: 3 } ),
        blue: paintedMaterial( { color: palette.blue, shade: '#3b3aa0', highlight: '#8fb0ff', scale: 3 } ),
        boot: paintedMaterial( { color: palette.boot, shade: '#2c2d72', highlight: '#7a8ed8', scale: 3 } ),
        tail: paintedMaterial( { color: palette.tail, shade: '#5a3226', highlight: '#d0935f', scale: 4 } ),
        staff: paintedMaterial( { color: palette.staff, shade: '#7d1b2a', highlight: '#ff7a5c', gloss: 0.9, scale: 2 } ),
        gold: paintedMaterial( { color: palette.gold, shade: '#a8622a', highlight: '#fff0a8', gloss: 1, scale: 2 } ),
        eye: paintedMaterial( { color: palette.eye, shade: '#1a1530', highlight: '#4d5280', rim: 0, gloss: 0, brush: 0.3, haze: 0 } ),
        white: paintedMaterial( { color: '#ffffff', unlit: true } ),
        mouth: paintedMaterial( { color: palette.mouth, shade: '#4a1220', rim: 0, gloss: 0, brush: 0.3, haze: 0.3 } ),
        tongue: paintedMaterial( { color: palette.tongue, shade: '#d4566a', rim: 0, gloss: 0, brush: 0.3, haze: 0.3 } ),
        blush: paintedMaterial( { color: palette.blush, shade: '#f07e7a', rim: 0, gloss: 0, brush: 0.4 } ),
        patch: paintedMaterial( { color: palette.patch, shade: '#e3c7bf', rim: 0.3, gloss: 0.1, brush: 0.5 } ),
    }
}

const SKULL_RADIUS = 0.58
const SKULL_SCALE = new Vector3( 1.02, 0.95, 0.97 )
const HAIR_RADIUS = 0.615
const UP = new Vector3( 0, 1, 0 )
const Z = new Vector3( 0, 0, 1 )
const deg = Math.PI / 180

function mesh( geometry, material, parent, position = null, scale = null )
{
    const m = new Mesh( geometry, material )
    if( position ) m.position.copy( position )
    if( scale ) m.scale.copy( scale )
    parent.add( m )
    return m
}

const v3 = ( x, y, z ) => new Vector3( x, y, z )

function sphereDir( yaw, pitch )
{
    return new Vector3(
        Math.sin( yaw ) * Math.cos( pitch ),
        Math.sin( pitch ),
        Math.cos( yaw ) * Math.cos( pitch )
    )
}

/** Head surface distance along a unit direction: a squashed ball with soft, full cheeks. */
function skullRadius( d )
{
    const ellipsoid = SKULL_RADIUS / Math.hypot( d.x / SKULL_SCALE.x, d.y / SKULL_SCALE.y, d.z / SKULL_SCALE.z )
    const band = Math.exp( - ( ( ( d.y + 0.3 ) / 0.3 ) ** 2 ) )
    const front = Math.min( 1, Math.max( 0, ( d.z + 0.2 ) / 0.8 ) )
    // a short, soft chin keeps the face low and wide
    const chin = d.y < 0 ? 0.06 * ( - d.y ) ** 2 : 0
    return ellipsoid * ( 1 + 0.05 * band * front - chin )
}

function skullGeometry()
{
    const g = mergeVertices( new SphereGeometry( 1, 72, 54 ).deleteAttribute( 'normal' ).deleteAttribute( 'uv' ) )
    const pos = g.attributes.position
    const d = new Vector3()
    for( let i = 0; i < pos.count; i++ )
    {
        d.fromBufferAttribute( pos, i ).normalize()
        pos.setXYZ( i, d.x * skullRadius( d ), d.y * skullRadius( d ), d.z * skullRadius( d ) )
    }
    g.computeVertexNormals()
    return g
}

/**
 * A flattened, tapered blade curved toward local +x: base at the origin, tip
 * along +y, thin along z so the locks read as cut shapes rather than cones.
 */
function spikeGeometry( length, radius, bend, flat = 0.6, fullness = 1 )
{
    const g = new ConeGeometry( radius, length, 12, 10 )
    g.translate( 0, length * 0.5, 0 )
    const pos = g.attributes.position
    for( let i = 0; i < pos.count; i++ )
    {
        const t = pos.getY( i ) / length
        // fullness < 1 bows the taper outward: wide locks that pinch only near the tip
        const widen = t < 1 ? ( 1 - t ) ** ( fullness - 1 ) : 1
        pos.setX( i, pos.getX( i ) * widen + bend * t * t * length )
        pos.setZ( i, pos.getZ( i ) * widen * flat )
    }
    g.computeVertexNormals()
    return g
}

function orient( object, direction, bendToward )
{
    const y = direction.clone().normalize()
    const x = bendToward.clone().sub( y.clone().multiplyScalar( bendToward.dot( y ) ) )
    if( x.lengthSq() < 1e-6 ) x.set( 1, 0, 0 )
    x.normalize()
    const z = new Vector3().crossVectors( x, y ).normalize()
    object.quaternion.setFromRotationMatrix( new Matrix4().makeBasis( x, y, z ) )
}

function buildHair( head, mat )
{
    const hair = new Group()
    head.add( hair )

    // Tilted back so the hairline sits high on the forehead and the cap wraps
    // low over the nape.
    const cap = mesh( new SphereGeometry( HAIR_RADIUS, 48, 32, 0, Math.PI * 2, 0, 1.78 ), mat, hair )
    cap.rotation.x = - 0.85

    const spikes = []
    const add = ( base, direction, length, radius, bend, curl, { inset = 0.4, flat = 0.6, fullness = 0.8 } = {} ) =>
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

    // Big locks fanning out of the crown. Fewer, larger and more varied than a
    // ring of equal spikes, so the silhouette reads as a palm-frond burst.
    add( at( - 8, 78 ), v3( - 0.32, 1, - 0.12 ), 0.9, 0.27, 0.3, LEFT )
    add( at( 28, 64 ), v3( 0.6, 1, - 0.18 ), 0.84, 0.26, 0.28, RIGHT )
    add( at( - 42, 55 ), v3( - 1, 0.78, - 0.15 ), 0.86, 0.26, 0.3, UP )
    add( at( 58, 44 ), v3( 1, 0.5, - 0.15 ), 0.86, 0.26, 0.34, UP )
    add( at( - 86, 24 ), v3( - 1, 0.16, - 0.22 ), 0.88, 0.26, 0.38, UP )
    add( at( 92, 18 ), v3( 1, 0.02, - 0.24 ), 0.84, 0.25, 0.38, UP )
    add( at( - 112, - 4 ), v3( - 0.9, - 0.38, - 0.35 ), 0.72, 0.22, 0.34, UP )
    add( at( 112, - 8 ), v3( 0.9, - 0.46, - 0.35 ), 0.7, 0.22, 0.32, UP )

    // the back: layered blades that flare out and sweep down over the nape
    const back = { flat: 0.42 }
    add( at( 180, 52 ), v3( 0, 0.95, - 0.85 ), 0.84, 0.28, 0.26, UP, back )
    add( at( - 142, 30 ), v3( - 0.75, 0.3, - 1 ), 0.86, 0.28, 0.3, UP, back )
    add( at( 142, 30 ), v3( 0.75, 0.26, - 1 ), 0.86, 0.28, 0.3, UP, back )
    add( at( 180, 18 ), v3( 0, 0.05, - 1 ), 0.78, 0.28, 0.32, UP, back )
    add( at( - 150, - 14 ), v3( - 0.6, - 0.6, - 1 ), 0.7, 0.25, 0.34, UP, back )
    add( at( 150, - 14 ), v3( 0.6, - 0.64, - 1 ), 0.7, 0.25, 0.34, UP, back )
    add( at( 180, - 28 ), v3( 0, - 0.8, - 0.9 ), 0.6, 0.24, 0.3, UP, back )

    // Bangs lie on the forehead (tangent to the cap, nudged inward so the tips
    // hug the skin) and flick sideways into a zigzag fringe.
    const bangs = [
        [ - 48, 54, 0.36, 0.15, - 1 ], [ - 25, 60, 0.52, 0.17, - 1 ], [ - 3, 60, 0.42, 0.15, 1 ],
        [ 20, 60, 0.53, 0.17, 1 ], [ 44, 55, 0.38, 0.15, 1 ],
    ]
    for( const [ yaw, pitch, length, radius, side ] of bangs )
    {
        const n = at( yaw, pitch )
        const down = UP.clone().sub( n.clone().multiplyScalar( n.y ) ).normalize().negate()
        // tilted inward by about half the arc it spans, so the tip lands back on the head
        const dir = down.clone().sub( n.clone().multiplyScalar( 0.45 ) ).add( v3( side * 0.07, 0, 0 ) )
        add( n, dir, length, radius, 0.22, v3( side, 0, 0 ), { inset: 0.6, flat: 0.4, fullness: 0.55 } )
    }

    // sideburns in front of the ears
    for( const side of [ - 1, 1 ] )
        add( at( side * 72, 12 ), v3( side * 0.25, - 1, 0.18 ), 0.36, 0.1, 0.25, v3( side, 0, 0 ), { inset: 0.52, flat: 0.5 } )

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
        ball.scale.set( 0.09, 0.135, 0.05 )
        eye.add( ball )

        // Heavy upper lid that sweeps past the outer corner: the anime read.
        const a0 = side > 0 ? - 0.14 : 0.16 * Math.PI
        const a1 = side > 0 ? 0.84 * Math.PI : Math.PI + 0.14
        const lidCurve = new EllipseCurve( 0, 0.004, 0.1, 0.142, a0, a1, false )
        const lidPoints = lidCurve.getPoints( 20 ).map( ( p ) => v3( p.x, p.y, 0.014 ) )
        eye.add( new Mesh( new TubeGeometry( new CatmullRomCurve3( lidPoints ), 32, 0.017, 8 ), m.eye ) )

        const glint = new Mesh( sphere, m.white )
        glint.scale.set( 0.03, 0.037, 0.02 )
        glint.position.set( side * 0.024, 0.048, 0.04 )
        eye.add( glint )
        const glint2 = new Mesh( sphere, m.white )
        glint2.scale.setScalar( 0.013 )
        glint2.position.set( - side * 0.032, - 0.055, 0.042 )
        eye.add( glint2 )
        place( eye, side * 0.34, - 0.07, 0.018 )
        eyes.push( eye )

        const blush = new Mesh( sphere, m.blush )
        blush.scale.set( 0.075, 0.035, 0.02 )
        place( blush, side * 0.56, - 0.23, 0.01 )

        const ear = new Mesh( sphere, m.skin )
        ear.scale.set( 0.07, 0.12, 0.09 )
        ear.position.set( side * 0.56, - 0.06, - 0.03 )
        head.add( ear )
    }

    // open, toothless grin: a D with corners that turn up, and a tongue
    const w = 0.07
    const h = 0.068
    const grin = new Shape()
    grin.moveTo( - w, 0.012 )
    grin.quadraticCurveTo( 0, - 0.008, w, 0.012 )
    grin.bezierCurveTo( w * 0.75, - h * 0.85, - w * 0.75, - h * 0.85, - w, 0.012 )
    place( new Mesh( new ShapeGeometry( grin, 16 ), m.mouth ), 0, - 0.25, - 0.004 )

    const tongue = new Shape()
    tongue.moveTo( - w * 0.5, - h * 0.42 )
    tongue.bezierCurveTo( - w * 0.2, - h * 0.18, w * 0.2, - h * 0.18, w * 0.5, - h * 0.42 )
    tongue.bezierCurveTo( w * 0.3, - h * 0.66, - w * 0.3, - h * 0.66, - w * 0.5, - h * 0.42 )
    place( new Mesh( new ShapeGeometry( tongue, 12 ), m.tongue ), 0, - 0.25, - 0.006 )

    const nose = new Mesh( sphere, m.skin )
    nose.scale.set( 0.03, 0.024, 0.026 )
    place( nose, 0, - 0.11, 0.012 )

    return { eyes }
}

// torso lathe profile, shared by the mesh and the details pinned to its surface
const TORSO = [
    [ 0.0, 0.48 ], [ 0.3, 0.48 ], [ 0.33, 0.62 ], [ 0.34, 0.8 ], [ 0.3, 0.94 ], [ 0.2, 1.02 ], [ 0.12, 1.05 ], [ 0.0, 1.05 ]
]
const TORSO_DEPTH = 0.82

function torsoRadius( y )
{
    for( let i = 1; i < TORSO.length; i++ )
    {
        const [ r0, y0 ] = TORSO[ i - 1 ]
        const [ r1, y1 ] = TORSO[ i ]
        if( y <= y1 && y1 > y0 ) return r0 + ( r1 - r0 ) * ( y - y0 ) / ( y1 - y0 )
    }
    return 0
}

/** A point on the gi's front (face = 1) or back (face = -1), lifted off it by `lift`. */
function onTorso( x, y, face = 1, lift = 0.004 )
{
    const r = torsoRadius( y )
    return v3( x, y, face * ( TORSO_DEPTH * Math.sqrt( Math.max( 0, r * r - x * x ) ) + lift ) )
}

function stroke( points, radius, material, parent )
{
    return mesh( new TubeGeometry( new CatmullRomCurve3( points ), points.length * 6, radius, 8 ), material, parent )
}

/** A round school patch that hugs the torso, with a few ink strokes on it. */
function buildPatch( parent, m, cx, cy, radius, face, glyph )
{
    const g = new CircleGeometry( radius, 40, 0, Math.PI * 2 )
    const pos = g.attributes.position
    for( let i = 0; i < pos.count; i++ )
    {
        const p = onTorso( cx + face * pos.getX( i ), cy + pos.getY( i ), face, 0.006 )
        pos.setXYZ( i, p.x, p.y, p.z )
    }
    g.computeVertexNormals()
    mesh( g, m.patch, parent )

    for( const line of glyph )
        stroke( line.map( ( [ x, y ] ) => onTorso( cx + face * x * radius, cy + y * radius, face, 0.011 ) ), radius * 0.075, m.eye, parent )
}

// a loose, made-up ink mark: reads as "a character on a dojo patch"
const GLYPH = [
    [ [ - 0.32, 0.6 ], [ - 0.05, 0.5 ], [ 0.22, 0.62 ] ],
    [ [ - 0.42, 0.22 ], [ 0.0, 0.26 ], [ 0.44, 0.2 ] ],
    [ [ - 0.3, - 0.1 ], [ - 0.28, - 0.45 ] ],
    [ [ - 0.3, - 0.1 ], [ 0.3, - 0.08 ], [ 0.28, - 0.45 ] ],
    [ [ 0.0, 0.5 ], [ 0.02, - 0.15 ], [ - 0.02, - 0.62 ], [ 0.3, - 0.66 ] ],
]

function buildArm( side, parent, m )
{
    const shoulder = new Group()
    shoulder.position.set( side * 0.31, 0.92, 0 )
    parent.add( shoulder )

    mesh( new SphereGeometry( 0.135, 24, 16 ), m.gi, shoulder, v3( 0, - 0.03, 0 ), v3( 1, 1.1, 1 ) )
    mesh( new CapsuleGeometry( 0.072, 0.16, 6, 12 ), m.skin, shoulder, v3( 0, - 0.17, 0 ) )

    const elbow = new Group()
    elbow.position.set( 0, - 0.27, 0 )
    shoulder.add( elbow )
    mesh( new CapsuleGeometry( 0.068, 0.12, 6, 12 ), m.skin, elbow, v3( 0, - 0.08, 0 ) )
    mesh( new CylinderGeometry( 0.085, 0.085, 0.09, 20 ), m.blue, elbow, v3( 0, - 0.17, 0 ) )
    mesh( new SphereGeometry( 0.088, 20, 16 ), m.skin, elbow, v3( 0, - 0.27, 0.005 ), v3( 1, 1.05, 0.95 ) )

    return { shoulder, elbow }
}

function buildTail( parent, mat )
{
    const root = new Group()
    root.position.set( 0, 0.46, - 0.24 )
    parent.add( root )

    const segments = []
    let current = root
    const count = 8
    for( let i = 0; i < count; i++ )
    {
        const t = i / ( count - 1 )
        const radius = 0.058 - t * 0.016
        const length = 0.11
        const joint = new Group()
        if( i > 0 ) joint.position.y = length
        current.add( joint )
        mesh( new CapsuleGeometry( radius, length, 4, 12 ), mat, joint, v3( 0, length * 0.5, 0 ) )
        segments.push( joint )
        current = joint
    }
    mesh( new SphereGeometry( 0.05, 16, 12 ), mat, current, v3( 0, 0.12, 0 ) )

    return { root, segments }
}

export function createCharacter()
{
    const m = makeMaterials()

    const root = new Group()
    root.name = 'kid'
    const body = new Group()
    root.add( body )

    // legs + boots
    for( const side of [ - 1, 1 ] )
    {
        mesh( new CylinderGeometry( 0.14, 0.165, 0.36, 24 ), m.gi, body, v3( side * 0.13, 0.32, 0 ) )
        mesh( new CylinderGeometry( 0.14, 0.135, 0.15, 24 ), m.boot, body, v3( side * 0.135, 0.13, 0 ) )
        mesh( new SphereGeometry( 1, 24, 16 ), m.boot, body, v3( side * 0.14, 0.06, 0.05 ), v3( 0.145, 0.085, 0.21 ) )
    }
    mesh( new SphereGeometry( 0.3, 32, 20 ), m.gi, body, v3( 0, 0.5, 0 ), v3( 1, 0.55, 0.84 ) )

    // torso: a lathed gi top
    const torso = mesh( new LatheGeometry( TORSO.map( ( [ r, y ] ) => new Vector2( r, y ) ), 40 ), m.gi, body )
    torso.scale.set( 1, 1, TORSO_DEPTH )

    const vee = mesh( new ConeGeometry( 0.11, 0.24, 3 ), m.blue, body, v3( 0, 0.92, 0.235 ) )
    vee.rotation.x = Math.PI - 0.32
    vee.scale.set( 1, 1, 0.35 )

    // wrap-front collar: the left panel crosses over the right down to the belt
    const lapel = ( points ) => stroke( points.map( ( [ x, y ] ) => onTorso( x, y, 1, 0.012 ) ), 0.03, m.gi, body )
    lapel( [ [ 0.12, 1.0 ], [ 0.07, 0.9 ], [ 0.0, 0.8 ], [ - 0.08, 0.7 ], [ - 0.15, 0.6 ] ] )
    lapel( [ [ - 0.12, 1.0 ], [ - 0.07, 0.9 ], [ - 0.01, 0.81 ] ] )

    buildPatch( body, m, 0.15, 0.79, 0.055, 1, GLYPH )
    buildPatch( body, m, 0, 0.77, 0.125, - 1, GLYPH )

    const belt = mesh( new TorusGeometry( 0.322, 0.052, 12, 48 ), m.blue, body, v3( 0, 0.55, 0 ) )
    belt.rotation.x = Math.PI / 2
    belt.scale.set( 1, 0.83, 1 )
    mesh( new SphereGeometry( 0.05, 16, 12 ), m.blue, body, v3( 0.14, 0.55, 0.265 ), v3( 1, 0.9, 0.7 ) )
    for( const [ x, rz ] of [ [ 0.11, 0.25 ], [ 0.17, - 0.15 ] ] )
    {
        const tail = mesh( new CapsuleGeometry( 0.036, 0.13, 4, 8 ), m.blue, body, v3( x, 0.44, 0.27 ) )
        tail.rotation.set( 0.2, 0, rz )
    }

    mesh( new CylinderGeometry( 0.1, 0.11, 0.14, 20 ), m.skin, body, v3( 0, 1.08, 0 ) )

    // staff slung across the back
    const staff = new Group()
    // Steep enough that the top clears the hair instead of sitting by the ear.
    staff.position.set( 0, 0.82, - 0.33 )
    staff.rotation.z = 0.5
    body.add( staff )
    mesh( new CylinderGeometry( 0.034, 0.034, 2.4, 16 ), m.staff, staff )
    mesh( new CylinderGeometry( 0.046, 0.046, 0.1, 16 ), m.gold, staff, v3( 0, 1.2, 0 ) )
    mesh( new CylinderGeometry( 0.046, 0.046, 0.1, 16 ), m.gold, staff, v3( 0, - 1.2, 0 ) )

    const arms = { left: buildArm( - 1, body, m ), right: buildArm( 1, body, m ) }
    const tail = buildTail( body, m.tail )

    // head on a neck pivot so it can turn
    const neck = new Group()
    neck.position.set( 0, 1.1, 0 )
    body.add( neck )
    const head = new Group()
    head.position.set( 0, 0.48, 0.02 )
    neck.add( head )
    mesh( skullGeometry(), m.skin, head )

    const { hair, spikes } = buildHair( head, m.hair )
    const { eyes } = buildFace( head, m )

    const pickables = []
    root.traverse( ( o ) => { if( o.isMesh ) pickables.push( o ) } )

    return { root, body, neck, head, hair, spikes, eyes, arms, tail, pickables, materials: m }
}
