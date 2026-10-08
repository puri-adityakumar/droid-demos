import GUI from 'three/addons/libs/lil-gui.module.min.js'

import { themes } from './themes.js'

const $ = ( selector ) => document.querySelector( selector )

export function createUI()
{
    const loader = $( '.loader' )
    const fill = $( '.loader-fill' )
    const status = $( '.loader-status' )

    function progress( value )
    {
        fill.style.setProperty( '--reveal', value.toFixed( 3 ) )
        loader.setAttribute( 'aria-valuenow', Math.round( value * 100 ) )
    }

    function ready()
    {
        progress( 1 )
        document.documentElement.dataset.state = 'ready'
        setTimeout( () => loader.classList.add( 'leaving' ), 180 )
        setTimeout( () => loader.remove(), 700 )
    }

    function fail( message )
    {
        status.textContent = message
        loader.classList.add( 'failed' )
    }

    // Park the page chrome around wherever the painted sheet landed.
    function layout( rect )
    {
        const root = document.documentElement.style
        root.setProperty( '--fx', rect.x + 'px' )
        root.setProperty( '--fy', rect.y + 'px' )
        root.setProperty( '--fw', rect.width + 'px' )
        root.setProperty( '--fh', rect.height + 'px' )
        document.documentElement.dataset.layout = rect.x > 130 ? 'side' : 'below'
    }

    // Copy the painted sheet (plus a sliver of paper) into a preset card.
    // Must run in the same task as the render so the canvas still holds it.
    function drawThumb( id, source, rect, dpr )
    {
        const thumb = document.querySelector( `[data-thumb="${ id }"]` )
        if( ! thumb ) return
        const ctx = thumb.getContext( '2d' )
        const m = rect.width * 0.035
        ctx.fillStyle = '#ffffff'
        ctx.fillRect( 0, 0, thumb.width, thumb.height )
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(
            source,
            ( rect.x - m ) * dpr, ( rect.y - m ) * dpr, ( rect.width + m * 2 ) * dpr, ( rect.height + m * 2 ) * dpr,
            0, 0, thumb.width, thumb.height
        )
    }

    // A soft cream disc that trails the mouse over the painting.
    const cursor = $( '.cursor' )
    const finePointer = window.matchMedia( '(hover: hover) and (pointer: fine)' ).matches
    const pointer = { x: - 100, y: - 100, cx: - 100, cy: - 100, last: performance.now() }

    if( finePointer )
    {
        window.addEventListener( 'pointermove', ( e ) =>
        {
            if( e.pointerType !== 'mouse' ) return
            pointer.x = e.clientX
            pointer.y = e.clientY
            cursor.classList.toggle( 'on', e.target.matches?.( 'canvas.scene' ) ?? false )
        } )
        document.addEventListener( 'pointerleave', () => cursor.classList.remove( 'on' ) )
        window.addEventListener( 'pointerdown', () => cursor.classList.add( 'pressed' ) )
        window.addEventListener( 'pointerup', () => cursor.classList.remove( 'pressed' ) )

        const follow = ( now ) =>
        {
            const dt = Math.min( ( now - pointer.last ) / 1000, 0.05 )
            pointer.last = now
            const k = 1 - Math.exp( - dt * 22 )
            pointer.cx += ( pointer.x - pointer.cx ) * k
            pointer.cy += ( pointer.y - pointer.cy ) * k
            cursor.style.transform = `translate3d(${ pointer.cx }px, ${ pointer.cy }px, 0)`
            requestAnimationFrame( follow )
        }
        requestAnimationFrame( follow )
    }

    const setCursorHover = ( on ) => cursor.classList.toggle( 'hover', on )
    const touched = () => { document.documentElement.dataset.touched = '' }

    function bind( { filter, theme, onJump, onWave, onFrameChange } )
    {
        const themeButtons = [ ...document.querySelectorAll( '[data-theme-button]' ) ]

        const syncTheme = () =>
        {
            for( const b of themeButtons ) b.setAttribute( 'aria-pressed', String( b.dataset.themeButton === theme.current ) )
        }

        for( const b of themeButtons ) b.addEventListener( 'click', () => { theme.set( b.dataset.themeButton ); syncTheme() } )

        const gui = new GUI( { title: 'Paint settings' } )
        gui.hide()
        const s = filter.settings
        const strokes = gui.addFolder( 'Strokes' )
        strokes.add( s, 'styleStrength', 0, 4, 0.01 ).name( 'style strength' )
        strokes.add( s, 'strokeWidth', 6, 64, 1 ).name( 'width' )
        strokes.add( s, 'strokeLength', 10, 300, 1 ).name( 'length' )
        strokes.add( s, 'strokeDensity', 0, 1, 0.01 ).name( 'density' )
        strokes.add( s, 'strokeAngle', - 90, 90, 1 ).name( 'flat-area angle' )
        strokes.add( s, 'halo', 0, 6, 0.01 ).name( 'halo' )
        strokes.add( s, 'smear', 0, 1, 0.01 ).name( 'smear' )
        const tone = gui.addFolder( 'Color' )
        tone.add( s, 'contrast', 0, 1, 0.01 )
        tone.add( s, 'saturation', 0, 2, 0.01 )
        const surface = gui.addFolder( 'Surface' )
        surface.add( s, 'relief', 0, 3, 0.01 ).name( 'impasto relief' )
        surface.add( s, 'lightAngle', 0, 360, 1 ).name( 'relief light' )
        surface.add( s, 'speckle', 0, 3, 0.01 ).name( 'speckle' )
        surface.add( s, 'speckleSize', 0.3, 4, 0.01 ).name( 'speckle size' )
        surface.add( s, 'dither', 0, 2, 0.01 ).name( 'fixed dither' )
        surface.add( s, 'grain', 0, 0.3, 0.001 ).name( 'paper grain' )
        const frame = gui.addFolder( 'Paper frame' )
        frame.add( s, 'frame' )
        frame.add( s, 'frameSize', 0.4, 1, 0.005 ).name( 'size' ).onChange( () => onFrameChange?.() )
        frame.add( s, 'edgeRoughness', 0, 2, 0.01 ).name( 'torn edge' )
        frame.add( s, 'bristles', 0, 3, 0.01 )
        frame.add( s, 'flecks', 0, 1.5, 0.01 )
        frame.add( s, 'edgeDarken', 0, 0.6, 0.01 ).name( 'edge pooling' )
        frame.add( s, 'seed', 1, 50, 1 )
        gui.close()

        const toggleGui = () => gui._hidden ? gui.show() : gui.hide()

        window.addEventListener( 'keydown', ( e ) =>
        {
            if( e.target instanceof HTMLInputElement ) return
            const key = e.key.toLowerCase()
            if( key === ' ' || key === 'j' ) { e.preventDefault(); onJump() }
            else if( key === 'w' ) onWave()
            else if( key === 'g' ) toggleGui()
            else if( key === 't' )
            {
                const ids = Object.keys( themes )
                theme.set( ids[ ( ids.indexOf( theme.current ) + 1 ) % ids.length ] )
                syncTheme()
            }
        } )

        syncTheme()
    }

    return { progress, ready, fail, bind, layout, drawThumb, setCursorHover, touched }
}
