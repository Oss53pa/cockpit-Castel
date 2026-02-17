import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui';

const pageTitles: Record<string, string> = {
  '/performance': 'Performance',
};

interface PerformanceHeaderProps {
  onToggleSidebar?: () => void;
}

export function PerformanceHeader({ onToggleSidebar }: PerformanceHeaderProps) {
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] ?? 'Performance';

  return (
    <header className="flex-shrink-0 sticky top-0 z-30 flex h-16 items-center justify-between border-b border-violet-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <h1 className="text-xl font-semibold text-violet-900">{pageTitle}</h1>
      </div>
    </header>
  );
}
