import {
    Group, Mesh, SphereGeometry, CylinderGeometry, BoxGeometry, CircleGeometry, CapsuleGeometry, TorusGeometry,
    TubeGeometry, CatmullRomCurve3, Vector3, Color, MeshBasicNodeMaterial
} from 'three/webgpu'
import { uniform } from 'three/tsl'

import { paintedMaterial } from '../materials/painted.js'
import { seeded, smooth, trs, Parts } from './parts.js'
import { erenLook } from './eren.js'

// Shiganshina, the district on the southern edge of Wall Maria where Eren grew
// up: a cobbled square ringed by half-timbered houses with red tile roofs, and
// behind them the Wall itself, fifty metres of pale stone with the district's
// outer gate. When Eren turns titan (or when the wall is tapped) the Colossal
// Titan rises behind it, skinless and steaming, and grips the top of the wall
// to look over, as it did the day the gate was kicked in.

const G = {
    sphere: new SphereGeometry( 1, 18, 12 ),
    cobble: new SphereGeometry( 1, 8, 5 ),
    box: new BoxGeometry( 1, 1, 1 ),
    cyl: new CylinderGeometry( 1, 1, 1, 14 ),
    prism: new CylinderGeometry( 1, 1, 1, 3 ),
    capsule: new CapsuleGeometry( 1, 1, 4, 10 ),
    halfDisc: new CircleGeometry( 1, 24, 0, Math.PI ),
}

function makeMaterials()
{
    return {
        plaza: paintedMaterial( { color: '#cdbfa6', shade: '#8a7a7c', highlight: '#f2e8d4', rim: 0.2, gloss: 0.1, brush: 0.9, scale: 0.7 } ),
        cobble: paintedMaterial( { color: '#d8cbb2', shade: '#8a7a78', highlight: '#fff4e2', rim: 0.3, gloss: 0.2, scale: 5 } ),
        cobble2: paintedMaterial( { color: '#c4b49c', shade: '#7a6a6c', highlight: '#f0e2cc', rim: 0.3, gloss: 0.2, scale: 5 } ),
        plaster: paintedMaterial( { color: '#f2e6cc', shade: '#b0a0a6', highlight: '#fffaf0', rim: 0.4, gloss: 0.15, scale: 1.6 } ),
        plaster2: paintedMaterial( { color: '#ead4b0', shade: '#a8928e', highlight: '#fff4e0', rim: 0.4, gloss: 0.15, scale: 1.6 } ),
        timber: paintedMaterial( { color: '#5c3a2c', shade: '#2a1814', highlight: '#9a6a50', rim: 0.3, gloss: 0.2, scale: 3 } ),
        roof: paintedMaterial( { color: '#c8583c', shade: '#7a2a2c', highlight: '#f49470', rim: 0.5, gloss: 0.3, scale: 2 } ),
        roof2: paintedMaterial( { color: '#b86a42', shade: '#6e3028', highlight: '#eea070', rim: 0.5, gloss: 0.3, scale: 2 } ),
        window: paintedMaterial( { color: '#3e3a52', shade: '#1a1828', highlight: '#7a86b0', rim: 0.2, gloss: 0.8, scale: 3 } ),
        door: paintedMaterial( { color: '#6e4630', shade: '#341e16', highlight: '#a87452', rim: 0.2, gloss: 0.2, scale: 3 } ),
        stone: paintedMaterial( { color: '#d6ccbc', shade: '#86808e', highlight: '#fbf6ee', rim: 0.35, gloss: 0.15, brush: 1, scale: 0.6 } ),
        stone2: paintedMaterial( { color: '#c6baa8', shade: '#76707e', highlight: '#efe8dc', rim: 0.35, gloss: 0.15, brush: 1, scale: 0.6 } ),
        stoneDark: paintedMaterial( { color: '#aa9e8e', shade: '#625c68', highlight: '#d8ccbc', rim: 0.2, gloss: 0.1, scale: 1 } ),
        gate: paintedMaterial( { color: '#2a2430', unlit: true } ),
        iron: paintedMaterial( { color: '#4c4a56', shade: '#1c1a22', highlight: '#9a98a8', rim: 0.4, gloss: 0.8, scale: 2 } ),
        wood: paintedMaterial( { color: '#9a6a44', shade: '#4e3022', highlight: '#d8a070', rim: 0.3, gloss: 0.2, scale: 3 } ),
        muscle: paintedMaterial( { color: '#b8343c', shade: '#561018', highlight: '#ff8a76', rim: 0.6, gloss: 0.6, scale: 1.4 } ),
        fiber: paintedMaterial( { color: '#e8827e', shade: '#a03a46', highlight: '#ffc0b0', rim: 0.3, gloss: 0.6, scale: 2 } ),
        teeth: paintedMaterial( { color: '#fff4e4', shade: '#c4ac9c', highlight: '#ffffff', rim: 0.3, gloss: 0.5, scale: 3 } ),
        socket: paintedMaterial( { color: '#24080c', unlit: true } ),
        glare: paintedMaterial( { color: '#fff2b8', unlit: true } ),
        steam: paintedMaterial( { color: '#f4eee8', shade: '#c0b2c0', highlight: '#ffffff', rim: 0.7, gloss: 0.15, scale: 0.8, haze: 0.6 } ),
    }
}

const WALL_R = 14
const WALL_H = 4.4
const COLOSSAL = 1.7
// off to one side of the gate, so it peers over the wall past Eren rather than hiding behind his head
const COLOSSAL_AT = 0.3
const WALL_D = 1.4
const WALL_SPAN = 1.25
const facing = ( x, z ) => Math.atan2( - x, - z )

/** A two-storey half-timbered house, its long side (local +z) toward the square. */
function house( P, M, w, h, d, rand )
{
    const at = ( p, r, s ) => M.clone().multiply( trs( p, r, s ) )
    const wall = rand() < 0.5 ? 'plaster' : 'plaster2'
    const front = d / 2 + 0.012
    P.add( wall, G.box, at( [ 0, h / 2, 0 ], [], [ w, h, d ] ) )

    for( const sx of [ - 1, 1 ] ) P.add( 'timber', G.box, at( [ sx * ( w / 2 - 0.035 ), h / 2, front ], [], [ 0.07, h, 0.03 ] ) )
    for( const y of [ 0.035, h * 0.48, h - 0.035 ] ) P.add( 'timber', G.box, at( [ 0, y, front ], [], [ w, 0.07, 0.03 ] ) )
    const panes = Math.max( 2, Math.round( w / 0.6 ) )
    for( let i = 0; i < panes; i++ )
    {
        const x = - w / 2 + ( i + 0.5 ) * w / panes
        P.add( 'window', G.box, at( [ x, h * 0.75, front - 0.004 ], [], [ 0.2, 0.26, 0.03 ] ) )
        P.add( 'timber', G.box, at( [ x, h * 0.75 - 0.16, front + 0.004 ], [], [ 0.26, 0.04, 0.04 ] ) )
        if( i > 0 ) P.add( 'timber', G.box, at( [ - w / 2 + i * w / panes, h * 0.74, front ], [], [ 0.05, h * 0.5, 0.03 ] ) )
    }
    for( const sx of [ - 1, 1 ] )
        P.add( 'timber', G.box, at( [ sx * ( w / 2 - 0.16 ), h * 0.24, front ], [ 0, 0, sx * 0.55 ], [ 0.05, h * 0.5, 0.03 ] ) )
    P.add( 'door', G.box, at( [ - w * 0.12, 0.34, front ], [], [ 0.3, 0.64, 0.03 ] ) )
    P.add( 'window', G.box, at( [ w * 0.24, 0.44, front - 0.004 ], [], [ 0.26, 0.22, 0.03 ] ) )

    // gable roof: a triangular prism along the ridge, overhanging all round
    const roofH = 0.42 + rand() * 0.25
    P.add( rand() < 0.5 ? 'roof' : 'roof2', G.prism, at( [ 0, h + roofH / 3, 0 ], [ - Math.PI / 2, Math.PI / 2, 0 ], [ ( d + 0.34 ) / 1.732, w + 0.26, roofH / 1.5 ] ) )
    P.add( 'stone2', G.box, at( [ w * ( rand() - 0.5 ) * 0.5, h + roofH * 0.7, - d * 0.12 ], [], [ 0.18, 0.5, 0.18 ] ) )
}

function buildTown( m, rand )
{
    const town = new Group()
    town.name = 'shiganshina-houses'
    const P = new Parts()
    for( const [ radius, count, from, to, tall ] of [ [ 6.2, 7, - 1.05, 1.05, 0 ], [ 8.4, 8, - 1.1, 1.1, 0.5 ] ] )
    {
        for( let i = 0; i < count; i++ )
        {
            const a = from + ( to - from ) * ( i + 0.5 ) / count + ( rand() - 0.5 ) * 0.06
            const x = Math.sin( a ) * radius
            const z = - Math.cos( a ) * radius
            const w = 1.4 + rand() * 0.7
            house( P, trs( [ x, 0, z ], [ 0, facing( x, z ), 0 ] ), w, 1.55 + tall + rand() * 0.5, 1.2 + rand() * 0.3, rand )
        }
    }
    // barrels and crates by the front doors
    for( const [ a, kind ] of [ [ - 0.62, 'barrel' ], [ - 0.5, 'crate' ], [ 0.42, 'barrel' ], [ 0.55, 'barrel' ], [ 0.7, 'crate' ] ] )
    {
        const x = Math.sin( a ) * 5.2
        const z = - Math.cos( a ) * 5.2
        if( kind === 'barrel' ) P.add( 'wood', G.cyl, trs( [ x, 0.22, z ], [], [ 0.17, 0.44, 0.17 ] ) )
        else P.add( 'wood', G.box, trs( [ x, 0.18, z ], [ 0, rand(), 0 ], [ 0.36, 0.36, 0.36 ] ) )
    }
    P.build( m, town )
    return town
}

function buildWall( m )
{
    const wall = new Group()
    wall.name = 'wall-maria'
    const P = new Parts()
    const SEG = 36
    const step = ( WALL_SPAN * 2 ) / SEG
    const width = 2 * WALL_R * Math.sin( step / 2 ) + 0.04
    for( let i = 0; i < SEG; i++ )
    {
        const a = - WALL_SPAN + ( i + 0.5 ) * step
        const x = Math.sin( a ) * WALL_R
        const z = - Math.cos( a ) * WALL_R
        const M = trs( [ x, 0, z ], [ 0, facing( x, z ), 0 ] )
        const at = ( p, s ) => M.clone().multiply( trs( p, [], s ) )
        P.add( i % 2 ? 'stone' : 'stone2', G.box, at( [ 0, WALL_H / 2, 0 ], [ width, WALL_H, WALL_D ] ) )
        // courses of block, a walkway lip and crenellations along the top
        for( let y = 0.9; y < WALL_H; y += 0.9 ) P.add( 'stoneDark', G.box, at( [ 0, y, WALL_D / 2 + 0.02 ], [ width, 0.06, 0.05 ] ) )
        P.add( 'stone2', G.box, at( [ 0, WALL_H + 0.1, WALL_D / 2 - 0.15 ], [ width, 0.2, 0.32 ] ) )
        if( i % 2 === 0 ) P.add( 'stone', G.box, at( [ 0, WALL_H + 0.34, WALL_D / 2 - 0.15 ], [ width * 0.5, 0.3, 0.3 ] ) )
        if( i % 6 === 3 ) P.add( 'stone2', G.box, at( [ 0, WALL_H / 2, WALL_D / 2 + 0.2 ], [ 0.6, WALL_H, 0.42 ] ) )
    }

    // the outer gate, in a gatehouse standing proud of the wall
    const M = trs( [ 0, 0, - ( WALL_R - 1.0 ) ] )
    const at = ( p, r, s ) => M.clone().multiply( trs( p, r, s ) )
    const GH = WALL_H + 0.5
    P.add( 'stone', G.box, at( [ 0, GH / 2, 0 ], [], [ 3.8, GH, 1.0 ] ) )
    for( let y = 0.9; y < GH; y += 0.9 ) P.add( 'stoneDark', G.box, at( [ 0, y, 0.52 ], [], [ 3.8, 0.06, 0.05 ] ) )
    for( let i = 0; i < 5; i++ ) P.add( 'stone2', G.box, at( [ - 1.6 + i * 0.8, GH + 0.18, 0.3 ], [], [ 0.45, 0.36, 0.36 ] ) )
    P.add( 'gate', G.box, at( [ 0, 1.15, 0.51 ], [], [ 1.7, 2.3, 0.04 ] ) )
    P.add( 'gate', G.halfDisc, at( [ 0, 2.3, 0.53 ], [], [ 0.85, 0.85, 1 ] ) )
    P.add( 'stone2', new TorusGeometry( 0.95, 0.12, 8, 24, Math.PI ), at( [ 0, 2.3, 0.55 ] ) )
    for( const sx of [ - 1, 1 ] ) P.add( 'stone2', G.box, at( [ sx * 0.95, 1.15, 0.55 ], [], [ 0.24, 2.3, 0.1 ] ) )
    for( let i = 0; i < 7; i++ ) P.add( 'iron', G.box, at( [ - 0.72 + i * 0.24, 1.55, 0.58 ], [], [ 0.05, 3.0, 0.05 ] ) )
    for( const y of [ 0.6, 1.4, 2.2 ] ) P.add( 'iron', G.box, at( [ 0, y, 0.6 ], [], [ 1.6, 0.05, 0.05 ] ) )

    const meshes = P.build( m, wall )
    return { group: wall, meshes }
}

/** A tube laid over an ellipsoid surface through (yaw, pitch) pairs, for muscle fibres. */
function overHead( scale, center, points, radius )
{
    const pts = points.map( ( [ yaw, pitch ] ) => new Vector3(
        Math.sin( yaw ) * Math.cos( pitch ) * scale[ 0 ],
        Math.sin( pitch ) * scale[ 1 ],
        Math.cos( yaw ) * Math.cos( pitch ) * scale[ 2 ],
    ).multiplyScalar( 1.01 ).add( new Vector3( ...center ) ) )
    return new TubeGeometry( new CatmullRomCurve3( pts ), pts.length * 5, radius, 6 )
}

function buildColossal( m )
{
    const head = new Group()
    head.name = 'colossal-titan'
    const P = new Parts()
    const CRANIUM = [ 1.35, 1.55, 1.2 ]
    P.add( 'muscle', G.sphere, trs( [ 0, 0, 0 ], [], CRANIUM ) )
    P.add( 'muscle', G.sphere, trs( [ 0, - 0.85, 0.15 ], [], [ 1.15, 0.8, 1.0 ] ) )
    for( const sx of [ - 1, 1 ] )
    {
        P.add( 'muscle', G.sphere, trs( [ sx * 0.82, - 0.28, 0.62 ], [], [ 0.42, 0.3, 0.42 ] ) )
        P.add( 'socket', G.sphere, trs( [ sx * 0.44, 0.1, 1.0 ], [ 0, 0, sx * 0.18 ], [ 0.3, 0.19, 0.14 ] ) )
        P.add( 'glare', G.sphere, trs( [ sx * 0.44, 0.08, 1.1 ], [], [ 0.075, 0.06, 0.04 ] ) )
        P.add( 'socket', G.sphere, trs( [ sx * 0.09, - 0.3, 1.12 ], [ 0, 0, sx * 0.3 ], [ 0.035, 0.11, 0.05 ] ) )
        // bands of exposed cheek muscle running back from the corners of the mouth
        for( const dy of [ 0, - 0.14, - 0.28 ] )
            P.add( 'fiber', new TubeGeometry( new CatmullRomCurve3( [
                new Vector3( sx * 0.72, - 0.55 + dy, 0.82 ), new Vector3( sx * 1.0, - 0.45 + dy, 0.5 ), new Vector3( sx * 1.14, - 0.32 + dy, 0.05 ),
            ] ), 12, 0.035, 6 ), trs() )
    }
    P.add( 'muscle', G.sphere, trs( [ 0, 0.36, 0.92 ], [], [ 0.95, 0.2, 0.3 ] ) )
    P.add( 'muscle', G.sphere, trs( [ 0, - 0.18, 1.06 ], [], [ 0.17, 0.2, 0.14 ] ) )

    // striated fibres sweeping back over the bare skull
    for( let k = - 5; k <= 5; k++ )
    {
        const yaw = k * 0.2
        P.add( 'fiber', overHead( CRANIUM, [ 0, 0, 0 ], [ 0.42, 0.7, 0.98, 1.24, 1.45 ].map( ( p ) => [ yaw * ( 1 - p * 0.3 ), p ] ), 0.035 ), trs() )
    }

    // a lipless grin: rows of huge teeth around a dark gap
    const ARC = 1.7
    P.add( 'socket', new TorusGeometry( 0.98, 0.07, 6, 24, ARC ), trs( [ 0, - 0.68, 0.12 ], [ Math.PI / 2, 0, Math.PI / 2 - ARC / 2 ] ) )
    for( let i = 0; i < 14; i++ )
    {
        const a = ( ( i + 0.5 ) / 14 - 0.5 ) * ARC
        for( const y of [ - 0.56, - 0.8 ] )
            P.add( 'teeth', G.box, trs( [ Math.sin( a ) * 1.0, y, 0.12 + Math.cos( a ) * 1.0 ], [ 0, a, 0 ], [ 0.11, 0.2, 0.06 ] ) )
    }
    const meshes = P.build( m, head )
    return { group: head, meshes }
}

/** Its hands, gripping the top of the wall on either side of its head. */
function buildHands( m )
{
    const hands = []
    for( const sx of [ - 1, 1 ] )
    {
        const a = COLOSSAL_AT + sx * 0.25
        const x = Math.sin( a ) * WALL_R
        const z = - Math.cos( a ) * WALL_R
        const hand = new Group()
        hand.position.set( x, WALL_H, z )
        hand.rotation.y = facing( x, z )
        const P = new Parts()
        P.add( 'muscle', G.sphere, trs( [ 0, 0.3, - 0.1 ], [], [ 0.62, 0.24, 0.5 ] ) )
        for( let i = 0; i < 4; i++ )
        {
            const fx = ( i - 1.5 ) * 0.3
            P.add( 'muscle', G.capsule, trs( [ fx, 0.32, 0.36 ], [ Math.PI / 2, 0, 0 ], [ 0.12, 0.34, 0.12 ] ) )
            P.add( 'muscle', G.capsule, trs( [ fx, 0.02, 0.8 ], [], [ 0.11, 0.32 + ( i % 3 ) * 0.05, 0.11 ] ) )
            P.add( 'fiber', G.box, trs( [ fx, 0.32, 0.36 ], [], [ 0.03, 0.03, 0.5 ] ) )
        }
        P.build( m, hand )
        hands.push( hand )
    }
    return hands
}

function flatMaterial( color, opacity )
{
    const mat = new MeshBasicNodeMaterial( { transparent: true, depthWrite: false } )
    mat.colorNode = uniform( new Color( color ) )
    mat.opacityNode = opacity
    return mat
}

export function createShiganshina( camera = null, kid = null )
{
    const rand = seeded( 845 )
    const m = makeMaterials()

    // the rig squashes `group`, so it only holds his shadow; the square is
    // `ground`, and the town, the wall and the Colossal live in `backdrop`,
    // turned to stay behind him
    const group = new Group()
    group.name = 'eren-feet'
    const ground = new Group()
    ground.name = 'shiganshina-square'
    const backdrop = new Group()
    backdrop.name = 'wall-maria'

    const shadow = new Mesh( new CircleGeometry( 0.62, 40 ), flatMaterial( '#3a2a2c', uniform( 0.2 ) ) )
    shadow.rotation.x = - Math.PI / 2
    shadow.position.y = 0.035
    group.add( shadow )

    const plaza = new Mesh( new CircleGeometry( 40, 96 ), m.plaza )
    plaza.rotation.x = - Math.PI / 2
    ground.add( plaza )
    const stones = new Parts()
    for( let r = 0.35; r < 5.8; r += 0.3 )
    {
        const n = Math.floor( ( Math.PI * 2 * r ) / 0.3 )
        const offset = rand() * Math.PI
        for( let i = 0; i < n; i++ )
        {
            const a = offset + ( i / n ) * Math.PI * 2 + ( rand() - 0.5 ) * 0.04
            const rr = r + ( rand() - 0.5 ) * 0.05
            stones.add( rand() < 0.5 ? 'cobble' : 'cobble2', G.cobble,
                trs( [ Math.sin( a ) * rr, 0, Math.cos( a ) * rr ], [ 0, a + ( rand() - 0.5 ) * 0.2, 0 ], [ 0.13 + rand() * 0.02, 0.028, 0.115 + rand() * 0.02 ] ) )
        }
    }
    stones.build( m, ground )

    backdrop.add( buildTown( m, rand ) )
    const wall = buildWall( m )
    backdrop.add( wall.group )

    const colossal = buildColossal( m )
    colossal.group.position.set( Math.sin( COLOSSAL_AT ) * ( WALL_R + 2.2 ), WALL_H - 3.2, - Math.cos( COLOSSAL_AT ) * ( WALL_R + 2.2 ) )
    colossal.group.rotation.y = - COLOSSAL_AT
    colossal.group.scale.setScalar( COLOSSAL )
    colossal.group.visible = false
    backdrop.add( colossal.group )
    const hands = buildHands( m )
    for( const h of hands ) { h.visible = false; backdrop.add( h ) }

    // the Colossal's steam, rolling off its head and up the sky
    const puffGeometry = new SphereGeometry( 1, 14, 10 )
    const puffs = []
    for( let i = 0; i < 40; i++ )
    {
        const p = new Mesh( puffGeometry, m.steam )
        p.visible = false
        backdrop.add( p )
        puffs.push( { mesh: p, age: 0, life: - 1, size: 0, vel: new Vector3() } )
    }
    let nextPuff = 0
    let puffIn = 0

    const state = { rise: 0, peek: 0 }
    const risen = () => erenLook.goal >= 0.5 || state.peek > 0

    function peek()
    {
        state.peek = 7
    }

    function place( rise )
    {
        const s = smooth( Math.min( 1, Math.max( 0, rise ) ) )
        colossal.group.visible = rise > 0.01
        // from hidden behind the wall to its teeth just clearing the parapet
        colossal.group.position.y = WALL_H - 3.2 + s * 4.7
        const grip = smooth( Math.min( 1, Math.max( 0, ( rise - 0.55 ) / 0.45 ) ) )
        for( const h of hands )
        {
            h.visible = grip > 0.01
            h.scale.setScalar( Math.max( 1e-3, grip * 1.4 ) )
        }
    }

    function snap()
    {
        state.rise = risen() ? 1 : 0
        place( state.rise )
        for( const p of puffs ) { p.life = - 1; p.mesh.visible = false }
    }

    function update( t, dt )
    {
        if( camera ) backdrop.rotation.y = Math.atan2( camera.position.x, camera.position.z )
        shadow.scale.setScalar( kid?.growth ?? 1 )

        state.peek = Math.max( 0, state.peek - dt )
        const k = 1 - Math.exp( - dt * 0.9 )
        state.rise += ( ( risen() ? 1 : 0 ) - state.rise ) * k
        place( state.rise )
        colossal.group.rotation.z = Math.sin( t * 0.4 ) * 0.025 - 0.12

        if( state.rise > 0.3 )
        {
            puffIn -= dt
            if( puffIn <= 0 )
            {
                puffIn = 0.16
                const p = puffs[ nextPuff ]
                nextPuff = ( nextPuff + 1 ) % puffs.length
                const a = ( rand() - 0.5 ) * 2.4
                const top = colossal.group.position
                p.mesh.position.set( top.x + Math.sin( a ) * 1.8, top.y + ( 1.1 + rand() * 0.9 ) * COLOSSAL, top.z - 0.5 + Math.cos( a ) * 0.4 )
                p.vel.set( Math.sin( a ) * 0.4, 0.55 + rand() * 0.3, - 0.2 )
                p.size = 0.3 + rand() * 0.4
                p.age = 0
                p.life = 3.5 + rand() * 2
                p.mesh.visible = true
            }
        }
        for( const p of puffs )
        {
            if( p.life < 0 ) continue
            p.age += dt
            const u = p.age / p.life
            if( u >= 1 ) { p.life = - 1; p.mesh.visible = false; continue }
            p.mesh.position.addScaledVector( p.vel, dt )
            const s = p.size * smooth( Math.min( 1, u / 0.2 ) ) * ( 1 + u ) * ( 1 - smooth( Math.max( 0, ( u - 0.6 ) / 0.4 ) ) )
            p.mesh.scale.setScalar( Math.max( 1e-3, s ) )
        }
    }

    const pickables = []
    backdrop.traverse( ( o ) => { if( o.isMesh && o.material !== m.steam ) pickables.push( o ) } )

    return {
        group, main: null, tail: null, ground, backdrop, update, snap,
        // tapping the wall brings the Colossal Titan up to look over it
        onTap: peek,
        grounded: true, baseY: 0,
        pickables,
    }
}
