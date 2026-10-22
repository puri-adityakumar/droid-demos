#!/usr/bin/env node
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Text,
  render,
  useApp,
  useInput,
  usePaste,
  useWindowSize,
} from 'ink';
import {
  BOOT_SEQUENCE_LINES,
  LANE_CONFIGS,
  VIBE_MODES,
} from './nostalgia.js';
import { LANE_ORDER, TriadEngine } from './triadEngine.js';
import { HeaderDeck } from './components/HeaderDeck.js';
import { LaneColumn } from './components/LaneColumn.js';
import { UnifiedPromptBar } from './components/UnifiedPromptBar.js';
import type {
  LaneId,
  LaneState,
  PendingElicitation,
  VibeMode,
} from './types.js';

const VIBE_CYCLE: VibeMode[] = ['nostalgia', 'arcade', 'bbs', 'raw'];

function createInitialLanes(): Record<LaneId, LaneState> {
  return {
    frontier: {
      id: 'frontier',
      config: LANE_CONFIGS.frontier,
      selectedModelIndex: 0,
      sessionId: null,
      status: 'booting',
      turns: [],
      totalTokensIn: 0,
      totalTokensOut: 0,
    },
    opensource: {
      id: 'opensource',
      config: LANE_CONFIGS.opensource,
      selectedModelIndex: 0,
      sessionId: null,
      status: 'booting',
      turns: [],
      totalTokensIn: 0,
      totalTokensOut: 0,
    },
    lightweight: {
      id: 'lightweight',
      config: LANE_CONFIGS.lightweight,
      selectedModelIndex: 0,
      sessionId: null,
      status: 'booting',
      turns: [],
      totalTokensIn: 0,
      totalTokensOut: 0,
    },
  };
}

interface AppOptions {
  demoMode: boolean;
  initialPrompt?: string;
  skipBoot?: boolean;
  cwd: string;
}

const TriadApp: React.FC<AppOptions> = ({
  demoMode: initialDemoMode,
  initialPrompt,
  skipBoot,
  cwd,
}) => {
  const { exit } = useApp();
  const { rows } = useWindowSize();

  const [bootStep, setBootStep] = useState<number>(
    skipBoot ? BOOT_SEQUENCE_LINES.length : 0
  );
  const [tick, setTick] = useState<number>(0);
  const [lanes, setLanes] = useState<Record<LaneId, LaneState>>(() =>
    createInitialLanes()
  );
  const [vibe, setVibe] = useState<VibeMode>('nostalgia');
  const [demoMode, setDemoMode] = useState<boolean>(initialDemoMode);
  const [input, setInput] = useState<string>('');
  const [elicitationQueue, setElicitationQueue] = useState<
    PendingElicitation[]
  >([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  const [broadcastAnswers, setBroadcastAnswers] = useState<boolean>(true);
  const [expandedTools, setExpandedTools] = useState<boolean>(false);
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const [focusedLane, setFocusedLane] = useState<LaneId | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [, setHistoryCursor] = useState<number>(-1);

  const engineRef = useRef<TriadEngine | null>(null);
  const initialPromptSentRef = useRef<boolean>(false);
  const pendingLaneUpdatesRef = useRef<
    Array<{ laneId: LaneId; updater: (prev: LaneState) => LaneState }>
  >([]);
  const frameCountRef = useRef<number>(0);

  const activeElicitation = elicitationQueue[0] ?? null;
  const isBusy = Object.values(lanes).some((l) =>
    ['thinking', 'tool_calling', 'streaming'].includes(l.status)
  );
  const anyAnimating = Object.values(lanes).some((l) =>
    ['thinking', 'tool_calling', 'streaming', 'booting'].includes(l.status)
  );
  const anyAnimatingRef = useRef<boolean>(anyAnimating);
  anyAnimatingRef.current = anyAnimating;

  // Single unified 80ms (12.5fps) frame scheduler:
  // Batches all 3 model stream deltas + advances micro-animation tick in one React commit.
  // Does zero renders when idle and no updates are queued.
  useEffect(() => {
    const timer = setInterval(() => {
      frameCountRef.current += 1;
      const queued = pendingLaneUpdatesRef.current;
      const hasLaneUpdates = queued.length > 0;
      const shouldAdvanceTick =
        anyAnimatingRef.current && frameCountRef.current % 5 === 0;

      if (!hasLaneUpdates && !shouldAdvanceTick) {
        return;
      }

      if (hasLaneUpdates) {
        pendingLaneUpdatesRef.current = [];
        setLanes((prev) => {
          const next = { ...prev };
          for (const item of queued) {
            next[item.laneId] = item.updater(next[item.laneId]);
          }
          return next;
        });
      }

      if (shouldAdvanceTick) {
        setTick((t) => t + 1);
      }
    }, 80);

    return () => clearInterval(timer);
  }, []);

  // Fast 1998 CRT boot sequence
  useEffect(() => {
    if (bootStep >= BOOT_SEQUENCE_LINES.length) return;
    const timer = setTimeout(() => {
      setBootStep((s) => s + 1);
    }, 180);
    return () => clearTimeout(timer);
  }, [bootStep]);

  // Initialize TriadEngine and all 3 @factory/droid-sdk sessions
  useEffect(() => {
    const engine = new TriadEngine({
      cwd,
      vibe: 'nostalgia',
      demoMode: initialDemoMode,
      callbacks: {
        onLaneUpdate: (laneId, updater) => {
          pendingLaneUpdatesRef.current.push({ laneId, updater });
        },
        onEnqueueElicitation: (item) => {
          setElicitationQueue((prev) => [...prev, item]);
          setSelectedOptionIndex(0);
        },
      },
    });
    engineRef.current = engine;

    void engine.initializeAll().then(() => {
      if (initialPrompt && !initialPromptSentRef.current) {
        initialPromptSentRef.current = true;
        void engine.broadcastPrompt(initialPrompt);
      }
    });

    return () => {
      void engine.closeAll();
    };
  }, [cwd, initialDemoMode, initialPrompt]);

  usePaste((pastedText) => {
    const clean = pastedText.replace(/\r?\n/g, ' ');
    setInput((prev) => prev + clean);
  });

  const submitAnswer = (answerValue: string) => {
    if (!activeElicitation) return;
    setInput('');
    setSelectedOptionIndex(0);

    if (broadcastAnswers && elicitationQueue.length > 1) {
      const toResolve = [...elicitationQueue];
      setElicitationQueue([]);
      for (const item of toResolve) {
        item.resolve(answerValue);
      }
      setStatusBanner(
        `Broadcasted answer "${answerValue}" to all ${toResolve.length} waiting channels!`
      );
    } else {
      const current = activeElicitation;
      setElicitationQueue((prev) => prev.slice(1));
      current.resolve(answerValue);
      setStatusBanner(
        `Sent answer "${answerValue}" to ${current.laneTitle} (${current.modelLabel})`
      );
    }
  };

  const handleSlashCommand = async (raw: string): Promise<boolean> => {
    const trimmed = raw.trim();
    if (!trimmed.startsWith('/')) return false;

    const [cmd, ...rest] = trimmed.split(/\s+/);
    const argText = rest.join(' ').trim();
    const engine = engineRef.current;
    if (!engine) return true;

    switch (cmd?.toLowerCase()) {
      case '/quit':
      case '/exit': {
        await engine.closeAll();
        exit();
        return true;
      }

      case '/clear': {
        setLanes((prev) => ({
          frontier: { ...prev.frontier, turns: [], status: 'ready' },
          opensource: { ...prev.opensource, turns: [], status: 'ready' },
          lightweight: { ...prev.lightweight, turns: [], status: 'ready' },
        }));
        setScrollOffset(0);
        setStatusBanner('Cleared all 3 channel transcripts.');
        return true;
      }

      case '/vibe': {
        const nextIdx = (VIBE_CYCLE.indexOf(vibe) + 1) % VIBE_CYCLE.length;
        const nextVibe = VIBE_CYCLE[nextIdx]!;
        setVibe(nextVibe);
        await engine.setVibe(nextVibe);
        setStatusBanner(
          `Switched persona to ${VIBE_MODES[nextVibe].badge} — ${VIBE_MODES[nextVibe].description}`
        );
        return true;
      }

      case '/swap':
      case '/model': {
        const laneNum = argText || '1';
        const targetLane: LaneId =
          laneNum === '2' || laneNum === 'open'
            ? 'opensource'
            : laneNum === '3' || laneNum === 'light'
              ? 'lightweight'
              : 'frontier';
        const msg = await engine.cycleModel(targetLane);
        setStatusBanner(`Hot-swapped model: ${msg}`);
        return true;
      }

      case '/demo': {
        const nextDemo = !demoMode;
        setDemoMode(nextDemo);
        engine.setDemoMode(nextDemo);
        await engine.initializeAll();
        setStatusBanner(
          nextDemo
            ? 'Switched to [SIM-DECK] instant demo mode.'
            : 'Switched to live [@factory/droid-sdk] multi-session mode.'
        );
        return true;
      }

      case '/ask': {
        const topic =
          argText || 'our favorite late-90s game or coding snack';
        const askPrompt = `Use the AskUser tool right now to ask me 1 quick multiple-choice question about ${topic}, and after I answer in the prompt bar, give a fun 3-line reply!`;
        setScrollOffset(0);
        setStatusBanner(
          `Broadcasting AskUser trigger across all 3 models for "${topic}"…`
        );
        void engine.broadcastPrompt(askPrompt);
        return true;
      }

      case '/tools': {
        const mood = argText || 'late-night 1998 cyberdeck coding';
        const toolPrompt = `Call two tools from nostalgia-deck (like magic_8ball and winamp_mixtape or tamagotchi_pet) for "${mood}", then give a short, punchy 3-line summary!`;
        setScrollOffset(0);
        setStatusBanner(
          `Triggering parallel MCP tool cartridges across all 3 models…`
        );
        void engine.broadcastPrompt(toolPrompt);
        return true;
      }

      case '/focus': {
        if (argText === '1') setFocusedLane('frontier');
        else if (argText === '2') setFocusedLane('opensource');
        else if (argText === '3') setFocusedLane('lightweight');
        else setFocusedLane(null);
        setStatusBanner(
          argText && ['1', '2', '3'].includes(argText)
            ? `Highlighted Channel ${argText} (use /focus 0 to reset)`
            : 'Reset channel focus to balanced triad view.'
        );
        return true;
      }

      default: {
        setStatusBanner(
          `Commands: /ask <topic> · /tools <mood> · /swap 1|2|3 · /vibe · /demo · /clear · /quit`
        );
        return true;
      }
    }
  };

  useInput((char, key) => {
    const engine = engineRef.current;

    if (key.ctrl && char === 'c') {
      void engine?.closeAll().finally(() => exit());
      return;
    }

    if (key.ctrl && char === 't') {
      setExpandedTools((e) => !e);
      setStatusBanner(
        !expandedTools
          ? 'Tool cards set to FULL output preview.'
          : 'Tool cards set to COMPACT preview.'
      );
      return;
    }

    if (key.pageUp || (key.ctrl && char === 'u')) {
      setScrollOffset((s) => s + 1);
      return;
    }

    if (key.pageDown || (key.ctrl && char === 'd')) {
      setScrollOffset((s) => Math.max(0, s - 1));
      return;
    }

    // Escape either cancels active question or interrupts active streams
    if (key.escape) {
      if (activeElicitation) {
        const current = activeElicitation;
        setElicitationQueue((prev) => prev.slice(1));
        current.cancel();
        setStatusBanner(`Skipped question from ${current.laneTitle}`);
      } else if (isBusy) {
        void engine?.interruptAll();
        setStatusBanner('Interrupted active streams across all 3 channels.');
      } else {
        setInput('');
      }
      return;
    }

    // Tab toggles broadcast mode when answering questions, or cycles Vibe when idle
    if (key.tab) {
      if (activeElicitation) {
        setBroadcastAnswers((b) => !b);
      } else {
        const nextIdx = (VIBE_CYCLE.indexOf(vibe) + 1) % VIBE_CYCLE.length;
        const nextVibe = VIBE_CYCLE[nextIdx]!;
        setVibe(nextVibe);
        void engine?.setVibe(nextVibe);
        setStatusBanner(
          `Vibe -> ${VIBE_MODES[nextVibe].badge}: ${VIBE_MODES[nextVibe].description}`
        );
      }
      return;
    }

    // Arrow keys
    if (key.upArrow || key.leftArrow) {
      if (activeElicitation && activeElicitation.options.length > 0 && input.length === 0) {
        setSelectedOptionIndex(
          (idx) =>
            (idx - 1 + activeElicitation.options.length) %
            activeElicitation.options.length
        );
        return;
      }
      if (!activeElicitation && promptHistory.length > 0) {
        setHistoryCursor((prev) => {
          const next = Math.min(promptHistory.length - 1, prev + 1);
          setInput(promptHistory[promptHistory.length - 1 - next] ?? '');
          return next;
        });
        return;
      }
    }

    if (key.downArrow || key.rightArrow) {
      if (activeElicitation && activeElicitation.options.length > 0 && input.length === 0) {
        setSelectedOptionIndex(
          (idx) => (idx + 1) % activeElicitation.options.length
        );
        return;
      }
      if (!activeElicitation && promptHistory.length > 0) {
        setHistoryCursor((prev) => {
          const next = Math.max(-1, prev - 1);
          setInput(
            next === -1 ? '' : (promptHistory[promptHistory.length - 1 - next] ?? '')
          );
          return next;
        });
        return;
      }
    }

    // Enter key submits either an answer to the active question or a broadcast prompt
    if (key.return) {
      if (activeElicitation) {
        const typed = input.trim();
        if (typed.length > 0) {
          submitAnswer(typed);
        } else if (activeElicitation.options[selectedOptionIndex]) {
          submitAnswer(activeElicitation.options[selectedOptionIndex]!.value);
        } else {
          submitAnswer('yes');
        }
        return;
      }

      const trimmed = input.trim();
      if (!trimmed) return;
      setInput('');
      setHistoryCursor(-1);
      setPromptHistory((prev) => [...prev, trimmed]);

      void handleSlashCommand(trimmed).then((wasSlash) => {
        if (!wasSlash && engine) {
          setScrollOffset(0);
          setStatusBanner(null);
          void engine.broadcastPrompt(trimmed);
        }
      });
      return;
    }

    if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1));
      return;
    }

    // Quick number selection (1-9) when answering a question and input is empty
    if (
      activeElicitation &&
      input.length === 0 &&
      /^[1-9]$/.test(char)
    ) {
      const idx = Number(char) - 1;
      if (activeElicitation.options[idx]) {
        submitAnswer(activeElicitation.options[idx]!.value);
        return;
      }
    }

    if (char && !key.ctrl && !key.meta) {
      setInput((prev) => prev + char);
    }
  });

  const totalHeight = Math.max(18, (rows || 30) - 2);

  if (bootStep < BOOT_SEQUENCE_LINES.length) {
    return (
      <Box
        flexDirection="column"
        width="100%"
        height={totalHeight}
        borderStyle="double"
        borderColor="cyan"
        paddingX={2}
        paddingY={1}
        overflow="hidden"
      >
        <Text color="yellow" bold>
          ╔══════════════════════════════════════════════════════════════════╗
        </Text>
        <Text color="yellow" bold>
          ║  ◈ TRIAD-98 // FACTORY SDK TRIPLE-MODEL CRT TRANSCEIVER v1.98   ║
        </Text>
        <Text color="yellow" bold>
          ╚══════════════════════════════════════════════════════════════════╝
        </Text>
        <Box flexDirection="column" marginTop={1}>
          {BOOT_SEQUENCE_LINES.slice(0, bootStep + 1).map((line, i) => (
            <Text key={i} color={i === bootStep ? 'green' : 'cyan'}>
              {i === bootStep ? '▶ ' : '✓ '}
              {line}
            </Text>
          ))}
        </Box>
      </Box>
    );
  }

  const chromeHeight = activeElicitation ? 10 : 8;
  const maxBodyLines = Math.max(8, totalHeight - chromeHeight);

  return (
    <Box flexDirection="column" width="100%" height={totalHeight} overflow="hidden">
      {/* Top Retro Deck Header */}
      <HeaderDeck
        lanes={lanes}
        vibe={vibe}
        tick={tick}
        demoMode={demoMode}
        expandedTools={expandedTools}
        broadcastAnswers={broadcastAnswers}
        pendingQuestionsCount={elicitationQueue.length}
      />

      {/* Three Split Conversation Columns */}
      <Box flexDirection="row" width="100%" gap={1} height={maxBodyLines} flexShrink={0}>
        {LANE_ORDER.map((laneId) => {
          const lane = lanes[laneId];
          const laneActive = [
            'thinking',
            'tool_calling',
            'streaming',
            'waiting_user',
            'booting',
          ].includes(lane.status);
          return (
            <LaneColumn
              key={laneId}
              lane={lane}
              tick={laneActive ? tick : 0}
              expandedTools={expandedTools}
              scrollOffset={scrollOffset}
              isFocused={focusedLane === laneId}
              maxBodyLines={maxBodyLines}
            />
          );
        })}
      </Box>

      {/* Single Unified Prompt & Question-Answering Bar */}
      <UnifiedPromptBar
        input={input}
        activeElicitation={activeElicitation}
        queueLength={elicitationQueue.length}
        selectedOptionIndex={selectedOptionIndex}
        broadcastAnswers={broadcastAnswers}
        isBusy={isBusy}
        statusBanner={statusBanner}
        tick={tick}
      />
    </Box>
  );
};

// Parse CLI flags
const args: string[] = process.argv.slice(2);
const demoMode = args.includes('--demo');
const skipBoot = args.includes('--no-boot');
const promptArgIndex = args.findIndex((a: string) => a === '--prompt' || a === '-p');
const initialPrompt =
  promptArgIndex !== -1 ? args[promptArgIndex + 1] : undefined;

render(
  <TriadApp
    demoMode={demoMode}
    initialPrompt={initialPrompt}
    skipBoot={skipBoot}
    cwd={process.cwd()}
  />,
  {
    incrementalRendering: true,
    alternateScreen: true,
    maxFps: 15,
  }
);
