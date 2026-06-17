import { Plus, Trash2, ChevronRight, Search, Filter, List, PanelLeftClose, PenSquare, Home } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Conversation } from '@/type/ai-conversation/conversation';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  isOpen,
  onToggle,
}: SidebarProps) {
  return (
    <div
      className={`${
        isOpen ? 'w-64' : 'w-0'
      } flex-shrink-0 transition-all duration-300 overflow-hidden border-r border-blue-900 bg-gradient-to-b from-blue-950 to-blue-900 flex flex-col text-blue-50`}
    >
      {/* Top bar with logo, home button and collapse icon */}
      {isOpen && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-blue-900">
          <div className="flex items-center gap-2">
            <Image
              src="/aiapplication/image/logo.png"
              alt="IDDION logo"
              width={60}
              height={36}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const launchdeskUrl = `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/launchdesk`
                window.location.href = launchdeskUrl
              }}
              className="p-1 rounded-md text-blue-200 hover:text-white hover:bg-blue-800/50 transition-colors"
              aria-label="Go to Launchdesk"
              title="Go to Launchdesk"
            >
              <Home className="w-4 h-4" />
            </button>
            <button
              onClick={onToggle}
              className="p-1 rounded-md text-blue-200 hover:text-white hover:bg-blue-800/50 transition-colors"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search agents bar */}
      {isOpen && (
        <div className="px-3 pt-2 pb-3 border-b border-blue-900">
          <div className="flex items-center gap-2 rounded-lg border border-blue-800/60 bg-blue-900/40 backdrop-blur-sm px-2.5 py-1.5 text-[12px] text-blue-100">
            <Search className="w-3.5 h-3.5 text-blue-300" />
            <input
              type="text"
              placeholder="Search agents..."
              className="flex-1 bg-transparent outline-none border-none text-[12px] placeholder-blue-300 text-blue-100"
            />
            <button className="p-1 rounded hover:bg-blue-800/50" aria-label="Filter agents">
              <Filter className="w-3.5 h-3.5 text-blue-300" />
            </button>
            <button className="p-1 rounded hover:bg-blue-800/50" aria-label="Change list view">
              <List className="w-3.5 h-3.5 text-blue-300" />
            </button>
          </div>
        </div>
      )}

      {/* New Agent button */}
      {isOpen && (
        <div className="px-3 pb-3">
          <button
            onClick={onNewConversation}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-[#f5f5f5] text-[#111111] rounded-lg hover:bg-white transition-colors text-[13px] font-medium"
          >
            <PenSquare className="w-3.5 h-3.5" />
            New Agent
          </button>
        </div>
      )}

      {isOpen && (
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="px-3 py-6 text-center text-blue-200">
              <p className="text-[13px]">No agents yet</p>
              <p className="text-[11px] mt-1.5 text-blue-300">Create a new agent to begin</p>
            </div>
          ) : (
            <div className="px-2 pb-2 space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    currentConversationId === conversation.id
                      ? 'bg-blue-800/60 text-white'
                      : 'text-blue-100 hover:bg-blue-800/40'
                  }`}
                >
                  <button
                    onClick={() => onSelectConversation(conversation.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="text-[13px] truncate font-medium">{conversation.title}</p>
                    <p className="text-[11px] text-blue-300">
                      {new Date(conversation.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conversation.id);
                    }}
                    className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 rounded"
                  >
                    {/* <Trash2 className="w-3.5 h-3.5 text-red-500" /> */}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div className="border-t border-blue-900 p-3 relative">
          {/* <div className="absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500" /> */}
          <Link 
            href="/settings"
            className="w-full flex items-center justify-between px-3 py-1.5 text-blue-100 hover:bg-blue-800/40 rounded-lg transition-colors text-[13px]"
          >
            <span>Settings</span>
            {/* <ChevronRight className="w-3.5 h-3.5" /> */}
          </Link>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
