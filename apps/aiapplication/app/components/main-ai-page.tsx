"use client";
import { useState } from 'react';
import ChatInterface from './chatInterface';
import Sidebar from './sidebar';
import { Conversation, Message } from '@/type/ai-conversation/conversation';

function MainAiPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, Message[]>>({});

  const handleNewConversation = (title: string): string => {
    const id = Date.now().toString();
    const newConversation: Conversation = {
      id,
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(id);
    setMessagesByConversation((prev) => ({ ...prev, [id]: prev[id] || [] }));
    return id;
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id));
    setMessagesByConversation((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  const handleMessagesChange = (conversationId: string, messages: Message[]) => {
    setMessagesByConversation((prev) => ({
      ...prev,
      [conversationId]: messages,
    }));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onNewConversation={() => {
          handleNewConversation('New Conversation');
        }}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <ChatInterface
        conversationId={currentConversationId}
        onConversationStart={handleNewConversation}
        messages={currentConversationId ? messagesByConversation[currentConversationId] || [] : []}
        onMessagesChange={handleMessagesChange}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
    </div>
  );
}

export default MainAiPage;
