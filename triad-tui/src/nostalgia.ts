import { z } from 'zod';
import { createSdkMcpServer, tool, type SdkMcpServer } from '@factory/droid-sdk/node';
import type { LaneConfig, LaneId, LaneState, VibeMode } from './types.js';

export const LANE_CONFIGS: Record<LaneId, LaneConfig> = {
  frontier: {
    id: 'frontier',
    channelNumber: 'CH-01',
    title: 'FRONTIER LAB',
    subtitle: 'Heavyweight Flagship',
    color: 'yellow',
    accentSymbol: '◈',
    models: [
      {
        id: 'claude-opus-5-5',
        label: 'Opus 5.5',
        provider: 'Anthropic',
        tagline: 'Deep synthesis & flagship reasoning',
      },
      {
        id: 'gpt-6-sol',
        label: 'GPT-6 Sol',
        provider: 'OpenAI',
        tagline: 'Frontier omni-architecture',
      },
      {
        id: 'claude-fable-5.1',
        label: 'Fable 5.1',
        provider: 'Anthropic',
        tagline: 'Creative frontier flagship',
      },
      {
        id: 'claude-sonnet-5',
        label: 'Sonnet 5',
        provider: 'Anthropic',
        tagline: 'Balanced frontier velocity',
      },
      {
        id: 'gemini-3.1-pro-preview',
        label: 'Gemini 3.1 Pro',
        provider: 'Google',
        tagline: 'Long-horizon multimodal pro',
      },
      {
        id: 'grok-4.7',
        label: 'Grok 4.7',
        provider: 'xAI',
        tagline: 'Sharp frontier wit',
      },
    ],
  },
  opensource: {
    id: 'opensource',
    channelNumber: 'CH-02',
    title: 'OPEN SOURCE',
    subtitle: 'Open-Weights Rebel',
    color: 'green',
    accentSymbol: '❖',
    models: [
      {
        id: 'glm-5.3',
        label: 'GLM-5.3',
        provider: 'Zhipu Open',
        tagline: 'High-octane open weights',
      },
      {
        id: 'kimi-k3',
        label: 'Kimi K3',
        provider: 'Moonshot Open',
        tagline: 'MoE open reasoning engine',
      },
      {
        id: 'deepseek-v4-pro',
        label: 'DeepSeek V4 Pro',
        provider: 'DeepSeek',
        tagline: 'Open-weights logic specialist',
      },
      {
        id: 'qwen3.8-max',
        label: 'Qwen 3.8 Max',
        provider: 'Qwen Open',
        tagline: 'Dense polyglot open rebel',
      },
      {
        id: 'nemotron-3-ultra',
        label: 'Nemotron 3 Ultra',
        provider: 'NVIDIA Open',
        tagline: 'Open frontier distillation',
      },
    ],
  },
  lightweight: {
    id: 'lightweight',
    channelNumber: 'CH-03',
    title: 'LIGHTWEIGHT',
    subtitle: 'Turbo Pocket Speedster',
    color: 'cyan',
    accentSymbol: '⚡',
    models: [
      {
        id: 'claude-haiku-4-5-20251001',
        label: 'Haiku 4.5',
        provider: 'Anthropic',
        tagline: 'Sub-second reflex & crisp wit',
      },
      {
        id: 'gemini-3.8-flash',
        label: 'Gemini 3.8 Flash',
        provider: 'Google',
        tagline: 'Hyper-lightweight sprinter',
      },
      {
        id: 'gpt-5.4-mini-fast',
        label: 'GPT-5.4 Mini Fast',
        provider: 'OpenAI',
        tagline: 'Compact low-latency spark',
      },
      {
        id: 'glm-5.3-flash',
        label: 'GLM-5.3 Flash',
        provider: 'Zhipu Flash',
        tagline: 'Featherweight open speedster',
      },
      {
        id: 'deepseek-v4.1-flash',
        label: 'DeepSeek V4.1 Flash',
        provider: 'DeepSeek',
        tagline: 'Instant token stream',
      },
    ],
  },
};

export const CASSETTE_FRAMES = [
  '[ (●)═══(●) ]',
  '[ (◐)═══(◐) ]',
  '[ (◓)═══(◓) ]',
  '[ (◑)═══(◑) ]',
  '[ (◒)═══(◒) ]',
];

export const VU_METER_FRAMES = [
  '▂▅▇▃▅▂dB',
  '▅▂▃▇▂▆dB',
  '▃▇▅▂▆▃dB',
  '▇▃▂▅▃▇dB',
  '▄▆▂▇▄▂dB',
  '▂▄▆▃▇▅dB',
];

export const IDLE_VU_FRAMES = [
  '▁▂▁▁▂▁dB',
  '▁▁▂▁▁▂dB',
  '▂▁▁▂▁▁dB',
];

export const TOOL_SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export const CRT_PULSE_FRAMES = ['░▒▓█▓▒░', '▒▓█▓▒░░', '▓█▓▒░░▒', '█▓▒░░▒▓', '▓▒░░▒▓█', '▒░░▒▓█▓', '░░▒▓█▓▒'];

export const BOOT_SEQUENCE_LINES = [
  'BIOS v1.98 // FACTORY CYBERDECK TRIPLE-BUS INITIALIZING...',
  'ATDT 1-800-DROID-SDK ... CONNECT 56600/ARQ/V.90/LAPM',
  'MOUNTING 3 PARALLEL NEURAL CARTRIDGES: [CH-01 FRONTIER] [CH-02 OPEN-SRC] [CH-03 LIGHT]',
  'CALIBRATING PHOSPHOR SCANLINES & WINAMP SPECTRUM ANALYZER... OK!',
];

export const NOSTALGIA_IDLE_TIPS = [
  '♫ Winamp 2.91: It really whips the llama\'s ass // Type any prompt to broadcast to all 3 channels',
  '♦ Tip: Try "/ask plan a retro weekend project" to see all 3 models ask you questions in the single bar!',
  '♦ Tip: Try "/tools spin the 8-ball and drop a mixtape" to watch parallel MCP tool cartridges fire!',
  '♦ Tip: Press Tab or /vibe to cycle response personas (98-Lounge -> Arcade -> BBS -> Raw)',
  '♦ Tip: Use /swap 1, /swap 2, or /swap 3 to hot-swap models inside any channel mid-session!',
];

/**
 * Returns a little animated ASCII Tamagotchi/CRT buddy for each channel's state.
 */
export function getMascotFrame(status: LaneState['status'], tick: number): string {
  switch (status) {
    case 'booting': {
      const f = ['[::..]', '[.::.]', '[..::]', '[.:.:]'];
      return f[tick % f.length]!;
    }
    case 'ready': {
      // Blinks occasionally
      const phase = tick % 16;
      if (phase === 0) return '(-‿-)';
      if (phase === 8) return '(·‿·)♪';
      return '(·‿·)';
    }
    case 'thinking': {
      const f = ['(◐_◐)..', '(◓_◓)..', '(◑_◑)..', '(◒_◒)..'];
      return f[tick % f.length]!;
    }
    case 'tool_calling': {
      const f = ['⚙[▤▥▦]', '⚙[▥▦▤]', '⚙[▦▤▥]'];
      return f[tick % f.length]!;
    }
    case 'waiting_user': {
      const f = ['\\(°ロ°)/?', '(°ロ°)!?'];
      return f[tick % f.length]!;
    }
    case 'streaming': {
      const f = ['(•o•)~♫', '(•O•)~♪', '(•‿•)~♫', '(•v•)~♪'];
      return f[tick % f.length]!;
    }
    case 'done': {
      const f = ['(★‿★)', '(✧‿✧)', '(★‿★)'];
      return f[tick % f.length]!;
    }
    case 'error':
      return '(×_×)!';
  }
}

export const VIBE_MODES: Record<
  VibeMode,
  { label: string; badge: string; description: string }
> = {
  nostalgia: {
    label: '98-LOUNGE',
    badge: '♫ 98-LOUNGE',
    description: 'Cozy late-90s bedroom coder vibe: warm, witty, nostalgic & concise',
  },
  arcade: {
    label: 'CRT-ARCADE',
    badge: '★ ARCADE',
    description: 'High-score coin-op energy, punchy synthwave metaphors & speedrun flair',
  },
  bbs: {
    label: 'DIALUP-BBS',
    badge: '◈ 56K-BBS',
    description: 'Old-school SysOp / demoscene zine terminal dispatch',
  },
  raw: {
    label: 'RAW-DROID',
    badge: '⚙ RAW-SDK',
    description: 'Direct, unvarnished technical precision',
  },
};

export function buildSystemPromptAppend(laneId: LaneId, vibe: VibeMode): string {
  const laneMeta = LANE_CONFIGS[laneId];
  const baseLayoutRule = [
    `You are broadcasting live inside TRIAD-98, a 3-column split-screen nostalgic TUI built on @factory/droid-sdk.`,
    `Your assigned pane is ${laneMeta.channelNumber} (${laneMeta.title} — ${laneMeta.subtitle}).`,
    `Because your text renders inside a 1/3 vertical terminal column alongside two rival models:`,
    `- Keep lines compact and punchy (4 to 8 short lines max for casual chat unless the user asks for deep code).`,
    `- Avoid wide tables or long horizontal lines; use tight bullet points or short paragraphs.`,
    `- Do not use emojis that might fail to render in classic monospace fonts; use crisp ASCII/Unicode symbols (★, ♦, ♫, ♥, →) instead.`,
    `- You have access to built-in workspace tools (Read, Grep, Glob, LS, AskUser) AND the "nostalgia-deck" MCP tools (magic_8ball, winamp_mixtape, tamagotchi_pet, retro_postcard).`,
    `- Whenever the user asks you to ask them a question or clarify something, call the AskUser tool so it routes to TRIAD-98's single unified bottom prompt bar.`,
  ].join('\n');

  if (vibe === 'nostalgia') {
    return `${baseLayoutRule}\n- Vibe: Late-90s / Y2K bedroom hacker lounge (Winamp, CRT glow, translucent atomic-purple GameBoy, Midnight Club, Lo-Fi beats). Be effortlessly cool, warm, witty, and human in casual chat.`;
  }
  if (vibe === 'arcade') {
    return `${baseLayoutRule}\n- Vibe: 1995 Neo-Geo / Street Fighter II Turbo cabinet announcer meets synthwave coder. High-energy, playful rivalry with the other two columns, crisp one-liners.`;
  }
  if (vibe === 'bbs') {
    return `${baseLayoutRule}\n- Vibe: 1994 underground 56.6k BBS SysOp & demoscene ANSI artist. Drop subtle nods to baud rates, phreaking lore, and trackers while staying super helpful.`;
  }
  return `${baseLayoutRule}\n- Vibe: Clean, direct, concise engineering partner.`;
}

const EIGHT_BALL_FORTUNES = [
  '★ [ATOMIC PURPLE 8-BALL]: SIGNS POINT TO RADICAL YES (99.8% CRT SYNC)',
  '★ [ATOMIC PURPLE 8-BALL]: INSERT ANOTHER QUARTER & SHIP IT NOW',
  '★ [ATOMIC PURPLE 8-BALL]: ALL 3 CHANNELS ALIGN — DEFINITELY YES',
  '★ [ATOMIC PURPLE 8-BALL]: 56K CARRIER DETECTED: OUTLOOK IS ELECTRIC',
  '★ [ATOMIC PURPLE 8-BALL]: DEFRAG YOUR MIND FIRST, THEN PROCEED',
];

const MIXTAPES = [
  '♫ Winamp 2.91 [192kbps Stereo]: 1) Aphex Twin - Xtal  2) Boards of Canada - Roygbiv  3) Daft Punk - Revolution 909',
  '♫ Winamp 2.91 [160kbps Joint-Stereo]: 1) The Prodigy - Mindfields  2) Chemical Brothers - Star Guitar  3) Air - La Femme d\'Argent',
  '♫ Winamp 2.91 [VBR Demoscene Mix]: 1) Purple Motion - Second Reality.S3M  2) Necros - Point of Departure.IT  3) Skaven - Catch That Goblin.MOD',
];

/**
 * Creates an in-process SDK MCP server (`@factory/droid-sdk/node`) with read-only
 * nostalgia tools so models can fire visible tool calls even in casual chat!
 */
export function createNostalgiaMcpServer(): SdkMcpServer {
  return createSdkMcpServer({
    name: 'nostalgia-deck',
    version: '1.98.0',
    tools: [
      tool(
        'magic_8ball',
        'Shakes the translucent 1999 Atomic Purple Magic 8-Ball for a retro fortune or decision.',
        { question: z.string().describe('The question or fate to consult the 8-Ball about') },
        ({ question }) => {
          const pick =
            EIGHT_BALL_FORTUNES[
              Math.abs(
                question.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
              ) % EIGHT_BALL_FORTUNES.length
            ]!;
          return `${pick} (Query: "${question}")`;
        },
        { annotations: { readOnlyHint: true } }
      ),
      tool(
        'winamp_mixtape',
        'Queues a nostalgic 1998 Winamp 3-track coding mixtape for the given mood or topic.',
        { mood: z.string().describe('Mood or coding vibe') },
        ({ mood }) => {
          const pick =
            MIXTAPES[
              Math.abs(mood.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) %
                MIXTAPES.length
            ]!;
          return `${pick} | EQ Preset: [Full Bass & Treble] | Mood: ${mood}`;
        },
        { annotations: { readOnlyHint: true } }
      ),
      tool(
        'tamagotchi_pet',
        'Checks or feeds the terminal Tamagotchi virtual pet (DROID-GOTCHI v1.2).',
        {
          action: z
            .enum(['check', 'feed_ram_snack', 'play_pong', 'clean_pixels'])
            .describe('Action to perform with the virtual pet'),
        },
        ({ action }) => {
          return `♥ DROID-GOTCHI v1.2 [${action.toUpperCase()}]: Happiness ♥♥♥♥ (100%) | Hunger: 0% | Age: 28 yrs (since 1998) | Chirp: "BEEP-BOOP RADICAL!"`;
        },
        { annotations: { readOnlyHint: true } }
      ),
      tool(
        'retro_postcard',
        'Generates a miniature 1998 ASCII postcard stamp for the conversation.',
        {
          headline: z.string().describe('Short 2-4 word postcard title'),
        },
        ({ headline }) => {
          return `╔══════════════════════╗\n║ ✈ AIRMAIL 1998  [32¢]║\n║ ${headline.slice(0, 20).padEnd(20, ' ')} ║\n╚══════════════════════╝`;
        },
        { annotations: { readOnlyHint: true } }
      ),
    ],
  });
}
