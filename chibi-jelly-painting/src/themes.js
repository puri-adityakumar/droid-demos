import { Color, Vector3 } from 'three/webgpu'

import { light } from './materials/painted.js'
import { sky } from './scene/world.js'

const raw = {
    day: {
        label: 'Day',
        skyTop: '#6fa6f2',
        skyHorizon: '#ffd9cf',
        skyLeft: '#a796ea',
        skyRight: '#8fd6e0',
        blotch: '#ffffff',
        haze: '#c8d4ff',
        hazeAmount: 0.08,
        sparkle: '#fff6e4',
        sparkleStrength: 0.9,
        lightDir: [ - 0.5, 0.78, 0.55 ],
        rimDir: [ 0.7, 0.35, - 0.6 ],
        rimColor: '#fff2cf',
        bounce: '#ffd36b',
        shadowTint: '#6c63c9',
        shadowTintAmount: 0.24,
        cloud: '#ffffff',
        cloudShade: '#b7b0e8',
        paper: '#ffffff',
        ink: '#6b5647',
    },
    dusk: {
        label: 'Dusk',
        skyTop: '#4a3f93',
        skyHorizon: '#ffa27a',
        skyLeft: '#8a5fc4',
        skyRight: '#ff94a6',
        blotch: '#ffc6a3',
        haze: '#d6a6dc',
        hazeAmount: 0.1,
        sparkle: '#ffe4bf',
        sparkleStrength: 1,
        lightDir: [ 0.78, 0.3, 0.45 ],
        rimDir: [ - 0.7, 0.3, - 0.6 ],
        rimColor: '#ffbb80',
        bounce: '#ff965c',
        shadowTint: '#4a2f86',
        shadowTintAmount: 0.3,
        cloud: '#ffd8c4',
        cloudShade: '#8d6cc2',
        paper: '#ffffff',
        ink: '#5c3f4b',
    },
}

const COLOR_KEYS = [ 'skyTop', 'skyHorizon', 'skyLeft', 'skyRight', 'blotch', 'haze', 'sparkle', 'rimColor', 'bounce', 'shadowTint', 'cloud', 'cloudShade', 'paper' ]

export const themes = Object.fromEntries( Object.entries( raw ).map( ( [ id, t ] ) =>
{
    const parsed = {
        id, label: t.label, ink: t.ink, paperHex: t.paper,
        shadowTintAmount: t.shadowTintAmount, hazeAmount: t.hazeAmount, sparkleStrength: t.sparkleStrength,
    }
    for( const k of COLOR_KEYS ) parsed[ k ] = new Color( t[ k ] )
    parsed.lightDir = new Vector3( ...t.lightDir ).normalize()
    parsed.rimDir = new Vector3( ...t.rimDir ).normalize()
    return [ id, parsed ]
} ) )

/** Eases every theme-driven uniform toward the active theme each frame. */
export function createThemeDriver( { farClouds, sparkles, filter } )
{
    let target = themes.day
    const paper = themes.day.paper.clone()
    const cloudPaint = farClouds.material.userData.paint

    function set( id )
    {
        target = themes[ id ] ?? themes.day
        document.documentElement.dataset.theme = target.id
        document.documentElement.style.setProperty( '--ink', target.ink )
        document.documentElement.style.setProperty( '--paper', target.paperHex )
    }

    function snap()
    {
        update( 1e3 )
    }

    function update( dt )
    {
        const k = 1 - Math.exp( - dt * 3.2 )
        sky.top.value.lerp( target.skyTop, k )
        sky.horizon.value.lerp( target.skyHorizon, k )
        sky.left.value.lerp( target.skyLeft, k )
        sky.right.value.lerp( target.skyRight, k )
        sky.blotch.value.lerp( target.blotch, k )
        light.haze.value.lerp( target.haze, k )
        light.hazeAmount.value += ( target.hazeAmount - light.hazeAmount.value ) * k
        sparkles.tint.value.lerp( target.sparkle, k )
        sparkles.strength.value += ( target.sparkleStrength - sparkles.strength.value ) * k
        light.rimColor.value.lerp( target.rimColor, k )
        light.bounce.value.lerp( target.bounce, k )
        light.shadowTint.value.lerp( target.shadowTint, k )
        light.shadowTintAmount.value += ( target.shadowTintAmount - light.shadowTintAmount.value ) * k
        light.dir.value.lerp( target.lightDir, k ).normalize()
        light.rimDir.value.lerp( target.rimDir, k ).normalize()
        cloudPaint.base.value.lerp( target.cloud, k )
        cloudPaint.shade.value.lerp( target.cloudShade, k )
        paper.lerp( target.paper, k )
        filter.settings.paperColor = '#' + paper.getHexString()
    }

    return { set, snap, update, get current() { return target.id } }
}
