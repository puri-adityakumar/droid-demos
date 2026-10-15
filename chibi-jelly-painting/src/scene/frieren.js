import {
    Group, Mesh, SphereGeometry, CapsuleGeometry, CylinderGeometry, ConeGeometry, TorusGeometry,
    LatheGeometry, TubeGeometry, CircleGeometry, RingGeometry, ShapeGeometry, BoxGeometry,
    Shape, Vector2, Vector3, CatmullRomCurve3, Sprite, SpriteNodeMaterial, MeshBasicNodeMaterial,
    DoubleSide, Color
} from 'three/webgpu'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { uniform, positionLocal, normalLocal, normalView, mix, smoothstep, mx_noise_float } from 'three/tsl'

import { paintedMaterial, light } from '../materials/painted.js'
import {
    mesh, v3, sphereDir, skullRadius, skullGeometry, orient, spikeGeometry, onTorso, stroke,
    TORSO, TORSO_DEPTH, HAIR_RADIUS, UP, Z, deg
} from './character.js'
import { glowMaterial } from './glow.js'

// Frieren, after her anime design and Nendoroid: silver-white hair in long
// twin-tails with black-and-gold ties, long pointed elf ears with red drop
// earrings, calm emerald-green eyes, a white gold-trimmed capelet with a red
// brooch over her belted tunic and skirt, and her red crescent mage's staff.
// She stands in a floating bed of Blue-Moon Weed flowers with an open grimoire;
// in the Zoltraak mood, glowing geometric spell circles unfurl around her.

export const meadowLook = {
    // 0 in the sunlit Flower Field, 1 in the starlit Zoltraak spell mood
    mana: uniform( 0 ),
    petal: uniform( new Color( '#b8e8ff' ) ),
    ring: uniform( new Color( '#6ce8ff' ) ),
}

export const palette = {
    skin: '#ffe4d4',
    hair: '#f2f5ff',
    hairTie: '#262238',
    cape: '#f7f8fe',
    gold: '#ebb43e',
    trim: '#2a263e',
    tights: '#28253a',
    boot: '#6e4534',
    gem: '#e62e48',
    staff: '#c82838',
    sclera: '#f6f8ff',
    iris: '#22b890',
    irisLow: '#96f7dc',
    pupil: '#103c36',
    lash: '#3d3862',
    brow: '#d8def6',
    mouth: '#c4506a',
    blush: '#ff9ea6',
}

function makeMaterials()
{
    return {
        skin: paintedMaterial( { color: palette.skin, shade: '#eea0a0', rim: 0.55, gloss: 0.25, scale: 2.4 } ),
        hair: paintedMaterial( { color: palette.hair, shade: '#7686dc', highlight: '#ffffff', rim: 0.55, gloss: 0.5, scale: 3.0, terminator: 0.42 } ),
        hairTie: paintedMaterial( { color: palette.hairTie, shade: '#121024', highlight: '#666298', scale: 3 } ),
        cape: paintedMaterial( { color: palette.cape, shade: '#8e98d8', highlight: '#ffffff', rim: 0.55, gloss: 0.3, scale: 2.8, terminator: 0.44 } ),
        gold: paintedMaterial( { color: palette.gold, shade: '#9e6224', highlight: '#fff2b2', gloss: 0.95, rim: 0.7, scale: 2.5 } ),
        trim: paintedMaterial( { color: palette.trim, shade: '#121026', highlight: '#6c68a4', scale: 3, rim: 0.5 } ),
        tights: paintedMaterial( { color: palette.tights, shade: '#121026', highlight: '#66629a', scale: 3, rim: 0.5 } ),
        boot: paintedMaterial( { color: palette.boot, shade: '#3c2028', highlight: '#b87c5e', gloss: 0.65, rim: 0.55, scale: 2.8 } ),
        gem: paintedMaterial( { color: palette.gem, shade: '#88122e', highlight: '#ff9aa8', gloss: 1, rim: 0.85, scale: 2.2 } ),
        staff: paintedMaterial( { color: palette.staff, shade: '#741428', highlight: '#ff7a72', gloss: 0.9, rim: 0.65, scale: 2.2 } ),
        sclera: paintedMaterial( { color: palette.sclera, shade: '#c4cdf4', rim: 0, gloss: 0, brush: 0.2, haze: 0 } ),
        iris: paintedMaterial( { color: palette.iris, unlit: true } ),
        irisLow: paintedMaterial( { color: palette.irisLow, unlit: true } ),
        pupil: paintedMaterial( { color: palette.pupil, unlit: true } ),
        lash: paintedMaterial( { color: palette.lash, shade: '#242044', rim: 0, gloss: 0, brush: 0.3, haze: 0.2 } ),
        brow: paintedMaterial( { color: palette.brow, shade: '#828ed4', rim: 0, gloss: 0, brush: 0.3, haze: 0.3 } ),
        white: paintedMaterial( { color: '#ffffff', unlit: true } ),
        mouth: paintedMaterial( { color: palette.mouth, shade: '#6e1e38', rim: 0, gloss: 0, brush: 0.3, haze: 0.3 } ),
        blush: paintedMaterial( { color: palette.blush, shade: '#f07c8a', rim: 0, gloss: 0, brush: 0.4 } ),
    }
}

function buildHair( head, m )
{
    const hair = new Group()
    head.add( hair )

    // Smooth silver cap wrapping over the skull
    const cap = mesh( new SphereGeometry( HAIR_RADIUS + 0.032, 48, 32, 0, Math.PI * 2, 0, 1.78 ), m.hair, hair )
    cap.rotation.x = - 0.78

    const spikes = []
    const add = ( base, direction, length, radius, bend, curl, { inset = 0.48, flat = 0.52, fullness = 0.7, weight = length } = {} ) =>
    {
        const pivot = new Group()
        pivot.position.copy( base.clone().multiplyScalar( inset ) )
        orient( pivot, direction, curl )
        hair.add( pivot )
        mesh( spikeGeometry( length, radius, bend, flat, fullness ), m.hair, pivot )
        spikes.push( { pivot, rest: pivot.quaternion.clone(), weight } )
        return pivot
    }
    const at = ( yaw, pitch ) => sphereDir( yaw * deg, pitch * deg )

    // Center-parted bangs sweeping gracefully to either side of her forehead
    const bangs = [
        [ - 50, 48, 0.44, 0.14, - 1, 0.24 ],
        [ - 31, 58, 0.54, 0.16, - 1, 0.28 ],
        [ - 14, 65, 0.58, 0.14, - 1, 0.22 ],
        [ 14, 65, 0.58, 0.14, 1, 0.22 ],
        [ 31, 58, 0.54, 0.16, 1, 0.28 ],
        [ 50, 48, 0.44, 0.14, 1, 0.24 ],
    ]
    for( const [ yaw, pitch, length, radius, side, sweep ] of bangs )
    {
        const n = at( yaw, pitch )
        const down = UP.clone().sub( n.clone().multiplyScalar( n.y ) ).normalize().negate()
        const dir = down.clone().sub( n.clone().multiplyScalar( 0.42 ) ).add( v3( side * sweep, 0, 0 ) )
        add( n, dir, length, radius, 0.2, v3( side, 0, 0 ), { inset: 0.61, flat: 0.4, fullness: 0.58, weight: 0.45 } )
    }

    // Slender cheek-framing sidelocks in front of the ears (leaving the elf ears & earrings unobstructed)
    for( const side of [ - 1, 1 ] )
    {
        add(
            at( side * 52, 20 ),
            v3( side * 0.06, - 1, 0.28 ),
            0.56, 0.105, 0.14, v3( - side, 0, 0.3 ),
            { inset: 0.56, flat: 0.42, fullness: 0.58, weight: 0.55 }
        )
    }

    // Back of the head: neat silver layers tucked smoothly toward the nape
    for( const yaw of [ 135, 160, 180, - 160, - 135 ] )
    {
        const n = at( yaw, 14 )
        add( n, v3( n.x * 0.25, - 1, - 0.35 ), 0.52, 0.22, 0.14, n, { inset: 0.52, flat: 0.42, fullness: 0.72, weight: 0.4 } )
    }

    // Iconic high twin-tails with black-and-gold hair ties set slightly back on the crown
    // so the long elf ears project cleanly in front of them
    for( const side of [ - 1, 1 ] )
    {
        const tiePos = v3( side * 0.56, 0.24, - 0.16 )

        // Black ribbon cuff with a gold band
        const cuff = new Group()
        cuff.position.copy( tiePos )
        cuff.rotation.z = - side * 0.65
        cuff.rotation.y = - side * 0.2
        hair.add( cuff )
        mesh( new TorusGeometry( 0.12, 0.044, 12, 24 ), m.hairTie, cuff )
        mesh( new TorusGeometry( 0.125, 0.018, 10, 24 ), m.gold, cuff, v3( 0, 0.028, 0 ) )
        for( const flap of [ - 1, 1 ] )
        {
            const ribbon = mesh( new ConeGeometry( 0.048, 0.15, 10 ), m.hairTie, cuff, v3( side * 0.08, 0.06, flap * 0.04 ) )
            ribbon.rotation.z = - side * 0.8
            ribbon.rotation.x = flap * 0.45
        }

        // Voluminous sweeping twin-tail built from layered curved blades
        const tailPivot = new Group()
        tailPivot.position.copy( tiePos )
        hair.add( tailPivot )

        const mainLock = new Group()
        orient( mainLock, v3( side * 0.55, - 0.86, - 0.14 ), v3( side, 0.25, 0 ) )
        tailPivot.add( mainLock )
        mesh( spikeGeometry( 1.32, 0.25, 0.32, 0.62, 0.62 ), m.hair, mainLock )

        const innerLock = new Group()
        orient( innerLock, v3( side * 0.4, - 0.92, - 0.04 ), v3( side, 0.15, 0.2 ) )
        tailPivot.add( innerLock )
        mesh( spikeGeometry( 1.18, 0.2, 0.26, 0.58, 0.65 ), m.hair, innerLock )

        const outerLock = new Group()
        orient( outerLock, v3( side * 0.72, - 0.74, - 0.2 ), v3( side, 0.4, - 0.1 ) )
        tailPivot.add( outerLock )
        mesh( spikeGeometry( 1.08, 0.18, 0.36, 0.55, 0.68 ), m.hair, outerLock )

        spikes.push( { pivot: tailPivot, rest: tailPivot.quaternion.clone(), weight: 0.95 } )
    }

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
        // Calm emerald-teal eyes with a soft mint lower rim and gentle droopy upper lash
        const eye = new Group()
        part( m.sclera, [ 0.102, 0.105, 0.05 ], [ 0, 0, 0 ], eye )
        part( m.iris, [ 0.078, 0.088, 0.03 ], [ 0, - 0.004, 0.026 ], eye )
        part( m.irisLow, [ 0.058, 0.032, 0.02 ], [ 0, - 0.046, 0.05 ], eye )
        part( m.pupil, [ 0.036, 0.044, 0.02 ], [ 0, 0.004, 0.056 ], eye )
        part( m.white, [ 0.028, 0.032, 0.015 ], [ side * 0.026, 0.034, 0.07 ], eye )
        part( m.white, [ 0.012, 0.012, 0.01 ], [ - side * 0.03, - 0.032, 0.072 ], eye )

        // Frieren's signature relaxed, slightly flat/droopy upper lash line with a small outer wing
        const lash = [
            [ - 0.105, 0.042 ],
            [ - 0.035, 0.088 ],
            [ 0.055, 0.084 ],
            [ 0.132, 0.038 ],
        ].map( ( [ x, y ] ) => v3( x * side, y, 0.018 ) )
        eye.add( new Mesh( new TubeGeometry( new CatmullRomCurve3( lash ), 24, 0.022, 8 ), m.lash ) )

        place( eye, side * 0.33, - 0.08, 0.018, - side * 0.03 )
        eyes.push( eye )

        // Soft silver-white arched brows
        const brow = [ [ - 0.085, 0.008 ], [ 0, 0.024 ], [ 0.095, 0.006 ] ].map( ( [ x, y ] ) => v3( x * side, y, 0 ) )
        place( new Mesh( new TubeGeometry( new CatmullRomCurve3( brow ), 16, 0.013, 8 ), m.brow ), side * 0.33, 0.2, 0.004 )

        part( m.blush, [ 0.078, 0.036, 0.02 ], [ 0, 0, 0 ], place( new Group(), side * 0.55, - 0.23, 0.01 ) )

        // Long pointed elf ear projecting out horizontally in front of the twin-tails
        const earGroup = new Group()
        earGroup.position.set( side * 0.48, - 0.04, 0.08 )
        head.add( earGroup )
        const earCone = new Group()
        orient( earCone, v3( side * 1.0, 0.12, 0.06 ), UP )
        earGroup.add( earCone )
        mesh( spikeGeometry( 0.52, 0.118, - 0.06, 0.46, 0.72 ), m.skin, earCone )
        mesh( spikeGeometry( 0.34, 0.062, - 0.04, 0.35, 0.65 ), m.blush, earCone, v3( 0, 0.04, 0.035 ) )

        // Iconic red drop earring hanging clearly visible beneath each elf ear
        const earring = new Group()
        earring.position.set( side * 0.64, - 0.11, 0.12 )
        head.add( earring )
        mesh( new SphereGeometry( 0.024, 12, 10 ), m.gold, earring, v3( 0, 0, 0 ) )
        mesh( new CylinderGeometry( 0.009, 0.009, 0.055, 8 ), m.gold, earring, v3( 0, - 0.032, 0 ) )
        mesh( new ConeGeometry( 0.042, 0.1, 14 ), m.gem, earring, v3( 0, - 0.088, 0 ) )
        mesh( new SphereGeometry( 0.042, 14, 12 ), m.gem, earring, v3( 0, - 0.138, 0 ), v3( 1, 1.18, 1 ) )
    }

    // Serene cat-like smile (a subtle W curve)
    const mouthPoints = [
        v3( - 0.062, 0.01, 0 ),
        v3( - 0.028, - 0.014, 0.004 ),
        v3( 0, 0.004, 0.006 ),
        v3( 0.028, - 0.014, 0.004 ),
        v3( 0.062, 0.01, 0 ),
    ]
    const smile = new Mesh( new TubeGeometry( new CatmullRomCurve3( mouthPoints ), 24, 0.011, 8 ), m.mouth )
    place( smile, 0, - 0.255, - 0.005 )

    const nose = new Mesh( sphere, m.skin )
    nose.scale.set( 0.028, 0.022, 0.025 )
    place( nose, 0, - 0.11, 0.012 )

    return { eyes }
}

function buildStaff( parent, m )
{
    const staff = new Group()
    // Positioned in the right elbow's coordinate space and tilted slightly outward
    // so the gold crescent and crimson jewel silhouette cleanly beside her head
    staff.position.set( 0.03, - 0.25, 0.02 )
    staff.rotation.set( 0.44, 0.08, - 0.56 )
    parent.add( staff )

    // Red lacquered shaft + gold rings
    mesh( new CylinderGeometry( 0.029, 0.026, 2.25, 16 ), m.staff, staff, v3( 0, 0.36, 0 ) )
    mesh( new CylinderGeometry( 0.036, 0.032, 0.09, 16 ), m.gold, staff, v3( 0, - 0.72, 0 ) )
    mesh( new CylinderGeometry( 0.04, 0.036, 0.08, 16 ), m.gold, staff, v3( 0, 1.12, 0 ) )
    mesh( new CylinderGeometry( 0.048, 0.038, 0.13, 16 ), m.gold, staff, v3( 0, 1.4, 0 ) )

    // Ornate gold crescent head at the top of the staff
    const head = new Group()
    head.position.set( 0, 1.72, 0 )
    staff.add( head )

    // Outer gold crescent + inner gold cradle
    const crescent = mesh( new TorusGeometry( 0.25, 0.04, 14, 40, Math.PI * 1.58 ), m.gold, head )
    crescent.rotation.z = Math.PI * 0.71
    const innerArc = mesh( new TorusGeometry( 0.16, 0.022, 12, 32, Math.PI * 1.25 ), m.gold, head, v3( 0, - 0.03, 0 ) )
    innerArc.rotation.z = Math.PI * 0.875

    // Gold wing finials on either side of the socket
    for( const side of [ - 1, 1 ] )
    {
        const wing = mesh( spikeGeometry( 0.24, 0.048, 0.15, 0.5, 0.7 ), m.gold, head, v3( side * 0.08, - 0.25, 0 ) )
        wing.rotation.z = - side * 1.05
    }

    // Crimson mana jewel suspended in the center of the crescent + soft red halo
    mesh( new SphereGeometry( 0.09, 20, 16 ), m.gem, head, v3( 0, 0.01, 0 ), v3( 0.86, 1.24, 0.86 ) )
    const redGlow = new Sprite( glowMaterial( SpriteNodeMaterial, '#ff4866', { strength: 0.6, power: 1.5 } ) )
    redGlow.scale.setScalar( 0.75 )
    redGlow.position.set( 0, 0.01, 0 )
    head.add( redGlow )

    // Fluttering red ribbons tied below the crescent
    for( const [ side, drop, out ] of [ [ - 1, 0.44, 0.2 ], [ 1, 0.52, 0.25 ] ] )
    {
        const pts = [
            v3( side * 0.03, - 0.25, 0.02 ),
            v3( side * ( 0.09 + out * 0.5 ), - 0.25 - drop * 0.45, 0.05 ),
            v3( side * ( 0.05 + out ), - 0.25 - drop, - 0.02 ),
        ]
        stroke( pts, 0.022, m.gem, head )
    }

    return { staff, head }
}

function buildArm( side, parent, m )
{
    const shoulder = new Group()
    shoulder.position.set( side * 0.31, 0.92, 0 )
    parent.add( shoulder )

    mesh( new SphereGeometry( 0.135, 24, 16 ), m.cape, shoulder, v3( 0, - 0.03, 0 ), v3( 1, 1.1, 1 ) )
    mesh( new CapsuleGeometry( 0.086, 0.15, 6, 12 ), m.cape, shoulder, v3( 0, - 0.17, 0 ) )

    const elbow = new Group()
    elbow.position.set( 0, - 0.27, 0 )
    shoulder.add( elbow )
    mesh( new CapsuleGeometry( 0.082, 0.12, 6, 12 ), m.cape, elbow, v3( 0, - 0.08, 0 ) )
    mesh( new CylinderGeometry( 0.086, 0.08, 0.055, 20 ), m.gold, elbow, v3( 0, - 0.175, 0 ) )
    mesh( new SphereGeometry( 0.086, 20, 16 ), m.skin, elbow, v3( 0, - 0.26, 0.005 ), v3( 1, 1.05, 0.95 ) )

    return { shoulder, elbow }
}

// Flared skirt profile from waist (y = 0.58) down to hem (y = 0.30) so her tights and boots show clearly
const SKIRT = [
    [ 0.0, 0.30 ], [ 0.42, 0.30 ], [ 0.39, 0.39 ], [ 0.35, 0.49 ], [ 0.3, 0.58 ], [ 0.0, 0.58 ]
]

// Short flared capelet draping over the shoulders and chest (y = 0.75 to 1.07)
const CAPELET = [
    [ 0.35, 0.75 ], [ 0.44, 0.75 ], [ 0.43, 0.85 ], [ 0.38, 0.96 ], [ 0.26, 1.05 ], [ 0.17, 1.07 ], [ 0.17, 1.02 ], [ 0.34, 0.77 ]
]

export function createFrieren()
{
    const m = makeMaterials()

    const root = new Group()
    root.name = 'frieren'
    const body = new Group()
    root.add( body )

    // Dark tights + tall brown boots with gold cuff trim standing on the flower bed
    for( const side of [ - 1, 1 ] )
    {
        mesh( new CylinderGeometry( 0.112, 0.102, 0.32, 24 ), m.tights, body, v3( side * 0.125, 0.27, 0 ) )
        mesh( new CylinderGeometry( 0.124, 0.116, 0.16, 24 ), m.boot, body, v3( side * 0.13, 0.13, 0 ) )
        mesh( new TorusGeometry( 0.122, 0.018, 10, 24 ), m.gold, body, v3( side * 0.13, 0.21, 0 ) ).rotation.x = Math.PI / 2
        mesh( new SphereGeometry( 1, 24, 16 ), m.boot, body, v3( side * 0.135, 0.06, 0.055 ), v3( 0.135, 0.082, 0.21 ) )
    }

    // Flared white skirt with gold stripe border
    const skirt = mesh( new LatheGeometry( SKIRT.map( ( [ r, y ] ) => new Vector2( r, y ) ), 40 ), m.cape, body )
    skirt.scale.set( 1, 1, 0.85 )
    const skirtGold = mesh( new TorusGeometry( 0.402, 0.02, 12, 44 ), m.gold, body, v3( 0, 0.345, 0 ) )
    skirtGold.rotation.x = Math.PI / 2
    skirtGold.scale.set( 1, 0.85, 1 )
    const skirtTrim = mesh( new TorusGeometry( 0.415, 0.014, 12, 44 ), m.trim, body, v3( 0, 0.312, 0 ) )
    skirtTrim.rotation.x = Math.PI / 2
    skirtTrim.scale.set( 1, 0.85, 1 )

    // Waist torso + dark leather belt with gold buckle
    const torso = mesh( new LatheGeometry( TORSO.map( ( [ r, y ] ) => new Vector2( r, y ) ), 40 ), m.cape, body )
    torso.scale.set( 1, 1, TORSO_DEPTH )

    const belt = mesh( new TorusGeometry( 0.315, 0.036, 12, 44 ), m.trim, body, v3( 0, 0.58, 0 ) )
    belt.rotation.x = Math.PI / 2
    belt.scale.set( 1, 0.84, 1 )
    mesh( new RoundedBoxGeometry( 0.095, 0.088, 0.04, 2, 0.015 ), m.gold, body, v3( 0, 0.58, 0.275 ) )

    // White shoulder capelet with gold border and dark edge trim
    const capelet = mesh( new LatheGeometry( CAPELET.map( ( [ r, y ] ) => new Vector2( r, y ) ), 40 ), m.cape, body )
    capelet.scale.set( 1, 1, 0.86 )

    const capeGold = mesh( new TorusGeometry( 0.432, 0.02, 12, 48 ), m.gold, body, v3( 0, 0.785, 0 ) )
    capeGold.rotation.x = Math.PI / 2
    capeGold.scale.set( 1, 0.86, 1 )

    const capeTrim = mesh( new TorusGeometry( 0.438, 0.015, 12, 48 ), m.trim, body, v3( 0, 0.755, 0 ) )
    capeTrim.rotation.x = Math.PI / 2
    capeTrim.scale.set( 1, 0.86, 1 )

    // High collar + dark center opening + red gem brooch & short ribbon ties
    mesh( new CylinderGeometry( 0.22, 0.2, 0.14, 32 ), m.cape, body, v3( 0, 1.07, 0 ), v3( 1, 1, 0.88 ) )
    const collarGold = mesh( new TorusGeometry( 0.22, 0.018, 10, 32 ), m.gold, body, v3( 0, 1.13, 0 ) )
    collarGold.rotation.x = Math.PI / 2
    collarGold.scale.set( 1, 0.88, 1 )

    // Center seam of the capelet + red brooch at the throat
    stroke( [ v3( 0, 0.96, 0.33 ), v3( 0, 0.86, 0.365 ), v3( 0, 0.755, 0.382 ) ], 0.014, m.trim, body )
    mesh( new SphereGeometry( 0.052, 16, 12 ), m.gold, body, v3( 0, 0.96, 0.335 ), v3( 1.1, 1.25, 0.65 ) )
    mesh( new SphereGeometry( 0.038, 16, 12 ), m.gem, body, v3( 0, 0.96, 0.352 ), v3( 0.95, 1.15, 0.65 ) )
    for( const side of [ - 1, 1 ] )
    {
        stroke( [
            v3( side * 0.015, 0.92, 0.348 ),
            v3( side * 0.042, 0.86, 0.368 ),
        ], 0.016, m.gem, body )
    }

    mesh( new CylinderGeometry( 0.1, 0.11, 0.16, 20 ), m.skin, body, v3( 0, 1.1, 0 ) )

    const arms = { left: buildArm( - 1, body, m ), right: buildArm( 1, body, m ) }
    buildStaff( arms.right.elbow, m )

    const neck = new Group()
    neck.position.set( 0, 1.12, 0 )
    body.add( neck )
    const head = new Group()
    head.position.set( 0, 0.48, 0.02 )
    neck.add( head )
    mesh( skullGeometry(), m.skin, head )

    const { hair, spikes } = buildHair( head, m )
    const { eyes } = buildFace( head, m )

    // Right hand holds her staff out beside her; left hand is lightly raised toward the grimoire
    const armRest = {
        left: { shoulderX: - 0.55, shoulderZ: - 0.34, elbowX: - 0.82 },
        right: { shoulderX: - 0.42, shoulderZ: 0.46, elbowX: - 0.48 },
    }

    const pickables = []
    root.traverse( ( o ) => { if( o.isMesh ) pickables.push( o ) } )

    return {
        root, body, neck, head, hair, spikes, eyes, arms, tail: null, armRest, pickables, materials: m,
        waveSide: - 1, bobScale: 0.75, jumpScale: 0.9,
        wavePose: { shoulderZ: 2.15, shoulderX: - 0.15, elbowX: - 0.85 }
    }
}

// ── Blue-Moon Weed meadow mound, open Grimoire & Zoltraak magic circles ─────

const seeded = ( seed ) => () => ( seed = ( seed * 16807 ) % 2147483647 ) / 2147483647

const wobbly = ( amount, speed, frequency ) => positionLocal.add(
    normalLocal.mul( mx_noise_float( positionLocal.mul( frequency ).add( light.time.mul( speed ) ) ).mul( amount ) )
)

const MOUND_SQUASH = 0.44
const MOUND_PUFFS = [
    [ 0, - 0.56, 0, 0.64 ], [ 0.56, - 0.6, 0.1, 0.5 ], [ - 0.58, - 0.58, 0.08, 0.52 ],
    [ 0.26, - 0.54, 0.44, 0.44 ], [ - 0.28, - 0.55, 0.42, 0.43 ], [ 0.24, - 0.56, - 0.44, 0.44 ],
    [ - 0.3, - 0.56, - 0.42, 0.43 ], [ 0.92, - 0.68, - 0.04, 0.36 ], [ - 0.94, - 0.66, - 0.04, 0.38 ],
]

function moundGeometry( puffs, squashY = MOUND_SQUASH )
{
    const parts = puffs.map( ( [ x, y, z, r ] ) =>
    {
        const g = new SphereGeometry( r, 24, 18 )
        g.scale( 1, squashY, 1 )
        g.translate( x, y * squashY, z )
        return g
    } )
    return mergeGeometries( parts )
}

function moundSurfaceY( x, z )
{
    let top = - 0.18
    for( const [ px, py, pz, r ] of MOUND_PUFFS )
    {
        const d2 = ( x - px ) * ( x - px ) + ( z - pz ) * ( z - pz )
        if( d2 < r * r )
        {
            const h = ( py + Math.sqrt( r * r - d2 ) ) * MOUND_SQUASH
            if( h > top ) top = h
        }
    }
    return top
}

/** Lush 5-petal Blue-Moon Weed blossoms + golden centers + leaves carpeting the mound surface. */
function buildBlossoms( group )
{
    const bluePetalMat = paintedMaterial( {
        color: '#52beff',
        shade: '#2652d6',
        highlight: '#e6f9ff',
        rim: 0.85,
        gloss: 0.75,
        scale: 3,
        terminator: 0.38,
    } )
    const palePetalMat = paintedMaterial( {
        color: '#b4ecff',
        shade: '#5282ec',
        highlight: '#ffffff',
        rim: 0.85,
        gloss: 0.8,
        scale: 3,
        terminator: 0.38,
    } )
    const centerMat = paintedMaterial( { color: '#ffd84a', shade: '#c87a28', highlight: '#fff8c4', gloss: 0.9, scale: 3 } )
    const leafMat = paintedMaterial( { color: '#349862', shade: '#174e46', highlight: '#84e296', scale: 2.5 } )

    const rand = seeded( 29 )
    const blueGeoms = []
    const paleGeoms = []
    const centerGeoms = []
    const leafGeoms = []

    // Rich carpet of Blue-Moon Weed flowers across the entire meadow knoll around her boots
    const spots = [
        [ - 0.38, 0.34, 1.25 ], [ 0.02, 0.42, 1.3 ], [ 0.36, 0.35, 1.25 ],
        [ - 0.68, 0.24, 1.2 ], [ 0.66, 0.25, 1.2 ], [ - 0.52, 0.56, 1.15 ],
        [ 0.52, 0.54, 1.15 ], [ - 0.18, 0.66, 1.1 ], [ 0.22, 0.64, 1.12 ],
        [ - 0.88, 0.04, 1.15 ], [ 0.88, 0.05, 1.15 ], [ - 0.44, - 0.04, 1.1 ],
        [ 0.44, - 0.02, 1.1 ], [ - 0.72, - 0.28, 1.08 ], [ 0.72, - 0.26, 1.08 ],
        [ - 0.36, - 0.44, 1.05 ], [ 0.36, - 0.42, 1.05 ], [ 0.0, - 0.52, 1.05 ],
        [ - 1.06, - 0.12, 1.0 ], [ 1.06, - 0.1, 1.0 ], [ - 0.84, 0.38, 1.02 ],
        [ 0.82, 0.36, 1.02 ], [ - 0.22, 0.22, 1.05 ], [ 0.24, 0.22, 1.05 ],
        [ - 0.62, - 0.54, 0.95 ], [ 0.62, - 0.52, 0.95 ], [ 0.0, 0.76, 0.98 ],
        [ - 1.16, 0.12, 0.92 ],
    ]

    for( let idx = 0; idx < spots.length; idx++ )
    {
        const [ x, z, scale ] = spots[ idx ]
        const y = moundSurfaceY( x, z )
        const rotY = rand() * Math.PI * 2
        const tiltX = ( z * 0.26 ) + ( rand() - 0.5 ) * 0.14
        const tiltZ = - ( x * 0.22 ) + ( rand() - 0.5 ) * 0.14
        const s = 0.135 * scale

        for( let p = 0; p < 5; p++ )
        {
            const a = rotY + ( p / 5 ) * Math.PI * 2
            const petal = new SphereGeometry( 1, 10, 8 )
            petal.scale( s * 0.48, s * 0.17, s * 0.86 )
            petal.rotateX( 0.2 )
            petal.translate( 0, 0, s * 0.7 )
            petal.rotateY( a )
            petal.rotateX( tiltX )
            petal.rotateZ( tiltZ )
            petal.translate( x, y + 0.024, z )
            if( idx % 3 === 0 ) paleGeoms.push( petal )
            else blueGeoms.push( petal )
        }

        const c = new SphereGeometry( s * 0.35, 10, 8 )
        c.scale( 1, 0.68, 1 )
        c.translate( x, y + 0.038, z )
        centerGeoms.push( c )

        for( let l = 0; l < 2; l++ )
        {
            const la = rotY + l * 2.4 + 0.5
            const leaf = new SphereGeometry( 1, 8, 6 )
            leaf.scale( s * 0.4, s * 0.1, s * 0.95 )
            leaf.translate( 0, 0, s * 0.82 )
            leaf.rotateY( la )
            leaf.translate( x, y + 0.006, z )
            leafGeoms.push( leaf )
        }
    }

    const blueMesh = mesh( mergeGeometries( blueGeoms ), bluePetalMat, group )
    const paleMesh = mesh( mergeGeometries( paleGeoms ), palePetalMat, group )
    mesh( mergeGeometries( centerGeoms ), centerMat, group )
    mesh( mergeGeometries( leafGeoms ), leafMat, group )

    return [ blueMesh, paleMesh ]
}

/** An open floating grimoire with flapping pages and gold corner fittings. */
function buildGrimoire( parent )
{
    const bookGroup = new Group()
    bookGroup.position.set( - 0.98, 0.78, 0.42 )
    bookGroup.rotation.set( 0.55, 0.48, - 0.18 )
    parent.add( bookGroup )

    const coverMat = paintedMaterial( { color: '#7c2238', shade: '#3c0e26', highlight: '#d85c74', gloss: 0.75, scale: 2.5 } )
    const goldMat = paintedMaterial( { color: '#f0bc42', shade: '#9e6224', highlight: '#fff2b2', gloss: 1, scale: 3 } )
    const pageMat = paintedMaterial( { color: '#fbf2dc', shade: '#c8b6ce', highlight: '#ffffff', scale: 2.5, rim: 0.3 } )
    const runeMat = paintedMaterial( { color: '#3b6ee2', unlit: true } )

    // Spine
    const spine = mesh( new RoundedBoxGeometry( 0.07, 0.06, 0.46, 2, 0.015 ), coverMat, bookGroup )
    mesh( new BoxGeometry( 0.08, 0.065, 0.06 ), goldMat, bookGroup, v3( 0, 0, 0.18 ) )
    mesh( new BoxGeometry( 0.08, 0.065, 0.06 ), goldMat, bookGroup, v3( 0, 0, - 0.18 ) )

    const wings = []
    for( const side of [ - 1, 1 ] )
    {
        const wing = new Group()
        wing.position.set( side * 0.025, 0.01, 0 )
        bookGroup.add( wing )

        mesh( new RoundedBoxGeometry( 0.34, 0.024, 0.46, 2, 0.01 ), coverMat, wing, v3( side * 0.17, - 0.012, 0 ) )
        mesh( new RoundedBoxGeometry( 0.31, 0.032, 0.42, 2, 0.01 ), pageMat, wing, v3( side * 0.16, 0.012, 0 ) )
        // Gold corner trim
        mesh( new BoxGeometry( 0.07, 0.03, 0.07 ), goldMat, wing, v3( side * 0.31, - 0.012, 0.2 ) )
        mesh( new BoxGeometry( 0.07, 0.03, 0.07 ), goldMat, wing, v3( side * 0.31, - 0.012, - 0.2 ) )

        // Glowing blue spell lines & magic circle diagram on the open pages
        for( let r = 0; r < 4; r++ )
        {
            const w = 0.16 + ( ( r * 3 ) % 3 ) * 0.03
            mesh( new BoxGeometry( w, 0.004, 0.016 ), runeMat, wing, v3( side * 0.16, 0.03, - 0.11 + r * 0.07 ) )
        }
        wings.push( { wing, side } )
    }

    return { bookGroup, spine, wings }
}

/** Zoltraak geometric spell mandala: concentric rings, inscribed star polygon, and rune ticks. */
function buildSpellCircle( radius, mat )
{
    const parts = []
    parts.push( new RingGeometry( radius * 0.94, radius, 64 ) )
    parts.push( new RingGeometry( radius * 0.72, radius * 0.76, 64 ) )
    parts.push( new RingGeometry( radius * 0.34, radius * 0.38, 48 ) )

    // Two interlocked triangles (hexagram) inside the outer ring
    for( const offset of [ 0, Math.PI / 3 ] )
    {
        for( let i = 0; i < 3; i++ )
        {
            const a0 = offset + ( i / 3 ) * Math.PI * 2
            const a1 = offset + ( ( i + 1 ) / 3 ) * Math.PI * 2
            const r = radius * 0.74
            const x0 = Math.cos( a0 ) * r, y0 = Math.sin( a0 ) * r
            const x1 = Math.cos( a1 ) * r, y1 = Math.sin( a1 ) * r
            const len = Math.hypot( x1 - x0, y1 - y0 )
            const bar = new BoxGeometry( len, radius * 0.028, 0.004 )
            bar.rotateZ( Math.atan2( y1 - y0, x1 - x0 ) )
            bar.translate( ( x0 + x1 ) / 2, ( y0 + y1 ) / 2, 0 )
            parts.push( bar )
        }
    }

    // Radial rune ticks between the inner and outer rings
    const ticks = 18
    for( let i = 0; i < ticks; i++ )
    {
        const a = ( i / ticks ) * Math.PI * 2
        const rMid = radius * 0.85
        const tick = new BoxGeometry( radius * ( i % 3 === 0 ? 0.11 : 0.06 ), radius * 0.024, 0.004 )
        tick.rotateZ( a )
        tick.translate( Math.cos( a ) * rMid, Math.sin( a ) * rMid, 0 )
        parts.push( tick )
    }

    return new Mesh( mergeGeometries( parts ), mat )
}

const smooth = ( t ) => t * t * ( 3 - 2 * t )

export function createFlowerField()
{
    const group = new Group()
    group.name = 'flower-field'

    // Lush mossy meadow mound sized so her boots rest cleanly on top
    const grassMaterial = paintedMaterial( {
        color: '#48b866',
        shade: '#1e6250',
        highlight: '#9ef08c',
        rim: 0.6,
        gloss: 0.4,
        scale: 1.8,
        terminator: 0.4,
        positionNode: wobbly( 0.025, 0.55, 2.0 ),
    } )

    const moundBody = moundGeometry( MOUND_PUFFS )
    const main = new Mesh( moundBody, grassMaterial )
    group.add( main )

    // Small rounded mossy border puffs (no long tail sticking out to the side)
    const trailBody = moundGeometry( [
        [ - 1.12, - 0.72, - 0.25, 0.28 ], [ 1.1, - 0.72, - 0.28, 0.26 ],
    ] )
    const tail = new Mesh( trailBody, grassMaterial )
    group.add( tail )

    const blossomMeshes = buildBlossoms( group )
    const grimoire = buildGrimoire( group )

    // Soft bioluminescent glow on the flower bed (brightens in Zoltraak mode)
    const bedGlow = new Sprite( glowMaterial( SpriteNodeMaterial, '#62d8ff', { strength: 0.45, power: 1.4 } ) )
    bedGlow.position.set( 0, 0.08, 0.1 )
    bedGlow.scale.setScalar( 2.6 )
    group.add( bedGlow )

    // Ground magic circle encircling the flower mound (unfurls in Zoltraak mood)
    const ringMat = new MeshBasicNodeMaterial( { side: DoubleSide, transparent: true, depthWrite: false } )
    ringMat.colorNode = meadowLook.ring
    const groundCircle = buildSpellCircle( 1.48, ringMat )
    groundCircle.rotation.x = - Math.PI / 2
    groundCircle.position.y = - 0.02
    group.add( groundCircle )

    // Grand arcane mandala halo behind Frieren in Zoltraak mode (frames her without covering her face)
    const backMandala = buildSpellCircle( 1.16, ringMat )
    backMandala.position.set( 0.06, 1.18, - 0.56 )
    group.add( backMandala )

    // Focused Zoltraak spell seal & mana core out beside her staff tip (clear of her face)
    const zoltraak = new Group()
    zoltraak.position.set( 1.06, 1.42, 0.28 )
    zoltraak.rotation.set( 0.08, - 0.34, 0 )
    group.add( zoltraak )

    const outerMandala = buildSpellCircle( 0.52, ringMat )
    const innerMandala = buildSpellCircle( 0.32, ringMat )
    innerMandala.position.z = 0.12
    zoltraak.add( outerMandala, innerMandala )

    // Glowing Zoltraak mana core at the center of the staff spell seal
    const coreMat = new MeshBasicNodeMaterial()
    const facing = normalView.z.clamp( 0, 1 ).add( mx_noise_float( positionLocal.mul( 6 ).add( light.time.mul( 1.6 ) ) ).mul( 0.2 ) )
    coreMat.colorNode = mix(
        mix( uniform( new Color( '#1a5ce6' ) ), uniform( new Color( '#66e8ff' ) ), smoothstep( 0.05, 0.55, facing ) ),
        uniform( new Color( '#f2feff' ) ),
        smoothstep( 0.6, 0.95, facing )
    )
    const manaCore = mesh( new SphereGeometry( 0.12, 24, 18 ), coreMat, zoltraak, v3( 0, 0, 0.05 ) )
    const manaHalo = new Sprite( glowMaterial( SpriteNodeMaterial, '#6ae8ff', { strength: 0.9, power: 1.3 } ) )
    manaHalo.scale.setScalar( 1.15 )
    zoltraak.add( manaHalo )

    // Backdrop: drifting Blue-Moon Weed petals & mana motes floating through the air
    const backdrop = new Group()
    backdrop.name = 'meadow-backdrop'
    const petalMat = new MeshBasicNodeMaterial( { side: DoubleSide } )
    petalMat.colorNode = meadowLook.petal

    const petalShape = new Shape()
    petalShape.moveTo( 0, - 0.06 )
    petalShape.quadraticCurveTo( 0.045, 0, 0, 0.075 )
    petalShape.quadraticCurveTo( - 0.045, 0, 0, - 0.06 )
    const petalGeom = new ShapeGeometry( petalShape, 8 )

    const rand = seeded( 43 )
    const petals = []
    for( let i = 0; i < 26; i++ )
    {
        let x, y
        do
        {
            x = ( rand() * 2 - 1 ) * 3.6
            y = rand() * 3.8 - 0.6
        } while( Math.abs( x ) < 0.85 && y > 0.2 && y < 2.2 )

        const p = new Mesh( petalGeom, petalMat )
        const s = 0.75 + rand() * 0.95
        p.scale.setScalar( s )
        const base = v3( x, y, - 0.8 + ( rand() - 0.5 ) * 2.2 )
        p.position.copy( base )
        backdrop.add( p )
        petals.push( {
            mesh: p,
            base,
            speed: 0.55 + rand() * 0.8,
            phase: rand() * Math.PI * 2,
            spin: ( rand() - 0.5 ) * 1.8,
        } )
    }

    function update( t )
    {
        const m = smooth( meadowLook.mana.value )

        // Floating open grimoire bobs and gently flaps its pages
        grimoire.bookGroup.position.y = 0.78 + Math.sin( t * 1.8 ) * 0.055
        grimoire.bookGroup.rotation.z = - 0.18 + Math.sin( t * 1.2 ) * 0.04
        const flap = Math.sin( t * 2.6 ) * 0.09
        for( const { wing, side } of grimoire.wings )
            wing.rotation.z = - side * ( 0.14 + flap )

        // Zoltraak spell circles unfurl when mana > 0 (Zoltraak mood)
        const grow = smooth( Math.max( 0, ( m - 0.06 ) / 0.94 ) )
        const spellOn = grow > 0.003

        groundCircle.visible = spellOn
        groundCircle.rotation.z = t * 0.25
        groundCircle.scale.setScalar( Math.max( grow, 1e-3 ) * ( 1 + Math.sin( t * 2 ) * 0.02 ) )

        backMandala.visible = spellOn
        backMandala.rotation.z = - t * 0.32
        backMandala.scale.setScalar( Math.max( grow, 1e-3 ) * ( 1 + Math.sin( t * 3 ) * 0.02 ) )

        zoltraak.visible = spellOn
        zoltraak.scale.setScalar( Math.max( grow, 1e-3 ) * ( 1 + Math.sin( t * 5 ) * 0.03 ) )
        outerMandala.rotation.z = t * 0.65
        innerMandala.rotation.z = - t * 1.1

        bedGlow.scale.setScalar( 2.0 + m * 1.8 )

        // Drifting petals in the breeze
        for( const p of petals )
        {
            p.mesh.position.x = p.base.x + Math.sin( t * p.speed + p.phase ) * 0.28
            p.mesh.position.y = p.base.y + Math.cos( t * p.speed * 0.85 + p.phase ) * 0.22
            p.mesh.rotation.z = Math.sin( t * p.speed + p.phase ) * 0.6
            p.mesh.rotation.y = t * p.spin + p.phase
        }
    }

    const pickables = [ main, tail, ...blossomMeshes, grimoire.spine, manaCore ]
    return { group, main, tail, backdrop, pickables, update, material: grassMaterial }
}
