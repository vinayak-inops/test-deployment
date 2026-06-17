import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Loader2, Maximize2, Minimize2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface GreenChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GreenChatWidget({ isOpen, onClose }: GreenChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I am ARIA Intelligence. Ask me anything about workforce analytics and insights.',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_AI_URL}/webhook/aria-rag-webhook-v2/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sendMessage',
          sessionId: sessionId,
          chatInput: inputValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantText = data.output || data.response || data.text || 'Sorry, I could not process your request.';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: assistantText,
        sender: 'assistant',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('ARIA chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const detectTable = (text: string): { isTable: boolean; rows: string[][] } => {
    const lines = text.trim().split('\n').filter(line => line.trim());

    if (lines.length < 2) return { isTable: false, rows: [] };

    // Check if lines contain pipe separators
    const hasPipes = lines.every(line => line.includes('|'));
    if (!hasPipes) return { isTable: false, rows: [] };

    // Parse rows
    const rows = lines.map(line =>
      line.split('|').map(cell => cell.trim())
    );

    // Validate consistent column count
    const columnCount = rows[0].length;
    const isConsistent = rows.every(row => row.length === columnCount);

    return { isTable: isConsistent && columnCount > 1, rows };
  };

  const formatMessage = (text: string) => {
    // Check if the entire message is a table
    const tableCheck = detectTable(text);
    if (tableCheck.isTable) {
      return (
        <table className="chat-table" key="table-0">
          <thead>
            <tr>
              {tableCheck.rows[0].map((header, idx) => (
                <th key={idx}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableCheck.rows.slice(1).map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    // Otherwise, process as regular content with lists
    const lines = text.split('\n');
    const elements: any[] = [];
    let currentList: string[] = [];
    let listType: 'numbered' | 'bullet' | null = null;
    let tableBuffer: string[] = [];

    const flushTable = () => {
      if (tableBuffer.length > 0) {
        const tableCheck = detectTable(tableBuffer.join('\n'));
        if (tableCheck.isTable) {
          elements.push(
            <table className="chat-table" key={`table-${elements.length}`}>
              <thead>
                <tr>
                  {tableCheck.rows[0].map((header, idx) => (
                    <th key={idx}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableCheck.rows.slice(1).map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }
        tableBuffer = [];
      }
    };

    const flushList = () => {
      if (currentList.length > 0) {
        const ListTag = listType === 'numbered' ? 'ol' : 'ul';
        elements.push(
          <ListTag
            key={`list-${elements.length}`}
            style={{
              margin: '0.5rem 0',
              paddingLeft: '1.5rem',
              listStylePosition: 'outside',
            }}
          >
            {currentList.map((item, idx) => (
              <li
                key={idx}
                style={{
                  marginBottom: '0.25rem',
                  lineHeight: 'var(--chat--message-line-height, 1.5)',
                }}
              >
                {item}
              </li>
            ))}
          </ListTag>
        );
        currentList = [];
        listType = null;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Check for table row (contains pipe)
      if (trimmedLine.includes('|')) {
        flushList();
        tableBuffer.push(line);
        return;
      } else {
        flushTable();
      }

      // Check for numbered list (1. or 1) or 1.)
      const numberedMatch = trimmedLine.match(/^\d+[\.)]\s+(.+)$/);
      // Check for bullet list (- or * or •)
      const bulletMatch = trimmedLine.match(/^[-*•]\s+(.+)$/);

      if (numberedMatch) {
        if (listType !== 'numbered') {
          flushList();
          listType = 'numbered';
        }
        currentList.push(numberedMatch[1]);
      } else if (bulletMatch) {
        if (listType !== 'bullet') {
          flushList();
          listType = 'bullet';
        }
        currentList.push(bulletMatch[1]);
      } else {
        flushList();
        if (trimmedLine) {
          elements.push(
            <span key={`text-${index}`}>
              {line}
              {index < lines.length - 1 && <br />}
            </span>
          );
        } else if (index < lines.length - 1) {
          elements.push(<br key={`br-${index}`} />);
        }
      }
    });

    flushTable();
    flushList();
    return elements;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed flex flex-col shadow-2xl transition-all duration-300"
      style={{
        bottom: isMaximized ? '0' : 'var(--chat--window--bottom, 1rem)',
        right: isMaximized ? '0' : 'var(--chat--window--right, 1rem)',
        top: isMaximized ? '0' : 'auto',
        left: isMaximized ? '0' : 'auto',
        width: isMaximized ? '100vw' : '600px',
        maxWidth: isMaximized ? '100vw' : 'calc(100vw - 2rem)',
        height: isMaximized ? '100vh' : 'var(--chat--window--height, 600px)',
        zIndex: 'var(--chat--window--z-index, 9999)',
        border: 'var(--chat--window--border, 1px solid #e6e9f1)',
        borderRadius: isMaximized ? '0' : 'var(--chat--window--border-radius, 0.75rem)',
        fontFamily: 'var(--chat--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        backgroundColor: 'var(--chat--color-white, #fff)',
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          padding: 'var(--chat--header--padding, 1rem)',
          background: 'var(--chat--header--background, linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%))',
          color: 'var(--chat--header--color, #ffffff)',
          borderTop: 'var(--chat--header--border-top, none)',
          borderBottom: 'var(--chat--header--border-bottom, 1px solid #1e40af)',
          borderLeft: 'var(--chat--header--border-left, none)',
          borderRight: 'var(--chat--header--border-right, none)',
          height: 'var(--chat--header-height, auto)',
          borderTopLeftRadius: 'var(--chat--border-radius, 0.25rem)',
          borderTopRightRadius: 'var(--chat--border-radius, 0.25rem)',
        }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <div>
            <h3
              className="text-lg sm:text-xl font-semibold tracking-tight"
              style={{
                fontSize: 'var(--chat--heading--font-size, inherit)',
              }}
            >
              ARIA Intelligence
            </h3>
            <p
              className="text-xs mt-0.5"
              style={{
                fontSize: 'var(--chat--subtitle--font-size, inherit)',
                lineHeight: 'var(--chat--subtitle--line-height, 1.25rem)',
                opacity: 0.9,
              }}
            >
              Workforce Analytics System
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 rounded-lg transition-colors"
            style={{
              color: 'var(--chat--header--color, #ffffff)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--chat--button--color--hover, #dbeafe)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--chat--header--color, #ffffff)';
            }}
          >
            {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors"
            style={{
              color: 'var(--chat--header--color, #ffffff)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--chat--close--button--color-hover, #fecaca)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--chat--header--color, #ffffff)';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        style={{
          padding: 'var(--chat--messages-list--padding, 1rem)',
          background: 'var(--chat--body--background, #f1f5f9)',
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            style={{
              marginBottom: 'var(--chat--message--margin-bottom, 1rem)',
            }}
          >
            <div
              style={{
                maxWidth: '95%',
                borderRadius: 'var(--chat--message--border-radius, 0.25rem)',
                padding: 'var(--chat--message--padding, 1rem)',
                fontSize: 'var(--chat--message--font-size, 1rem)',
                lineHeight: 'var(--chat-message-line-height, 1.5)',
                background: message.sender === 'user'
                  ? 'var(--chat--message--user--background, #2563eb)'
                  : 'var(--chat--message--bot--background, #fff)',
                color: message.sender === 'user'
                  ? 'var(--chat--message--user--color, #fff)'
                  : 'var(--chat--message--bot--color, #1e293b)',
                border: message.sender === 'user'
                  ? 'var(--chat--message--user--border, none)'
                  : 'var(--chat--message--bot--border, none)',
              }}
            >
              <div className="message-content">
                {formatMessage(message.text)}
              </div>
              <p
                className="text-xs mt-1"
                style={{
                  opacity: 0.7,
                }}
              >
                {message.timestamp.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div
              style={{
                background: 'var(--chat--message--bot--background, #fff)',
                color: 'var(--chat--message--bot--color, #1e293b)',
                borderRadius: 'var(--chat--message--border-radius, 0.25rem)',
                padding: 'var(--chat--message--padding, 1rem)',
              }}
            >
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          background: 'var(--chat--footer--background, #f8fafc)',
          color: 'var(--chat--footer--color, #1e293b)',
          padding: 'var(--chat--spacing, 1rem)',
        }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g. Show workforce trends..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: 'var(--chat--input--padding, 0.8rem)',
              border: 'var(--chat--input--border, 0)',
              borderRadius: 'var(--chat--input--border-radius, 0)',
              background: 'var(--chat--input--background, #fff)',
              color: 'var(--chat--input--text-color, initial)',
              fontSize: 'var(--chat--input--font-size, inherit)',
              lineHeight: 'var(--chat--input--line-height, 1.5)',
              outline: 'none',
            }}
            className="focus:ring-2"
            onFocus={(e) => {
              e.currentTarget.style.border = 'var(--chat--input--border-active, 0)';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="flex items-center gap-2 transition-colors"
            style={{
              padding: 'var(--chat--button--padding, 0.625rem 1rem)',
              borderRadius: 'var(--chat--button--border-radius, 0.25rem)',
              fontSize: 'var(--chat--button--font-size, 1rem)',
              lineHeight: 'var(--chat--button--line-height, 1)',
              color: !inputValue.trim() || isLoading
                ? 'var(--chat--button--color--primary--disabled, #f2f4f8)'
                : 'var(--chat--button--color--primary, #f2f4f8)',
              background: !inputValue.trim() || isLoading
                ? 'var(--chat--button--background--primary--disabled, #93c5fd)'
                : 'var(--chat--button--background--primary, #2563eb)',
              border: !inputValue.trim() || isLoading
                ? 'var(--chat--button--border--primary--disabled, none)'
                : 'var(--chat--button--border--primary, none)',
              cursor: !inputValue.trim() || isLoading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!(!inputValue.trim() || isLoading)) {
                e.currentTarget.style.background = 'var(--chat--button--background--primary--hover, #1d4ed8)';
                e.currentTarget.style.color = 'var(--chat--button--color--primary--hover, #f2f4f8)';
              }
            }}
            onMouseLeave={(e) => {
              if (!(!inputValue.trim() || isLoading)) {
                e.currentTarget.style.background = 'var(--chat--button--background--primary, #2563eb)';
                e.currentTarget.style.color = 'var(--chat--button--color--primary, #f2f4f8)';
              }
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
