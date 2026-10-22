import React from 'react';
import { Box, Text } from 'ink';
import {
  CASSETTE_FRAMES,
  CRT_PULSE_FRAMES,
  IDLE_VU_FRAMES,
  NOSTALGIA_IDLE_TIPS,
  VIBE_MODES,
  VU_METER_FRAMES,
} from '../nostalgia.js';
import type { LaneId, LaneState, VibeMode } from '../types.js';

interface HeaderDeckProps {
  lanes: Record<LaneId, LaneState>;
  vibe: VibeMode;
  tick: number;
  demoMode: boolean;
  expandedTools: boolean;
  broadcastAnswers: boolean;
  pendingQuestionsCount: number;
}

export const HeaderDeck: React.FC<HeaderDeckProps> = ({
  lanes,
  vibe,
  tick,
  demoMode,
  expandedTools,
  pendingQuestionsCount,
}) => {
  const laneList = Object.values(lanes);
  const anyActive = laneList.some((l) =>
    ['thinking', 'tool_calling', 'streaming', 'waiting_user', 'booting'].includes(
      l.status
    )
  );

  const totalTokensIn = laneList.reduce((acc, l) => acc + l.totalTokensIn, 0);
  const totalTokensOut = laneList.reduce((acc, l) => acc + l.totalTokensOut, 0);
  const totalToolCalls = laneList.reduce(
    (acc, l) =>
      acc + l.turns.reduce((tAcc, turn) => tAcc + turn.toolCalls.length, 0),
    0
  );

  const cassette = anyActive
    ? CASSETTE_FRAMES[(tick % (CASSETTE_FRAMES.length - 1)) + 1]!
    : CASSETTE_FRAMES[0]!;

  const vuMeter = anyActive
    ? VU_METER_FRAMES[tick % VU_METER_FRAMES.length]!
    : IDLE_VU_FRAMES[tick % IDLE_VU_FRAMES.length]!;

  const crtPulse = CRT_PULSE_FRAMES[tick % CRT_PULSE_FRAMES.length]!;
  const tipIndex = Math.floor(tick / 28) % NOSTALGIA_IDLE_TIPS.length;
  const currentTip = NOSTALGIA_IDLE_TIPS[tipIndex]!;
  const vibeMeta = VIBE_MODES[vibe];

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={pendingQuestionsCount > 0 ? 'magenta' : anyActive ? 'yellow' : 'gray'}
      paddingX={1}
      height={4}
      flexShrink={0}
      overflow="hidden"
    >
      <Box justifyContent="space-between" alignItems="center" flexShrink={0}>
        <Box gap={1} flexShrink={1}>
          <Text bold color="white">
            ◈ TRIAD-98
          </Text>
          <Text dimColor>│</Text>
          <Text color="magenta">{vibeMeta.badge}</Text>
          {demoMode ? (
            <Text color="yellow" bold>
              [SIM-DECK]
            </Text>
          ) : (
            <Text color="cyan" dimColor>
              [@factory/droid-sdk]
            </Text>
          )}
          <Text dimColor>│</Text>
          <Text color={anyActive ? 'yellow' : 'cyan'}>{cassette}</Text>
          <Text dimColor>│</Text>
          <Text color="green">{vuMeter}</Text>
          <Text dimColor>│</Text>
          <Text color="magenta" bold>
            {crtPulse}
          </Text>
        </Box>

        <Box gap={1} flexShrink={0}>
          {pendingQuestionsCount > 0 && (
            <Text backgroundColor="magenta" color="black" bold>
              {` [?] ${pendingQuestionsCount} QUESTION${pendingQuestionsCount > 1 ? 'S' : ''} QUEUED `}
            </Text>
          )}
          <Text color="yellow">
            ⚙ {totalToolCalls} tool{totalToolCalls === 1 ? '' : 's'}
          </Text>
          <Text dimColor>·</Text>
          <Text color="cyan">
            ⚡ {totalTokensIn + totalTokensOut} tok
          </Text>
          <Text dimColor>·</Text>
          <Text dimColor>
            {expandedTools ? '[Tools: FULL]' : '[Tools: COMPACT]'}
          </Text>
        </Box>
      </Box>

      <Box justifyContent="space-between" flexShrink={0}>
        <Box flexShrink={1} marginRight={1}>
          <Text dimColor wrap="truncate-end">
            {currentTip}
          </Text>
        </Box>
        <Box flexShrink={0}>
          <Text dimColor>
            /ask · /tools · /vibe · /swap 1-3 · /clear · Esc
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
