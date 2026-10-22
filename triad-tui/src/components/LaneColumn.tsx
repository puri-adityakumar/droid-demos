import React from 'react';
import { Box, Text } from 'ink';
import { TOOL_SPINNER_FRAMES, getMascotFrame } from '../nostalgia.js';
import type { LaneState, ToolCallEntry, TurnEntry } from '../types.js';

interface LaneColumnProps {
  lane: LaneState;
  tick: number;
  expandedTools: boolean;
  scrollOffset: number;
  isFocused: boolean;
  maxBodyLines: number;
}

function getRankBadge(rank?: 1 | 2 | 3): { text: string; color: 'yellow' | 'cyan' | 'magenta' } | null {
  if (rank === 1) return { text: '★ 1ST', color: 'yellow' };
  if (rank === 2) return { text: '◆ 2ND', color: 'cyan' };
  if (rank === 3) return { text: '▲ 3RD', color: 'magenta' };
  return null;
}

function getStatusLabel(status: LaneState['status']): { text: string; color: string } {
  switch (status) {
    case 'booting':
      return { text: 'DIALING 56K…', color: 'yellow' };
    case 'ready':
      return { text: 'STANDBY', color: 'gray' };
    case 'thinking':
      return { text: 'SYNTHESIZING', color: 'yellow' };
    case 'tool_calling':
      return { text: 'TOOL SEEK', color: 'magenta' };
    case 'waiting_user':
      return { text: 'ASKING YOU ↓', color: 'magenta' };
    case 'streaming':
      return { text: 'BROADCASTING', color: 'green' };
    case 'done':
      return { text: 'LOCKED IN', color: 'cyan' };
    case 'error':
      return { text: 'FAULT', color: 'red' };
  }
}

const ToolCallCard: React.FC<{
  tc: ToolCallEntry;
  tick: number;
  expanded: boolean;
  accentColor: 'yellow' | 'green' | 'cyan';
}> = ({ tc, tick, expanded, accentColor }) => {
  const spinner = TOOL_SPINNER_FRAMES[tick % TOOL_SPINNER_FRAMES.length]!;
  const statusIcon =
    tc.status === 'running' ? spinner : tc.status === 'ok' ? '✓' : '✗';
  const statusColor =
    tc.status === 'running' ? 'yellow' : tc.status === 'ok' ? 'green' : 'red';
  const timing =
    tc.durationMs !== undefined
      ? `${(tc.durationMs / 1000).toFixed(1)}s`
      : 'live';

  if (!expanded) {
    const shortInput = tc.inputSummary ? ` (${tc.inputSummary.slice(0, 22)})` : '';
    return (
      <Box flexDirection="column" flexShrink={0} marginBottom={0}>
        <Text wrap="truncate-end">
          <Text color={accentColor} bold>
            ╭─ {statusIcon} ⚙ {tc.name}
          </Text>
          <Text color={statusColor} dimColor={tc.status === 'ok'}>
            {` [${timing}]`}
          </Text>
          <Text dimColor>{shortInput}</Text>
        </Text>
        <Text
          color={
            tc.status === 'error'
              ? 'red'
              : tc.status === 'running'
                ? 'yellow'
                : 'white'
          }
          dimColor={tc.status === 'ok'}
          wrap="truncate-end"
        >
          ╰─{' '}
          {tc.status === 'running'
            ? (tc.progressText ?? 'executing tool cartridge…')
            : (tc.resultPreview ?? 'completed')}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      flexShrink={0}
      borderStyle="single"
      borderColor={tc.status === 'running' ? 'yellow' : 'gray'}
      paddingX={1}
      marginY={0}
    >
      <Box justifyContent="space-between">
        <Text color={accentColor} bold wrap="truncate-end">
          {statusIcon} ⚙ {tc.name}
        </Text>
        <Text color={statusColor} dimColor={tc.status === 'ok'}>
          [{tc.status.toUpperCase()} {timing}]
        </Text>
      </Box>
      {tc.inputSummary ? (
        <Text dimColor wrap="truncate-end">
          ├─ in: {tc.inputSummary}
        </Text>
      ) : null}
      {tc.status === 'running' && tc.progressText ? (
        <Text color="yellow" wrap="truncate-end">
          └─ {tc.progressText}
        </Text>
      ) : null}
      {tc.resultPreview ? (
        <Text
          color={tc.status === 'error' ? 'red' : 'white'}
          dimColor={tc.status === 'ok'}
          wrap="wrap"
        >
          └─ out: {tc.resultPreview}
        </Text>
      ) : null}
    </Box>
  );
};

export const LaneColumn: React.FC<LaneColumnProps> = React.memo(({
  lane,
  tick,
  expandedTools,
  scrollOffset,
  isFocused,
  maxBodyLines,
}) => {
  const { config, selectedModelIndex, status, turns } = lane;
  const activeModel = config.models[selectedModelIndex] ?? config.models[0]!;
  const mascot = getMascotFrame(status, tick);
  const statusBadge = getStatusLabel(status);
  const lastTurn: TurnEntry | undefined = turns[turns.length - 1];
  const rankBadge = getRankBadge(lastTurn?.rank);

  const liveElapsed =
    lastTurn &&
    ['thinking', 'tool_calling', 'streaming', 'waiting_user'].includes(status)
      ? `${((Date.now() - lastTurn.startedAt) / 1000).toFixed(1)}s`
      : lastTurn?.durationMs
        ? `${(lastTurn.durationMs / 1000).toFixed(1)}s`
        : null;

  // Show the active turn (latest turn or scrolled turn) so headers and tool cards never clip
  const activeTurnIndex = Math.max(
    0,
    Math.min(turns.length - 1, turns.length - 1 - scrollOffset)
  );
  const visibleTurns =
    turns.length === 0 ? [] : [turns[activeTurnIndex]!];

  const cursorChar = tick % 2 === 0 ? '█' : '▒';

  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      flexBasis={0}
      borderStyle={isFocused ? 'double' : 'round'}
      borderColor={
        status === 'waiting_user'
          ? 'magenta'
          : status === 'streaming' || status === 'tool_calling'
            ? config.color
            : isFocused
              ? config.color
              : 'gray'
      }
      paddingX={1}
      height={maxBodyLines}
      overflow="hidden"
    >
      {/* Channel Header */}
      <Box justifyContent="space-between" alignItems="center" flexShrink={0} height={1} overflow="hidden">
        <Box gap={1} flexShrink={1}>
          <Text color={config.color} bold wrap="truncate-end">
            {config.accentSymbol} {config.channelNumber} {config.title}
          </Text>
        </Box>
        <Box flexShrink={0}>
          <Text color={config.color} bold>
            {mascot}
          </Text>
        </Box>
      </Box>

      {/* Model & Telemetry Subheader */}
      <Box justifyContent="space-between" alignItems="center" flexShrink={0} height={1} overflow="hidden">
        <Box gap={1} flexShrink={1}>
          <Text backgroundColor={config.color} color="black" bold wrap="truncate-end">
            {` ${activeModel.label} `}
          </Text>
          <Text dimColor wrap="truncate-end">{activeModel.provider}</Text>
        </Box>
        <Box gap={1} flexShrink={0}>
          {rankBadge && (
            <Text color={rankBadge.color} bold>
              {rankBadge.text}
            </Text>
          )}
          {liveElapsed && <Text dimColor>{liveElapsed}</Text>}
          <Text color={statusBadge.color as 'yellow' | 'green' | 'cyan' | 'magenta' | 'red' | 'gray'}>
            [{statusBadge.text}]
          </Text>
        </Box>
      </Box>

      {/* Divider */}
      <Box flexShrink={0}>
        <Text dimColor wrap="truncate-end">
          {'─'.repeat(60)}
        </Text>
      </Box>

      {/* Conversation Body */}
      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {turns.length === 0 ? (
          <Box
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            flexGrow={1}
          >
            <Text color={config.color} bold>
              {mascot}
            </Text>
            <Text color="white" bold>
              {activeModel.label} Ready
            </Text>
            <Text dimColor>{activeModel.tagline}</Text>
            <Text dimColor>
              Tools: Workspace + ♫ Nostalgia MCP
            </Text>
          </Box>
        ) : (
          visibleTurns.map((turn) => (
            <Box key={turn.id} flexDirection="column" marginBottom={1}>
              {/* Prompt Echo */}
              <Box flexShrink={0}>
                <Text color={config.color} bold>
                  {'❯ '}
                </Text>
                <Text color="white" bold wrap="truncate-end">
                  {turn.prompt}
                </Text>
              </Box>

              {/* Tool Calls List */}
              {turn.toolCalls.length > 0 && (
                <Box flexDirection="column" flexShrink={0} marginTop={0}>
                  {turn.toolCalls.map((tc) => (
                    <ToolCallCard
                      key={tc.id}
                      tc={tc}
                      tick={tick}
                      expanded={expandedTools}
                      accentColor={config.color}
                    />
                  ))}
                </Box>
              )}

              {/* Thinking state */}
              {turn.isThinking && (
                <Box marginTop={0} flexShrink={0}>
                  <Text color="yellow" wrap="truncate-end">
                    ◌ {turn.thinkingText ? turn.thinkingText.replace(/\s+/g, ' ').slice(-50) : 'Synthesizing thoughts…'}
                  </Text>
                </Box>
              )}

              {/* Waiting on unified question bar */}
              {turn.status === 'waiting_user' && (
                <Box marginTop={0} flexShrink={0}>
                  <Text color="magenta" bold>
                    [?] Waiting for your answer in the unified bar below…
                  </Text>
                </Box>
              )}

              {/* Assistant Response */}
              {turn.responseText ? (
                <Box marginTop={0} flexDirection="column">
                  <Text color="white" wrap="wrap">
                    {turn.responseText}
                    {turn.status === 'streaming' ? (
                      <Text color={config.color}>{cursorChar}</Text>
                    ) : null}
                  </Text>
                </Box>
              ) : null}

              {/* Error Banner */}
              {turn.errorMessage ? (
                <Text color="red" wrap="wrap">
                  ⚠ {turn.errorMessage}
                </Text>
              ) : null}
            </Box>
          ))
        )}
      </Box>

      {/* Channel Footer */}
      <Box justifyContent="space-between" flexShrink={0}>
        <Text dimColor wrap="truncate-end">
          #{lane.sessionId ? lane.sessionId.slice(0, 6) : 'init'} · t:{turns.length === 0 ? 0 : activeTurnIndex + 1}/{turns.length} · ⚙ {turns.reduce((a, t) => a + t.toolCalls.length, 0)}
        </Text>
        <Text dimColor>
          in:{lane.totalTokensIn} out:{lane.totalTokensOut}
        </Text>
      </Box>
    </Box>
  );
});
