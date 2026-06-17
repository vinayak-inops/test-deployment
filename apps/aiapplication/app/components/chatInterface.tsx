"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, User, Settings, LogOut, Home, Zap } from "lucide-react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import MessageList from "./message-list"
import { Message } from "@/type/ai-conversation/conversation"
import PredefinedPropertiesSelectorPopup from "./predefined-properties-selector-popup"

interface ChatInterfaceProps {
  conversationId: string | null
  onConversationStart: (title: string) => string
  messages: Message[]
  onMessagesChange: (conversationId: string, messages: Message[]) => void
  onToggleSidebar: () => void
  isSidebarOpen: boolean
}

function ChatInterface({
  conversationId,
  onConversationStart,
  messages,
  onMessagesChange,
  onToggleSidebar,
  isSidebarOpen,
}: ChatInterfaceProps) {
  // Optional Environment Variable:
  // - NEXT_PUBLIC_CLMS_CONTEXT_JSON (stringified JSON array/object for CLMS context injection)
  const CONTEXT_DATA = (() => {
    const raw = undefined
    if (!raw) return undefined
    try {
      return JSON.parse(raw)
    } catch {
      return undefined
    }
  })()

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [propertiesPopupOpen, setPropertiesPopupOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()
  const router = useRouter()

  // Get user info
  const userName = session?.user?.name || ""
  const userEmail = session?.user?.email || ""
  const firstName = userName.split(" ")[0] || "J"
  const firstLetter = firstName.charAt(0).toUpperCase()

  // Handle click outside to close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle logout
  const handleLogout = () => {
    router.push(`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/logout`)
  }

  // Handle navigate to launchdesk
  const handleNavigateToLaunchdesk = () => {
    const launchdeskUrl = `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/launchdesk`
    window.location.href = launchdeskUrl
  }

  // Handle property selection
  const handlePropertySelect = (property: { prop: string; description: string }) => {
    setInput((prev) => {
      // If input is empty, just add the description
      if (!prev.trim()) {
        return property.description
      }
      // Otherwise, append with a space
      return `${prev} ${property.description}`
    })
    setPropertiesPopupOpen(false)
  }

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    // First message => start conversation
    let activeConversationId = conversationId
    if (!activeConversationId) {
      const title = trimmed.substring(0, 50)
      activeConversationId = onConversationStart(title)
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    }

    const afterUser = [...messages, userMessage]
    onMessagesChange(activeConversationId, afterUser)
    setInput("")
    setIsLoading(true)

    try {
      // Send message through local API proxy with basePath awareness
      const apiPath =
        typeof window !== "undefined" && window.location.pathname.startsWith("/aiapplication")
          ? "/aiapplication/api/chat"
          : "/api/chat"

      const res = await fetch(apiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: session?.user?.email || session?.user?.name || "web-user",
          conversation_id: activeConversationId,
          message: trimmed, // what the customer typed
          contextData: CONTEXT_DATA,
        }),
      })

      let replyText = "Thanks for your message."
      let replySources: Array<{ title: string; uri: string }> = []

      if (res.ok) {
        // Read raw body so we can debug streaming / non-JSON responses too
        const rawBody = await res.text()

        let data: any = null
        try {
          // Try to parse as JSON first
          data = rawBody ? JSON.parse(rawBody) : null
        } catch (e) {
          // Not JSON; keep as plain text
          data = rawBody
        }

        replyText =
          (data && (data.reply || data.message)) ||
          (typeof data === "string" ? data : JSON.stringify(data)) ||
          replyText

        if (data && Array.isArray(data.sources)) {
          replySources = data.sources
            .filter((s: any) => s && s.uri)
            .map((s: any) => ({
              title: s.title || s.uri,
              uri: s.uri,
            }))
        }
      } else {
        const rawError = await res.text().catch(() => "")
        let parsedError: any = null
        try {
          parsedError = rawError ? JSON.parse(rawError) : null
        } catch {
          parsedError = rawError
        }
        replyText =
          (parsedError && (parsedError.error || parsedError.message)) ||
          (typeof parsedError === "string" ? parsedError : "") ||
          "I couldn't reach the chat service right now."
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: replyText,
        timestamp: new Date(),
        sources: replySources,
      }

      onMessagesChange(activeConversationId, [...afterUser, assistantMessage])
    } catch (err: any) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content:
          err?.message || "Something went wrong while sending your message. Please try again in a moment.",
        timestamp: new Date(),
      }
      onMessagesChange(activeConversationId, [...afterUser, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-gradient-to-b from-blue-50 to-blue-100 relative">
      {/* Logo button at top left - only visible when sidebar is closed */}
      {!isSidebarOpen && (
        <button
          onClick={onToggleSidebar}
          className="absolute top-3 left-3 z-10 p-2 rounded-lg hover:bg-blue-100/80 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Image
            src="/aiapplication/image/logo.png"
            alt="IDDION logo"
            width={90}
            height={50}
            className="object-contain"
          />
        </button>
      )}

      {/* User info and Home button at top right */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2" ref={menuRef}>
        {/* Home button - only visible when sidebar is closed */}
        {!isSidebarOpen && (
          <button
            onClick={handleNavigateToLaunchdesk}
            className="group relative w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
            aria-label="Go to Launchdesk"
            title="Go to Launchdesk"
          >
            <Home className="w-4 h-4 text-blue-700 transition-transform group-hover:scale-110" />
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Launchdesk
            </span>
          </button>
        )}
        {/* User Avatar - Clickable */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-900 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 bg-gradient-to-b from-blue-700 to-blue-900"
          aria-label="User menu"
        >
          <span className="text-white font-bold text-sm">{firstLetter}</span>
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute top-10 right-0 mt-2 w-48 bg-white border border-blue-200 rounded-lg shadow-xl z-[150] overflow-hidden">
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{firstLetter}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-blue-950">{userName || "User"}</span>
                  <span className="text-xs text-blue-700">{userEmail || ""}</span>
                </div>
              </div>
            </div>
            <div className="py-1">
              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-blue-900 hover:bg-blue-50 transition-colors">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </button>
              <button 
                onClick={() => {
                  router.push("/settings")
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-blue-900 hover:bg-blue-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-blue-100 mt-1"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Initial state: hero + centered input card (no messages yet) */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-xl mb-6">
            <div className="flex items-center justify-center mb-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">
              What can I help with today?
            </h2>
            <p className="text-sm text-gray-600">
              Back at it, ask a question, paste code, or describe a task you&apos;d like help with.
            </p>
          </div>

          {/* Centered input card, ChatGPT-style */}
          <form onSubmit={handleSubmit} className="w-full flex justify-center">
            <div className="w-full max-w-2xl">
              <div className="relative rounded-3xl bg-white/95 shadow-md border-2 border-blue-200">
                {/* subtle glow */}
                <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-white/40 to-blue-100/60" />

                <div className="relative flex items-center gap-3 px-5 py-4 min-h-[80px]">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="How can I help you today?"
                    rows={2}
                    className="flex-1 resize-none bg-transparent py-2 outline-none text-[13px] text-slate-900 placeholder-slate-400 max-h-[260px]"
                    disabled={isLoading}
                  />

                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="flex-shrink-0 inline-flex items-center justify-center mb-1 h-9 w-9 rounded-full bg-gradient-to-br from-blue-700 to-blue-600 text-white shadow-sm hover:from-blue-800 hover:to-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-blue-600 mt-2 px-1 flex items-center justify-between">
                <span>
                  Press <span className="font-semibold">Enter</span> to send, <span className="font-semibold">Shift + Enter</span> for a new line.
                </span>
                <button
                  type="button"
                  onClick={() => setPropertiesPopupOpen(true)}
                  className="group relative inline-flex items-center justify-center"
                  aria-label="Select predefined property"
                >
                  <Zap className="w-3.5 h-3.5 text-blue-400 hover:text-blue-600 transition-colors" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Preprompt
                  </span>
                </button>
              </p>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-blue-50 min-h-0">
          {/* Conversation view: messages scroll, input fixed at bottom of chat column */}
          <div className="w-full flex-1 flex flex-col min-h-0">
            <div className={`flex-1 overflow-y-auto px-4 ${!isSidebarOpen ? 'pt-16' : 'pt-4'} pb-24`}>
              <MessageList messages={messages} isLoading={isLoading} />
            </div>

            <div className="flex-shrink-0 border-t border-blue-200 bg-white">
              <form onSubmit={handleSubmit} className="px-3 py-3 w-full max-w-3xl mx-auto">
                <div className="relative flex items-end gap-2 bg-white border border-blue-200 rounded-2xl shadow-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-300 transition-colors">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    rows={2}
                    className="flex-1 resize-none bg-transparent px-3 py-2.5 outline-none text-[13px] text-blue-950 placeholder-blue-400 max-h-[260px]"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="flex-shrink-0 mb-1.5 mr-1.5 px-3 py-1.5 rounded-xl bg-blue-700 text-white hover:bg-blue-800 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium hidden sm:inline">Send</span>
                  </button>
                </div>
                <p className="text-[10px] text-blue-600 mt-2 flex items-center justify-between">
                  <span>
                    Press <span className="font-semibold">Enter</span> to send, <span className="font-semibold">Shift + Enter</span> for a new line.
                  </span>
                  <button
                    type="button"
                    onClick={() => setPropertiesPopupOpen(true)}
                    className="group relative inline-flex items-center justify-center"
                    aria-label="Select predefined property"
                  >
                    <Zap className="w-3.5 h-3.5 text-blue-400 hover:text-blue-600 transition-colors" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Preprompt
                  </span>
                  </button>
                </p>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Predefined Properties Selector Popup */}
      <PredefinedPropertiesSelectorPopup
        isOpen={propertiesPopupOpen}
        onClose={() => setPropertiesPopupOpen(false)}
        onSelect={handlePropertySelect}
      />
    </div>
  )
}

export default ChatInterface
