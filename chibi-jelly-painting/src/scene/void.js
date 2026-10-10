import {
    Group, Mesh, MeshBasicNodeMaterial, Shape, ShapeGeometry, BufferGeometry, Float32BufferAttribute, DoubleSide, Color
} from 'three/webgpu'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { uniform } from 'three/tsl'

// Gojo's backdrop: ink thrown across a night with no ground in it. The sky
// shader paints the colour field (indigo in the middle, magenta pooling low on
// the left, blue high on the right); this adds what sits on top of it, white
// ink waves, flung drops and thin speed lines, all flat shapes that the paint
// filter turns into brushwork. The shapes face the camera so that orbiting
// never shows them edge-on.

export const voidLook = {
    rays: uniform( new Color( '#ff4f9a' ) ),
    splash: uniform( new Color( '#ffffff' ) ),
    // 0 in the Unlimited Void, 1 once Blue and Red have merged into Hollow Purple
    purple: uniform( 0 ),
}

const seeded = ( seed ) => () => ( seed = ( seed * 16807 ) % 2147483647 ) / 2147483647

function material()
{
    const m = new MeshBasicNodeMaterial( { side: DoubleSide } )
    m.colorNode = voidLook.splash
    return m
}

/** A flung drop: a rough disc with a few spiky edges. */
function blob( radius, rand )
{
    const shape = new Shape()
    const count = 18
    for( let i = 0; i < count; i++ )
    {
        const a = ( i / count ) * Math.PI * 2
        const r = radius * ( 0.72 + rand() * 0.28 ) * ( rand() < 0.2 ? 1.6 + rand() * 0.8 : 1 )
        if( i === 0 ) shape.moveTo( Math.cos( a ) * r, Math.sin( a ) * r )
        else shape.lineTo( Math.cos( a ) * r, Math.sin( a ) * r )
    }
    return new ShapeGeometry( shape, 1 )
}

/**
 * A brushed wave of ink along a curve from a to b: fat in the middle, a clean
 * lower edge and a torn, toothed upper edge.
 */
function swoosh( [ ax, ay ], [ cx, cy ], [ bx, by ], width, rand )
{
    const count = 64
    const phase = [ rand() * 6, rand() * 6 ]
    const upper = []
    const lower = []
    let lastSpike = - 9
    for( let i = 0; i <= count; i++ )
    {
        const t = i / count
        const u = 1 - t
        const x = u * u * ax + 2 * u * t * cx + t * t * bx
        const y = u * u * ay + 2 * u * t * cy + t * t * by
        let tx = 2 * u * ( cx - ax ) + 2 * t * ( bx - cx )
        let ty = 2 * u * ( cy - ay ) + 2 * t * ( by - cy )
        const len = Math.hypot( tx, ty )
        tx /= len
        ty /= len
        const nx = - ty
        const ny = tx
        const w = width * Math.sin( Math.PI * t ) ** 0.75
        const rough = 0.85 + Math.sin( i * 0.9 + phase[ 0 ] ) * 0.22 + Math.sin( i * 2.3 + phase[ 1 ] ) * 0.14
        upper.push( [ x + nx * w * rough, y + ny * w * rough ] )
        // now and then the ink is flicked off the edge in a tall, leaning tooth
        if( i > 3 && i < count - 3 && i - lastSpike > 2 && rand() < 0.2 )
        {
            lastSpike = i
            const reach = 1.5 + rand() * 1.5
            const lean = 0.5 + rand() * 0.9
            upper.push( [ x + nx * w * reach + tx * w * lean, y + ny * w * reach + ty * w * lean ] )
            upper.push( [ x + nx * w * rough + tx * w * 0.12, y + ny * w * rough + ty * w * 0.12 ] )
        }
        lower.push( [ x - nx * w * 0.45, y - ny * w * 0.45 ] )
    }
    const shape = new Shape()
    const outline = [ ...upper, ...lower.reverse() ]
    outline.forEach( ( [ x, y ], i ) => i === 0 ? shape.moveTo( x, y ) : shape.lineTo( x, y ) )
    return new ShapeGeometry( shape, 1 )
}

/** Thin kites fanning out of a point, like speed lines. */
function rays( count, rand, [ ox, oy ] )
{
    const positions = []
    for( let i = 0; i < count; i++ )
    {
        const a = rand() * Math.PI * 2
        const r0 = 1.4 + rand() * 1.4
        const r1 = r0 + 1.8 + rand() * 3.2
        const w = 0.008 + rand() * 0.022
        const dx = Math.cos( a )
        const dy = Math.sin( a )
        const rm = r0 + ( r1 - r0 ) * 0.35
        const p = ( r, side ) => [ ox + dx * r - dy * w * side, oy + dy * r + dx * w * side, 0 ]
        positions.push( ...p( r0, 0 ), ...p( rm, 1 ), ...p( r1, 0 ), ...p( r0, 0 ), ...p( r1, 0 ), ...p( rm, - 1 ) )
    }
    const g = new BufferGeometry()
    g.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) )
    return g
}

export function createVoid()
{
    const rand = seeded( 11 )
    const group = new Group()
    group.name = 'void'
    group.position.set( 0, 1.2, 0 )
    group.scale.setScalar( 0.74 )

    const ink = material()
    const drift = []

    const waves = [
        { a: [ - 5.2, - 2.5 ], c: [ - 3.7, - 0.7 ], b: [ - 2.0, - 1.9 ], width: 0.85, z: - 3.2 },
        { a: [ - 4.8, 2.4 ], c: [ - 3.2, 3.8 ], b: [ - 1.4, 3.2 ], width: 0.7, z: - 3.4 },
        { a: [ 4.8, - 1.0 ], c: [ 3.6, - 3.1 ], b: [ 1.2, - 2.7 ], width: 0.95, z: - 3.3 },
        { a: [ 1.4, 3.7 ], c: [ 3.9, 3.9 ], b: [ 4.8, 1.7 ], width: 0.8, z: - 3.5 },
    ]

    for( const { a, c, b, width, z } of waves )
    {
        const wave = new Mesh( swoosh( a, c, b, width, rand ), ink )
        wave.position.z = z
        group.add( wave )
        drift.push( { object: wave, x: 0, y: 0, phase: rand() * 6, size: 0.05 } )

        // drops flung off the torn edge
        const parts = []
        for( let i = 0; i < 9; i++ )
        {
            const t = 0.15 + rand() * 0.7
            const u = 1 - t
            const x = u * u * a[ 0 ] + 2 * u * t * c[ 0 ] + t * t * b[ 0 ]
            const y = u * u * a[ 1 ] + 2 * u * t * c[ 1 ] + t * t * b[ 1 ]
            const away = ( 0.35 + rand() * 0.9 )
            const g = blob( 0.03 + rand() * 0.075, rand )
            g.translate( x + ( c[ 0 ] - x ) * - away * 0.28 + ( rand() - 0.5 ) * 0.5, y + ( y > 0 ? 1 : - 1 ) * away * 0.3 * ( rand() + 0.4 ), 0 )
            parts.push( g )
        }
        const drops = new Mesh( mergeGeometries( parts ), ink )
        drops.position.z = z + 0.02
        group.add( drops )
    }

    // loose drops scattered over the field, clear of the middle
    const scatter = []
    while( scatter.length < 16 )
    {
        const x = ( rand() * 2 - 1 ) * 4.4
        const y = ( rand() * 2 - 1 ) * 3.6
        if( ( x / 2.1 ) ** 2 + ( y / 2.8 ) ** 2 < 1 ) continue
        scatter.push( blob( 0.04 + rand() * 0.12, rand ).translate( x, y, 0 ) )
    }
    const drops = new Mesh( mergeGeometries( scatter ), ink )
    drops.position.z = - 3.6
    group.add( drops )

    const rayMaterial = new MeshBasicNodeMaterial( { side: DoubleSide } )
    rayMaterial.colorNode = voidLook.rays
    const fan = new Mesh( rays( 32, rand, [ 0, 0.5 ] ), rayMaterial )
    fan.position.z = - 3.8
    group.add( fan )

    function update( t, camera )
    {
        group.quaternion.copy( camera.quaternion )
        fan.rotation.z = Math.sin( t * 0.12 ) * 0.05
        for( const d of drift )
        {
            d.object.position.x = Math.sin( t * 0.35 + d.phase ) * d.size
            d.object.position.y = Math.cos( t * 0.28 + d.phase ) * d.size * 0.7
        }
    }

    return { group, update }
}
