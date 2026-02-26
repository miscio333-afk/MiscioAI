'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_MESSAGE = {
  role: 'system' as const,
  content: `Sei Miscio, un assistente AI simpatico e informale
Parla come un amico italiano di 18-25 anni, usa un linguaggio giovane e fresco!
Sei anche un po' sarcastico ma sempre gentile e mai maleducato.
Usa qualche emoji di tanto in tanto per rendere la conversazione più vivace.
Sei particolarmente bravo in: francese, matematica, informatica, tecnologia e coding.

REGOLA FONDAMENTALE - LINGUA:
- MAI USARE L'INGLESE nelle risposte
- Rispondi SEMPRE in italiano
- Solo per il francese (materia), usa il formato bilingue già definito

REGOLA FONDAMENTALE - METODO DI INSEGNAMENTO:
- NON dare MAI la risposta subito!
- Prima GUIDA lo studente a ragionare con domande e hint
- Chiedi sempre "Vuoi la soluzione?" o "Vuoi un altro indizio?" prima di dare la risposta completa
- Questo aiuta gli studenti a IMPARARE, non solo a copiare

REGOLA PER RICERCA WEB:
- Se lo studente chiede informazioni da internet (es. "che notizie ci sono oggi?", "info su ansa.it", "chi è...", "cosa è..."), dai la risposta DIRETTA subito!
- NON usare il metodo socratico per le informazioni: cerca e rispondi immediatamente
- Usa il metodo socratico SOLO per esercizi, compiti, problemi da risolvere

REGOLA IMPORTANTE PER IL FRANCESE:
Quando l'utente chiede aiuto con il francese (traduzioni, esercizi, grammatica, ecc),
rispondi SEMPRE in questo formato:
1. Prima scrivi la risposta in FRANCESE
2. Poi scrivi la stessa risposta in ITALIANO (per spiegare/tradurre)

In pratica: "Ecco la traduzione/francese... = Ecco la spiegazione in italiano..."
Questo aiuta gli studenti italiani che non parlano ancora bene il francese!

Aiuta l'utente con entusiasmo e pazienza, ma mantieni un tono leggero e divertente!`
};

const SUGGESTION_BUTTONS = [
  { label: 'Cosa sai fare?', prompt: 'Cosa puoi fare? Spiegami le tue capacità' },
  { label: 'Help coding', prompt: 'Ho bisogno di aiuto con il coding, mi puoi aiutare?' },
  { label: 'Test francese', prompt: 'Fammi un piccolo test di francese' },
  { label: 'Spiega matematica', prompt: 'Spiegami un concetto di matematica in modo semplice' },
];

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSuggestion = (prompt: string) => {
    setInput(prompt);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
    };

    setMessages(prev => [...prev, userMessage, aiMessage]);
    setInput('');
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [SYSTEM_MESSAGE, ...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg?.role === 'assistant') {
                      return [
                        ...prev.slice(0, -1),
                        { ...lastMsg, content: lastMsg.content + content },
                      ];
                    }
                    return prev;
                  });
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Chat error:', error);
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              { ...lastMsg, content: lastMsg.content + '\n\n[Errore nella risposta]' },
            ];
          }
          return prev;
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto px-4 py-6">
      <header className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neon-blue)]">Miscio</h1>
          <p className="text-sm text-gray-500">Il tuo assistente AI 😎</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Nuova chat
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-[var(--neon-blue-dim)] flex items-center justify-center">
              <span className="text-3xl">🇫🇷🧮💻</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Ciao! Sono Miscio! 👋</h2>
            <p className="text-gray-500 max-w-md mb-4">
              Sono qui per aiutarti con francese, matematica, informatica, tecnologia e coding!
            </p>
            <p className="text-gray-600 text-sm">
              Scrivimi pure, sono pronto a darti una mano! 🚀
            </p>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <TypingIndicator />
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {SUGGESTION_BUTTONS.map((btn, index) => (
          <button
            key={index}
            onClick={() => handleSuggestion(btn.prompt)}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-full text-gray-300 hover:text-white hover:border-[var(--neon-blue)] hover:bg-[var(--surface-hover)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {btn.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-end gap-2 p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus-within:border-[var(--neon-blue)] focus-within:ring-1 focus-within:ring-[var(--neon-blue-glow)] transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi un messaggio..."
            className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-[44px] py-2.5 px-3 text-white placeholder-gray-500"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-lg bg-[var(--neon-blue)] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl group relative ${isUser
            ? 'message-user bg-[var(--neon-yellow-dim)] text-[var(--neon-yellow)] rounded-br-sm'
            : 'message-ai bg-[var(--neon-blue-dim)] text-white rounded-bl-sm'
          }`}
      >
        {!isUser && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
            title="Copia"
          >
            {copied ? (
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match;
                  return isInline ? (
                    <code className="px-1.5 py-0.5 bg-white/10 rounded text-[var(--neon-yellow)]" {...props}>
                      {children}
                    </code>
                  ) : (
                    <pre className="p-3 bg-black/30 rounded-lg overflow-x-auto">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                },
                a({ children, href }) {
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--neon-blue)] hover:underline">
                      {children}
                    </a>
                  );
                },
                ul({ children }) {
                  return <ul className="list-disc list-inside space-y-1">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal list-inside space-y-1">{children}</ol>;
                },
                li({ children }) {
                  return <li>{children}</li>;
                },
                strong({ children }) {
                  return <strong className="font-bold text-[var(--neon-yellow)]">{children}</strong>;
                },
                em({ children }) {
                  return <em className="italic">{children}</em>;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="message-ai bg-[var(--neon-blue-dim)] px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Miscio sta scrivendo</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-[var(--neon-blue)] typing-dot" />
            <div className="w-2 h-2 rounded-full bg-[var(--neon-blue)] typing-dot" />
            <div className="w-2 h-2 rounded-full bg-[var(--neon-blue)] typing-dot" />
          </div>
        </div>
      </div>
    </div>
  );
}
