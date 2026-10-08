import { RenderPipeline, Color, Vector2, Vector3, HalfFloatType, MathUtils, LinearSRGBColorSpace } from 'three/webgpu'
import {
    Fn, uniform, uv, vec2, vec3, vec4, float, int, pass, rtt, renderOutput,
    dot, mix, smoothstep, clamp, max, min, abs, sqrt, exp, atan, cos, sin, floor,
    fract, length, step, select, normalize, Loop, If, PI
} from 'three/tsl'
import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js'

import { hash12, hash22, valueNoise, fbm } from '../tsl/noise.js'

export const paintDefaults = {
    styleStrength: 2,
    strokeLength: 160,
    strokeWidth: 30,
    strokeDensity: 0.3,
    halo: 2,
    strokeAngle: 0,
    smear: 0.3,
    relief: 0,
    lightAngle: 0,
    contrast: 0.4,
    saturation: 1.15,
    speckle: 1.5,
    speckleSize: 0.9,
    dither: 1,
    frame: true,
    frameSize: 0.805,
    edgeRoughness: 0.8,
    bristles: 1.2,
    flecks: 0.3,
    edgeDarken: 0,
    grain: 0,
    paperColor: '#ffffff',
    seed: 10,
}

// valueNoise remapped to roughly -1..1
const snoise = ( p ) => valueNoise( p ).mul( 2 ).sub( 1 )

/**
 * Screen-space painting in the spirit of mesq's Jelly Painting:
 *   scene → structure tensor of the colors → blurred twice (detail + halo)
 *   → a stroke direction field that runs along color edges
 *   → line-integral smear + flat dabs picked from a fixed stroke grid
 *   → relief, edge speckle, fixed dither and a torn paper frame.
 * Every noise is anchored to screen pixels and never animates, so motion
 * reads as paint being re-laid on paper instead of a filter crawling.
 */
export function createPaintFilter( renderer, scene, camera, settings = { ...paintDefaults } )
{
    const u = {
        viewport: uniform( new Vector2( 1, 1 ) ),
        dpr: uniform( 1 ),
        half: uniform( new Vector2( 1, 1 ) ),
        frameOn: uniform( 1 ),
        seed: uniform( 1 ),
        roughness: uniform( 1 ),
        bristles: uniform( 1 ),
        flecks: uniform( 0.3 ),
        edgeScale: uniform( 1 ),
        edgeDarken: uniform( 0.15 ),
        grain: uniform( 0.06 ),
        paper: uniform( new Color() ),
        styleStrength: uniform( 1 ),
        stepLength: uniform( 5 ),
        strokeWidth: uniform( 26 ),
        density: uniform( 0.3 ),
        haloWeight: uniform( 8 ),
        strokeAngle: uniform( 0 ),
        smear: uniform( 0.4 ),
        relief: uniform( 0.3 ),
        lightDir: uniform( new Vector3( 0, 1, 1 ) ),
        speckle: uniform( 1 ),
        speckleSize: uniform( 1 ),
        dither: uniform( 1 ),
        contrast: uniform( 0.4 ),
        saturation: uniform( 1.15 ),
    }

    const size = { width: 1, height: 1, dpr: 1 }

    // ── 0. scene ────────────────────────────────────────────────────────────
    const scenePass = pass( scene, camera, { samples: 4 } )
    const display = rtt( renderOutput( scenePass ), null, null, { type: HalfFloatType, depthBuffer: false } )
    display.name = 'Paint · display'

    const cssTargets = []
    const cssRtt = ( node, name, scale, options = {} ) =>
    {
        const target = rtt( node, null, null, { type: HalfFloatType, depthBuffer: false, ...options } )
        target.name = name
        cssTargets.push( { target, scale } )
        return target
    }

    // ── 1. paper + torn frame (static) ──────────────────────────────────────
    const paperNode = Fn( () =>
    {
        const p = uv().mul( u.viewport ).sub( u.viewport.mul( 0.5 ) ).toVar()

        const warp = valueNoise( p.mul( 0.008 ).add( 3.7 ) ).mul( 1.8 )
            .add( valueNoise( p.mul( 0.04 ).add( 9.1 ) ).mul( 0.4 ) )
        const ribY = p.y.div( 3.4 ).add( warp ).toVar()
        const ribs = sin( ribY.mul( PI ).mul( 2 ) ).mul( 0.5 ).add( 0.5 )
            .mul( smoothstep( 0.2, 0.8, valueNoise( vec2( p.x.mul( 0.05 ), ribY.mul( 0.3 ) ) ) ) )
        const fibres = valueNoise( vec2( p.x.mul( 0.016 ), ribY.mul( 0.29 ) ).add( 11.3 ) )
            .mul( 0.5 ).add( valueNoise( vec2( p.x.mul( 0.04 ), ribY.mul( 0.55 ) ).add( 27.9 ) ).mul( 0.25 ) )
        const tooth = valueNoise( p.mul( 0.5 ).add( 51.7 ) )
        const tex = ribs.mul( 0.3 ).add( fibres ).add( tooth.mul( 0.2 ) ).sub( 0.12 ).toVar()

        // Rounded rectangle with every edge torn by its own noise.
        const radius = float( 7 )
        const q = abs( p ).sub( u.half ).add( radius ).toVar()
        const sd = length( max( q, 0 ) ).add( min( max( q.x, q.y ), 0 ) ).sub( radius )

        const tear = ( along, side ) =>
        {
            const s = side.add( u.seed.mul( 7.31 ) )
            const coarse = fbm( vec2( along.mul( 0.006 ), s ) ).sub( 0.5 ).mul( 22 )
            const fine = valueNoise( vec2( along.mul( 0.07 ), s.add( 3.3 ) ) ).sub( 0.5 ).mul( 5 )
            const dry = smoothstep( - 0.25, 0.45, valueNoise( vec2( along.mul( 0.0085 ), s.add( 13.1 ) ) ).sub( 0.3 ) )
            return { shift: coarse.add( fine ), dry }
        }
        const vertical = tear( p.y, select( p.x.greaterThan( 0 ), float( 1 ), float( 2 ) ) )
        const horizontal = tear( p.x, select( p.y.greaterThan( 0 ), float( 3 ), float( 4 ) ) )
        const corner = smoothstep( - 6, 6, q.x.sub( q.y ) )
        const shift = mix( horizontal.shift, vertical.shift, corner )
        const dry = mix( horizontal.dry, vertical.dry, corner )

        // Deckle: the whole edge breathes in and out a little, not just per side.
        const deckle = snoise( p.mul( 0.3 ).add( 31.1 ) ).mul( 1.6 ).add( snoise( p.mul( 0.85 ).add( 47.3 ) ).mul( 0.8 ) )
        const inside = sd.add( shift.add( deckle ).mul( u.roughness ).mul( u.edgeScale ) ).negate().toVar()

        // Dry-brush bristle streaks dragged along the nearest edge.
        const tangentPos = mix( vec2( p.y, p.x ), vec2( p.x, p.y ), corner )
        const streak = valueNoise( vec2( tangentPos.x.mul( 0.4 ), tangentPos.y.mul( 0.018 ) ) ).mul( 0.6 )
            .add( valueNoise( vec2( tangentPos.x.mul( 1.1 ), tangentPos.y.mul( 0.05 ) ).add( 71.3 ) ).mul( 0.4 ) )
        const reach = u.bristles.mul( mix( 2, 14, dry ) ).mul( u.edgeScale )
        const edge = inside.add( streak.sub( 0.58 ).mul( reach ) ).toVar()
        const aa = float( 0.75 ).div( u.dpr )
        const body = smoothstep( aa.negate(), aa, edge )

        // Loose paint flecks that landed on the paper just outside the edge.
        const fleckCell = float( 11 )
        const fleckPos = p.div( fleckCell )
        const fleckId = floor( fleckPos )
        const fleckCentre = hash22( fleckId.add( u.seed.mul( 17.1 ) ) ).mul( 0.4 ).add( 0.3 )
        const fleckRadius = hash12( fleckId.add( 91.7 ) ).mul( 0.1 ).add( 0.05 )
        const fleckDist = length( fract( fleckPos ).sub( fleckCentre ) )
        const outside = inside.negate()
        const band = smoothstep( 1.5, 4, outside ).mul( smoothstep( u.edgeScale.mul( 5 ), u.edgeScale.mul( 24 ), outside ).oneMinus() )
        const patchy = smoothstep( 0.35, 0.8, valueNoise( p.mul( 0.009 ).add( u.seed.mul( 5.3 ).add( 61.3 ) ) ) )
        const fleckOn = step( hash12( fleckId.add( u.seed.mul( 3.1 ) ).add( 7.3 ) ), u.flecks.mul( band ).mul( patchy ).mul( 0.45 ) )
        const fleck = fleckOn.mul( smoothstep( fleckRadius.sub( 0.04 ), fleckRadius.add( 0.02 ), fleckDist ).oneMinus() )

        const mask = mix( float( 1 ), max( body, fleck ), u.frameOn )
        const pooled = exp( max( edge, 0 ).div( - 2.2 ) ).mul( body ).mul( u.frameOn )

        return vec4( mask, pooled, tex, tooth )
    } )()
    const paper = cssRtt( paperNode, 'Paint · paper', 1, { autoUpdate: false } )

    // ── 2. stroke grid (static) ─────────────────────────────────────────────
    const cellOf = ( px ) =>
    {
        const cell = u.strokeWidth.mul( 1.7 )
        const id = floor( px.div( cell ) )
        return { cell, id, centre: id.add( hash22( id.add( u.seed.mul( 13.7 ) ) ).mul( 0.4 ).add( 0.3 ) ).mul( cell ) }
    }

    const strokeNoiseNode = Fn( () =>
    {
        const px = uv().mul( u.viewport )
        const w = u.strokeWidth
        const { id, centre } = cellOf( px )
        const radius = hash12( id.add( u.seed.mul( 2.3 ) ).add( 41.9 ) ).mul( 0.28 ).add( 0.32 ).mul( w )
        const dab = smoothstep( radius.sub( w.mul( 0.1 ) ), radius.add( w.mul( 0.06 ) ), length( px.sub( centre ) ) ).oneMinus()
        const ticket = hash12( id.add( u.seed.mul( 5.1 ) ).add( 3.7 ) )
        const bristle = valueNoise( px.div( w.mul( 0.1 ).add( 1.6 ) ).add( 41.3 ) ).mul( 0.35 )
            .add( valueNoise( px.div( w.mul( 0.03 ).add( 0.9 ) ).add( 17.9 ) ).mul( 0.15 ) )
            .add( 0.25 )
        return vec4( dab, ticket, bristle, 1 )
    } )()
    const strokeNoise = cssRtt( strokeNoiseNode, 'Paint · stroke grid', 1, { autoUpdate: false } )

    // ── 3. structure tensor of the colors ───────────────────────────────────
    const tensorNode = Fn( () =>
    {
        const texel = vec2( 1 ).div( u.viewport )
        const s = ( x, y ) => display.sample( uv().add( texel.mul( vec2( x, y ) ) ) ).rgb
        const a = s( - 1, - 1 ), b = s( 0, - 1 ), c = s( 1, - 1 )
        const d = s( - 1, 0 ), f = s( 1, 0 )
        const g = s( - 1, 1 ), h = s( 0, 1 ), i = s( 1, 1 )
        const gx = c.add( f.mul( 2 ) ).add( i ).sub( a ).sub( d.mul( 2 ) ).sub( g ).mul( 0.25 )
        const gy = g.add( h.mul( 2 ) ).add( i ).sub( a ).sub( b.mul( 2 ) ).sub( c ).mul( 0.25 )
        const t = vec3( dot( gx, gx ), dot( gy, gy ), dot( gx, gy ) )
        const energy = t.x.add( t.y )
        return vec4( t.div( energy.add( 0.02 ) ), energy )
    } )()
    const tensor = cssRtt( tensorNode, 'Paint · tensor', 0.5 )

    const detail = gaussianBlur( tensor, null, 1 )
    const halo = gaussianBlur( detail.getTextureNode(), null, 4, { resolutionScale: 0.5 } )

    // ── 4. stroke direction (double-angle encoded so blurring is sign-free) ─
    const flowNode = Fn( () =>
    {
        const a = detail.getTextureNode().sample( uv() )
        const b = halo.getTextureNode().sample( uv() )
        const px = uv().mul( u.viewport )

        const bias = u.strokeAngle.add( valueNoise( px.mul( 0.004 ).add( u.seed.mul( 1.9 ).add( 23.1 ) ) ).sub( 0.5 ).mul( 0.7 ) )
        const o = vec2( sin( bias ).negate(), cos( bias ) )
        const t = a.xyz.add( b.xyz.mul( u.haloWeight ) ).add( vec3( o.x.mul( o.x ), o.y.mul( o.y ), o.x.mul( o.y ) ).mul( 0.08 ) )
        const l = vec2( t.x.sub( t.y ), t.z.mul( 2 ) ).negate()
        const dir = l.div( max( length( l ), 1e-9 ) )

        const turn = valueNoise( px.div( u.stepLength.mul( 50 ) ).add( u.seed.mul( 3.1 ).add( 77.7 ) ) ).sub( 0.5 ).mul( 0.84 )
        const ct = cos( turn ), st = sin( turn )
        return vec4(
            dir.x.mul( ct ).sub( dir.y.mul( st ) ),
            dir.x.mul( st ).add( dir.y.mul( ct ) ),
            sqrt( max( a.w, 0 ) ),
            sqrt( max( b.w, 0 ) )
        )
    } )()
    const flow = cssRtt( flowNode, 'Paint · flow', 0.5 )

    const directionAt = ( px ) =>
    {
        const f = flow.sample( px.div( u.viewport ) ).level( 0 )
        const angle = atan( f.y, f.x ).mul( 0.5 )
        return vec2( cos( angle ), sin( angle ) )
    }

    // ── 5. strokes: march both ways along the flow ──────────────────────────
    const STEPS = 10

    const strokesNode = Fn( () =>
    {
        const texel = vec2( 1 ).div( u.viewport )
        const origin = uv().mul( u.viewport ).toVar()
        const start = strokeNoise.sample( uv() ).level( 0 )
        const startColor = display.sample( uv() ).level( 0 ).rgb

        const priority = ( s, t ) => s.x
            .mul( step( s.y, u.density ) )
            .mul( fract( s.y.div( max( u.density, 0.001 ) ).mul( 7.31 ) ).mul( 0.45 ).add( 0.55 ) )
            .mul( smoothstep( 0.55, 1, t ).oneMinus() )
        const tint = ( s ) => fract( s.y.mul( 13.7 ) ).sub( 0.5 ).mul( 0.08 ).add( 1 )

        const bias = start.z.sub( 0.5 ).mul( 0.5 )
        const best = priority( start, float( 0 ) ).toVar()
        const bestPos = vec2( origin ).toVar()
        const bestTint = tint( start ).toVar()
        const bestBody = start.x.toVar()
        const height = start.z.toVar()
        const colorSum = vec3( startColor ).toVar()
        const weight = float( 1 ).toVar()
        const dir0 = directionAt( origin ).toVar()

        const march = ( sign, name ) =>
        {
            const pos = vec2( origin ).toVar()
            const prev = dir0.mul( sign ).toVar()

            Loop( { start: int( 1 ), end: int( STEPS + 1 ), type: 'int', condition: '<', name }, ( loop ) =>
            {
                const t = float( loop[ name ] ).div( STEPS )
                const d = directionAt( pos ).toVar()
                If( dot( d, prev ).lessThan( 0 ), () => d.assign( d.negate() ) )
                pos.addAssign( d.mul( u.stepLength ) )
                prev.assign( d )

                const sampleUv = pos.mul( texel )
                const s = strokeNoise.sample( sampleUv ).level( 0 )
                const c = display.sample( sampleUv ).level( 0 ).rgb
                const pr = priority( s, t.add( bias ) )

                If( pr.greaterThan( best ), () =>
                {
                    bestPos.assign( pos )
                    bestTint.assign( tint( s ) )
                    bestBody.assign( s.x.mul( smoothstep( 0.55, 1, t.add( bias ) ).oneMinus() ) )
                } )
                best.assign( max( best, pr ) )

                const k = cos( t.mul( PI ) ).mul( 0.5 ).add( 0.5 )
                height.addAssign( s.z.mul( k ) )
                colorSum.addAssign( c.mul( k ) )
                weight.addAssign( k )
            } )
        }

        march( 1, 'fw' )
        march( - 1, 'bw' )

        const dabColor = display.sample( cellOf( bestPos ).centre.mul( texel ) ).level( 0 ).rgb.mul( bestTint )
        const owned = smoothstep( 0.02, 0.2, best )
        const color = mix( colorSum.div( weight ), dabColor, owned )

        const bristle = height.div( weight ).sub( 0.5 ).mul( 3.2 )
        const ridge = bestBody.mul( bestBody.oneMinus() ).mul( 4 ).mul( owned )
        const h = best.add( ridge.mul( 0.12 ) ).add( bristle.mul( best.mul( 0.2 ).add( 0.16 ) ) )

        return vec4( color, h )
    } )()
    const strokes = cssRtt( strokesNode, 'Paint · strokes', 1 )

    // ── 6. composite onto paper ─────────────────────────────────────────────
    const paintedNode = Fn( () =>
    {
        const frame = paper.sample( uv() )
        const base = clamp( display.sample( uv() ).rgb, 0, 1 ).toVar()
        const stroke = strokes.sample( uv() )
        const texel = vec2( 1 ).div( u.viewport )
        const px = uv().mul( u.viewport )
        const style = u.styleStrength

        const f = flow.sample( uv() )
        const angle = atan( f.y, f.x ).mul( 0.5 )
        const across = vec2( sin( angle ).negate(), cos( angle ) )

        const color = vec3( base ).toVar()

        // Lay the stroke colors only where they agree with the surface below,
        // so dabs never drag one region's color across a hard edge.
        const strokeColor = clamp( stroke.rgb, 0, 1 )
        const diff = strokeColor.sub( color )
        const agree = exp( dot( diff, diff ).mul( - 10 ) )
        color.assign( mix( color, strokeColor, clamp( u.smear.mul( style ).mul( agree ), 0, 1 ) ) )

        // Impasto: light the stroke height field.
        const hAt = ( x, y ) => strokes.sample( uv().add( texel.mul( vec2( x, y ) ) ) ).w
        const normal = normalize( vec3( hAt( 1, 0 ).sub( hAt( - 1, 0 ) ).negate(), hAt( 0, 1 ).sub( hAt( 0, - 1 ) ), 1.6 ) )
        const lit = dot( normal, u.lightDir ).sub( dot( vec3( 0, 0, 1 ), u.lightDir ) )
        color.mulAssign( lit.mul( u.relief ).mul( style ).mul( 1.6 ).add( 1 ) )

        // Speckle: tiny cells pull their color from a few pixels across the
        // stroke. Everywhere a little, much more along edges, so neighbouring
        // hues interleave like dry pastel on toothy paper.
        const fleck = u.speckleSize.mul( 2.1 )
        const cellPos = px.div( fleck )
        const cell = floor( cellPos )
        const r1 = hash12( cell.add( u.seed.mul( 3.3 ) ) )
        const r2 = hash12( cell.add( u.seed.mul( 1.7 ) ).add( 71.1 ) )
        const sideSign = select( r2.lessThan( 0.5 ), float( 1 ), float( - 1 ) )
        const reach = fleck.mul( r1.mul( 3 ).add( 1.2 ) )
        const neighbour = display.sample( uv().add( across.mul( sideSign ).mul( reach ).mul( texel ) ) ).rgb
        const edgeAmount = smoothstep( 0.02, 0.1, f.w ).mul( 0.85 ).add( smoothstep( 0.03, 0.2, f.z ).mul( 0.3 ) ).add( 0.04 )
        const patch = smoothstep( - 0.1, 0.55, snoise( px.mul( 0.045 ).add( u.seed.add( 12.7 ) ) ).add( snoise( px.mul( 0.14 ).add( 3.3 ) ).mul( 0.35 ) ) )
        const dotRadius = r2.mul( 0.3 ).add( 0.15 )
        const dot_ = smoothstep( dotRadius.sub( 0.08 ), dotRadius.add( 0.04 ), length( fract( cellPos ).sub( hash22( cell.add( 5.5 ) ).mul( 0.5 ).add( 0.25 ) ) ) ).oneMinus()
        const amount = u.speckle.mul( style ).mul( edgeAmount ).mul( patch ).mul( 1.4 )
        color.assign( mix( color, clamp( neighbour, 0, 1 ), step( r1, amount ).mul( dot_ ) ) )

        // Tone: a gentle S-curve (steeper mids, soft toe and shoulder so
        // nothing clips) plus a saturation lift, before the grain is laid in.
        const luma = dot( color, vec3( 0.2126, 0.7152, 0.0722 ) )
        color.assign( clamp( mix( vec3( luma ), color, u.saturation ), 0, 1 ) )
        color.assign( mix( color, color.mul( color ).mul( color.mul( - 2 ).add( 3 ) ), u.contrast ) )

        // Fixed dither: posterise to 9 levels per channel with screen-locked
        // noise. Channels cross levels at different places, which gives the
        // multi-hue grain. Never animated, so it reads as paper tooth.
        const devicePx = floor( px.mul( u.dpr ) )
        const noise = clamp(
            snoise( px.div( u.speckleSize.mul( 1.3 ) ).mul( 0.85 ).add( u.seed.mul( 9.1 ) ) ).mul( 0.6 )
                .add( hash12( devicePx.add( 3.7 ) ).mul( 0.4 ) )
                .add( 0.2 ),
            0, 1 )
        const quantised = floor( color.mul( 9 ).add( noise ) ).div( 9 )
        color.assign( mix( color, quantised, clamp( u.dither.mul( u.speckle ).mul( style ).mul( 0.7 ), 0, 1 ) ) )

        color.mulAssign( frame.z.sub( 0.5 ).mul( u.grain ).oneMinus() )
        color.mulAssign( frame.y.mul( u.edgeDarken ).oneMinus() )

        return vec4( mix( u.paper, clamp( color, 0, 1 ), frame.x ), 1 )
    } )()

    // ── pipeline ────────────────────────────────────────────────────────────
    const pipeline = new RenderPipeline( renderer )
    pipeline.outputColorTransform = false
    pipeline.outputNode = paintedNode

    const frameHalf = new Vector2()

    // A square sheet. Narrow portrait screens get a slightly taller card so
    // the subject is not tiny.
    function computeFrame()
    {
        const w = size.width, h = size.height
        const k = MathUtils.clamp( settings.frameSize, 0.3, 1.2 )
        if( w < h * 0.8 )
        {
            const halfW = w * Math.min( k * 1.14, 0.94 ) * 0.5
            return frameHalf.set( halfW, Math.min( halfW * 1.25, h * 0.4 ) )
        }
        const half = Math.min( w, h ) * k * 0.5
        return frameHalf.set( half, half )
    }

    function applySettings()
    {
        const s = settings
        u.frameOn.value = s.frame ? 1 : 0
        u.seed.value = s.seed
        u.roughness.value = s.edgeRoughness
        u.bristles.value = s.bristles
        u.flecks.value = s.flecks
        u.edgeDarken.value = s.frame ? s.edgeDarken : 0
        u.grain.value = s.grain
        // The composite runs on display-referred (sRGB) values, so skip the
        // usual sRGB → linear conversion when reading the paper color.
        u.paper.value.setStyle( s.paperColor, LinearSRGBColorSpace )
        u.styleStrength.value = MathUtils.clamp( s.styleStrength, 0, 4 )
        u.stepLength.value = Math.max( 0.5, s.strokeLength * 0.8 ) / 20
        u.strokeWidth.value = MathUtils.clamp( s.strokeWidth, 4, 64 )
        u.density.value = MathUtils.clamp( s.strokeDensity, 0, 1 )
        u.haloWeight.value = Math.max( 0, s.halo * 0.8 ) * 5
        u.strokeAngle.value = MathUtils.degToRad( s.strokeAngle )
        u.smear.value = MathUtils.clamp( s.smear, 0, 1 )
        u.relief.value = Math.max( 0, s.relief * 0.1 )
        const a = MathUtils.degToRad( s.lightAngle )
        u.lightDir.value.set( Math.cos( a ), Math.sin( a ), 0.9 ).normalize()
        u.speckle.value = Math.max( 0, s.speckle )
        u.speckleSize.value = MathUtils.clamp( s.speckleSize, 0.3, 6 )
        u.dither.value = Math.max( 0, s.dither )
        u.contrast.value = MathUtils.clamp( s.contrast, 0, 1 )
        u.saturation.value = Math.max( 0, s.saturation )

        syncFrame()
    }

    function syncFrame()
    {
        u.half.value.copy( computeFrame() )
        u.edgeScale.value = MathUtils.clamp( Math.min( frameHalf.x, frameHalf.y ) / 420, 0.5, 1.3 )
    }

    // Static targets only re-render when something they depend on changes.
    function refreshStatic()
    {
        paper.textureNeedsUpdate = true
        strokeNoise.textureNeedsUpdate = true
    }

    function setSize( width, height, dpr )
    {
        Object.assign( size, { width, height, dpr } )
        u.viewport.value.set( width, height )
        u.dpr.value = dpr
        for( const { target, scale } of cssTargets ) target.setResolutionScale( scale / dpr )
        syncFrame()
        refreshStatic()
    }

    const STATIC_KEYS = [ 'frame', 'frameSize', 'seed', 'edgeRoughness', 'bristles', 'flecks', 'strokeWidth' ]
    let staticKey = ''

    function update()
    {
        applySettings()
        const key = STATIC_KEYS.map( ( k ) => settings[ k ] ).join( '|' )
        if( key !== staticKey )
        {
            staticKey = key
            refreshStatic()
        }
    }

    const dpr = renderer.getPixelRatio()
    const s = renderer.getSize( new Vector2() )
    setSize( s.x, s.y, dpr )
    applySettings()

    return {
        settings,
        uniforms: u,
        pipeline,
        setSize,
        update,
        refreshStatic,
        frameRect()
        {
            const h = computeFrame()
            if( ! settings.frame ) return { x: 0, y: 0, width: size.width, height: size.height }
            return { x: size.width * 0.5 - h.x, y: size.height * 0.5 - h.y, width: h.x * 2, height: h.y * 2 }
        },
        render() { pipeline.render() },
    }
}
