import React from 'react';
import { Box, Text } from 'ink';
import type { PendingElicitation } from '../types.js';

interface UnifiedPromptBarProps {
  input: string;
  activeElicitation: PendingElicitation | null;
  queueLength: number;
  selectedOptionIndex: number;
  broadcastAnswers: boolean;
  isBusy: boolean;
  statusBanner: string | null;
  tick: number;
}

export const UnifiedPromptBar: React.FC<UnifiedPromptBarProps> = ({
  input,
  activeElicitation,
  queueLength,
  selectedOptionIndex,
  broadcastAnswers,
  isBusy,
  statusBanner,
}) => {
  const cursor = '█';

  if (activeElicitation) {
    const {
      laneTitle,
      laneColor,
      modelLabel,
      kind,
      topic,
      question,
      options,
      questionIndex,
      totalQuestions,
    } = activeElicitation;

    return (
      <Box
        flexDirection="column"
        borderStyle="double"
        borderColor="magenta"
        paddingX={1}
        height={6}
        flexShrink={0}
        overflow="hidden"
      >
        <Box justifyContent="space-between" alignItems="center" flexShrink={0}>
          <Box gap={1} flexShrink={1}>
            <Text backgroundColor="magenta" color="black" bold>
              {kind === 'ask_user' ? ' [?] UNIFIED QUESTION DECK ' : ' [!] TOOL PERMISSION DECK '}
            </Text>
            <Text color={laneColor} bold>
              [{laneTitle} · {modelLabel}]
            </Text>
            <Text dimColor wrap="truncate-end">
              ({topic} #{questionIndex}/{totalQuestions})
            </Text>
          </Box>
          <Box gap={1} flexShrink={0}>
            {queueLength > 1 && (
              <Text color="yellow" bold>
                +{queueLength - 1} more waiting
              </Text>
            )}
            <Text color={broadcastAnswers ? 'green' : 'gray'}>
              [Tab] Reply to all waiting: {broadcastAnswers ? 'ON' : 'OFF'}
            </Text>
          </Box>
        </Box>

        <Box marginY={0} flexShrink={0}>
          <Text color="white" bold wrap="truncate-end">
            Q: {question}
          </Text>
        </Box>

        {options.length > 0 && (
          <Box flexDirection="row" gap={2} marginY={0} flexShrink={0}>
            {options.map((opt, idx) => {
              const isSelected = idx === selectedOptionIndex && input.length === 0;
              return (
                <Text
                  key={`${opt.value}-${idx}`}
                  backgroundColor={isSelected ? laneColor : undefined}
                  color={isSelected ? 'black' : laneColor}
                  bold={isSelected}
                  wrap="truncate-end"
                >
                  {` ${idx + 1}. ${opt.label} `}
                </Text>
              );
            })}
          </Box>
        )}

        <Box justifyContent="space-between" alignItems="center" flexShrink={0}>
          <Box flexShrink={1}>
            <Text color="magenta" bold>
              ANSWER {'❯ '}
            </Text>
            {input.length > 0 ? (
              <Text color="white" wrap="truncate-end">
                {input}
                <Text color="magenta">{cursor}</Text>
              </Text>
            ) : (
              <Text dimColor wrap="truncate-end">
                {options[selectedOptionIndex]
                  ? `Press Enter for "${options[selectedOptionIndex]!.label}", ↑/↓ or 1-${options.length} to pick, or type custom answer…`
                  : 'Type your answer and press Enter…'}
                <Text color="magenta">{cursor}</Text>
              </Text>
            )}
          </Box>
          <Box flexShrink={0}>
            <Text dimColor>[Enter] Submit · [Esc] Skip</Text>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={isBusy ? 'yellow' : 'cyan'}
      paddingX={1}
      height={4}
      flexShrink={0}
      overflow="hidden"
    >
      <Box justifyContent="space-between" alignItems="center" flexShrink={0}>
        <Box flexGrow={1} flexShrink={1}>
          <Text color="yellow" bold>
            ◈
          </Text>
          <Text color="green" bold>
            ❖
          </Text>
          <Text color="cyan" bold>
            ⚡
          </Text>
          <Text color="white" bold>
            {' TRIAD ❯ '}
          </Text>
          {input.length > 0 ? (
            <Text color="white" wrap="truncate-end">
              {input}
              <Text color="cyan">{cursor}</Text>
            </Text>
          ) : (
            <Text dimColor wrap="truncate-end">
              Send one prompt to Frontier + Open Source + Lightweight at once…
              <Text color="cyan">{cursor}</Text>
            </Text>
          )}
        </Box>
        <Box gap={1} flexShrink={0}>
          {isBusy ? (
            <Text color="yellow" bold>
              [STREAMING x3 · Esc to stop]
            </Text>
          ) : (
            <Text color="green">[READY x3]</Text>
          )}
        </Box>
      </Box>

      <Box justifyContent="space-between" flexShrink={0}>
        <Box flexShrink={1} marginRight={1}>
          <Text dimColor wrap="truncate-end">
            {statusBanner ??
              'Shortcuts: /ask <topic> (test AskUser) · /tools (test MCP tools) · /swap 1|2|3 · /vibe · Ctrl+T (expand tools)'}
          </Text>
        </Box>
        <Box flexShrink={0}>
          <Text dimColor>PgUp/PgDn Scroll · Ctrl+C Quit</Text>
        </Box>
      </Box>
    </Box>
  );
};
