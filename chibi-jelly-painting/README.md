# Chibi Jelly Painting

A chibi martial-arts kid riding a wobbly cloud, a smirking chibi Light Yagami
sitting at his desk at night, writing in the Death Note, a chibi Gojo Satoru
hovering over an Infinity sign in a void of ink, a chibi Frieren standing in a
floating bed of Blue-Moon Weed flowers with her mage's staff and open grimoire, and a
chibi Nezuko Kamado on a floating mossy island under hanging wisteria, painted
live in the browser. One page, one switch for the mood (day and dusk in the sky, lamp
light and moonlight at the desk, Unlimited Void and Hollow Purple in the void, Flower
field and Zoltraak in the meadow, Sunrise and Exploding Blood under the wisteria), one
card per character.

<p>
  <img src="screenshots/day.jpg" width="32%" alt="Day" />
  <img src="screenshots/turn.jpg" width="32%" alt="Turned around" />
  <img src="screenshots/dusk.jpg" width="32%" alt="Dusk" />
</p>
<p>
  <img src="screenshots/light-day.jpg" width="48%" alt="Light Yagami at his desk, lamp light" />
  <img src="screenshots/light-dusk.jpg" width="48%" alt="Light Yagami at his desk, moonlight" />
</p>
<p>
  <img src="screenshots/gojo-day.jpg" width="48%" alt="Gojo Satoru in the Unlimited Void" />
  <img src="screenshots/gojo-dusk.jpg" width="48%" alt="Gojo Satoru with Hollow Purple" />
</p>
<p>
  <img src="screenshots/frieren-day.jpg" width="48%" alt="Frieren in a field of Blue-Moon Weed flowers" />
  <img src="screenshots/frieren-dusk.jpg" width="48%" alt="Frieren casting Zoltraak" />
</p>
<p>
  <img src="screenshots/nezuko-day.jpg" width="48%" alt="Nezuko under the wisteria at sunrise" />
  <img src="screenshots/nezuko-dusk.jpg" width="48%" alt="Nezuko wreathed in the pink flames of Exploding Blood" />
</p>

- **Live:** [chibi-jelly-painting.vercel.app](https://chibi-jelly-painting.vercel.app)
- **Model:** Opus 5.5 (high) for the build, Sonnet 5.5 (high) for the final polish, video, repo and deploy
- **Tokens:** ~580K (300K input + 279K output), plus 35.7M read from cache
- **Time:** 1h 25m of active agent time, spread over several days of iteration
- **Built with:** Droid in the Factory app
- **Stack:** three.js WebGPU + TSL (WebGL 2 fallback), Vite
- **Style:** a screen-space paint filter after mesq's [Jelly Painting](https://x.com/mesqme/status/2106646827193778352)
- **Character:** built from primitives in code, with no model files

## Run it

```bash
npm install
npm run dev      # http://localhost:5173  (add ?webgl to force the WebGL 2 backend)
npm run build    # static build in dist/
```

## Controls

Tap the character to jump (Light only hops in his chair), tap the cloud, Light's notebook, Gojo's Infinity sign, Frieren's flower bed or Nezuko's island to bounce it, drag to orbit, scroll to zoom.
Five painted cards beside the sheet pick the character, **Goku**, **Light Yagami**,
**Gojo Satoru**, **Frieren** or **Nezuko Kamado** (each hops in on arrival); the selected one is outlined. An icon-only
button in the top right flips the mood: sun / moon for Goku's sky (day, dusk), lamp / moon
for Light's desk (lamp light, moonlight), the Infinity sign / a purple orb for Gojo's
void (Unlimited Void, Hollow Purple), and a Blue-Moon Weed blossom / Zoltraak magic seal for
Frieren's meadow (Flower field, Zoltraak), and a rising sun / pink flame for Nezuko's wisteria
(Sunrise, Exploding Blood). The card previews are
captured from the live pipeline at load. Add `?char=light`, `?char=gojo`, `?char=frieren` or `?char=nezuko` to open on a
specific character.
Keys: `space`/`j` jump · `w` wave · `t` mood · `c` next character · `1` Goku · `2` Light Yagami · `3` Gojo Satoru · `4` Frieren · `5` Nezuko Kamado · `g` paint settings.

## How it works

- `src/materials/painted.js` — painted lighting. Object-space brush noise bends the
  shading normal (a procedural stand-in for hand-painted normal maps), then hard,
  noise-wobbled light bands break surfaces into flat painted planes with cool
  shadows, a rim light, a warm bounce from the cloud and a pastel haze that
  keeps the darks soft.
- `src/post/paintFilter.js` — the screen-space painting, all TSL:
  1. paper + torn frame (static): a square sheet with a torn, deckled edge,
     dry-brush bristles and loose paint flecks on the paper around it
  2. stroke grid (static): jittered dabs, each with a random ticket
  3. structure tensor of the colors (Sobel), blurred twice (detail + wide halo)
  4. flow: a stroke direction running along color edges, double-angle encoded
  5. strokes: march 10 steps each way along the flow, smear the color and let the
     strongest dab on the path claim the pixel with its flat center color
  6. composite: agreement-gated smear, speckle (cells that borrow color from a
     few pixels across the stroke, heaviest on edges) and a screen-locked
     9-level dither that gives the multi-hue pastel grain. Impasto relief,
     paper grain and edge pooling are available in the settings but off by default
- `src/scene/character.js` — the kid, built from primitives (no model files). It also
  exports the head, hair-blade and torso helpers the other character reuses.
- `src/scene/yagami.js` — Light Yagami, same recipe: honey-brown bowl cut with a swept
  fringe, narrow eyes with a red glint, a smirk, the tan jacket and red tie, and a pen
  in his right hand. He sits behind his desk instead of riding a cloud: the open Death
  Note on the desk plays the cloud's part (block lettering on the inside cover, names
  on the page, a bookmark ribbon that sways, a bounce when tapped), plus Ryuk's apple.
  Reference: the Death Note wiki and the Light Nendoroid.
- `src/scene/room.js` — his desk at night: the wooden desk (its top is as high as his
  waist, so it hides his legs) and the back of his chair, a brass desk lamp whose glow
  is a real uniform (`light.lamp`) that fades the halo, the pool of light on the desk
  and the bulb, a window onto a lit city with a crescent moon and Kira-red curtains,
  stacked books, a sheet of names and a mug of pencils. The wall is the painted
  backdrop; the far clouds and sparkles are hidden here.
- `src/scene/gojo.js` — Gojo Satoru: messy snow-white hair (tufts on the crown, bangs
  that hang between his eyes), pale blue Six Eyes with a lighter rim and a soft lash
  line, a dark navy jacket zipped up to a high collar that flares around his chin, and
  longer sleeves so one hand can make the two-finger sign (palm out) beside his cheek while the
  other grips his collar. In place of the cloud he hovers over an Infinity sign (a
  lemniscate tube) that his Blue and Red orbs run around. In the Hollow Purple mood
  the two orbs spiral together into a churning purple orb of energy that throws
  sparks over his raised hand. Reference: the JJK wiki and the Gojo Nendoroid.
- `src/scene/void.js` — his backdrop: white ink waves with flung drops and thin speed
  lines, flat shapes that always face the camera so orbiting never shows them edge-on.
  Their colours (and the `purple` mix that drives the orbs) are theme uniforms.
- `src/scene/frieren.js` — Frieren: silver-white hair in long sweeping twin-tails tied with
  black-and-gold ribbons, long pointed elf ears with red drop earrings, calm emerald-green
  eyes with a relaxed lash line and cat-like smile, a white gold-trimmed capelet with a red
  brooch over her belted tunic and skirt, dark tights and cuffed brown boots, holding her
  red crescent mage's staff. She stands in a floating bed of Blue-Moon Weed blossoms with an
  open floating grimoire and drifting petals; in the Zoltraak mood, glowing geometric spell
  circles unfurl behind her, around the meadow and at her staff tip.
- `src/scene/nezuko.js` — Nezuko Kamado: long black hair that turns flame-orange toward the
  tips (each lock is an orange blade under a slightly larger black one, so the orange licks
  up its edges), a small pink ribbon, big pink eyes with slit pupils and long lashes, the
  bamboo muzzle tied with red cloth, a pale pink asanoha kimono with a red-and-white
  checkered obi, orange obijime and green obiage, a long dark-brown haori hanging open,
  black kyahan, white tabi and pink-strapped zori. She stands on a floating mossy island
  strewn with fallen petals beside Tanjiro's wooden box, under a wisteria branch that turns
  with the camera so it always hangs behind her. In the Exploding Blood mood pink flames and
  embers burn up around her. Reference: the Demon Slayer wiki and the Nezuko Nendoroid.
- `src/scene/glow.js` — the soft round glow shared by the lamp, the moon and the orbs.
- `src/scene/world.js` — the nimbus cloud (recolorable), far clouds, the painted
  multi-hue sky and the twinkling sparkles.
- `src/scene/rig.js` — springs for bobbing, blinking, head tracking, squash-and-stretch
  jumps, hair lag, tail swish and the occasional wave. A character can hold an arm
  pose by exposing `armRest` (with `scribble` for a hand that is writing), pick which
  arm waves (`waveSide`, with its own `wavePose` if the default would hide the hand
  behind the head), bob and hop less (`bobScale`, `jumpScale`) and may have no
  tail. A prop can be `grounded`: it stays on its desk (`baseY`) and only squashes,
  and may have an `update(t)` of its own (Gojo's orbs).
- `src/main.js` — also gives each character their own camera height (`view.polar`),
  so Light is seen from above enough to read the notebook; the camera eases there on
  a swap until you grab it.
- `src/themes.js` — two moods per world, eased every frame: `sky` (day, dusk), `room`
  (lamp light, moonlight), `void` (Unlimited Void, Hollow Purple), `meadow` (Flower
  field, Zoltraak) and `wisteria` (Sunrise, Exploding Blood). The switch picks a slot; each character's world decides
  what it looks like.

Dev-only debug hook: `window.__chibi` (renderer, scene, camera, controls, filter, cast, theme, character).
