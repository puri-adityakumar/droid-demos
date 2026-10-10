import {
    Group, Sprite, SpriteNodeMaterial, MeshBasicNodeMaterial, Color, Shape, Vector2, Vector3,
    BoxGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, LatheGeometry, PlaneGeometry, CircleGeometry, ShapeGeometry
} from 'three/webgpu'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { uniform, uv, mix, pow, smoothstep, length } from 'three/tsl'

import { paintedMaterial, light } from '../materials/painted.js'
import { mesh, v3 } from './character.js'

// Light's desk at night: the wall is the painted backdrop, so this builds what
// stands in front of it: the desk and everything on it, a lamp that really
// lights the scene (see `light.lamp`) and a window onto the city and the moon.
// He sits behind the desk, so its top is as high as his waist and its back
// edge is tucked up to his belly. +z is toward the viewer.

export const DESK_Y = 0.42
export const DESK_BACK = 0.2
export const DESK_FRONT = 2.2
export const NOTE_Z = 0.7

const seeded = ( seed ) => () => ( seed = ( seed * 16807 ) % 2147483647 ) / 2147483647
const UP = new Vector3( 0, 1, 0 )

function makeMaterials()
{
    const bulb = new MeshBasicNodeMaterial()
    bulb.colorNode = mix( uniform( new Color( '#7a6676' ) ), uniform( new Color( '#fff0b4' ) ), light.lamp )

    const pane = new MeshBasicNodeMaterial()
    pane.colorNode = mix( uniform( new Color( '#4d63b8' ) ), uniform( new Color( '#0b1030' ) ), smoothstep( 0.05, 0.85, uv().y ) )

    return {
        wood: paintedMaterial( { color: '#a06c48', shade: '#4a2a3c', highlight: '#eab67e', scale: 1.4, gloss: 0.35, rim: 0.45 } ),
        woodDark: paintedMaterial( { color: '#7c4e36', shade: '#3a2236', highlight: '#c98a5e', scale: 1.4, gloss: 0.2, rim: 0.3 } ),
        brass: paintedMaterial( { color: '#dcae52', shade: '#7a4a3a', highlight: '#fff0b0', gloss: 0.9, scale: 3, rim: 0.7 } ),
        lampshade: paintedMaterial( { color: '#2f7d64', shade: '#143a4c', highlight: '#8ee4b4', gloss: 0.6, scale: 2, rim: 0.6, terminator: 0.4 } ),
        paper: paintedMaterial( { color: '#fbf3e2', shade: '#c4b0cc', highlight: '#ffffff', scale: 2.5, rim: 0.2 } ),
        ink: paintedMaterial( { color: '#2c2640', unlit: true } ),
        frame: paintedMaterial( { color: '#eee2ca', shade: '#8a7092', highlight: '#ffffff', scale: 2, rim: 0.5 } ),
        curtain: paintedMaterial( { color: '#a03450', shade: '#4a1838', highlight: '#e8647e', scale: 2.2, rim: 0.5, gloss: 0.25 } ),
        mug: paintedMaterial( { color: '#e6edf9', shade: '#8a94cc', highlight: '#ffffff', scale: 2.6, gloss: 0.8, rim: 0.6 } ),
        leather: paintedMaterial( { color: '#7a2c40', shade: '#2e1030', highlight: '#d0687e', scale: 2.2, gloss: 0.55, rim: 0.5 } ),
        bulb,
        pane,
        skyline: paintedMaterial( { color: '#0a0f2e', unlit: true } ),
        lit: paintedMaterial( { color: '#ffd98a', unlit: true } ),
        white: paintedMaterial( { color: '#fff3d0', unlit: true } ),
    }
}

/** A soft round glow; `lamp` ties its strength to the lamp ('on') or to its absence ('off'). */
function glowMaterial( Material, color, { strength = 1, power = 1.5, lamp = null } = {} )
{
    const m = new Material( { transparent: true, depthWrite: false } )
    m.colorNode = uniform( new Color( color ) )
    const radial = pow( smoothstep( 0, 1, length( uv().mul( 2 ).sub( 1 ) ) ).oneMinus(), power ).mul( strength )
    m.opacityNode = lamp === 'on' ? radial.mul( light.lamp ) : lamp === 'off' ? radial.mul( light.lamp.oneMinus() ) : radial
    return m
}

function bar( a, b, radius, material, parent )
{
    const dir = b.clone().sub( a )
    const m = mesh( new CylinderGeometry( radius, radius, dir.length(), 12 ), material, parent, a.clone().add( b ).multiplyScalar( 0.5 ) )
    m.quaternion.setFromUnitVectors( UP, dir.normalize() )
    return m
}

function decal( geometry, material, parent, x, y, z )
{
    const m = mesh( geometry.clone().rotateX( - Math.PI / 2 ), material, parent, v3( x, y, z ) )
    m.renderOrder = 1
    return m
}

/** Rows of handwriting, as thin dark bars lying flat. */
function writing( { width, depth, rows, seed } )
{
    const rand = seeded( seed )
    const parts = []
    for( let i = 0; i < rows; i++ )
    {
        const z = - depth / 2 + 0.1 + i * ( depth - 0.2 ) / ( rows - 1 )
        const len = width * ( 0.4 + rand() * 0.45 )
        parts.push( new BoxGeometry( len, 0.004, 0.03 ).translate( - width / 2 + 0.1 + len / 2, 0.004, z ) )
    }
    return mergeGeometries( parts )
}

function buildDesk( parent, m )
{
    mesh( new RoundedBoxGeometry( 7.4, 0.22, DESK_FRONT - DESK_BACK, 3, 0.05 ), m.wood, parent, v3( 0, DESK_Y - 0.11, ( DESK_FRONT + DESK_BACK ) / 2 ) )
    mesh( new BoxGeometry( 7, 3, 0.18 ), m.woodDark, parent, v3( 0, DESK_Y - 1.7, DESK_FRONT - 0.1 ) )
    mesh( new RoundedBoxGeometry( 2.8, 1.1, 0.1, 3, 0.04 ), m.wood, parent, v3( 0, DESK_Y - 0.95, DESK_FRONT + 0.03 ) )
    mesh( new SphereGeometry( 0.08, 14, 10 ), m.brass, parent, v3( 0, DESK_Y - 0.95, DESK_FRONT + 0.13 ) )
}

/** The back of his chair, just behind his shoulders, so it reads as sitting rather than standing. */
function buildChair( parent, m )
{
    mesh( new RoundedBoxGeometry( 1.6, 1.25, 0.2, 3, 0.1 ), m.leather, parent, v3( 0, 0.95, - 0.6 ) )
    mesh( new RoundedBoxGeometry( 1.74, 0.16, 0.26, 3, 0.07 ), m.woodDark, parent, v3( 0, 1.6, - 0.6 ) )
}

function buildLamp( parent, m )
{
    const lamp = new Group()
    lamp.position.set( - 1.7, DESK_Y, 0.7 )
    lamp.scale.setScalar( 0.62 )
    parent.add( lamp )

    mesh( new CylinderGeometry( 0.42, 0.48, 0.12, 28 ), m.brass, lamp, v3( 0, 0.06, 0 ) )
    const elbow = v3( - 0.15, 1.5, 0 )
    const wrist = v3( 0.6, 2.05, 0 )
    bar( v3( 0, 0.1, 0 ), elbow, 0.045, m.brass, lamp )
    mesh( new SphereGeometry( 0.085, 14, 10 ), m.brass, lamp, elbow )
    bar( elbow, wrist, 0.04, m.brass, lamp )
    mesh( new SphereGeometry( 0.095, 14, 10 ), m.brass, lamp, wrist )

    // the shade hangs from the wrist and looks down at the notebook
    const shade = new Group()
    shade.position.copy( wrist )
    shade.rotation.z = 0.6
    shade.scale.setScalar( 0.85 )
    lamp.add( shade )
    const profile = [
        [ 0.54, - 0.42 ], [ 0.17, 0.12 ], [ 0.001, 0.15 ],
        [ 0.001, 0.1 ], [ 0.14, 0.07 ], [ 0.5, - 0.42 ], [ 0.54, - 0.42 ],
    ].map( ( [ r, y ] ) => new Vector2( r, y ) )
    mesh( new LatheGeometry( profile, 36 ), m.lampshade, shade )
    mesh( new SphereGeometry( 0.16, 16, 12 ), m.bulb, shade, v3( 0, - 0.28, 0 ) )

    return lamp
}

function buildGlow( parent )
{
    // light thrown on the wall and the desk; both fade with the lamp
    const halo = new Sprite( glowMaterial( SpriteNodeMaterial, '#ffb35e', { strength: 0.62, power: 1.7, lamp: 'on' } ) )
    halo.position.set( - 1.3, DESK_Y + 1.1, - 0.3 )
    halo.scale.setScalar( 4.4 )
    parent.add( halo )

    const poolMaterial = glowMaterial( MeshBasicNodeMaterial, '#ffb866', { strength: 0.5, power: 1.3, lamp: 'on' } )
    decal( new PlaneGeometry( 4.6, 2.2 ), poolMaterial, parent, - 0.7, DESK_Y + 0.012, 1.2 )

    // with the lamp out the desk only has the window's cold light
    const cold = glowMaterial( MeshBasicNodeMaterial, '#18246a', { strength: 0.6, power: 0.35, lamp: 'off' } )
    decal( new PlaneGeometry( 7.4, DESK_FRONT - DESK_BACK ), cold, parent, 0, DESK_Y + 0.016, ( DESK_FRONT + DESK_BACK ) / 2 )

    // soft shadows: under the notebook, and under his arms
    const shadow = glowMaterial( MeshBasicNodeMaterial, '#120a2a', { strength: 0.5, power: 1.1 } )
    decal( new PlaneGeometry( 2.1, 1.5 ), shadow, parent, 0.02, DESK_Y + 0.02, NOTE_Z + 0.04 )
    decal( new PlaneGeometry( 1.7, 0.9 ), shadow, parent, 0, DESK_Y + 0.022, DESK_BACK + 0.3 )
}

function buildStack( parent, m )
{
    const stack = new Group()
    stack.position.set( 1.75, DESK_Y, 0.65 )
    stack.scale.setScalar( 0.8 )
    parent.add( stack )

    const volumes = [
        [ 1.5, 0.24, 1.0, '#a8344a', 0.06 ],
        [ 1.35, 0.2, 0.92, '#2f5486', - 0.1 ],
        [ 1.2, 0.18, 0.84, '#e0ac3c', 0.12 ],
    ]
    let y = 0
    for( const [ w, h, d, color, turn ] of volumes )
    {
        const cover = paintedMaterial( { color, scale: 2.4, gloss: 0.5, rim: 0.5 } )
        const book = new Group()
        book.position.y = y + h / 2
        book.rotation.y = turn
        stack.add( book )
        mesh( new RoundedBoxGeometry( w, h, d, 2, 0.025 ), cover, book )
        mesh( new BoxGeometry( w - 0.12, h - 0.07, d + 0.03 ), m.paper, book, v3( 0.03, 0, 0 ) )
        y += h
    }
}

function buildDeskTop( parent, m )
{
    // a sheet of names and a mug of pencils; the pen is in his hand
    const sheet = new Group()
    sheet.position.set( - 1.25, DESK_Y + 0.01, 1.55 )
    sheet.rotation.y = 0.35
    sheet.scale.setScalar( 0.85 )
    parent.add( sheet )
    mesh( new BoxGeometry( 1.0, 0.012, 1.3 ), m.paper, sheet )
    mesh( writing( { width: 1.0, depth: 1.3, rows: 7, seed: 11 } ), m.ink, sheet, v3( 0, 0.006, 0 ) )

    const mug = new Group()
    mug.position.set( 1.5, DESK_Y, 1.55 )
    mug.scale.setScalar( 0.8 )
    parent.add( mug )
    mesh( new CylinderGeometry( 0.23, 0.2, 0.42, 26 ), m.mug, mug, v3( 0, 0.21, 0 ) )
    const handle = mesh( new TorusGeometry( 0.12, 0.032, 10, 20 ), m.mug, mug, v3( 0.25, 0.22, 0 ) )
    handle.scale.set( 0.9, 1.1, 1 )
    const pencils = [ [ '#d8323c', - 0.18, 0.14 ], [ '#f0c040', 0.05, - 0.1 ], [ '#2c2640', 0.2, 0.22 ] ]
    for( const [ color, lean, spin ] of pencils )
    {
        const pencil = new Group()
        pencil.position.set( lean * 0.3, 0.38, spin * 0.2 )
        pencil.rotation.z = - lean
        pencil.rotation.x = spin
        mug.add( pencil )
        mesh( new CylinderGeometry( 0.024, 0.024, 0.5, 8 ), paintedMaterial( { color, scale: 4, rim: 0.5 } ), pencil, v3( 0, 0.2, 0 ) )
        mesh( new CylinderGeometry( 0.002, 0.024, 0.07, 8 ), m.paper, pencil, v3( 0, 0.485, 0 ) )
    }
}

function moonGeometry()
{
    const R = 1
    const d = 0.32
    const r = 0.9
    const x = ( d * d + R * R - r * r ) / ( 2 * d )
    const y = Math.sqrt( R * R - x * x )
    const a = Math.atan2( y, x )
    const b = Math.atan2( y, x - d )

    const shape = new Shape()
    shape.absarc( 0, 0, R, a, Math.PI * 2 - a, false )
    shape.absarc( d, 0, r, Math.PI * 2 - b, b, true )
    return new ShapeGeometry( shape, 64 )
}

function buildWindow( parent, m )
{
    const W = 2.8
    const H = 3.6
    const win = new Group()
    win.position.set( 0.6, 1.0, - 4.6 )
    parent.add( win )

    mesh( new PlaneGeometry( W, H ), m.pane, win, v3( 0, 0, - 0.05 ) )

    const rand = seeded( 5 )

    // the city below the window: dark towers with a few lit windows
    const towers = []
    const lights = []
    let x = - W / 2
    while( x < W / 2 )
    {
        const w = Math.min( 0.26 + rand() * 0.3, W / 2 - x )
        const h = 0.35 + rand() * 0.95
        towers.push( new BoxGeometry( w, h, 0.02 ).translate( x + w / 2, - H / 2 + h / 2, 0 ) )
        for( let wx = x + 0.07; wx < x + w - 0.06; wx += 0.1 )
            for( let wy = - H / 2 + 0.1; wy < - H / 2 + h - 0.08; wy += 0.14 )
                if( rand() < 0.4 ) lights.push( new PlaneGeometry( 0.045, 0.06 ).translate( wx, wy, 0.012 ) )
        x += w + 0.02
    }
    mesh( mergeGeometries( towers ), m.skyline, win, v3( 0, 0, - 0.03 ) )
    mesh( mergeGeometries( lights ), m.lit, win, v3( 0, 0, - 0.03 ) )

    const stars = []
    for( let i = 0; i < 16; i++ )
        stars.push( new CircleGeometry( 0.018 + rand() * 0.02, 6 ).translate( ( rand() - 0.5 ) * ( W - 0.3 ), H * 0.05 + rand() * H * 0.42, 0 ) )
    mesh( mergeGeometries( stars ), m.white, win, v3( 0, 0, - 0.04 ) )

    const moonGlow = new Sprite( glowMaterial( SpriteNodeMaterial, '#9dbcff', { strength: 0.38, power: 1.6 } ) )
    moonGlow.position.set( 0.5, 1.0, - 0.02 )
    moonGlow.scale.setScalar( 2.6 )
    win.add( moonGlow )
    const moon = mesh( moonGeometry(), m.white, win, v3( 0.5, 1.0, - 0.01 ) )
    moon.scale.setScalar( 0.46 )
    moon.rotation.z = 0.5

    const bars = [
        [ W + 0.4, 0.18, 0.22, 0, H / 2 + 0.09 ],
        [ W + 0.4, 0.18, 0.22, 0, - H / 2 - 0.09 ],
        [ 0.18, H, 0.22, - W / 2 - 0.09, 0 ],
        [ 0.18, H, 0.22, W / 2 + 0.09, 0 ],
        [ 0.09, H, 0.12, 0, 0 ],
        [ W, 0.09, 0.12, 0, 0.35 ],
    ]
    for( const [ w, h, d, bx, by ] of bars ) mesh( new BoxGeometry( w, h, d ), m.frame, win, v3( bx, by, 0 ) )
    mesh( new RoundedBoxGeometry( W + 0.8, 0.14, 0.5, 2, 0.03 ), m.frame, win, v3( 0, - H / 2 - 0.25, 0.14 ) )

    // heavy curtains in Kira red, pleated from a row of rounded folds
    const rodY = H / 2 + 0.55
    const drop = 5.7
    bar( v3( - W / 2 - 1.3, rodY, 0.4 ), v3( W / 2 + 1.3, rodY, 0.4 ), 0.045, m.brass, win )
    for( const side of [ - 1, 1 ] )
    {
        for( let i = 0; i < 5; i++ )
        {
            const fold = mesh(
                new CylinderGeometry( 0.2, 0.2, drop - ( i % 2 ) * 0.12, 14 ),
                m.curtain, win,
                v3( side * ( W / 2 + 0.95 - i * 0.22 ), rodY - drop / 2 + 0.05, 0.4 + ( i % 2 ) * 0.06 )
            )
            fold.scale.z = 0.55
        }
    }
}

export function createRoom()
{
    const m = makeMaterials()
    const group = new Group()
    group.name = 'room'

    buildWindow( group, m )
    buildDesk( group, m )
    buildChair( group, m )
    buildStack( group, m )
    buildDeskTop( group, m )
    buildLamp( group, m )
    buildGlow( group )

    return { group }
}
