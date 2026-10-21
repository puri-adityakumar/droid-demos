import {
  AutonomyLevel,
  DroidMessageType,
  ProcessTransport,
  ToolConfirmationOutcome,
  createSession,
  type DroidSession,
  type SdkMcpServer,
} from '@factory/droid-sdk/node';
import {
  LANE_CONFIGS,
  buildSystemPromptAppend,
  createNostalgiaMcpServer,
} from './nostalgia.js';
import type {
  LaneId,
  LaneState,
  PendingElicitation,
  ToolCallEntry,
  TurnEntry,
  VibeMode,
} from './types.js';

export const LANE_ORDER: LaneId[] = ['frontier', 'opensource', 'lightweight'];

export function formatToolInputSummary(input: unknown): string {
  if (!input || typeof input !== 'object') {
    return typeof input === 'string' ? input.slice(0, 60) : '';
  }
  const obj = input as Record<string, unknown>;
  const priorityKeys = [
    'file_path',
    'directory_path',
    'path',
    'pattern',
    'patterns',
    'command',
    'question',
    'mood',
    'action',
    'headline',
    'questionnaire',
    'url',
    'query',
  ];
  for (const key of priorityKeys) {
    if (obj[key] !== undefined) {
      const raw =
        typeof obj[key] === 'string'
          ? (obj[key] as string)
          : JSON.stringify(obj[key]);
      const singleLine = raw.replace(/\s+/g, ' ').trim();
      return `${key}: ${singleLine.slice(0, 52)}${singleLine.length > 52 ? '…' : ''}`;
    }
  }
  const entries = Object.entries(obj);
  if (entries.length === 0) return '()';
  const [firstKey, firstVal] = entries[0]!;
  const raw =
    typeof firstVal === 'string' ? firstVal : JSON.stringify(firstVal);
  const clean = (raw ?? '').replace(/\s+/g, ' ').trim();
  return `${firstKey}: ${clean.slice(0, 48)}${clean.length > 48 ? '…' : ''}`;
}

export function formatToolResultPreview(content: unknown): string {
  let raw = '';
  if (typeof content === 'string') {
    raw = content;
  } else if (Array.isArray(content)) {
    raw = content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'text' in item) {
          return String((item as { text: unknown }).text);
        }
        return JSON.stringify(item);
      })
      .join(' ');
  } else if (content !== undefined && content !== null) {
    raw = JSON.stringify(content);
  }
  const clean = raw.replace(/\s+/g, ' ').trim();
  if (!clean) return 'completed';
  return clean.slice(0, 88) + (clean.length > 88 ? '…' : '');
}

export function prettifyToolName(rawName: string): string {
  // Shorten MCP prefix for crisp display while preserving clarity
  if (
    rawName.startsWith('mcp__nostalgia-deck__') ||
    rawName.startsWith('nostalgia-deck___')
  ) {
    return `♫ ${rawName.replace(/^mcp__nostalgia-deck__|^nostalgia-deck___/, '')}`;
  }
  if (rawName.includes('___')) {
    const parts = rawName.split('___');
    return `◆ ${parts[parts.length - 1]}`;
  }
  return rawName;
}

export interface TriadEngineCallbacks {
  onLaneUpdate: (laneId: LaneId, updater: (prev: LaneState) => LaneState) => void;
  onEnqueueElicitation: (item: PendingElicitation) => void;
  onSoundCue?: (kind: 'finish' | 'ask' | 'tool') => void;
}

interface LaneRuntime {
  session: DroidSession | null;
  transport: ProcessTransport | null;
  mcpServer: SdkMcpServer | null;
}

export class TriadEngine {
  private runtimes: Record<LaneId, LaneRuntime> = {
    frontier: { session: null, transport: null, mcpServer: null },
    opensource: { session: null, transport: null, mcpServer: null },
    lightweight: { session: null, transport: null, mcpServer: null },
  };

  private cwd: string;
  private vibe: VibeMode;
  private demoMode: boolean;
  private callbacks: TriadEngineCallbacks;
  private activeModels: Record<LaneId, number> = {
    frontier: 0,
    opensource: 0,
    lightweight: 0,
  };

  constructor(options: {
    cwd: string;
    vibe: VibeMode;
    demoMode?: boolean;
    callbacks: TriadEngineCallbacks;
  }) {
    this.cwd = options.cwd;
    this.vibe = options.vibe;
    this.demoMode = Boolean(options.demoMode);
    this.callbacks = options.callbacks;
  }

  public isDemoMode(): boolean {
    return this.demoMode;
  }

  public setDemoMode(enabled: boolean): void {
    this.demoMode = enabled;
  }

  public async initializeAll(): Promise<void> {
    if (this.demoMode) {
      for (const laneId of LANE_ORDER) {
        this.callbacks.onLaneUpdate(laneId, (prev) => ({
          ...prev,
          status: 'ready',
          sessionId: `demo-${laneId}-1998`,
        }));
      }
      return;
    }

    await Promise.all(
      LANE_ORDER.map(async (laneId) => {
        await this.initLaneSession(laneId);
      })
    );
  }

  public async initLaneSession(laneId: LaneId): Promise<void> {
    const config = LANE_CONFIGS[laneId];
    const modelIndex = this.activeModels[laneId];
    const modelOption = config.models[modelIndex] ?? config.models[0]!;

    this.callbacks.onLaneUpdate(laneId, (prev) => ({
      ...prev,
      status: 'booting',
      lastError: undefined,
    }));

    await this.closeLaneRuntime(laneId);

    if (this.demoMode) {
      this.callbacks.onLaneUpdate(laneId, (prev) => ({
        ...prev,
        status: 'ready',
        sessionId: `demo-${laneId}-1998`,
      }));
      return;
    }

    try {
      const mcpServer = createNostalgiaMcpServer();
      const hasEnvKey = Boolean(process.env.FACTORY_API_KEY);
      let transport: ProcessTransport | null = null;

      if (!hasEnvKey) {
        transport = new ProcessTransport({
          cwd: this.cwd,
          env: {
            ...(process.env as Record<string, string>),
          },
        });
        await transport.connect();
      }

      const session = await createSession({
        cwd: this.cwd,
        modelId: modelOption.id,
        autonomyLevel: AutonomyLevel.Low,
        mcpServers: [mcpServer],
        ...(transport ? { transport } : {}),
        systemPrompt: {
          type: 'preset',
          preset: 'droid',
          append: buildSystemPromptAppend(laneId, this.vibe),
        },
        askUserHandler: async ({ questions }) => {
          this.callbacks.onLaneUpdate(laneId, (prev) => ({
            ...prev,
            status: 'waiting_user',
            turns: prev.turns.map((t, idx) =>
              idx === prev.turns.length - 1
                ? { ...t, status: 'waiting_user' }
                : t
            ),
          }));
          this.callbacks.onSoundCue?.('ask');

          const collectedAnswers: Array<{
            index: number;
            question: string;
            answer: string;
          }> = [];

          for (let i = 0; i < questions.length; i++) {
            const q = questions[i]!;
            const answer = await new Promise<string | null>((resolve) => {
              this.callbacks.onEnqueueElicitation({
                id: `${laneId}-ask-${Date.now()}-${i}`,
                laneId,
                laneTitle: `${config.channelNumber} ${config.title}`,
                laneColor: config.color,
                modelLabel: modelOption.label,
                kind: 'ask_user',
                topic: q.topic || 'Question',
                question: q.question,
                options: (q.options ?? []).map((opt) => ({
                  label: opt,
                  value: opt,
                })),
                questionIndex: i + 1,
                totalQuestions: questions.length,
                createdAt: Date.now(),
                resolve: (val) => resolve(val),
                cancel: () => resolve(null),
              });
            });

            if (answer === null) {
              this.callbacks.onLaneUpdate(laneId, (prev) => ({
                ...prev,
                status: 'streaming',
              }));
              return { cancelled: true, answers: [] };
            }

            collectedAnswers.push({
              index: q.index,
              question: q.question,
              answer,
            });
          }

          this.callbacks.onLaneUpdate(laneId, (prev) => ({
            ...prev,
            status: 'streaming',
            turns: prev.turns.map((t, idx) =>
              idx === prev.turns.length - 1 ? { ...t, status: 'streaming' } : t
            ),
          }));

          return {
            answers: collectedAnswers,
          };
        },
        permissionHandler: async ({ toolUses, options }) => {
          const toolNames = toolUses
            .map((u) => {
              const details = u.details as { type?: string; filePath?: string; command?: string };
              if (details.filePath) return `${details.type ?? 'Tool'}(${details.filePath})`;
              if (details.command) return `Execute(${details.command.slice(0, 36)})`;
              return details.type ?? 'Tool';
            })
            .join(', ');

          this.callbacks.onLaneUpdate(laneId, (prev) => ({
            ...prev,
            status: 'waiting_user',
          }));
          this.callbacks.onSoundCue?.('ask');

          const chosen = await new Promise<string | null>((resolve) => {
            this.callbacks.onEnqueueElicitation({
              id: `${laneId}-perm-${Date.now()}`,
              laneId,
              laneTitle: `${config.channelNumber} ${config.title}`,
              laneColor: config.color,
              modelLabel: modelOption.label,
              kind: 'permission',
              topic: 'Tool Approval',
              question: `Allow ${modelOption.label} to run: ${toolNames}?`,
              options: options.map((o) => ({
                label: o.label,
                value: o.value,
              })),
              questionIndex: 1,
              totalQuestions: 1,
              createdAt: Date.now(),
              resolve: (val) => resolve(val),
              cancel: () => resolve(null),
            });
          });

          this.callbacks.onLaneUpdate(laneId, (prev) => ({
            ...prev,
            status: 'streaming',
          }));

          if (!chosen) {
            return ToolConfirmationOutcome.Cancel;
          }
          const matched = options.find(
            (o) =>
              o.value.toLowerCase() === chosen.toLowerCase() ||
              o.label.toLowerCase() === chosen.toLowerCase()
          );
          if (
            matched &&
            matched.value !== ToolConfirmationOutcome.ProceedEdit
          ) {
            return matched.value;
          }
          return ToolConfirmationOutcome.ProceedOnce;
        },
      });

      this.runtimes[laneId] = { session, transport, mcpServer };

      this.callbacks.onLaneUpdate(laneId, (prev) => ({
        ...prev,
        status: 'ready',
        sessionId: session.id,
        lastError: undefined,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.callbacks.onLaneUpdate(laneId, (prev) => ({
        ...prev,
        status: 'error',
        lastError: msg,
      }));
    }
  }

  public async broadcastPrompt(
    prompt: string,
    targetLanes: LaneId[] = LANE_ORDER
  ): Promise<void> {
    if (this.demoMode) {
      await this.runSimulatedTurn(prompt, targetLanes);
      return;
    }

    let finishOrder = 0;

    await Promise.allSettled(
      targetLanes.map(async (laneId) => {
        let runtime = this.runtimes[laneId];
        if (!runtime.session) {
          await this.initLaneSession(laneId);
          runtime = this.runtimes[laneId];
        }
        const session = runtime.session;
        if (!session) {
          return;
        }

        const turnId = `turn-${laneId}-${Date.now()}`;
        const startedAt = Date.now();

        const initialTurn: TurnEntry = {
          id: turnId,
          prompt,
          thinkingText: '',
          isThinking: true,
          responseText: '',
          toolCalls: [],
          status: 'streaming',
          startedAt,
          tokensIn: 0,
          tokensOut: 0,
        };

        this.callbacks.onLaneUpdate(laneId, (prev) => ({
          ...prev,
          status: 'thinking',
          lastError: undefined,
          turns: [...prev.turns, initialTurn],
        }));

        let sawDeltaSinceLastAssistant = false;
        let needsBlockSeparator = false;

        try {
          for await (const ev of session.stream(prompt, {
            includePartialMessages: true,
          })) {
            switch (ev.type) {
              case DroidMessageType.ThinkingTextDelta: {
                this.callbacks.onLaneUpdate(laneId, (prev) => ({
                  ...prev,
                  status: 'thinking',
                  turns: updateLastTurn(prev.turns, turnId, (t) => ({
                    ...t,
                    isThinking: true,
                    thinkingText: (t.thinkingText + ev.text).slice(-240),
                  })),
                }));
                break;
              }

              case DroidMessageType.ThinkingTextComplete: {
                this.callbacks.onLaneUpdate(laneId, (prev) => ({
                  ...prev,
                  turns: updateLastTurn(prev.turns, turnId, (t) => ({
                    ...t,
                    isThinking: false,
                  })),
                }));
                break;
              }

              case DroidMessageType.ToolCall: {
                const toolEntry: ToolCallEntry = {
                  id: ev.toolUseId,
                  name: prettifyToolName(ev.name),
                  inputSummary: formatToolInputSummary(ev.input),
                  status: 'running',
                  startedAt: Date.now(),
                };
                this.callbacks.onSoundCue?.('tool');
                this.callbacks.onLaneUpdate(laneId, (prev) => ({
                  ...prev,
                  status:
                    prev.status === 'waiting_user'
                      ? 'waiting_user'
                      : 'tool_calling',
                  turns: updateLastTurn(prev.turns, turnId, (t) => {
                    const exists = t.toolCalls.some(
                      (tc) => tc.id === ev.toolUseId
                    );
                    return {
                      ...t,
                      isThinking: false,
                      toolCalls: exists
                        ? t.toolCalls.map((tc) =>
                            tc.id === ev.toolUseId
                              ? { ...tc, inputSummary: toolEntry.inputSummary }
                              : tc
                          )
                        : [...t.toolCalls, toolEntry],
                    };
                  }),
                }));
                break;
              }

              case DroidMessageType.ToolProgress: {
                this.callbacks.onLaneUpdate(laneId, (prev) => ({
                  ...prev,
                  turns: updateLastTurn(prev.turns, turnId, (t) => ({
                    ...t,
                    toolCalls: t.toolCalls.map((tc) =>
                      tc.id === ev.toolUseId
                        ? {
                            ...tc,
                            progressText: ev.content
                              ? ev.content.replace(/\s+/g, ' ').trim().slice(0, 60)
                              : 'working…',
                          }
                        : tc
                    ),
                  })),
                }));
                break;
              }

              case DroidMessageType.ToolResult: {
                needsBlockSeparator = true;
                const preview = formatToolResultPreview(ev.content);
                this.callbacks.onLaneUpdate(laneId, (prev) => ({
                  ...prev,
                  status:
                    prev.status === 'waiting_user' ? 'waiting_user' : 'thinking',
                  turns: updateLastTurn(prev.turns, turnId, (t) => ({
                    ...t,
                    toolCalls: t.toolCalls.map((tc) =>
                      tc.id === ev.toolUseId
                        ? {
                            ...tc,
                            status: ev.isError ? 'error' : 'ok',
                            resultPreview: preview,
                            durationMs: Date.now() - tc.startedAt,
                          }
                        : tc
                    ),
                  })),
                }));
                break;
              }

              case DroidMessageType.AssistantTextDelta: {
                const addSep = needsBlockSeparator && ev.text.length > 0;
                if (addSep) {
                  needsBlockSeparator = false;
                }
                sawDeltaSinceLastAssistant = true;
                this.callbacks.onLaneUpdate(laneId, (prev) => ({
                  ...prev,
                  status: 'streaming',
                  turns: updateLastTurn(prev.turns, turnId, (t) => {
                    const prefix =
                      addSep &&
                      t.responseText.length > 0 &&
                      !t.responseText.endsWith('\n')
                        ? '\n\n'
                        : '';
                    return {
                      ...t,
                      isThinking: false,
                      responseText: t.responseText + prefix + ev.text,
                    };
                  }),
                }));
                break;
              }

              case DroidMessageType.Assistant: {
                // Fallback if no partial deltas were emitted for this message block
                if (!sawDeltaSinceLastAssistant && ev.text) {
                  this.callbacks.onLaneUpdate(laneId, (prev) => ({
                    ...prev,
                    status: 'streaming',
                    turns: updateLastTurn(prev.turns, turnId, (t) => ({
                      ...t,
                      isThinking: false,
                      responseText: t.responseText
                        ? `${t.responseText}\n${ev.text}`
                        : ev.text,
                    })),
                  }));
                }
                sawDeltaSinceLastAssistant = false;
                break;
              }

              case DroidMessageType.TokenUsageUpdate: {
                this.callbacks.onLaneUpdate(laneId, (prev) => ({
                  ...prev,
                  totalTokensIn: ev.inputTokens,
                  totalTokensOut: ev.outputTokens,
                  turns: updateLastTurn(prev.turns, turnId, (t) => ({
                    ...t,
                    tokensIn: ev.inputTokens,
                    tokensOut: ev.outputTokens,
                  })),
                }));
                break;
              }

              case DroidMessageType.Result: {
                finishOrder += 1;
                const rank =
                  finishOrder <= 3 ? (finishOrder as 1 | 2 | 3) : undefined;
                const durationMs = ev.durationMs || Date.now() - startedAt;
                this.callbacks.onSoundCue?.('finish');
                this.callbacks.onLaneUpdate(laneId, (prev) => ({
                  ...prev,
                  status: ev.success ? 'done' : 'error',
                  totalTokensIn:
                    ev.tokenUsage?.inputTokens ?? prev.totalTokensIn,
                  totalTokensOut:
                    ev.tokenUsage?.outputTokens ?? prev.totalTokensOut,
                  turns: updateLastTurn(prev.turns, turnId, (t) => ({
                    ...t,
                    isThinking: false,
                    status: ev.interrupted
                      ? 'interrupted'
                      : ev.success
                        ? 'done'
                        : 'error',
                    responseText: t.responseText || ev.text || '',
                    durationMs,
                    rank,
                    tokensIn: ev.tokenUsage?.inputTokens ?? t.tokensIn,
                    tokensOut: ev.tokenUsage?.outputTokens ?? t.tokensOut,
                    errorMessage: !ev.success
                      ? ev.error?.message ?? `Ended: ${ev.subtype}`
                      : undefined,
                  })),
                }));
                break;
              }
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.callbacks.onLaneUpdate(laneId, (prev) => ({
            ...prev,
            status: 'error',
            lastError: msg,
            turns: updateLastTurn(prev.turns, turnId, (t) => ({
              ...t,
              isThinking: false,
              status: 'error',
              durationMs: Date.now() - startedAt,
              errorMessage: msg,
            })),
          }));
        }
      })
    );
  }

  public async cycleModel(laneId: LaneId): Promise<string> {
    const config = LANE_CONFIGS[laneId];
    const nextIndex = (this.activeModels[laneId] + 1) % config.models.length;
    this.activeModels[laneId] = nextIndex;
    const nextModel = config.models[nextIndex]!;

    this.callbacks.onLaneUpdate(laneId, (prev) => ({
      ...prev,
      selectedModelIndex: nextIndex,
    }));

    const session = this.runtimes[laneId].session;
    if (session && !this.demoMode) {
      try {
        await session.updateSettings({ modelId: nextModel.id });
      } catch {
        // Re-init session if hot-swap fails
        await this.initLaneSession(laneId);
      }
    }
    return `${config.channelNumber} -> ${nextModel.label} (${nextModel.id})`;
  }

  public async setVibe(vibe: VibeMode): Promise<void> {
    this.vibe = vibe;
  }

  public async interruptAll(): Promise<void> {
    await Promise.allSettled(
      LANE_ORDER.map(async (laneId) => {
        const session = this.runtimes[laneId].session;
        if (session) {
          await session.interrupt();
        }
      })
    );
  }

  public async closeAll(): Promise<void> {
    await Promise.allSettled(
      LANE_ORDER.map((laneId) => this.closeLaneRuntime(laneId))
    );
  }

  private async closeLaneRuntime(laneId: LaneId): Promise<void> {
    const rt = this.runtimes[laneId];
    this.runtimes[laneId] = { session: null, transport: null, mcpServer: null };
    try {
      if (rt.session) await rt.session.close();
    } catch {
      // ignore
    }
    try {
      if (rt.transport) await rt.transport.close();
    } catch {
      // ignore
    }
    try {
      if (rt.mcpServer) await rt.mcpServer.close();
    } catch {
      // ignore
    }
  }

  /**
   * Built-in choreographed demo turn so `--demo` or `/demo` works offline or
   * showcases parallel tool calls + unified AskUser question bar immediately.
   */
  private async runSimulatedTurn(
    prompt: string,
    targetLanes: LaneId[]
  ): Promise<void> {
    const startedAt = Date.now();
    let finishRank = 0;
    const wantsQuestion =
      /ask|question|quiz|prefer|choose|clarif/i.test(prompt);

    await Promise.all(
      targetLanes.map(async (laneId, idx) => {
        const config = LANE_CONFIGS[laneId];
        const model = config.models[this.activeModels[laneId]]!;
        const turnId = `sim-${laneId}-${Date.now()}`;

        this.callbacks.onLaneUpdate(laneId, (prev) => ({
          ...prev,
          status: 'thinking',
          turns: [
            ...prev.turns,
            {
              id: turnId,
              prompt,
              thinkingText: `Dialing ${model.label} neural bus @ 56.6k…`,
              isThinking: true,
              responseText: '',
              toolCalls: [],
              status: 'streaming',
              startedAt,
              tokensIn: 120 + idx * 30,
              tokensOut: 0,
            },
          ],
        }));

        await sleep(250 + idx * 140);

        // Simulated Tool Call 1
        const toolId1 = `tc-${laneId}-1`;
        const toolName1 =
          laneId === 'frontier'
            ? '♫ winamp_mixtape'
            : laneId === 'opensource'
              ? '♫ magic_8ball'
              : '♫ tamagotchi_pet';
        const toolInput1 =
          laneId === 'frontier'
            ? 'mood: late-night CRT hacking'
            : laneId === 'opensource'
              ? `question: ${prompt.slice(0, 32)}`
              : 'action: feed_ram_snack';

        this.callbacks.onLaneUpdate(laneId, (prev) => ({
          ...prev,
          status: 'tool_calling',
          turns: updateLastTurn(prev.turns, turnId, (t) => ({
            ...t,
            isThinking: false,
            toolCalls: [
              ...t.toolCalls,
              {
                id: toolId1,
                name: toolName1,
                inputSummary: toolInput1,
                status: 'running',
                startedAt: Date.now(),
              },
            ],
          })),
        }));

        await sleep(320 + idx * 120);

        const toolPreview1 =
          laneId === 'frontier'
            ? '♫ Winamp 2.91 [192kbps]: Aphex Twin - Xtal | Boards of Canada - Roygbiv'
            : laneId === 'opensource'
              ? '★ [ATOMIC PURPLE 8-BALL]: ALL 3 CHANNELS ALIGN — DEFINITELY YES'
              : '♥ DROID-GOTCHI v1.2: Happiness ♥♥♥♥ (100%) | "BEEP-BOOP RADICAL!"';

        this.callbacks.onLaneUpdate(laneId, (prev) => ({
          ...prev,
          status: 'thinking',
          turns: updateLastTurn(prev.turns, turnId, (t) => ({
            ...t,
            toolCalls: t.toolCalls.map((tc) =>
              tc.id === toolId1
                ? {
                    ...tc,
                    status: 'ok',
                    resultPreview: toolPreview1,
                    durationMs: 320 + idx * 120,
                  }
                : tc
            ),
          })),
        }));

        let userPicked = '';
        if (wantsQuestion) {
          this.callbacks.onLaneUpdate(laneId, (prev) => ({
            ...prev,
            status: 'waiting_user',
            turns: updateLastTurn(prev.turns, turnId, (t) => ({
              ...t,
              status: 'waiting_user',
            })),
          }));

          const answer = await new Promise<string | null>((resolve) => {
            this.callbacks.onEnqueueElicitation({
              id: `sim-ask-${laneId}-${Date.now()}`,
              laneId,
              laneTitle: `${config.channelNumber} ${config.title}`,
              laneColor: config.color,
              modelLabel: model.label,
              kind: 'ask_user',
              topic: `${config.channelNumber} Vibe Check`,
              question:
                laneId === 'frontier'
                  ? 'Which 1998 aesthetic should anchor our architecture?'
                  : laneId === 'opensource'
                    ? 'Pick your open-source sound card synth mode:'
                    : 'How fast should we ship this turbo build?',
              options:
                laneId === 'frontier'
                  ? [
                      { label: 'Atomic Purple GameBoy', value: 'Atomic Purple GameBoy' },
                      { label: 'Winamp Classic Skin', value: 'Winamp Classic Skin' },
                      { label: 'Sony Trinitron CRT', value: 'Sony Trinitron CRT' },
                    ]
                  : laneId === 'opensource'
                    ? [
                        { label: 'SoundBlaster AWE64', value: 'SoundBlaster AWE64' },
                        { label: 'Roland MT-32 MIDI', value: 'Roland MT-32 MIDI' },
                        { label: 'FastTracker II .XM', value: 'FastTracker II .XM' },
                      ]
                    : [
                        { label: '60fps Lockstep', value: '60fps Lockstep' },
                        { label: ' Ludicrous Turbo', value: 'Ludicrous Turbo' },
                        { label: 'Sub-millisecond', value: 'Sub-millisecond' },
                      ],
              questionIndex: 1,
              totalQuestions: 1,
              createdAt: Date.now(),
              resolve: (val) => resolve(val),
              cancel: () => resolve(null),
            });
          });
          userPicked = answer ? ` (Locked in: "${answer}"!)` : ' (Freestyle mode!)';
        }

        const replies: Record<LaneId, string> = {
          lightweight: `⚡ [${model.label}] First on the wire!${userPicked}\n• Pocket-sized latency, zero fluff.\n• DROID-GOTCHI fed & purring at 100%.\n• Ready for your next broadcast.`,
          opensource: `❖ [${model.label}] Open weights reporting in!${userPicked}\n• Consulted the Atomic Purple 8-Ball — signs point to radical yes.\n• Community-tuned weights humming on Channel 2.\n• Inspecting tools & keeping the source open.`,
          frontier: `◈ [${model.label}] Deep synthesis complete.${userPicked}\n• Queued Aphex Twin & Boards of Canada on Winamp 2.91.\n• Cross-checked all three channels: Frontier brings depth, Open Source brings grit, Lightweight brings raw speed.`,
        };

        const words = replies[laneId].split(' ');
        for (let w = 0; w < words.length; w++) {
          await sleep(laneId === 'lightweight' ? 18 : laneId === 'opensource' ? 28 : 36);
          const chunk = (w === 0 ? '' : ' ') + words[w];
          this.callbacks.onLaneUpdate(laneId, (prev) => ({
            ...prev,
            status: 'streaming',
            totalTokensOut: prev.totalTokensOut + 2,
            turns: updateLastTurn(prev.turns, turnId, (t) => ({
              ...t,
              status: 'streaming',
              responseText: t.responseText + chunk,
              tokensOut: t.tokensOut + 2,
            })),
          }));
        }

        finishRank += 1;
        const r = finishRank <= 3 ? (finishRank as 1 | 2 | 3) : undefined;
        this.callbacks.onLaneUpdate(laneId, (prev) => ({
          ...prev,
          status: 'done',
          turns: updateLastTurn(prev.turns, turnId, (t) => ({
            ...t,
            status: 'done',
            durationMs: Date.now() - startedAt,
            rank: r,
          })),
        }));
      })
    );
  }
}

function updateLastTurn(
  turns: TurnEntry[],
  turnId: string,
  updater: (turn: TurnEntry) => TurnEntry
): TurnEntry[] {
  return turns.map((t) => (t.id === turnId ? updater(t) : t));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
