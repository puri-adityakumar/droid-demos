import './style.css'

import {
    WebGPURenderer, Scene, PerspectiveCamera, Raycaster, Vector2, Vector3, Spherical, Timer, NoToneMapping
} from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { light } from './materials/painted.js'
import { createCharacter } from './scene/character.js'
import { createLight, createDeathNote, createApple } from './scene/yagami.js'
import { createRoom, DESK_Y, NOTE_Z } from './scene/room.js'
import { createNimbus, createFarClouds, createSparkles, skyNode } from './scene/world.js'
import { createRig } from './scene/rig.js'
import { createPaintFilter, paintDefaults } from './post/paintFilter.js'
import { createThemeDriver, slots } from './themes.js'
import { createUI } from './ui.js'

const canvas = document.querySelector( 'canvas.scene' )
const ui = createUI()

async function start()
{
    ui.progress( 0.1 )

    const forceWebGL = new URLSearchParams( window.location.search ).has( 'webgl' )
    const renderer = new WebGPURenderer( { canvas, antialias: false, forceWebGL } )
    renderer.toneMapping = NoToneMapping
    renderer.setPixelRatio( Math.min( window.devicePixelRatio, 2 ) )
    renderer.setSize( window.innerWidth, window.innerHeight )
    await renderer.init()
    ui.progress( 0.3 )

    const scene = new Scene()
    scene.backgroundNode = skyNode()

    const camera = new PerspectiveCamera( 28, window.innerWidth / window.innerHeight, 0.1, 60 )
    camera.position.set( 1.6, 2.1, 7.3 )

    const farClouds = createFarClouds()
    const sparkles = createSparkles()

    // Everyone is built up front and only the active one is shown. Each has its
    // own rig; all of them keep ticking so the shared far clouds never jump.
    // Light doesn't ride a nimbus: he sits at his desk at night, writing in the
    // Death Note, which stands in for the cloud (it bounces when tapped).
    const notebook = createDeathNote( { y: DESK_Y, z: NOTE_Z, writingZ: - 0.2 } )
    const room = createRoom()
    const apple = createApple()
    apple.position.set( 1.0, DESK_Y + 0.156, 1.2 )
    room.group.add( apple )

    const cast = {
        goku: {
            name: 'Goku',
            world: 'sky',
            kid: createCharacter(),
            ride: createNimbus(),
            extras: [],
            view: { y: 1, zoom: 1, polar: 1.425 },
            label: 'A painting of a chibi martial-arts kid with spiky black hair and an orange gi, standing on a wobbly yellow cloud in the sky. Tap the kid to make him jump, tap the cloud to bounce it, drag to orbit and scroll to zoom.',
        },
        light: {
            name: 'Light Yagami',
            world: 'room',
            kid: createLight(),
            ride: notebook,
            extras: [ room.group ],
            // seen from higher up so the open notebook on the desk can be read
            view: { y: 1.05, zoom: 1.15, polar: 1.2 },
            label: 'A painting of a chibi Light Yagami with honey-brown hair, a tan school jacket and a red tie, sitting at his desk at night with a smirk and writing in the open Death Note, with a red apple beside it, a glowing desk lamp, and a window onto the city and a crescent moon. Tap him to make him hop, tap the notebook to bounce it, drag to orbit and scroll to zoom.',
        },
    }
    for( const c of Object.values( cast ) )
    {
        scene.add( c.kid.root, c.ride.group, ...c.extras )
        c.rig = createRig( c.kid, c.ride, farClouds )
    }
    scene.add( farClouds.group, sparkles.group )

    const requested = new URLSearchParams( window.location.search ).get( 'char' )
    let active = requested in cast ? requested : 'goku'

    // Each character is framed from their own height; the camera eases there
    // after a swap, until the user takes hold of it.
    let settling = true

    function show( id )
    {
        active = id
        settling = true
        const { world } = cast[ id ]
        for( const [ key, c ] of Object.entries( cast ) )
        {
            const on = key === id
            c.kid.root.visible = on
            c.ride.group.visible = on
            for( const e of c.extras ) e.visible = on
        }
        // the sky's clouds and glints belong to the sky; a room has its own light
        farClouds.group.visible = sparkles.group.visible = world === 'sky'
        theme.setWorld( world )
        canvas.setAttribute( 'aria-label', cast[ id ].label )
    }

    const controls = new OrbitControls( camera, canvas )
    controls.target.set( 0, 1.0, 0 )
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = false
    controls.rotateSpeed = 0.6
    controls.zoomSpeed = 0.7
    controls.minDistance = 4.8
    controls.maxDistance = 11
    controls.minPolarAngle = 0.7
    controls.maxPolarAngle = 1.9
    controls.addEventListener( 'start', () => { settling = false } )
    controls.update()

    const filter = createPaintFilter( renderer, scene, camera, { ...paintDefaults } )
    const theme = createThemeDriver( { farClouds, sparkles, filter } )
    theme.set( 'day' )
    show( active )
    theme.snap()
    ui.progress( 0.55 )

    // Keep the subject filling the painted frame whatever the window shape.
    // `view` is each character's own framing, eased into when they swap.
    const view = { y: cast[ active ].view.y, zoom: cast[ active ].view.zoom }
    const orbit = new Spherical()
    const offset = new Vector3()
    let fitZoom = 1

    function applyView( dt = 0 )
    {
        const goal = cast[ active ].view
        const k = dt > 0 ? 1 - Math.exp( - dt * 5 ) : 1
        view.y += ( goal.y - view.y ) * k
        view.zoom += ( goal.zoom - view.zoom ) * k
        controls.target.y = view.y
        camera.zoom = fitZoom * view.zoom
        camera.updateProjectionMatrix()

        if( settling )
        {
            orbit.setFromVector3( offset.copy( camera.position ).sub( controls.target ) )
            orbit.phi += ( goal.polar - orbit.phi ) * k
            camera.position.copy( controls.target ).add( offset.setFromSpherical( orbit ) )
            if( Math.abs( goal.polar - orbit.phi ) < 0.002 ) settling = false
        }
    }

    function fitCamera()
    {
        const rect = filter.frameRect()
        const share = rect.height / window.innerHeight
        const widthShare = rect.width / window.innerWidth
        camera.aspect = window.innerWidth / window.innerHeight
        const byHeight = share * 0.68
        const byWidth = widthShare * camera.aspect * 0.86
        fitZoom = Math.min( byHeight, byWidth )
        applyView()
    }

    function resize()
    {
        const dpr = Math.min( window.devicePixelRatio, 2 )
        renderer.setPixelRatio( dpr )
        renderer.setSize( window.innerWidth, window.innerHeight )
        filter.setSize( window.innerWidth, window.innerHeight, dpr )
        fitCamera()
        ui.layout( filter.frameRect() )
    }
    window.addEventListener( 'resize', resize )
    resize()

    // ── pointer: look, tap to jump, drag to orbit ───────────────────────────
    const raycaster = new Raycaster()
    const ndc = new Vector2()
    const lookPoint = new Vector3()
    const down = { x: 0, y: 0, t: 0, active: false }

    const toNdc = ( e ) => ndc.set( ( e.clientX / window.innerWidth ) * 2 - 1, - ( e.clientY / window.innerHeight ) * 2 + 1 )

    function pick( e )
    {
        toNdc( e )
        raycaster.setFromCamera( ndc, camera )
        const { kid, ride } = cast[ active ]
        const kidHit = raycaster.intersectObjects( kid.pickables, false )[ 0 ]
        const cloudHit = raycaster.intersectObjects( ride.pickables ?? [ ride.main, ride.tail ], false )[ 0 ]
        if( kidHit && ( ! cloudHit || kidHit.distance <= cloudHit.distance ) ) return 'kid'
        if( cloudHit ) return 'cloud'
        return null
    }

    canvas.addEventListener( 'pointermove', ( e ) =>
    {
        toNdc( e )
        raycaster.setFromCamera( ndc, camera )
        lookPoint.copy( raycaster.ray.direction ).multiplyScalar( camera.position.distanceTo( controls.target ) * 0.8 ).add( raycaster.ray.origin )
        for( const c of Object.values( cast ) ) c.rig.setLookTarget( lookPoint )
        if( ! down.active && e.pointerType === 'mouse' ) ui.setCursorHover( pick( e ) !== null )
    } )

    canvas.addEventListener( 'pointerdown', ( e ) =>
    {
        Object.assign( down, { x: e.clientX, y: e.clientY, t: performance.now(), active: true } )
        ui.touched()
    } )

    canvas.addEventListener( 'pointerup', ( e ) =>
    {
        down.active = false
        const moved = Math.hypot( e.clientX - down.x, e.clientY - down.y )
        if( moved < 6 && performance.now() - down.t < 400 )
        {
            const hit = pick( e )
            if( hit === 'kid' ) cast[ active ].rig.startJump()
            else if( hit === 'cloud' ) cast[ active ].rig.bounceCloud()
        }
        if( e.pointerType === 'mouse' ) ui.setCursorHover( pick( e ) !== null )
    } )

    // ── UI wiring ───────────────────────────────────────────────────────────
    const character = {
        ids: Object.keys( cast ),
        names: Object.fromEntries( Object.entries( cast ).map( ( [ id, c ] ) => [ id, c.name ] ) ),
        get current() { return active },
        // a little hop on arrival so the swap reads as an entrance
        set( id ) { if( id === active ) return; show( id ); cast[ id ].rig.startJump() },
    }

    ui.bind( {
        filter,
        theme,
        character,
        onJump: () => cast[ active ].rig.startJump(),
        onWave: () => cast[ active ].rig.startWave(),
        onFrameChange: resize,
    } )

    // Paint every character in every time of day into the toggle cards straight
    // from the real pipeline, one combination per frame (render targets refresh
    // once per frame), then settle back on the active one.
    const thumbQueue = []

    function applyLook( { id, themeId } )
    {
        show( id )
        applyView()
        theme.set( themeId )
        theme.snap()
    }

    function queueThumbnails()
    {
        const looks = character.ids.flatMap( ( id ) => slots.map( ( themeId ) => ( { id, themeId } ) ) )
        const isCurrent = ( l ) => l.id === active && l.themeId === theme.current
        thumbQueue.push( ...looks.filter( ( l ) => ! isCurrent( l ) ), ...looks.filter( isCurrent ) )
        applyLook( thumbQueue[ 0 ] )
    }

    function captureThumbnail()
    {
        const look = thumbQueue.shift()
        ui.drawThumb( `${ look.id }-${ look.themeId }`, canvas, filter.frameRect(), renderer.getPixelRatio() )
        if( thumbQueue.length ) applyLook( thumbQueue[ 0 ] )
        else ui.syncPreviews()
    }

    // ── loop ────────────────────────────────────────────────────────────────
    const timer = new Timer()
    timer.connect( document )
    let frames = 0
    let ready = false

    if( import.meta.env.DEV ) window.__chibi = { renderer, scene, camera, controls, filter, cast, theme, character, get frames() { return frames } }

    renderer.setAnimationLoop( () =>
    {
        timer.update()
        const dt = Math.min( timer.getDelta(), 1 / 20 )
        light.time.value += dt

        for( const c of Object.values( cast ) ) c.rig.update( dt )
        sparkles.update( light.time.value )
        theme.update( dt )
        applyView( dt )
        controls.update()
        filter.update()
        filter.render()

        if( thumbQueue.length ) captureThumbnail()

        frames++
        if( frames === 2 ) { ui.progress( 0.9 ); queueThumbnails() }
        if( frames > 2 && ! thumbQueue.length && ! ready ) { ready = true; ui.ready() }
    } )
}

start().catch( ( error ) =>
{
    console.error( error )
    ui.fail( 'This painting needs WebGPU or WebGL 2. Try a recent Chrome, Edge, Safari or Firefox.' )
} )
