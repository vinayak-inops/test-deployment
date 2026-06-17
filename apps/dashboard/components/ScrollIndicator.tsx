import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

interface ScrollIndicatorProps {
  containerId: string;
}

export function ScrollIndicator({ containerId }: ScrollIndicatorProps) {
  const [showDownIndicator, setShowDownIndicator] = useState(false);
  const [showUpIndicator, setShowUpIndicator] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = document.getElementById(containerId);
    containerRef.current = container;

    if (!container) return;

    const checkScroll = () => {
      const hasScroll = container.scrollHeight > container.clientHeight;
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
      const isAtTop = container.scrollTop <= 10;

      setShowDownIndicator(hasScroll && !isAtBottom);
      setShowUpIndicator(hasScroll && !isAtTop);
    };

    checkScroll();
    container.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    const observer = new MutationObserver(checkScroll);
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      observer.disconnect();
    };
  }, [containerId]);

  const handleScrollDown = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ top: 100, behavior: 'smooth' });
    }
  };

  const handleScrollUp = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ top: -100, behavior: 'smooth' });
    }
  };

  return (
    <>
      {showUpIndicator && (
        <button
          onClick={handleScrollUp}
          className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded px-1.5 py-0.5 shadow-sm transition-colors border border-slate-200"
          aria-label="Scroll up"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
      )}
      {showDownIndicator && (
        <button
          onClick={handleScrollDown}
          className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded px-1.5 py-0.5 shadow-sm transition-colors border border-slate-200"
          aria-label="Scroll down"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      )}
    </>
  );
}
