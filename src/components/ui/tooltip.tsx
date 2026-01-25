import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
}

function Tooltip({
  children,
  content,
  side = 'top',
  delayDuration = 200,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    const tooltipWidth = tooltipRect?.width || 200;
    const tooltipHeight = tooltipRect?.height || 40;
    const gap = 8;

    let top = 0;
    let left = 0;

    switch (side) {
      case 'top':
        top = rect.top - tooltipHeight - gap + window.scrollY;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2) + window.scrollX;
        break;
      case 'bottom':
        top = rect.bottom + gap + window.scrollY;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2) + window.scrollX;
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2) + window.scrollY;
        left = rect.left - tooltipWidth - gap + window.scrollX;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2) + window.scrollY;
        left = rect.right + gap + window.scrollX;
        break;
    }

    // Keep tooltip within viewport
    const padding = 10;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Horizontal bounds
    if (left < padding) {
      left = padding;
    } else if (left + tooltipWidth > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding;
    }

    // Vertical bounds - if tooltip would go above viewport, show below instead
    if (top < padding + window.scrollY) {
      top = rect.bottom + gap + window.scrollY;
    } else if (top + tooltipHeight > viewportHeight + window.scrollY - padding) {
      top = rect.top - tooltipHeight - gap + window.scrollY;
    }

    setPosition({ top, left });
  }, [side]);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        updatePosition();
      });
    }, delayDuration);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Update position when visible
  React.useEffect(() => {
    if (isVisible) {
      updatePosition();
      // Also update on scroll/resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible, updatePosition]);

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          className={cn(
            'fixed z-[99999] max-w-xs px-3 py-2 text-xs font-medium text-white bg-primary-900 rounded-lg shadow-xl',
            'animate-fade-in pointer-events-none'
          )}
          style={{
            top: position.top,
            left: position.left,
          }}
          role="tooltip"
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-2 h-2 bg-primary-900 rotate-45',
              side === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2',
              side === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2',
              side === 'left' && 'right-[-4px] top-1/2 -translate-y-1/2',
              side === 'right' && 'left-[-4px] top-1/2 -translate-y-1/2'
            )}
          />
        </div>,
        document.body
      )}
    </>
  );
}

// Simple Tooltip wrapper components for Radix-style API compatibility
const TooltipProvider = ({ children, delayDuration = 0 }: { children: React.ReactNode; delayDuration?: number }) => {
  void delayDuration; // Radix compatibility prop
  return <>{children}</>;
};

const TooltipTrigger = React.forwardRef<HTMLDivElement, { children: React.ReactNode; asChild?: boolean }>(
  ({ children, asChild = false }, ref) => {
    void asChild; // Radix compatibility prop
    return <div ref={ref} className="inline-flex">{children}</div>;
  }
);
TooltipTrigger.displayName = 'TooltipTrigger';

const TooltipContent = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent };
