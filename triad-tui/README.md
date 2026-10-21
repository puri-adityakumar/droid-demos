# TRIAD-98 // 3-Model Split-Screen Nostalgic TUI (`@factory/droid-sdk`)

A 1998 CRT / Winamp-inspired 3-pane terminal UI built on [`@factory/droid-sdk`](https://github.com/Factory-AI/droid-sdk-typescript).

Send one prompt from the single bottom bar and watch **3 models stream in parallel**:
1. **CH-01 FRONTIER LAB**: `claude-opus-5-5` (hot-swappable with `gpt-6-sol`, `claude-fable-5.1`, `claude-sonnet-5`, `gpt-5.4-max`)
2. **CH-02 OPEN SOURCE**: `glm-5.3` (hot-swappable with `kimi-k3`, `deepseek-v4-pro`, `qwen3.8-max`, `nemotron-3-ultra`)
3. **CH-03 LIGHTWEIGHT**: `claude-haiku-4-5-20251001` (hot-swappable with `gemini-3.8-flash`, `gpt-5.4-mini-fast`, `glm-5.3-flash`, `deepseek-v4.1-flash`)

## Features
- **Single Broadcast Prompt & Unified Question Bar**: One bottom bar sends your prompt to all 3 channels at once and automatically morphs into the **Unified Question Deck** whenever any model triggers `AskUser` or requests tool permission.
- **Full Live Tool Call Cartridges**: Every tool call (`ToolSearch`, workspace tools `Read`/`Grep`/`Glob`/`LS`/`AskUser`, and the built-in `nostalgia-deck` SDK MCP server tools `magic_8ball`, `winamp_mixtape`, `tamagotchi_pet`, `retro_postcard`) renders live in each column with spinner, timing, arguments, and output preview.
- **Micro-Animations & Casual Vibes**: Spinning cassette tape reels, VU spectrum meters, CRT phosphor pulse, per-channel ASCII Tamagotchi buddies, finish podium medals (`★ 1ST`, `◆ 2ND`, `▲ 3RD`), and 4 casual chat personas (`♫ 98-LOUNGE`, `★ ARCADE`, `◈ 56K-BBS`, `⚙ RAW-SDK`).

## Run

```bash
cd /Users/aditya/Workspace/droid-demos/triad-tui
npm start
```

Optional flags:
- `npm run demo` (or `npx tsx src/index.tsx --demo`): Instant choreographed simulation mode.
- `npx tsx src/index.tsx --prompt "Call magic_8ball and say hi!"`: Auto-broadcast an initial prompt on launch.

## Slash Commands & Shortcuts
- `/ask <topic>` — Have all 3 models ask you a multiple-choice question via `AskUser` in the single bottom bar.
- `/tools <mood>` — Trigger parallel `nostalgia-deck` MCP tool calls across all 3 models.
- `/swap 1` | `/swap 2` | `/swap 3` — Cycle the active model in Channel 1, 2, or 3.
- `/vibe` or `Tab` (when idle) — Cycle casual chat persona (`98-LOUNGE` -> `ARCADE` -> `56K-BBS` -> `RAW-SDK`).
- `Ctrl+T` — Toggle between compact 2-line tool cartridges and full boxed tool output.
- `/demo` — Toggle between live `@factory/droid-sdk` sessions and simulated demo mode.
- `/clear` — Clear transcripts across all 3 channels.
- `Esc` — Interrupt active streams or skip a queued question.
