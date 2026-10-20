import {
    Group, Mesh, SphereGeometry, CapsuleGeometry, CylinderGeometry, TorusGeometry, ConeGeometry,
    LatheGeometry, TubeGeometry, CircleGeometry, ShapeGeometry,
    Shape, Vector2, Vector3, CatmullRomCurve3, Sprite, SpriteNodeMaterial, MeshBasicNodeMaterial,
    MathUtils, Color
} from 'three/webgpu'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

import { paintedMaterial } from '../materials/painted.js'
import {
    mesh, v3, sphereDir, skullRadius, skullGeometry, orient, spikeGeometry, onTorso, stroke,
    TORSO, TORSO_DEPTH, HAIR_RADIUS, UP, Z, deg
} from './character.js'
import { glowMaterial } from './glow.js'

// Ryomen Sukuna, the King of Curses, in his shirtless Domain look: swept-back
// spiky salmon-pink hair over a dark charcoal undercut, four glowing crimson
// eyes (the second slit pair sitting under the main ones, blinking with them),
// black cursed tattoo bands across his forehead, nose, cheeks, bare chest,
// shoulders, back and wrists, and loose white hakama trousers tied with a dark
// sash. He has no background environment and no mood switch; instead he cycles
// through three poses on his own (and leaps to the next whenever tapped):
//   0 — slouched mid-air King of Curses sit, chin propped on one hand
//   1 — standing Malevolent Shrine (Fukuma Mizushi) Enmaten hand sign
//   2 — leaning Cleave & Dismantle slash dash with crimson blade arcs

export const palette = {
    skin: '#ffe0cf',
    hair: '#f28c9a',
    undercut: '#2a2028',
    tattoo: '#19121c',
    hakama: '#eee8df',
    sash: '#1b1a28',
    zori: '#c89e6e',
    claw: '#381220',
    sclera: '#fff6f6',
    irisRing: '#8e1024',
    iris: '#e62238',
    irisLow: '#ff7868',
    pupil: '#18050a',
    lash: '#1e1018',
    brow: '#2c1822',
    mouth: '#681426',
    blush: '#f28e98',
    slashCore: '#fff2f6',
    slashEdge: '#e81c3c',
}

function makeMaterials()
{
    return {
        skin: paintedMaterial( { color: palette.skin, shade: '#e8968e', highlight: '#fff4ec', rim: 0.58, gloss: 0.28, scale: 2.4 } ),
        hair: paintedMaterial( { color: palette.hair, shade: '#b84a62', highlight: '#ffc6d0', rim: 0.72, gloss: 0.58, scale: 3.0, terminator: 0.46 } ),
        undercut: paintedMaterial( { color: palette.undercut, shade: '#0e0a12', highlight: '#524456', rim: 0.45, gloss: 0.35, scale: 3.2 } ),
        tattoo: paintedMaterial( { color: palette.tattoo, shade: '#09060c', highlight: '#382a42', rim: 0.15, gloss: 0.1, brush: 0.35, scale: 3 } ),
        hakama: paintedMaterial( { color: palette.hakama, shade: '#b8b0c4', highlight: '#ffffff', rim: 0.55, gloss: 0.25, scale: 2.8 } ),
        sash: paintedMaterial( { color: palette.sash, shade: '#0a0914', highlight: '#4c4a6e', rim: 0.5, gloss: 0.35, scale: 3 } ),
        zori: paintedMaterial( { color: palette.zori, shade: '#7a5236', highlight: '#f2d4a6', scale: 3 } ),
        claw: paintedMaterial( { color: palette.claw, shade: '#14060c', highlight: '#9e2844', gloss: 0.7, scale: 3 } ),
        sclera: paintedMaterial( { color: palette.sclera, shade: '#e2c0cc', rim: 0, gloss: 0, brush: 0.2, haze: 0 } ),
        irisRing: paintedMaterial( { color: palette.irisRing, unlit: true } ),
        iris: paintedMaterial( { color: palette.iris, unlit: true } ),
        irisLow: paintedMaterial( { color: palette.irisLow, unlit: true } ),
        pupil: paintedMaterial( { color: palette.pupil, unlit: true } ),
        lash: paintedMaterial( { color: palette.lash, shade: '#0c060c', rim: 0, gloss: 0, brush: 0.3, haze: 0.2 } ),
        brow: paintedMaterial( { color: palette.brow, shade: '#140a10', rim: 0, gloss: 0, brush: 0.3, haze: 0.2 } ),
        mouth: paintedMaterial( { color: palette.mouth, shade: '#380814', rim: 0, gloss: 0, brush: 0.3, haze: 0.25 } ),
        white: paintedMaterial( { color: '#ffffff', unlit: true } ),
        blush: paintedMaterial( { color: palette.blush, shade: '#d86878', rim: 0, gloss: 0, brush: 0.4 } ),
        slashCore: paintedMaterial( { color: palette.slashCore, unlit: true } ),
        slashEdge: paintedMaterial( { color: palette.slashEdge, shade: '#7a081e', highlight: '#ff96a8', gloss: 0.9, rim: 0.8, unlit: true } ),
    }
}

function buildHair( head, m )
{
    const hair = new Group()
    head.add( hair )

    // Dark shaved undercut wrapping the lower back skull, nape and side temples
    // Centered at the origin with a smaller radius than the pink crown cap so it
    // never pokes through the top/back of the pink hair, only extending below its rim.
    const undercutCap = mesh( new SphereGeometry( HAIR_RADIUS + 0.008, 44, 28, 0, Math.PI * 2, 0, 1.56 ), m.undercut, hair, null, v3( 1.015, 0.98, 0.99 ) )
    undercutCap.rotation.x = - 0.98

    // Salmon-pink crown cap reaching down to the upper hairline in front and mid-skull in back
    const cap = mesh( new SphereGeometry( HAIR_RADIUS + 0.034, 48, 32, 0, Math.PI * 2, 0, 1.48 ), m.hair, hair )
    cap.rotation.x = - 0.66
    cap.scale.set( 1.03, 1.01, 1.01 )

    const spikes = []
    const add = ( base, direction, length, radius, bend, curl, { inset = 0.46, flat = 0.54, fullness = 0.72, mat = m.hair, weight = length } = {} ) =>
    {
        const pivot = new Group()
        pivot.position.copy( base.clone().multiplyScalar( inset ) )
        orient( pivot, direction, curl )
        hair.add( pivot )
        mesh( spikeGeometry( length, radius, bend, flat, fullness ), mat, pivot )
        spikes.push( { pivot, rest: pivot.quaternion.clone(), weight } )
        return pivot
    }
    const at = ( yaw, pitch ) => sphereDir( yaw * deg, pitch * deg )
    const LEFT = v3( - 1, 0, 0 )
    const RIGHT = v3( 1, 0, 0 )
    const BACK = v3( 0, 0, - 1 )

    // Swept-back spiky crown tufts: fierce, jagged and fanning up and outward
    add( at( 0, 74 ), v3( 0.03, 1, - 0.25 ), 0.72, 0.22, 0.26, BACK )
    add( at( - 20, 70 ), v3( - 0.34, 1, - 0.20 ), 0.68, 0.21, 0.28, LEFT )
    add( at( 20, 70 ), v3( 0.36, 1, - 0.20 ), 0.68, 0.21, 0.28, RIGHT )
    add( at( - 44, 58 ), v3( - 0.76, 0.88, - 0.18 ), 0.64, 0.20, 0.3, UP )
    add( at( 44, 58 ), v3( 0.76, 0.88, - 0.18 ), 0.64, 0.20, 0.3, UP )
    add( at( - 66, 44 ), v3( - 0.96, 0.56, - 0.22 ), 0.58, 0.19, 0.3, UP )
    add( at( 66, 44 ), v3( 0.96, 0.56, - 0.22 ), 0.58, 0.19, 0.3, UP )
    add( at( - 86, 28 ), v3( - 1, 0.26, - 0.30 ), 0.52, 0.18, 0.28, UP )
    add( at( 86, 28 ), v3( 1, 0.26, - 0.30 ), 0.52, 0.18, 0.28, UP )

    // Swept-up front hairline spikes rooted right along the upper forehead so the hairline is jagged pink
    add( at( 0, 46 ), v3( 0.02, 0.96, 0.12 ), 0.52, 0.18, 0.22, BACK, { inset: 0.49, flat: 0.48 } )
    add( at( - 15, 45 ), v3( - 0.26, 0.94, 0.14 ), 0.50, 0.17, 0.24, LEFT, { inset: 0.49, flat: 0.48 } )
    add( at( 15, 45 ), v3( 0.26, 0.94, 0.14 ), 0.50, 0.17, 0.24, RIGHT, { inset: 0.49, flat: 0.48 } )
    add( at( - 32, 42 ), v3( - 0.54, 0.84, 0.12 ), 0.48, 0.17, 0.24, LEFT, { inset: 0.50, flat: 0.48 } )
    add( at( 32, 42 ), v3( 0.54, 0.84, 0.12 ), 0.48, 0.17, 0.24, RIGHT, { inset: 0.50, flat: 0.48 } )
    add( at( - 48, 36 ), v3( - 0.78, 0.68, 0.08 ), 0.46, 0.16, 0.24, LEFT, { inset: 0.50, flat: 0.46 } )
    add( at( 48, 36 ), v3( 0.78, 0.68, 0.08 ), 0.46, 0.16, 0.24, RIGHT, { inset: 0.50, flat: 0.46 } )

    // Two signature loose salmon-pink front strands dipping down near the outer brows
    for( const side of [ - 1, 1 ] )
    {
        const n = at( side * 38, 38 )
        const down = UP.clone().sub( n.clone().multiplyScalar( n.y ) ).normalize().negate()
        const dir = down.clone().sub( n.clone().multiplyScalar( 0.36 ) ).add( v3( side * 0.12, 0, 0.12 ) )
        add( n, dir, 0.38, 0.095, 0.16, v3( side, 0, 0 ), { inset: 0.57, flat: 0.38, fullness: 0.58, weight: 0.3 } )
    }

    // Back spikes flaring out above the dark undercut
    for( const [ yaw, pitch, len, r ] of [
        [ 180, 56, 0.62, 0.22 ],
        [ - 146, 48, 0.58, 0.21 ],
        [ 146, 48, 0.58, 0.21 ],
        [ - 120, 36, 0.52, 0.19 ],
        [ 120, 36, 0.52, 0.19 ],
        [ 162, 26, 0.48, 0.2 ],
        [ - 162, 26, 0.48, 0.2 ],
    ] )
    {
        const n = at( yaw, pitch )
        add( n, v3( n.x * 0.75, 0.55, - 0.85 ), len, r, 0.24, UP, { inset: 0.48, flat: 0.46 } )
    }

    // Short dark undercut tufts flaring out along the side temples above the ears
    for( const [ yaw, pitch ] of [
        [ - 72, 18 ], [ 72, 18 ],
        [ - 84, 10 ], [ 84, 10 ],
        [ - 98, 2 ], [ 98, 2 ],
    ] )
    {
        const n = at( yaw, pitch )
        add( n, v3( Math.sign( n.x ) * 0.92, 0.22, - 0.28 ), 0.28, 0.125, 0.16, UP, { inset: 0.56, flat: 0.44, mat: m.undercut, weight: 0.14 } )
    }

    // Short dark undercut tufts sweeping down behind the ears and across the nape
    for( const [ yaw, pitch ] of [
        [ - 124, - 6 ], [ 124, - 6 ],
        [ - 148, - 10 ], [ 148, - 10 ],
        [ - 170, - 12 ], [ 170, - 12 ],
    ] )
    {
        const n = at( yaw, pitch )
        add( n, v3( n.x * 0.45, - 0.72, - 0.65 ), 0.28, 0.135, 0.14, UP, { inset: 0.52, flat: 0.42, mat: m.undercut, weight: 0.14 } )
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

    const headMark = ( points, radius ) =>
    {
        const curvePoints = points.map( ( [ yaw, pitch, lift = 0.005 ] ) =>
        {
            const d = sphereDir( yaw, pitch )
            return d.multiplyScalar( skullRadius( d ) + lift )
        } )
        return stroke( curvePoints, radius, m.tattoo, head )
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
        // Primary crimson eyes: sharp, glowing red iris with a slit pupil and bold upper lash
        const eye = new Group()
        part( m.sclera, [ 0.112, 0.108, 0.048 ], [ 0, 0, 0 ], eye )
        part( m.irisRing, [ 0.088, 0.092, 0.03 ], [ side * 0.003, - 0.002, 0.025 ], eye )
        part( m.iris, [ 0.074, 0.078, 0.03 ], [ side * 0.003, - 0.004, 0.033 ], eye )
        part( m.irisLow, [ 0.056, 0.032, 0.02 ], [ side * 0.003, - 0.042, 0.05 ], eye )
        part( m.pupil, [ 0.02, 0.048, 0.02 ], [ side * 0.003, 0.004, 0.056 ], eye )
        part( m.white, [ 0.03, 0.034, 0.015 ], [ side * 0.028, 0.034, 0.07 ], eye )
        part( m.white, [ 0.013, 0.013, 0.01 ], [ - side * 0.032, - 0.034, 0.07 ], eye )

        // Fierce angled upper lash line sweeping out to a sharp wing
        const lash = [
            [ - 0.112, 0.018 ],
            [ - 0.05, 0.086 ],
            [ 0.03, 0.098 ],
            [ 0.105, 0.076 ],
            [ 0.142, 0.096 ],
        ].map( ( [ x, y ] ) => v3( x * side, y, 0.022 ) )
        eye.add( new Mesh( new TubeGeometry( new CatmullRomCurve3( lash ), 28, 0.018, 8 ), m.lash ) )

        const lower = [ [ - 0.06, - 0.092 ], [ 0.02, - 0.098 ], [ 0.095, - 0.074 ] ].map( ( [ x, y ] ) => v3( x * side, y, 0.016 ) )
        eye.add( new Mesh( new TubeGeometry( new CatmullRomCurve3( lower ), 12, 0.007, 6 ), m.lash ) )

        place( eye, side * 0.34, - 0.05, 0.018, - side * 0.05 )
        eyes.push( eye )

        // Secondary cursed slit eye beneath each main eye on the upper cheek (all 4 blink together!)
        const subEye = new Group()
        part( m.sclera, [ 0.072, 0.030, 0.026 ], [ 0, 0, 0 ], subEye )
        part( m.irisRing, [ 0.050, 0.026, 0.022 ], [ 0, 0, 0.012 ], subEye )
        part( m.iris, [ 0.042, 0.024, 0.022 ], [ 0, 0, 0.016 ], subEye )
        part( m.pupil, [ 0.013, 0.023, 0.018 ], [ 0, 0, 0.028 ], subEye )
        part( m.white, [ 0.012, 0.011, 0.012 ], [ side * 0.014, 0.006, 0.036 ], subEye )
        const subLidTop = [ [ - 0.074, - 0.004 ], [ 0, 0.026 ], [ 0.078, 0.008 ] ].map( ( [ x, y ] ) => v3( x * side, y, 0.015 ) )
        const subLidBot = [ [ - 0.068, - 0.008 ], [ 0, - 0.026 ], [ 0.072, - 0.004 ] ].map( ( [ x, y ] ) => v3( x * side, y, 0.013 ) )
        subEye.add( new Mesh( new TubeGeometry( new CatmullRomCurve3( subLidTop ), 16, 0.009, 6 ), m.lash ) )
        subEye.add( new Mesh( new TubeGeometry( new CatmullRomCurve3( subLidBot ), 14, 0.007, 6 ), m.lash ) )
        place( subEye, side * 0.40, - 0.245, 0.012, side * 0.20 )
        eyes.push( subEye )

        // Sharp, furrowed brows angled down toward the bridge of the nose
        const brow = [
            [ - 0.095, - 0.028 ],
            [ - 0.02, 0.01 ],
            [ 0.085, 0.034 ],
        ].map( ( [ x, y ] ) => v3( x * side, y, 0 ) )
        place( new Mesh( new TubeGeometry( new CatmullRomCurve3( brow ), 18, 0.015, 8 ), m.brow ), side * 0.32, 0.145, 0.004 )

        // Cheek/jaw cursed tattoo arcs sweeping from outer temple down the cheekbone
        headMark( [
            [ side * 0.62, 0.04, 0.007 ],
            [ side * 0.60, - 0.12, 0.007 ],
            [ side * 0.54, - 0.28, 0.007 ],
            [ side * 0.44, - 0.40, 0.007 ],
        ], 0.0125 )
        headMark( [
            [ side * 0.68, - 0.06, 0.007 ],
            [ side * 0.63, - 0.22, 0.007 ],
            [ side * 0.54, - 0.36, 0.007 ],
        ], 0.0105 )

        // Ears with subtle inner fold
        const ear = new Mesh( sphere, m.skin )
        ear.scale.set( 0.072, 0.125, 0.09 )
        ear.position.set( side * 0.56, - 0.06, - 0.03 )
        head.add( ear )
    }

    // Twin horizontal cursed bands across the forehead
    headMark( [
        [ - 0.39, 0.32, 0.007 ], [ - 0.19, 0.35, 0.007 ], [ 0, 0.36, 0.007 ], [ 0.19, 0.35, 0.007 ], [ 0.39, 0.32, 0.007 ]
    ], 0.0135 )
    headMark( [
        [ - 0.33, 0.23, 0.007 ], [ - 0.16, 0.255, 0.007 ], [ 0, 0.265, 0.007 ], [ 0.16, 0.255, 0.007 ], [ 0.33, 0.23, 0.007 ]
    ], 0.012 )

    // Vertical cursed stripe down the bridge of the nose
    headMark( [
        [ 0, 0.06, 0.009 ], [ 0, - 0.02, 0.011 ], [ 0, - 0.10, 0.014 ]
    ], 0.0115 )

    const nose = new Mesh( sphere, m.skin )
    nose.scale.set( 0.028, 0.022, 0.025 )
    place( nose, 0, - 0.13, 0.012 )

    // Sinister, arrogant wide smirk with two tiny sharp white fangs at the corners
    const smirk = new Shape()
    smirk.moveTo( - 0.088, 0.018 )
    smirk.quadraticCurveTo( 0.0, - 0.016, 0.098, 0.034 )
    smirk.quadraticCurveTo( 0.048, - 0.056, - 0.01, - 0.048 )
    smirk.quadraticCurveTo( - 0.064, - 0.038, - 0.088, 0.018 )
    const mouthGroup = place( new Group(), 0.015, - 0.28, - 0.005 )
    mesh( new ShapeGeometry( smirk, 20 ), m.mouth, mouthGroup )

    // Upper lip line and fangs
    const lipPts = [ v3( - 0.092, 0.02, 0.004 ), v3( - 0.03, - 0.002, 0.006 ), v3( 0.035, 0.005, 0.006 ), v3( 0.102, 0.036, 0.004 ) ]
    stroke( lipPts, 0.0075, m.lash, mouthGroup )

    for( const [ fx, fy, rot ] of [ [ - 0.052, 0.004, 0.12 ], [ 0.058, 0.014, - 0.18 ] ] )
    {
        const fang = mesh( new ConeGeometry( 0.012, 0.026, 8 ), m.white, mouthGroup, v3( fx, fy - 0.01, 0.005 ) )
        fang.rotation.z = Math.PI + rot
    }

    return { eyes }
}

function buildBodyTattoos( body, m )
{
    const torsoStroke = ( pts, radius, face = 1 ) =>
        stroke( pts.map( ( [ x, y ] ) => onTorso( x, y, face, 0.008 ) ), radius, m.tattoo, body )

    const torsoDot = ( cx, cy, radius, face = 1 ) =>
    {
        const g = new CircleGeometry( radius, 24 )
        const pos = g.attributes.position
        for( let i = 0; i < pos.count; i++ )
        {
            const p = onTorso( cx + face * pos.getX( i ), cy + pos.getY( i ), face, 0.009 )
            pos.setXYZ( i, p.x, p.y, p.z )
        }
        g.computeVertexNormals()
        return mesh( g, m.tattoo, body )
    }

    // Collarbone / upper pectoral cursed bar + solid circle terminals beneath each side
    torsoStroke( [ [ - 0.23, 0.95 ], [ - 0.11, 0.92 ], [ 0, 0.91 ], [ 0.11, 0.92 ], [ 0.23, 0.95 ] ], 0.014, 1 )
    for( const side of [ - 1, 1 ] )
    {
        torsoDot( side * 0.155, 0.865, 0.026, 1 )
        // Symmetric pectoral and rib markings
        torsoStroke( [ [ side * 0.045, 0.81 ], [ side * 0.15, 0.805 ], [ side * 0.26, 0.825 ] ], 0.0135, 1 )
        torsoStroke( [ [ side * 0.05, 0.72 ], [ side * 0.15, 0.715 ], [ side * 0.25, 0.735 ] ], 0.012, 1 )
        torsoStroke( [ [ side * 0.05, 0.64 ], [ side * 0.14, 0.635 ], [ side * 0.23, 0.65 ] ], 0.011, 1 )
    }

    // Center sternum / stomach vertical line
    torsoStroke( [ [ 0, 0.89 ], [ 0, 0.76 ], [ 0, 0.61 ] ], 0.0105, 1 )

    // Back shoulder-blade and spine cursed markings (visible when orbiting behind him)
    torsoStroke( [ [ - 0.22, 0.93 ], [ - 0.1, 0.90 ], [ 0, 0.89 ], [ 0.1, 0.90 ], [ 0.22, 0.93 ] ], 0.0135, - 1 )
    torsoStroke( [ [ 0, 0.95 ], [ 0, 0.78 ], [ 0, 0.63 ] ], 0.011, - 1 )
    for( const side of [ - 1, 1 ] )
    {
        torsoDot( side * 0.14, 0.84, 0.024, - 1 )
        torsoStroke( [ [ side * 0.05, 0.77 ], [ side * 0.15, 0.76 ], [ side * 0.24, 0.79 ] ], 0.0125, - 1 )
        torsoStroke( [ [ side * 0.05, 0.68 ], [ side * 0.14, 0.67 ], [ side * 0.22, 0.70 ] ], 0.011, - 1 )
    }
}

function buildArm( side, parent, m )
{
    const shoulder = new Group()
    shoulder.position.set( side * 0.305, 0.92, 0 )
    parent.add( shoulder )

    // Bare muscular chibi deltoid & upper arm
    mesh( new SphereGeometry( 0.118, 24, 16 ), m.skin, shoulder, v3( 0, - 0.02, 0 ), v3( 1, 1.08, 0.96 ) )
    mesh( new CapsuleGeometry( 0.076, 0.16, 6, 14 ), m.skin, shoulder, v3( 0, - 0.16, 0 ) )

    // Double black cursed tattoo bands around the upper arm
    for( const y of [ - 0.105, - 0.155 ] )
    {
        const ring = mesh( new TorusGeometry( 0.079, 0.012, 8, 28 ), m.tattoo, shoulder, v3( 0, y, 0 ) )
        ring.rotation.x = Math.PI / 2
    }

    const elbow = new Group()
    elbow.position.set( 0, - 0.27, 0 )
    shoulder.add( elbow )
    mesh( new CapsuleGeometry( 0.072, 0.16, 6, 14 ), m.skin, elbow, v3( 0, - 0.1, 0 ) )

    // Double black cursed tattoo bands around the wrist
    for( const y of [ - 0.165, - 0.205 ] )
    {
        const ring = mesh( new TorusGeometry( 0.071, 0.0105, 8, 28 ), m.tattoo, elbow, v3( 0, y, 0 ) )
        ring.rotation.x = Math.PI / 2
    }

    // Sculpted hand with clawed fingertips for mudra, cheek-rest and slashing poses
    const hand = new Group()
    hand.position.set( 0, - 0.28, 0.008 )
    elbow.add( hand )
    mesh( new SphereGeometry( 0.082, 20, 16 ), m.skin, hand, null, v3( 1, 1.05, 0.92 ) )

    for( const [ fx, len, tilt ] of [
        [ - 0.044, 0.075, 0.14 ],
        [ - 0.014, 0.088, 0.04 ],
        [ 0.018, 0.084, - 0.05 ],
        [ 0.046, 0.068, - 0.16 ],
    ] )
    {
        const finger = new Group()
        finger.position.set( fx * side, - 0.055, 0.015 )
        finger.rotation.z = tilt * side
        hand.add( finger )
        mesh( new CapsuleGeometry( 0.021, len, 5, 10 ), m.skin, finger, v3( 0, - len * 0.5, 0 ) )
        const claw = mesh( new ConeGeometry( 0.016, 0.032, 8 ), m.claw, finger, v3( 0, - len - 0.012, 0.004 ) )
        claw.rotation.x = Math.PI
    }
    const thumb = new Group()
    thumb.position.set( - side * 0.065, - 0.018, 0.04 )
    thumb.rotation.z = - side * 0.48
    hand.add( thumb )
    mesh( new CapsuleGeometry( 0.022, 0.048, 5, 10 ), m.skin, thumb, v3( 0, - 0.02, 0 ) )

    return { shoulder, elbow, hand }
}

// Wide pleated hakama waist-to-upper-thigh skirt so the hip joints sit cleanly inside
const HAKAMA_TOP = [
    [ 0.0, 0.34 ], [ 0.36, 0.34 ], [ 0.35, 0.44 ], [ 0.32, 0.54 ], [ 0.0, 0.54 ]
]
const HAKAMA_DEPTH = 0.84

// ── Pose definitions for the 3-in-1 state machine ───────────────────────────
// Pose 0: Seated King of Curses (cross-legged mid-air lounge, chin propped on right hand)
// Pose 1: Standing Malevolent Shrine (Fukuma Mizushi Enmaten hand sign joined at chest)
// Pose 2: Cleave & Dismantle (dynamic forward slash lunge with crimson crescent blade arcs)
const POSES = [
    {
        name: 'throne',
        bodyY: 0.14,
        bodyRotX: - 0.08,
        bodyRotY: 0.08,
        bodyRotZ: - 0.06,
        headTiltZ: - 0.14,
        leftArm: { shoulderX: - 0.58, shoulderY: 0.0, shoulderZ: - 0.42, elbowX: - 0.65, elbowZ: 0.48, handX: - 0.25, handY: 0.2, handZ: - 0.2 },
        rightArm: { shoulderX: - 1.08, shoulderY: 0.0, shoulderZ: - 0.14, elbowX: - 1.62, elbowZ: - 0.38, handX: 0.35, handY: - 0.4, handZ: - 0.25 },
        leftLeg: { hipX: - 1.22, hipY: 0.25, hipZ: - 0.82, kneeX: 1.28, kneeZ: 0.88 },
        rightLeg: { hipX: - 1.32, hipY: - 0.35, hipZ: 0.90, kneeX: 1.15, kneeZ: - 1.18 },
        sealGlow: 0,
        slashPower: 0,
    },
    {
        name: 'shrine',
        bodyY: 0.0,
        bodyRotX: 0.02,
        bodyRotY: 0.0,
        bodyRotZ: 0.0,
        headTiltZ: 0.0,
        leftArm: { shoulderX: - 0.66, shoulderY: 0.0, shoulderZ: 0.20, elbowX: - 1.32, elbowZ: 0.78, handX: - 0.35, handY: 1.15, handZ: - 0.58 },
        rightArm: { shoulderX: - 0.66, shoulderY: 0.0, shoulderZ: - 0.20, elbowX: - 1.32, elbowZ: - 0.78, handX: - 0.35, handY: - 1.15, handZ: 0.58 },
        leftLeg: { hipX: - 0.05, hipY: 0.12, hipZ: - 0.15, kneeX: 0.10, kneeZ: 0.0 },
        rightLeg: { hipX: - 0.05, hipY: - 0.12, hipZ: 0.15, kneeX: 0.10, kneeZ: 0.0 },
        sealGlow: 1,
        slashPower: 0,
    },
    {
        name: 'cleave',
        bodyY: 0.05,
        bodyRotX: 0.26,
        bodyRotY: - 0.22,
        bodyRotZ: - 0.08,
        headTiltZ: 0.08,
        leftArm: { shoulderX: 0.32, shoulderY: 0.25, shoulderZ: - 1.02, elbowX: - 0.52, elbowZ: 0.24, handX: 0.0, handY: 0.5, handZ: 0.3 },
        rightArm: { shoulderX: - 1.22, shoulderY: - 0.18, shoulderZ: 0.38, elbowX: - 0.22, elbowZ: - 0.18, handX: - 0.25, handY: - 0.3, handZ: 0.15 },
        leftLeg: { hipX: - 0.95, hipY: 0.12, hipZ: - 0.32, kneeX: 1.18, kneeZ: 0.15 },
        rightLeg: { hipX: 0.52, hipY: - 0.15, hipZ: 0.28, kneeX: 0.42, kneeZ: - 0.12 },
        sealGlow: 0.2,
        slashPower: 1.0,
    },
]

function taperedArcGeometry( curve, tubularSegments, radius, radialSegments = 8 )
{
    const g = new TubeGeometry( curve, tubularSegments, radius, radialSegments, false )
    const pos = g.attributes.position
    const ringStride = radialSegments + 1
    const c = new Vector3()
    for( let i = 0; i <= tubularSegments; i++ )
    {
        const u = i / tubularSegments
        curve.getPointAt( u, c )
        // Smooth razor-sharp taper at both tips (0 -> 1 -> 0)
        const taper = Math.pow( Math.sin( u * Math.PI ), 0.75 )
        for( let j = 0; j < ringStride; j++ )
        {
            const idx = i * ringStride + j
            const vx = c.x + ( pos.getX( idx ) - c.x ) * taper
            const vy = c.y + ( pos.getY( idx ) - c.y ) * taper * 0.45
            const vz = c.z + ( pos.getZ( idx ) - c.z ) * taper
            pos.setXYZ( idx, vx, vy, vz )
        }
    }
    g.computeVertexNormals()
    return g
}

function buildSlashArcs( parent, m )
{
    const group = new Group()
    group.position.set( 0, 0.84, - 0.14 )
    parent.add( group )

    const specs = [
        { radius: 1.28, span: 1.65, tiltX: 0.38, tiltZ: - 0.68, speed: 3.2, phase: - 1.15, y: - 0.08 },
        { radius: 1.26, span: 1.60, tiltX: 0.34, tiltZ: 0.68, speed: - 3.6, phase: 1.15, y: - 0.04 },
        { radius: 1.38, span: 1.50, tiltX: - 0.28, tiltZ: 0.42, speed: 4.0, phase: 2.45, y: 0.22 },
        { radius: 1.20, span: 1.45, tiltX: - 0.32, tiltZ: - 0.46, speed: - 2.9, phase: - 2.45, y: 0.16 },
    ]

    const arcs = specs.map( ( s ) =>
    {
        const pivot = new Group()
        pivot.position.y = s.y
        pivot.rotation.set( s.tiltX, 0, s.tiltZ )
        group.add( pivot )

        const holder = new Group()
        pivot.add( holder )

        // Tapered crescent blade: crimson cursed edge + white-hot core + black cursed ink line
        const pts = []
        const steps = 24
        for( let i = 0; i <= steps; i++ )
        {
            const a = ( i / steps - 0.5 ) * s.span
            pts.push( v3( Math.sin( a ) * s.radius, 0, Math.cos( a ) * s.radius ) )
        }
        const curve = new CatmullRomCurve3( pts )
        const edge = mesh( taperedArcGeometry( curve, 36, 0.064, 8 ), m.slashEdge, holder )
        const core = mesh( taperedArcGeometry( curve, 36, 0.032, 6 ), m.slashCore, holder, v3( 0, 0.01, 0.014 ) )
        const ink = mesh( taperedArcGeometry( curve, 32, 0.022, 6 ), m.tattoo, holder, v3( 0, - 0.014, - 0.018 ) )

        return { pivot, holder, edge, core, ink, ...s }
    } )

    return { group, arcs }
}

export function createSukuna()
{
    const m = makeMaterials()

    const root = new Group()
    root.name = 'sukuna'
    const body = new Group()
    root.add( body )

    // Jointed legs in billowing white hakama trousers, dark ankle wraps & zori sandals
    const legs = {}
    for( const side of [ - 1, 1 ] )
    {
        const hip = new Group()
        hip.position.set( side * 0.13, 0.34, 0 )
        body.add( hip )
        // Wide pleated white hakama thigh
        mesh( new CylinderGeometry( 0.135, 0.155, 0.2, 24 ), m.hakama, hip, v3( 0, - 0.08, 0 ) )

        const knee = new Group()
        knee.position.set( 0, - 0.16, 0 )
        hip.add( knee )
        // Gathered lower hakama cuff + dark navy-black kyahan ankle wrap
        mesh( new SphereGeometry( 0.125, 18, 12 ), m.hakama, knee, v3( 0, 0.01, 0 ) )
        mesh( new CylinderGeometry( 0.095, 0.082, 0.12, 22 ), m.sash, knee, v3( 0, - 0.045, 0 ) )
        // Bare foot + traditional zori sandal with dark crimson-black strap
        mesh( new SphereGeometry( 1, 22, 14 ), m.skin, knee, v3( side * 0.005, - 0.1, 0.045 ), v3( 0.105, 0.065, 0.175 ) )
        mesh( new RoundedBoxGeometry( 0.2, 0.03, 0.36, 2, 0.012 ), m.zori, knee, v3( side * 0.005, - 0.148, 0.05 ) )
        stroke( [ v3( - 0.085, - 0.12, 0.0 ), v3( 0, - 0.045, 0.15 ), v3( 0.085, - 0.12, 0.0 ) ], 0.016, m.sash, knee )

        legs[ side < 0 ? 'left' : 'right' ] = { hip, knee }
    }

    // Upper hakama hip skirt + dark waist obi sash with hanging front knot tails
    const hakamaTop = mesh( new LatheGeometry( HAKAMA_TOP.map( ( [ r, y ] ) => new Vector2( r, y ) ), 36 ), m.hakama, body )
    hakamaTop.scale.set( 1, 1, HAKAMA_DEPTH )

    // Bare muscular upper torso
    const torso = mesh( new LatheGeometry( TORSO.map( ( [ r, y ] ) => new Vector2( r, y ) ), 44 ), m.skin, body )
    torso.scale.set( 1, 1, TORSO_DEPTH )

    // Subtle sculpted pectoral definition
    for( const side of [ - 1, 1 ] )
        mesh( new SphereGeometry( 1, 24, 16 ), m.skin, body, v3( side * 0.115, 0.84, 0.19 ), v3( 0.125, 0.082, 0.095 ) )

    // Full chest, shoulder-blade, stomach and spine cursed markings
    buildBodyTattoos( body, m )

    // Wide dark sash (obi) at the waist
    const belt = mesh( new TorusGeometry( 0.326, 0.054, 14, 48 ), m.sash, body, v3( 0, 0.54, 0 ) )
    belt.rotation.x = Math.PI / 2
    belt.scale.set( 1, 0.84, 1 )
    mesh( new SphereGeometry( 0.054, 16, 12 ), m.sash, body, v3( 0, 0.54, 0.275 ), v3( 1.15, 0.9, 0.75 ) )
    for( const [ x, rz ] of [ [ - 0.045, 0.22 ], [ 0.045, - 0.22 ] ] )
    {
        const tail = mesh( new CapsuleGeometry( 0.036, 0.14, 4, 10 ), m.sash, body, v3( x, 0.42, 0.28 ) )
        tail.rotation.set( 0.18, 0, rz )
    }

    // Neck with dark cursed throat rings
    mesh( new CylinderGeometry( 0.102, 0.112, 0.18, 20 ), m.skin, body, v3( 0, 1.09, 0 ) )
    const neckRing = mesh( new TorusGeometry( 0.106, 0.009, 8, 28 ), m.tattoo, body, v3( 0, 1.05, 0 ) )
    neckRing.rotation.x = Math.PI / 2

    const arms = { left: buildArm( - 1, body, m ), right: buildArm( 1, body, m ) }

    const neck = new Group()
    neck.position.set( 0, 1.12, 0 )
    body.add( neck )
    const head = new Group()
    head.position.set( 0, 0.48, 0.02 )
    head.scale.setScalar( 1.05 )
    neck.add( head )
    mesh( skullGeometry(), m.skin, head )

    const { hair, spikes } = buildHair( head, m )
    const { eyes } = buildFace( head, m )

    // Cursed energy seal glow behind his joined hands during Pose 1 (Malevolent Shrine)
    const sealAura = new Sprite( glowMaterial( SpriteNodeMaterial, '#e81c3c', { strength: 0.75, power: 1.5 } ) )
    sealAura.position.set( 0, 0.78, 0.28 )
    sealAura.scale.setScalar( 0.001 )
    body.add( sealAura )

    // Character-attached Cleave & Dismantle slash arcs
    const slashes = buildSlashArcs( body, m )

    // ── 3-Pose state machine ────────────────────────────────────────────────
    // Starts in Pose 1 (Malevolent Shrine hand sign) for his signature portrait,
    // cycles smoothly through all 3 poses (0: Seated King of Curses, 1: Malevolent
    // Shrine mudra, 2: Cleave & Dismantle slash dash), and also advances whenever
    // the user taps him or presses Space.
    let poseIndex = 1
    let poseTimer = 0
    let autoCycle = true
    const POSE_DURATION = 3.8

    // Current blended state
    const cur = {
        bodyY: POSES[ 1 ].bodyY,
        bodyRotX: POSES[ 1 ].bodyRotX,
        bodyRotY: POSES[ 1 ].bodyRotY,
        bodyRotZ: POSES[ 1 ].bodyRotZ,
        headTiltZ: POSES[ 1 ].headTiltZ,
        leftArm: { ...POSES[ 1 ].leftArm },
        rightArm: { ...POSES[ 1 ].rightArm },
        leftLeg: { ...POSES[ 1 ].leftLeg },
        rightLeg: { ...POSES[ 1 ].rightLeg },
        sealGlow: POSES[ 1 ].sealGlow,
        slashPower: POSES[ 1 ].slashPower,
    }
    let slashBurst = 0

    const armRest = {
        left: { shoulderX: cur.leftArm.shoulderX, shoulderZ: cur.leftArm.shoulderZ, elbowX: cur.leftArm.elbowX },
        right: { shoulderX: cur.rightArm.shoulderX, shoulderZ: cur.rightArm.shoulderZ, elbowX: cur.rightArm.elbowX },
    }

    function snapToPose( p )
    {
        cur.bodyY = p.bodyY
        cur.bodyRotX = p.bodyRotX
        cur.bodyRotY = p.bodyRotY
        cur.bodyRotZ = p.bodyRotZ
        cur.headTiltZ = p.headTiltZ
        Object.assign( cur.leftArm, p.leftArm )
        Object.assign( cur.rightArm, p.rightArm )
        Object.assign( cur.leftLeg, p.leftLeg )
        Object.assign( cur.rightLeg, p.rightLeg )
        cur.sealGlow = p.sealGlow
        cur.slashPower = p.slashPower
        slashBurst = 0
    }

    function setPose( index, lock = false )
    {
        poseIndex = ( ( index % POSES.length ) + POSES.length ) % POSES.length
        poseTimer = 0
        slashBurst = lock ? 0 : 0.85
        if( lock )
        {
            autoCycle = false
            snapToPose( POSES[ poseIndex ] )
            update( 0, 1 )
        }
    }

    function nextPose()
    {
        setPose( poseIndex + 1 )
    }

    function update( t, dt )
    {
        if( autoCycle )
        {
            poseTimer += dt
            if( poseTimer >= POSE_DURATION )
            {
                poseTimer = 0
                poseIndex = ( poseIndex + 1 ) % POSES.length
                slashBurst = 0.85
            }
        }

        const goal = POSES[ poseIndex ]
        const k = dt >= 1 ? 1 : 1 - Math.exp( - dt * 8.5 )
        slashBurst = Math.max( 0, slashBurst - dt * 2.2 )

        // In Pose 2 (Cleave & Dismantle), add a fast slashing stride rhythm on top of the pose
        const isCleave = poseIndex === 2
        const dashWave = isCleave && autoCycle ? Math.sin( t * 9.5 ) : 0

        cur.bodyY = MathUtils.lerp( cur.bodyY, goal.bodyY + ( isCleave && autoCycle ? Math.abs( dashWave ) * 0.06 : 0 ), k )
        cur.bodyRotX = MathUtils.lerp( cur.bodyRotX, goal.bodyRotX, k )
        cur.bodyRotY = MathUtils.lerp( cur.bodyRotY, goal.bodyRotY, k )
        cur.bodyRotZ = MathUtils.lerp( cur.bodyRotZ, goal.bodyRotZ + ( isCleave && autoCycle ? dashWave * 0.05 : 0 ), k )
        cur.headTiltZ = MathUtils.lerp( cur.headTiltZ, goal.headTiltZ, k )

        body.position.y = cur.bodyY
        body.rotation.set( cur.bodyRotX, cur.bodyRotY, cur.bodyRotZ )
        head.rotation.z += cur.headTiltZ

        // Blend arms and apply full 3-axis rotations to shoulder, elbow and hand
        for( const sideKey of [ 'left', 'right' ] )
        {
            const sign = sideKey === 'left' ? - 1 : 1
            const gArm = goal[ sideKey + 'Arm' ]
            const cArm = cur[ sideKey + 'Arm' ]
            const slashSwing = isCleave && autoCycle ? Math.sin( t * 9.5 + ( sign < 0 ? 0 : Math.PI ) ) * 0.35 : 0

            // Preserve any jump flare added by rig.js before kid.update() ran
            const jumpDeltaX = arms[ sideKey ].shoulder.rotation.x - armRest[ sideKey ].shoulderX

            cArm.shoulderX = MathUtils.lerp( cArm.shoulderX, gArm.shoulderX + slashSwing * 0.5, k )
            cArm.shoulderY = MathUtils.lerp( cArm.shoulderY, gArm.shoulderY, k )
            cArm.shoulderZ = MathUtils.lerp( cArm.shoulderZ, gArm.shoulderZ + slashSwing * 0.35 * sign, k )
            cArm.elbowX = MathUtils.lerp( cArm.elbowX, gArm.elbowX - Math.abs( slashSwing ) * 0.25, k )
            cArm.elbowZ = MathUtils.lerp( cArm.elbowZ, gArm.elbowZ, k )
            cArm.handX = MathUtils.lerp( cArm.handX, gArm.handX, k )
            cArm.handY = MathUtils.lerp( cArm.handY, gArm.handY, k )
            cArm.handZ = MathUtils.lerp( cArm.handZ, gArm.handZ, k )

            armRest[ sideKey ].shoulderX = cArm.shoulderX
            armRest[ sideKey ].shoulderZ = cArm.shoulderZ
            armRest[ sideKey ].elbowX = cArm.elbowX

            arms[ sideKey ].shoulder.rotation.set( cArm.shoulderX + jumpDeltaX, cArm.shoulderY, cArm.shoulderZ )
            arms[ sideKey ].elbow.rotation.set( cArm.elbowX, 0, cArm.elbowZ )
            arms[ sideKey ].hand.rotation.set( cArm.handX, cArm.handY, cArm.handZ )
        }

        // Blend jointed legs (seated cross-legged -> standing stance -> dashing stride)
        for( const sideKey of [ 'left', 'right' ] )
        {
            const sign = sideKey === 'left' ? - 1 : 1
            const gLeg = goal[ sideKey + 'Leg' ]
            const cLeg = cur[ sideKey + 'Leg' ]
            const stridePhase = t * 9.5 + ( sign < 0 ? 0 : Math.PI )
            const strideHip = isCleave && autoCycle ? - Math.sin( stridePhase ) * 0.45 : 0
            const strideKnee = isCleave && autoCycle ? Math.max( 0, Math.cos( stridePhase ) ) * 0.55 : 0

            cLeg.hipX = MathUtils.lerp( cLeg.hipX, gLeg.hipX + strideHip, k )
            cLeg.hipY = MathUtils.lerp( cLeg.hipY, gLeg.hipY, k )
            cLeg.hipZ = MathUtils.lerp( cLeg.hipZ, gLeg.hipZ, k )
            cLeg.kneeX = MathUtils.lerp( cLeg.kneeX, gLeg.kneeX + strideKnee, k )
            cLeg.kneeZ = MathUtils.lerp( cLeg.kneeZ, gLeg.kneeZ, k )

            legs[ sideKey ].hip.rotation.set( cLeg.hipX, cLeg.hipY, cLeg.hipZ )
            legs[ sideKey ].knee.rotation.set( cLeg.kneeX, 0, cLeg.kneeZ )
        }

        // Hand-sign cursed aura pulse in Pose 1
        cur.sealGlow = MathUtils.lerp( cur.sealGlow, goal.sealGlow, k )
        const auraScale = cur.sealGlow * ( 0.72 + Math.sin( t * 6.0 ) * 0.08 )
        sealAura.scale.setScalar( Math.max( 0.001, auraScale ) )
        sealAura.visible = cur.sealGlow > 0.02

        // Cleave & Dismantle slash arcs spin and flare during Pose 2 and pose transitions
        cur.slashPower = MathUtils.lerp( cur.slashPower, Math.max( goal.slashPower, slashBurst ), k )
        for( let i = 0; i < slashes.arcs.length; i++ )
        {
            const a = slashes.arcs[ i ]
            a.holder.rotation.y = t * a.speed + a.phase
            const pulse = 0.84 + 0.16 * Math.sin( t * 7.0 + i * 1.7 )
            const s = Math.max( 0.001, cur.slashPower * pulse )
            a.pivot.scale.setScalar( s )
            a.pivot.visible = cur.slashPower > 0.03
        }
    }

    // Apply initial pose immediately so frame 0 / thumbnails are posed cleanly
    update( 0, 1 )

    const pickables = []
    root.traverse( ( o ) => { if( o.isMesh ) pickables.push( o ) } )

    return {
        root, body, neck, head, hair, spikes, eyes, arms, legs, tail: null,
        armRest, pickables, materials: m,
        bobScale: 0.55, jumpScale: 1,
        // Disable automatic random hand-waving so Sukuna keeps his iconic mudra / cheek-rest / slash poses
        wavePose: { shoulderZ: - 0.46, shoulderX: - 0.92, elbowX: - 1.28 },
        waveSide: 0,
        update,
        setPose,
        nextPose,
        get pose() { return poseIndex },
        get poseName() { return POSES[ poseIndex ].name },
    }
}

/**
 * Bare stage for Sukuna: no background props or environment meshes.
 */
export function createSukunaStage()
{
    const group = new Group()
    group.name = 'sukuna-stage'
    return { group, main: null, tail: null, pickables: [] }
}
