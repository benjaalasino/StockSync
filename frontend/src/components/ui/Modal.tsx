import { useEffect, ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} rounded-[28px] bg-surface p-8 shadow-2xl ring-1 ring-outline-variant`}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-headline-md font-semibold text-on-surface">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-variant transition"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
