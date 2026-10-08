import { Group, Mesh, SphereGeometry, Color, Sprite, SpriteNodeMaterial } from 'three/webgpu'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import {
    Fn, uniform, uv, positionLocal, normalLocal, screenUV, mix, smoothstep, vec2, abs, pow, length, max, clamp,
    mx_noise_float
} from 'three/tsl'

import { paintedMaterial, light } from '../materials/painted.js'
import { fbm } from '../tsl/noise.js'

function puffGeometry( puffs, squashY = 0.72 )
{
    const parts = puffs.map( ( [ x, y, z, r ] ) =>
    {
        const g = new SphereGeometry( r, 28, 20 )
        g.scale( 1, squashY, 1 )
        g.translate( x, y * squashY, z )
        return g
    } )
    return mergeGeometries( parts )
}

const wobbly = ( amount, speed, frequency ) => positionLocal.add(
    normalLocal.mul( mx_noise_float( positionLocal.mul( frequency ).add( light.time.mul( speed ) ) ).mul( amount ) )
)

export const sky = {
    top: uniform( new Color( '#6fa6f2' ) ),
    horizon: uniform( new Color( '#ffd9cf' ) ),
    left: uniform( new Color( '#a796ea' ) ),
    right: uniform( new Color( '#8fd6e0' ) ),
    blotch: uniform( new Color( '#ffffff' ) ),
}

/**
 * A painted backdrop rather than a physical sky: a vertical wash with a cool
 * violet pooling low on the left, a teal glaze high on the right and broad
 * uneven patches, so the grain always has neighbouring hues to mix.
 */
export function skyNode()
{
    return Fn( () =>
    {
        const t = screenUV.y.oneMinus()
        const x = screenUV.x
        const color = mix( sky.horizon, sky.top, smoothstep( 0.02, 0.85, t ) ).toVar()

        const wander = fbm( screenUV.mul( vec2( 1.6, 1.2 ) ).add( 4.2 ) )
        const leftPool = smoothstep( 0.0, 0.75, x.add( wander.sub( 0.5 ).mul( 0.5 ) ) ).oneMinus().mul( smoothstep( 0.25, 1.0, t ).oneMinus() )
        color.assign( mix( color, sky.left, leftPool.mul( 0.7 ) ) )

        const rightGlaze = smoothstep( 0.35, 1.0, x.add( wander.sub( 0.5 ).mul( 0.6 ) ) ).mul( smoothstep( 0.2, 0.9, t ) )
        color.assign( mix( color, sky.right, rightGlaze.mul( 0.6 ) ) )

        const patches = smoothstep( 0.45, 0.8, fbm( screenUV.mul( vec2( 2.6, 2 ) ).add( 11.7 ) ) )
        color.assign( mix( color, sky.left, patches.mul( 0.18 ) ) )
        const blotch = smoothstep( 0.6, 0.85, fbm( screenUV.mul( vec2( 3, 2 ) ).add( 4.2 ) ) ).mul( 0.14 )
        return mix( color, sky.blotch, blotch )
    } )()
}

export function createNimbus()
{
    const material = paintedMaterial( {
        color: '#ffd545',
        shade: '#ef8a2f',
        highlight: '#fff6c4',
        rim: 0.7,
        gloss: 0.8,
        scale: 1.6,
        terminator: 0.4,
        positionNode: wobbly( 0.05, 0.7, 2.2 ),
    } )

    const body = puffGeometry( [
        [ 0, - 0.12, 0, 0.56 ], [ 0.55, - 0.18, 0.1, 0.42 ], [ - 0.56, - 0.14, 0.05, 0.45 ],
        [ 0.22, - 0.06, 0.45, 0.38 ], [ - 0.26, - 0.1, 0.4, 0.36 ], [ 0.12, - 0.1, - 0.46, 0.4 ],
        [ - 0.42, - 0.06, - 0.36, 0.35 ], [ 0.92, - 0.3, - 0.08, 0.3 ], [ - 0.96, - 0.22, - 0.08, 0.33 ],
        [ 0.45, - 0.35, - 0.42, 0.3 ], [ - 0.1, - 0.42, 0.2, 0.34 ],
    ] )

    // the wispy trail it leaves behind
    const trail = puffGeometry( [
        [ - 1.3, - 0.34, - 0.48, 0.27 ], [ - 1.6, - 0.44, - 0.78, 0.21 ],
        [ - 1.84, - 0.52, - 1.06, 0.16 ], [ - 2.02, - 0.58, - 1.3, 0.11 ],
    ] )

    const group = new Group()
    group.name = 'nimbus'
    const main = new Mesh( body, material )
    const tail = new Mesh( trail, material )
    group.add( main, tail )

    return { group, main, tail, material }
}

export function createFarClouds()
{
    const material = paintedMaterial( {
        color: '#ffffff',
        shade: '#b7b0e8',
        highlight: '#ffffff',
        rim: 0.2,
        gloss: 0.15,
        scale: 0.9,
        terminator: 0.38,
        positionNode: wobbly( 0.08, 0.25, 0.9 ),
    } )

    const layouts = [
        { at: [ - 5.2, 3.4, - 9 ], s: 1.1 },
        { at: [ 5.4, 2.2, - 8 ], s: 1.0 },
        { at: [ 3.6, - 2.9, - 6 ], s: 0.9 },
        { at: [ - 4.4, - 2.6, - 7 ], s: 1.2 },
    ]

    const geometry = puffGeometry( [
        [ 0, 0, 0, 1 ], [ 1.1, - 0.2, 0.1, 0.75 ], [ - 1.15, - 0.25, 0, 0.8 ],
        [ 0.45, 0.45, - 0.2, 0.7 ], [ - 0.5, 0.35, 0.1, 0.62 ], [ 1.9, - 0.45, 0, 0.45 ], [ - 2, - 0.45, 0, 0.5 ],
    ], 0.62 )

    const group = new Group()
    const clouds = layouts.map( ( { at, s }, i ) =>
    {
        const cloud = new Mesh( geometry, material )
        cloud.position.set( ...at )
        cloud.scale.setScalar( s )
        cloud.rotation.y = i * 1.7
        group.add( cloud )
        return { mesh: cloud, base: cloud.position.clone(), speed: 0.12 + ( i % 3 ) * 0.05, phase: i * 2.1 }
    } )

    return { group, clouds, material }
}

/**
 * Four-point glints and soft dots scattered behind the subject, like the
 * dabs of white a painter flicks onto a finished sky.
 */
export function createSparkles( count = 22 )
{
    const tint = uniform( new Color( '#fff6e4' ) )
    const strength = uniform( 1 )

    const shape = ( kind ) => Fn( () =>
    {
        const p = uv().mul( 2 ).sub( 1 )
        const a = abs( p.x ), b = abs( p.y )
        if( kind === 'dot' ) return smoothstep( 0.25, 0.55, length( p ) ).oneMinus()
        const armX = smoothstep( 0, pow( b.oneMinus().max( 0 ), 1.8 ).mul( 0.24 ).add( 1e-4 ), a ).oneMinus()
        const armY = smoothstep( 0, pow( a.oneMinus().max( 0 ), 1.8 ).mul( 0.24 ).add( 1e-4 ), b ).oneMinus()
        const core = smoothstep( 0, 0.35, length( p ) ).oneMinus().mul( 0.7 )
        return clamp( max( max( armX, armY ), core ), 0, 1 )
    } )()

    const makeMaterial = ( kind ) =>
    {
        const m = new SpriteNodeMaterial( { transparent: true, depthWrite: false } )
        m.colorNode = tint
        m.opacityNode = shape( kind ).mul( strength )
        return m
    }
    const starMaterial = makeMaterial( 'star' )
    const dotMaterial = makeMaterial( 'dot' )

    const group = new Group()
    group.name = 'sparkles'
    const items = []
    let seed = 7
    const rand = () => ( ( seed = ( seed * 16807 ) % 2147483647 ) / 2147483647 )

    for( let i = 0; i < count; i++ )
    {
        const star = i % 3 !== 2
        const sprite = new Sprite( star ? starMaterial : dotMaterial )
        // keep a clear oval around the kid so glints frame him instead of
        // landing on his face
        let x, y
        do
        {
            x = ( rand() * 2 - 1 ) * 3.4
            y = rand() * 4.6 - 1.4
        } while( ( x / 1.6 ) ** 2 + ( ( y - 1.1 ) / 1.9 ) ** 2 < 1 )
        sprite.position.set( x, y, - 1.2 - rand() * 2.5 )
        const size = star ? 0.26 + rand() * 0.26 : 0.07 + rand() * 0.06
        sprite.scale.setScalar( size )
        group.add( sprite )
        items.push( { sprite, size, speed: 0.6 + rand() * 1.4, phase: rand() * Math.PI * 2 } )
    }

    function update( t )
    {
        for( const it of items )
        {
            const w = Math.sin( t * it.speed + it.phase )
            it.sprite.scale.setScalar( it.size * ( 0.72 + 0.28 * w ) )
        }
    }

    return { group, tint, strength, update }
}
