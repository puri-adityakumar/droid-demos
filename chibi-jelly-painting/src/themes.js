import { Color, Vector3 } from 'three/webgpu'

import { light } from './materials/painted.js'
import { sky } from './scene/world.js'
import { voidLook } from './scene/void.js'
import { meadowLook } from './scene/frieren.js'
import { wisteriaLook } from './scene/nezuko.js'
import { erenLook } from './scene/eren.js'
import { shrineLook } from './scene/shrine.js'

// Two moods per world. The page has one switch, so a mood is a slot ('day' or
// 'dusk') and each world decides what that slot looks like: Goku's sky goes
// from day to dusk, Light's room from lamp light to moonlight, Gojo's void
// from the Unlimited Void to Hollow Purple, Frieren's meadow from a sunlit
// Flower Field to a starlit Zoltraak spell, Nezuko's wisteria from sunrise to
// the pink flames of Exploding Blood, and Eren's Shiganshina from a clear
// Survey Corps morning to the burning dusk he turns into the Attack Titan in.
const raw = {
    sky: {
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
    },
    // Light's desk at night. The wall is the painted backdrop: amber pooling on
    // the lamp side, a cool glaze toward the window. The haze does the night
    // grading, since every painted surface is pulled toward it.
    room: {
        day: {
            label: 'Lamp light',
            skyTop: '#1d2150',
            skyHorizon: '#5a3a58',
            skyLeft: '#e0905a',
            skyRight: '#34499a',
            blotch: '#7a5a92',
            haze: '#2a3068',
            hazeAmount: 0.2,
            sparkle: '#ffe9c0',
            sparkleStrength: 0,
            lightDir: [ - 0.8, 0.5, 0.45 ],
            rimDir: [ 0.7, 0.4, - 0.55 ],
            rimColor: '#a9c8ff',
            bounce: '#ff9a58',
            shadowTint: '#2c2468',
            shadowTintAmount: 0.42,
            cloud: '#ffd8c4',
            cloudShade: '#8d6cc2',
            paper: '#ffffff',
            ink: '#4a3550',
            lamp: 1,
        },
        dusk: {
            label: 'Moonlight',
            skyTop: '#0b0f30',
            skyHorizon: '#232a5e',
            skyLeft: '#2a2f68',
            skyRight: '#4c76cc',
            blotch: '#3a4084',
            haze: '#0c1238',
            hazeAmount: 0.5,
            sparkle: '#cfe0ff',
            sparkleStrength: 0,
            lightDir: [ 0.55, 0.6, 0.25 ],
            rimDir: [ 0.7, 0.4, - 0.5 ],
            rimColor: '#c4dcff',
            bounce: '#4a5aa0',
            shadowTint: '#12175e',
            shadowTintAmount: 0.6,
            cloud: '#ffd8c4',
            cloudShade: '#8d6cc2',
            paper: '#ffffff',
            ink: '#2d3358',
            lamp: 0,
        },
    },
    // Gojo's void. The sky shader's four colours become a night with no ground:
    // indigo through the middle, magenta pooling low on the left, blue up on
    // the right. The two moods are his two techniques: the cold Unlimited Void,
    // and Hollow Purple, where Blue and Red have merged and the whole field
    // turns violet.
    void: {
        day: {
            label: 'Unlimited Void',
            skyTop: '#161258',
            skyHorizon: '#2a1260',
            skyLeft: '#e02a9c',
            skyRight: '#3b44ea',
            blotch: '#ffffff',
            haze: '#1c1860',
            hazeAmount: 0.16,
            sparkle: '#dfe8ff',
            sparkleStrength: 1,
            lightDir: [ - 0.55, 0.65, 0.6 ],
            rimDir: [ 0.75, 0.3, - 0.55 ],
            rimColor: '#ff7ab8',
            bounce: '#5a64ff',
            shadowTint: '#241a8a',
            shadowTintAmount: 0.45,
            cloud: '#ffffff',
            cloudShade: '#8d6cc2',
            paper: '#ffffff',
            ink: '#2a2a66',
            rays: '#ff4f9a',
            splash: '#f1eeff',
        },
        dusk: {
            label: 'Hollow Purple',
            skyTop: '#2a0e6e',
            skyHorizon: '#5a1470',
            skyLeft: '#e0309a',
            skyRight: '#8a3cf0',
            blotch: '#f2dcff',
            haze: '#3a1478',
            hazeAmount: 0.2,
            sparkle: '#f2d6ff',
            sparkleStrength: 1,
            lightDir: [ - 0.5, 0.6, 0.65 ],
            rimDir: [ 0.75, 0.3, - 0.55 ],
            rimColor: '#e4a2ff',
            bounce: '#c040ff',
            shadowTint: '#4a1696',
            shadowTintAmount: 0.5,
            cloud: '#ffffff',
            cloudShade: '#8d6cc2',
            paper: '#ffffff',
            ink: '#4a2470',
            rays: '#b9a0ff',
            splash: '#fbeaff',
            purple: 1,
        },
    },
    // Frieren's meadow. In the day slot she stands in a warm, breezy sky over
    // a bed of Blue-Moon Weed flowers; in the dusk slot the sky deepens to an
    // astral night and her Zoltraak spell circles blaze cyan.
    meadow: {
        day: {
            label: 'Flower field',
            skyTop: '#5cb4f2',
            skyHorizon: '#fff0d8',
            skyLeft: '#9eb4f6',
            skyRight: '#7de4d4',
            blotch: '#ffffff',
            haze: '#c8e4ff',
            hazeAmount: 0.08,
            sparkle: '#fff8e8',
            sparkleStrength: 0.85,
            lightDir: [ - 0.52, 0.78, 0.56 ],
            rimDir: [ 0.72, 0.36, - 0.58 ],
            rimColor: '#fff6d8',
            bounce: '#78e0a4',
            shadowTint: '#5b66cc',
            shadowTintAmount: 0.24,
            cloud: '#ffffff',
            cloudShade: '#a8b8ec',
            paper: '#ffffff',
            ink: '#46586e',
            petal: '#c8ecff',
            ring: '#7ad8ff',
            mana: 0,
        },
        dusk: {
            label: 'Zoltraak',
            skyTop: '#111b4a',
            skyHorizon: '#234678',
            skyLeft: '#463894',
            skyRight: '#2482b8',
            blotch: '#bceeff',
            haze: '#1a2c68',
            hazeAmount: 0.18,
            sparkle: '#d4f6ff',
            sparkleStrength: 1,
            lightDir: [ 0.55, 0.62, 0.56 ],
            rimDir: [ - 0.72, 0.35, - 0.58 ],
            rimColor: '#88f0ff',
            bounce: '#42b8ff',
            shadowTint: '#1c2478',
            shadowTintAmount: 0.42,
            cloud: '#bfe4ff',
            cloudShade: '#3d52a0',
            paper: '#ffffff',
            ink: '#263c66',
            petal: '#94f0ff',
            ring: '#8ef6ff',
            mana: 1,
        },
    },
    // Nezuko's island under the wisteria. The day slot is the sunrise she
    // finally stood in; the dusk slot is a crimson night where her Blood Demon
    // Art, Exploding Blood, burns pink around her.
    wisteria: {
        day: {
            label: 'Sunrise',
            skyTop: '#7aa6ec',
            skyHorizon: '#ffd4a8',
            skyLeft: '#c4a2ec',
            skyRight: '#ffb4a0',
            blotch: '#ffffff',
            haze: '#e2d0ff',
            hazeAmount: 0.08,
            sparkle: '#fff2e0',
            sparkleStrength: 0.8,
            lightDir: [ 0.62, 0.52, 0.6 ],
            rimDir: [ - 0.7, 0.35, - 0.6 ],
            rimColor: '#ffd8a8',
            bounce: '#d8a2ff',
            shadowTint: '#7458c8',
            shadowTintAmount: 0.26,
            cloud: '#fff4ec',
            cloudShade: '#c0a4e4',
            paper: '#ffffff',
            ink: '#5a4660',
            flame: '#ff6aa8',
            blossom: '#dcc0ff',
            orb: '#fff2c8',
            blood: 0,
        },
        dusk: {
            label: 'Exploding Blood',
            skyTop: '#140826',
            skyHorizon: '#4c0e38',
            skyLeft: '#3c1a6c',
            skyRight: '#c2306e',
            blotch: '#ffb4d4',
            haze: '#2a0c36',
            hazeAmount: 0.15,
            sparkle: '#ffd0e4',
            sparkleStrength: 1,
            lightDir: [ - 0.5, 0.6, 0.62 ],
            rimDir: [ 0.72, 0.35, - 0.58 ],
            rimColor: '#ff72b0',
            bounce: '#ff3c8a',
            shadowTint: '#2c0e5c',
            shadowTintAmount: 0.45,
            cloud: '#8a4a8a',
            cloudShade: '#2e1444',
            paper: '#ffffff',
            ink: '#4c2044',
            flame: '#ff4fa0',
            blossom: '#ff86c0',
            orb: '#ffe6f0',
            blood: 1,
        },
    },
    // Sukuna's Domain: a blood-red night over the pool, the sky glowing low
    // behind the shrine; in the dusk slot he opens Fuga and the whole domain
    // burns, the sky turning to smoke and embers.
    sukuna: {
        day: {
            label: 'Malevolent Shrine',
            skyTop: '#0c0207',
            skyHorizon: '#a01c2c',
            skyLeft: '#6a0c1e',
            skyRight: '#1e050e',
            blotch: '#e04456',
            haze: '#2a0812',
            hazeAmount: 0.12,
            sparkle: '#ffccd6',
            sparkleStrength: 0,
            lightDir: [ - 0.48, 0.68, 0.62 ],
            rimDir: [ 0.76, 0.35, - 0.56 ],
            rimColor: '#ff4c6a',
            bounce: '#c0203e',
            shadowTint: '#2a0818',
            shadowTintAmount: 0.4,
            cloud: '#6e2844',
            cloudShade: '#240a18',
            paper: '#ffffff',
            ink: '#4a1828',
        },
        dusk: {
            label: 'Fuga',
            skyTop: '#140504',
            skyHorizon: '#ff7a1c',
            skyLeft: '#b02a0c',
            skyRight: '#3a0c08',
            blotch: '#ffb45a',
            haze: '#3a1206',
            hazeAmount: 0.13,
            sparkle: '#ffe0b0',
            sparkleStrength: 0,
            lightDir: [ 0.5, 0.62, 0.6 ],
            rimDir: [ - 0.74, 0.36, - 0.56 ],
            rimColor: '#ffa040',
            bounce: '#ff6a1c',
            shadowTint: '#3a0c10',
            shadowTintAmount: 0.4,
            cloud: '#8a3a1c',
            cloudShade: '#2a0a08',
            paper: '#ffffff',
            ink: '#4a2010',
            fuga: 1,
        },
    },
    // Shiganshina under Wall Maria. The day slot is a clear morning for the
    // scout; the dusk slot is the smoky orange evening of the fall of the
    // district, and switching to it is what makes him transform.
    eren: {
        day: {
            label: 'Scout',
            skyTop: '#6aa2e6',
            skyHorizon: '#ffe6c8',
            skyLeft: '#9cb4ea',
            skyRight: '#a6dcd4',
            blotch: '#ffffff',
            haze: '#d4dcf0',
            hazeAmount: 0.1,
            sparkle: '#fff6e4',
            sparkleStrength: 0,
            lightDir: [ - 0.5, 0.76, 0.58 ],
            rimDir: [ 0.7, 0.36, - 0.6 ],
            rimColor: '#fff0d0',
            bounce: '#e8c890',
            shadowTint: '#5c6aa8',
            shadowTintAmount: 0.24,
            cloud: '#ffffff',
            cloudShade: '#b4b8dc',
            paper: '#ffffff',
            ink: '#4e4440',
            titan: 0,
        },
        dusk: {
            label: 'Attack Titan',
            skyTop: '#3a2448',
            skyHorizon: '#ff9a52',
            skyLeft: '#c24a3a',
            skyRight: '#7a3a58',
            blotch: '#ffc890',
            haze: '#6a3a44',
            hazeAmount: 0.14,
            sparkle: '#ffe0b0',
            sparkleStrength: 0,
            lightDir: [ 0.7, 0.4, 0.55 ],
            rimDir: [ - 0.72, 0.34, - 0.6 ],
            rimColor: '#ffb070',
            bounce: '#ff7a3c',
            shadowTint: '#4a2050',
            shadowTintAmount: 0.34,
            cloud: '#e8a088',
            cloudShade: '#6a3a5a',
            paper: '#ffffff',
            ink: '#4a2a30',
            titan: 1,
        },
    },
}

const COLOR_KEYS = [ 'skyTop', 'skyHorizon', 'skyLeft', 'skyRight', 'blotch', 'haze', 'sparkle', 'rimColor', 'bounce', 'shadowTint', 'cloud', 'cloudShade', 'paper', 'rays', 'splash', 'petal', 'ring', 'flame', 'blossom', 'orb' ]
// worlds without ink, speed lines or petals still need a value for the driver to ease from
const DEFAULTS = { rays: '#ffffff', splash: '#ffffff', petal: '#c8ecff', ring: '#7ad8ff', flame: '#ff4fa0', blossom: '#d6b4ff', orb: '#fff0c8' }

export const slots = [ 'day', 'dusk' ]

export const worlds = Object.fromEntries( Object.entries( raw ).map( ( [ world, set ] ) => [ world, Object.fromEntries( Object.entries( set ).map( ( [ slot, t ] ) =>
{
    const parsed = {
        slot, label: t.label, ink: t.ink, paperHex: t.paper, lamp: t.lamp ?? 0, purple: t.purple ?? 0, mana: t.mana ?? 0, blood: t.blood ?? 0, titan: t.titan ?? 0, fuga: t.fuga ?? 0,
        shadowTintAmount: t.shadowTintAmount, hazeAmount: t.hazeAmount, sparkleStrength: t.sparkleStrength,
    }
    for( const k of COLOR_KEYS ) parsed[ k ] = new Color( t[ k ] ?? DEFAULTS[ k ] )
    parsed.lightDir = new Vector3( ...t.lightDir ).normalize()
    parsed.rimDir = new Vector3( ...t.rimDir ).normalize()
    return [ slot, parsed ]
} ) ) ] ) )

/** Eases every theme-driven uniform toward the active mood each frame. */
export function createThemeDriver( { farClouds, sparkles, filter } )
{
    let world = 'sky'
    let slot = 'day'
    let target = worlds[ world ][ slot ]
    const paper = target.paper.clone()
    const cloudPaint = farClouds.material.userData.paint

    function apply()
    {
        target = worlds[ world ][ slot ]
        document.documentElement.dataset.theme = slot
        document.documentElement.dataset.world = world
        document.documentElement.style.setProperty( '--ink', target.ink )
        document.documentElement.style.setProperty( '--paper', target.paperHex )
    }

    function set( id )
    {
        slot = slots.includes( id ) ? id : 'day'
        apply()
    }

    function setWorld( id )
    {
        if( ! worlds[ id ] ) return
        world = id
        apply()
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
        light.lamp.value += ( target.lamp - light.lamp.value ) * k
        voidLook.rays.value.lerp( target.rays, k )
        voidLook.splash.value.lerp( target.splash, k )
        voidLook.purple.value += ( target.purple - voidLook.purple.value ) * k
        meadowLook.petal.value.lerp( target.petal, k )
        meadowLook.ring.value.lerp( target.ring, k )
        meadowLook.mana.value += ( target.mana - meadowLook.mana.value ) * k
        wisteriaLook.flame.value.lerp( target.flame, k )
        wisteriaLook.blossom.value.lerp( target.blossom, k )
        wisteriaLook.orb.value.lerp( target.orb, k )
        wisteriaLook.blood.value += ( target.blood - wisteriaLook.blood.value ) * k
        // the form is a switch, not a blend: eren.js plays the transformation itself
        if( world === 'eren' ) erenLook.goal = target.titan
        shrineLook.fire += ( target.fuga - shrineLook.fire ) * k
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

    return {
        set, setWorld, snap, update,
        get current() { return slot },
        get world() { return world },
        label: ( id ) => worlds[ world ][ id ].label,
    }
}
