import { useState, useRef, useEffect } from 'react';

/**
 * VendorPolicyModal — Scroll-gated Terms & Conditions modal
 *
 * Props:
 *  - content: string (HTML from API)
 *  - title: string
 *  - onAccept: () => void  — called when user scrolls to bottom & clicks Continue
 *  - onClose:  () => void  — called when user clicks ✕
 */
const VendorPolicyModal = ({ content, title, onAccept, onClose }) => {
  const [canContinue, setCanContinue] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const scrollRef = useRef(null);

  // ── Scroll listener — enable Continue only when user reaches the bottom ──
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const percent = Math.round(((scrollTop + clientHeight) / scrollHeight) * 100);
    setScrollPercent(Math.min(percent, 100));
    // Give a 2px tolerance for sub-pixel rendering
    if (scrollTop + clientHeight >= scrollHeight - 2) {
      setCanContinue(true);
    }
  };

  // Check on mount in case content is short enough to not need scrolling
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 2) {
      setCanContinue(true);
      setScrollPercent(100);
    }
  }, [content]);

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6
                    bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl glass-card flex flex-col
                      max-h-[90vh] animate-slideUp overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-white/10 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">{title || 'Terms & Conditions'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Please read the entire policy before continuing
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10
                       transition-all flex-shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scroll Progress Bar */}
        <div className="h-1 bg-white/5 flex-shrink-0">
          <div
            className="h-full bg-gradient-to-r from-primary-600 to-primary-400
                       transition-all duration-300"
            style={{ width: `${scrollPercent}%` }}
          />
        </div>

        {/* Scrollable Policy Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-5 min-h-0
                     prose prose-invert prose-sm max-w-none
                     [&_h2]:text-white [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5
                     [&_h3]:text-gray-200 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4
                     [&_p]:text-gray-400 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-3
                     [&_strong]:text-gray-200"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex-shrink-0">
          {/* Hint when not scrolled */}
          {!canContinue && (
            <p className="text-gray-500 text-xs text-center mb-3 animate-fadeIn flex items-center justify-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              Scroll to the bottom to enable the Continue button
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={onAccept}
              disabled={!canContinue}
              className={`btn-primary flex-1 transition-all duration-300 ${
                canContinue
                  ? ''
                  : 'opacity-40 cursor-not-allowed pointer-events-none'
              }`}
            >
              {canContinue ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M5 13l4 4L19 7" />
                  </svg>
                  I Agree — Continue
                </>
              ) : `Read ${100 - scrollPercent}% more to continue`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPolicyModal;
