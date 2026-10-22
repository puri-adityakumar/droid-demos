export type LaneId = 'frontier' | 'opensource' | 'lightweight';

export type VibeMode = 'nostalgia' | 'arcade' | 'bbs' | 'raw';

export interface ModelOption {
  id: string;
  label: string;
  provider: string;
  tagline: string;
}

export interface LaneConfig {
  id: LaneId;
  channelNumber: string;
  title: string;
  subtitle: string;
  color: 'yellow' | 'green' | 'cyan';
  accentSymbol: string;
  models: ModelOption[];
}

export interface ToolCallEntry {
  id: string;
  name: string;
  inputSummary: string;
  status: 'running' | 'ok' | 'error';
  progressText?: string;
  resultPreview?: string;
  startedAt: number;
  durationMs?: number;
}

export interface TurnEntry {
  id: string;
  prompt: string;
  thinkingText: string;
  isThinking: boolean;
  responseText: string;
  toolCalls: ToolCallEntry[];
  status: 'streaming' | 'waiting_user' | 'done' | 'error' | 'interrupted';
  startedAt: number;
  durationMs?: number;
  tokensIn: number;
  tokensOut: number;
  rank?: 1 | 2 | 3;
  errorMessage?: string;
}

export interface LaneState {
  id: LaneId;
  config: LaneConfig;
  selectedModelIndex: number;
  sessionId: string | null;
  status: 'booting' | 'ready' | 'thinking' | 'tool_calling' | 'waiting_user' | 'streaming' | 'done' | 'error';
  turns: TurnEntry[];
  totalTokensIn: number;
  totalTokensOut: number;
  lastError?: string;
}

export interface PendingElicitationOption {
  label: string;
  value: string;
  description?: string;
}

export interface PendingElicitation {
  id: string;
  laneId: LaneId;
  laneTitle: string;
  laneColor: 'yellow' | 'green' | 'cyan';
  modelLabel: string;
  kind: 'ask_user' | 'permission';
  topic: string;
  question: string;
  options: PendingElicitationOption[];
  questionIndex: number;
  totalQuestions: number;
  createdAt: number;
  resolve: (answer: string) => void;
  cancel: () => void;
}
