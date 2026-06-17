import { MessageSquare } from 'lucide-react';

interface GreenChatToggleProps {
  onClick: () => void;
}

export function GreenChatToggle({ onClick }: GreenChatToggleProps) {
  return (
    <button
      onClick={onClick}
      className="fixed shadow-lg transition-all flex items-center justify-center hover:scale-110"
      style={{
        bottom: '1rem',
        right: '1rem',
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: '#10b981',
        color: '#fff',
        zIndex: 40,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#059669';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#10b981';
      }}
      aria-label="Open ARIA Green Intelligence chat"
    >
      <MessageSquare className="w-6 h-6" />
    </button>
  );
}
