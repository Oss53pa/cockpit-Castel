import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface DialogContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a Dialog');
  }
  return context;
}

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Dialog({ children, open: controlledOpen, onOpenChange }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = React.useCallback(
    (value: React.SetStateAction<boolean>) => {
      const newValue = typeof value === 'function' ? value(open) : value;
      if (onOpenChange) {
        onOpenChange(newValue);
      } else {
        setUncontrolledOpen(newValue);
      }
    },
    [open, onOpenChange]
  );

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const { setOpen } = useDialog();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(true),
    });
  }

  return (
    <button type="button" onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}

function DialogPortal({ children }: { children: React.ReactNode }) {
  const { open } = useDialog();

  if (!open) return null;

  return <>{children}</>;
}

function DialogOverlay({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <div
      className={cn(
        'fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in',
        className
      )}
      onClick={onClick}
    />
  );
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function DialogContent({ className, children, ...props }: DialogContentProps) {
  const { setOpen } = useDialog();

  return (
    <DialogPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogOverlay onClick={() => setOpen(false)} />
        <div
          className={cn(
            'relative z-50 w-full max-w-lg rounded-xl border bg-white p-6 shadow-xl animate-scale-in',
            className
          )}
          {...props}
        >
          {children}
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-4 top-4"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fermer</span>
          </Button>
        </div>
      </div>
    </DialogPortal>
  );
}

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6',
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-primary-500', className)} {...props} />
  );
}

function DialogClose({ children }: { children: React.ReactNode }) {
  const { setOpen } = useDialog();

  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(false),
    });
  }

  return (
    <button type="button" onClick={() => setOpen(false)}>
      {children}
    </button>
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
