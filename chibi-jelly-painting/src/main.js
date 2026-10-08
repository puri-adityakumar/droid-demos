import './style.css'

import {
    WebGPURenderer, Scene, PerspectiveCamera, Raycaster, Vector2, Vector3, Timer, NoToneMapping
} from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { light } from './materials/painted.js'
import { createCharacter } from './scene/character.js'
import { createNimbus, createFarClouds, createSparkles, skyNode } from './scene/world.js'
import { createRig } from './scene/rig.js'
import { createPaintFilter, paintDefaults } from './post/paintFilter.js'
import { createThemeDriver, themes } from './themes.js'
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

    const kid = createCharacter()
    const nimbus = createNimbus()
    const farClouds = createFarClouds()
    const sparkles = createSparkles()
    scene.add( kid.root, nimbus.group, farClouds.group, sparkles.group )

    const rig = createRig( kid, nimbus, farClouds )

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
    controls.update()

    const filter = createPaintFilter( renderer, scene, camera, { ...paintDefaults } )
    const theme = createThemeDriver( { farClouds, sparkles, filter } )
    theme.set( 'day' )
    theme.snap()
    ui.progress( 0.55 )

    // Keep the subject filling the painted frame whatever the window shape.
    function fitCamera()
    {
        const rect = filter.frameRect()
        const share = rect.height / window.innerHeight
        const widthShare = rect.width / window.innerWidth
        camera.aspect = window.innerWidth / window.innerHeight
        const byHeight = share * 0.68
        const byWidth = widthShare * camera.aspect * 0.86
        camera.zoom = Math.min( byHeight, byWidth )
        camera.updateProjectionMatrix()
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
        const kidHit = raycaster.intersectObjects( kid.pickables, false )[ 0 ]
        const cloudHit = raycaster.intersectObjects( [ nimbus.main, nimbus.tail ], false )[ 0 ]
        if( kidHit && ( ! cloudHit || kidHit.distance <= cloudHit.distance ) ) return 'kid'
        if( cloudHit ) return 'cloud'
        return null
    }

    canvas.addEventListener( 'pointermove', ( e ) =>
    {
        toNdc( e )
        raycaster.setFromCamera( ndc, camera )
        lookPoint.copy( raycaster.ray.direction ).multiplyScalar( camera.position.distanceTo( controls.target ) * 0.8 ).add( raycaster.ray.origin )
        rig.setLookTarget( lookPoint )
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
            if( hit === 'kid' ) rig.startJump()
            else if( hit === 'cloud' ) rig.bounceCloud()
        }
        if( e.pointerType === 'mouse' ) ui.setCursorHover( pick( e ) !== null )
    } )

    // ── UI wiring ───────────────────────────────────────────────────────────
    ui.bind( {
        filter,
        theme,
        onJump: () => rig.startJump(),
        onWave: () => rig.startWave(),
        onFrameChange: resize,
    } )

    // Paint each time of day into its preset card straight from the real
    // pipeline, one theme per frame (render targets refresh once per frame),
    // then settle back on the active one.
    const thumbQueue = []

    function queueThumbnails()
    {
        const active = theme.current
        thumbQueue.push( ...Object.keys( themes ).filter( ( k ) => k !== active ), active )
        theme.set( thumbQueue[ 0 ] )
        theme.snap()
    }

    function captureThumbnail()
    {
        ui.drawThumb( thumbQueue.shift(), canvas, filter.frameRect(), renderer.getPixelRatio() )
        if( thumbQueue.length )
        {
            theme.set( thumbQueue[ 0 ] )
            theme.snap()
        }
    }

    // ── loop ────────────────────────────────────────────────────────────────
    const timer = new Timer()
    timer.connect( document )
    let frames = 0
    let ready = false

    if( import.meta.env.DEV ) window.__chibi = { renderer, scene, camera, controls, filter, rig, kid, get frames() { return frames } }

    renderer.setAnimationLoop( () =>
    {
        timer.update()
        const dt = Math.min( timer.getDelta(), 1 / 20 )
        light.time.value += dt

        rig.update( dt )
        sparkles.update( light.time.value )
        theme.update( dt )
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
