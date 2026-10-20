import GUI from 'three/addons/libs/lil-gui.module.min.js'

import { slots } from './themes.js'

const $ = ( selector ) => document.querySelector( selector )

export function createUI()
{
    const loader = $( '.loader' )
    const status = $( '.loader-status' )

    // --reveal lives on the loader so the title and the garden both read it
    function progress( value )
    {
        loader.style.setProperty( '--reveal', value.toFixed( 3 ) )
        loader.setAttribute( 'aria-valuenow', Math.round( value * 100 ) )
    }

    // a beat longer than the page used to wait, so the last flower can open
    function ready()
    {
        progress( 1 )
        document.documentElement.dataset.state = 'ready'
        setTimeout( () => loader.classList.add( 'leaving' ), 650 )
        setTimeout( () => loader.remove(), 1200 )
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
    const thumbs = new Map()

    function drawThumb( id, source, rect, dpr )
    {
        let thumb = thumbs.get( id )
        if( ! thumb )
        {
            thumb = document.createElement( 'canvas' )
            thumb.width = thumb.height = 168
            thumbs.set( id, thumb )
        }
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

    let sync = () => {}

    function bind( { filter, theme, character, onJump, onWave, onFrameChange } )
    {
        // One card per character, always visible and named, painted in the
        // current time of day. A separate switch in the corner flips day <-> dusk.
        const cards = [ ...document.querySelectorAll( '[data-character]' ) ]
        const modeSwitch = $( '.mode' )
        const hint = $( '.hint' )
        const next = ( list, current ) => list[ ( list.indexOf( current ) + 1 ) % list.length ]

        sync = () =>
        {
            for( const card of cards )
            {
                const id = card.dataset.character
                card.setAttribute( 'aria-pressed', String( id === character.current ) )
                card.querySelector( '.preset-label' ).textContent = character.names[ id ]
                const source = thumbs.get( `${ id }-${ theme.current }` )
                if( source ) card.querySelector( 'canvas' ).getContext( '2d' ).drawImage( source, 0, 0 )
            }
            // the two moods mean different things in each world: day / dusk in
            // the sky, lamp light / moonlight at the desk, Unlimited Void /
            // Hollow Purple in the void
            const label = `Switch to ${ theme.label( next( slots, theme.current ) ).toLowerCase() }`
            modeSwitch.dataset.mode = theme.current
            modeSwitch.dataset.world = theme.world
            hint.textContent = theme.world === 'sukuna'
                ? `tap him to switch pose · tap the shrine · t ${ slots.map( ( slot ) => theme.label( slot ).toLowerCase() ).join( ' / ' ) } · c character`
                : theme.world === 'eren'
                ? `tap him to jump · tap the wall · t ${ theme.current === 'day' ? 'transform' : 'turn back' } · c character`
                : `tap to jump · drag to turn · t ${ slots.map( ( slot ) => theme.label( slot ).toLowerCase() ).join( ' / ' ) } · c character`
            modeSwitch.setAttribute( 'aria-label', label )
            modeSwitch.title = label
        }

        const toggleTheme = () => { theme.set( next( slots, theme.current ) ); sync() }
        const toggleCharacter = ( id = next( character.ids, character.current ) ) => { character.set( id ); sync() }
        modeSwitch.addEventListener( 'click', toggleTheme )
        for( const card of cards ) card.addEventListener( 'click', () => toggleCharacter( card.dataset.character ) )

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
            else if( key === 't' ) toggleTheme()
            else if( key === 'c' ) toggleCharacter()
            else if( /^[1-9]$/.test( key ) && character.ids[ key - 1 ] ) toggleCharacter( character.ids[ key - 1 ] )
        } )

        sync()
    }

    return { progress, ready, fail, bind, layout, drawThumb, syncPreviews: () => sync(), setCursorHover, touched }
}
