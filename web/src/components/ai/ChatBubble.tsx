import { format, parseISO } from 'date-fns'
import type { ChatMessage } from '../../store/aiStore'

interface Props {
  message: ChatMessage
  isStreaming?: boolean
}

// Very minimal markdown renderer for the AI response
// Handles: **bold**, `code`, bullet lists, and newlines
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const parts = renderInline(line)
    const isBlank = line.trim() === ''
    if (isBlank) return <div key={i} className="h-2" />
    if (line.startsWith('## ')) return <h3 key={i} className="font-bold text-sm mt-3 mb-1">{renderInline(line.slice(3))}</h3>
    if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      return <p key={i} className="font-semibold text-sm mb-1">{renderInline(line.slice(2, -2))}</p>
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return <li key={i} className="ml-4 text-sm list-disc mb-0.5">{renderInline(line.slice(2))}</li>
    }
    return <p key={i} className="text-sm mb-1 leading-relaxed">{parts}</p>
  })
}

function renderInline(text: string): React.ReactNode[] {
  // Handle **bold** and `code`
  const parts: React.ReactNode[] = []
  let remaining = text
  let idx = 0
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let match: RegExpExecArray | null
  let lastIndex = 0
  while ((match = re.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={idx++}>{remaining.slice(lastIndex, match.index)}</span>)
    }
    const raw = match[0]
    if (raw.startsWith('**')) {
      parts.push(<strong key={idx++} className="font-semibold">{raw.slice(2, -2)}</strong>)
    } else {
      parts.push(
        <code key={idx++} className="bg-muted text-xs rounded px-1 py-0.5 font-mono">
          {raw.slice(1, -1)}
        </code>
      )
    }
    lastIndex = match.index + raw.length
  }
  if (lastIndex < remaining.length) {
    parts.push(<span key={idx++}>{remaining.slice(lastIndex)}</span>)
  }
  return parts
}

export default function ChatBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
          AI
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-text-primary text-white rounded-tr-sm'
            : 'bg-card border border-border text-text-primary rounded-tl-sm'
        }`}
      >
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <div>
            {renderMarkdown(message.content)}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse rounded-sm" />
            )}
          </div>
        )}
        <div className={`text-xs mt-1.5 ${isUser ? 'text-white/60' : 'text-text-secondary'}`}>
          {format(parseISO(message.timestamp), 'h:mm a')}
        </div>
      </div>
    </div>
  )
}
