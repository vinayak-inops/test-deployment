import { useEffect, useRef } from "react"
import { User, Bot } from "lucide-react"
import { Message } from "@/type/ai-conversation/conversation"
import RichTextRenderer from "./rich-text-renderer"

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  return (
    <div className="px-3 py-2">
      <div className="w-full px-6 mx-auto space-y-2.5">
        {messages.map((message) => {
          const isUser = message.role === "user"

          return (
            <div
              key={message.id}
              className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {/* Assistant: icon on left, bubble on right */}
              {!isUser && (
                <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-700">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`flex-1 ${isUser ? "text-right" : "text-left"}`}>
                <div
                  className={`inline-block max-w-[90%] px-3 py-1.5 rounded-2xl align-top ${
                    isUser
                      ? "bg-blue-50 text-blue-900 border border-blue-100"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap break-words leading-relaxed text-[13px]">
                      {message.content}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <RichTextRenderer content={message.content} />
                      {message.sources && message.sources.length > 0 && (
                        <div className="pt-1">
                          <p className="text-[11px] font-medium text-gray-600 mb-1">Sources</p>
                          <ul className="space-y-0.5">
                            {message.sources.map((source, index) => (
                              <li key={`${source.uri}-${index}`} className="text-[11px]">
                                <a
                                  href={source.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline break-all"
                                >
                                  {source.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* User: bubble on left (within flex-end), icon on right */}
              {isUser && (
                <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full border border-blue-200 flex items-center justify-center text-blue-400">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          )
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center">
              {/* <Bot className="w-4 h-4" /> */}
            </div>
            <div className="flex-1">
              <div className="inline-block px-3 py-2.5 rounded-2xl bg-gray-100">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default MessageList
