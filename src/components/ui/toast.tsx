import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 4000,
    };
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => removeToast(id), newToast.duration);
    }
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message, duration: 6000 });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast Container
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// Single Toast Item
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 200);
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-success-600" />,
    error: <XCircle className="h-5 w-5 text-error-600" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning-600" />,
    info: <Info className="h-5 w-5 text-info-600" />,
  };

  const styles = {
    success: 'bg-success-50 border-success-200',
    error: 'bg-error-50 border-error-200',
    warning: 'bg-warning-50 border-warning-200',
    info: 'bg-info-50 border-info-200',
  };

  const titleStyles = {
    success: 'text-success-800',
    error: 'text-error-800',
    warning: 'text-warning-800',
    info: 'text-info-800',
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-200',
        styles[toast.type],
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0 animate-slide-in-right'
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className={cn('font-medium text-sm', titleStyles[toast.type])}>{toast.title}</p>
        {toast.message && (
          <p className="text-sm text-primary-600 mt-1">{toast.message}</p>
        )}
      </div>
      <button
        onClick={handleRemove}
        className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
      >
        <X className="h-4 w-4 text-primary-400" />
      </button>
    </div>
  );
}

// CSS Animation (add to index.css)
// @keyframes slide-in-right {
//   from { opacity: 0; transform: translateX(100%); }
//   to { opacity: 1; transform: translateX(0); }
// }
// .animate-slide-in-right { animation: slide-in-right 0.2s ease-out; }
