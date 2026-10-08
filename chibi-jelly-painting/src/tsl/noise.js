import { Fn, vec2, vec3, fract, floor, dot, mix } from 'three/tsl'

export const hash12 = /*@__PURE__*/ Fn( ( [ p ] ) => {

    const q = fract( p.mul( vec2( 123.34, 456.21 ) ) ).toVar()
    q.addAssign( dot( q, q.add( 45.32 ) ) )
    return fract( q.x.mul( q.y ) )

} ).setLayout( { name: 'hash12', type: 'float', inputs: [ { name: 'p', type: 'vec2' } ] } )

export const hash22 = /*@__PURE__*/ Fn( ( [ p ] ) => {

    const p3 = fract( vec3( p.x, p.y, p.x ).mul( vec3( 0.1031, 0.103, 0.0973 ) ) ).toVar()
    p3.addAssign( dot( p3, p3.yzx.add( 33.33 ) ) )
    return fract( p3.xx.add( p3.yz ).mul( p3.zy ) )

} ).setLayout( { name: 'hash22', type: 'vec2', inputs: [ { name: 'p', type: 'vec2' } ] } )

export const valueNoise = /*@__PURE__*/ Fn( ( [ p ] ) => {

    const cell = floor( p )
    const f = fract( p )
    const s = f.mul( f ).mul( f.mul( - 2 ).add( 3 ) )

    const a = hash12( cell )
    const b = hash12( cell.add( vec2( 1, 0 ) ) )
    const c = hash12( cell.add( vec2( 0, 1 ) ) )
    const d = hash12( cell.add( vec2( 1, 1 ) ) )

    return mix( mix( a, b, s.x ), mix( c, d, s.x ), s.y )

} ).setLayout( { name: 'valueNoise', type: 'float', inputs: [ { name: 'p', type: 'vec2' } ] } )

export const fbm = /*@__PURE__*/ Fn( ( [ p ] ) => {

    const v = valueNoise( p ).mul( 0.5 ).toVar()
    v.addAssign( valueNoise( p.mul( 2.03 ).add( 17.1 ) ).mul( 0.25 ) )
    v.addAssign( valueNoise( p.mul( 4.11 ).add( 41.7 ) ).mul( 0.125 ) )
    return v.div( 0.875 )

} ).setLayout( { name: 'fbm', type: 'float', inputs: [ { name: 'p', type: 'vec2' } ] } )

// Interleaved gradient noise: a stable per-pixel dither that never animates.
export const ign = /*@__PURE__*/ Fn( ( [ p ] ) => {

    return fract( fract( dot( p, vec2( 0.06711056, 0.00583715 ) ) ).mul( 52.9829189 ) )

} ).setLayout( { name: 'ign', type: 'float', inputs: [ { name: 'p', type: 'vec2' } ] } )
