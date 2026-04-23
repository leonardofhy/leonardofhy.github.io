import { useState } from 'react';

export interface ToolRef {
  name: string;
  args: string;
  result?: string;
  ok?: boolean;
}

export type MdBlock =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] };

export type Message =
  | { kind: 'system'; text: string }
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; tools?: ToolRef[]; md: MdBlock[] };

export interface QuickCommand {
  cmd: string;
  label: string;
  href: string;
}

interface Props {
  initialMessages: Message[];
  quickCommands: QuickCommand[];
}

/** Tiny inline renderer for **bold** and *italic* — content is hard-coded so safe to dangerouslySetInnerHTML. */
function renderInline(s: string): string {
  // Escape HTML first to avoid injection if this ever receives user content.
  const escaped = s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

export default function AgentREPL({ initialMessages, quickCommands }: Props) {
  const [input, setInput] = useState('');
  const [history] = useState<Message[]>(initialMessages);
  const [thinking] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // v1: no-op. Wiring a real Claude call is a follow-up change.
  };

  return (
    <>
      <div className="v6-convo">
        <div className="v6-welcome">
          <h2 className="v6-welcome-title">
            Hi, I'm <em>Leonardo.</em>
          </h2>
          <p>
            This site runs as a small agent. Ask anything about my work in AI safety,
            projects, writing, or NTUAIS — or use a slash command below. I'll route the
            question and reply as myself (or close enough, via Claude).
          </p>
          <div className="v6-welcome-hint">
            <span><kbd>↵</kbd> send</span>
            <span><kbd>/</kbd> commands</span>
            <span><kbd>tab</kbd> autocomplete</span>
            <span><kbd>esc</kbd> clear</span>
          </div>
        </div>

        {history.map((m, i) => (
          <div key={i} className="v6-msg">
            {m.kind === 'system' && <div className="v6-msg-system">{m.text}</div>}
            {m.kind === 'user' && (
              <div className="v6-msg-user">
                <span className="v6-prompt">{m.text.startsWith('/') ? '/' : '>'}</span>
                <span className="v6-msg-user-text">{m.text.replace(/^\//, '')}</span>
              </div>
            )}
            {m.kind === 'assistant' && (
              <div className="v6-msg-assistant">
                {m.tools && m.tools.length > 0 && (
                  <div className="v6-tools">
                    {m.tools.map((t, ti) => (
                      <div key={ti} className="v6-tool">
                        <span
                          className="ok"
                          style={
                            t.ok === false
                              ? { background: 'rgba(196, 85, 77, 0.18)', color: 'var(--err)' }
                              : undefined
                          }
                        >
                          {t.ok === false ? '✗' : '✓'}
                        </span>
                        <span>
                          <b>{t.name}</b>(<em>{t.args}</em>)
                          {t.result && <> → {t.result}</>}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="v6-md">
                  {m.md.map((b, bi) => {
                    if (b.type === 'p') {
                      return (
                        <p
                          key={bi}
                          dangerouslySetInnerHTML={{ __html: renderInline(b.text) }}
                        />
                      );
                    }
                    return (
                      <ul key={bi}>
                        {b.items.map((it, ii) => (
                          <li key={ii}>{it}</li>
                        ))}
                      </ul>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}

        {thinking && (
          <div className="v6-thinking">
            <span>leonardo is thinking</span>
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        )}
      </div>

      <div className="v6-input-wrap">
        <div className="v6-quick">
          {quickCommands.map((q) => (
            <a key={q.cmd} href={q.href} className="v6-quick-chip">
              <span className="cmd">{q.cmd}</span>
              {q.label}
            </a>
          ))}
        </div>
        <form className="v6-input-row" onSubmit={onSubmit}>
          <span className="v6-prompt">&gt;</span>
          <input
            className="v6-input"
            placeholder="ask leonardo anything… (coming soon)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled
          />
          <button type="submit" className="v6-send" disabled>
            send ↵
          </button>
        </form>
      </div>
    </>
  );
}
