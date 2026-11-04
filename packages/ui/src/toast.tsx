import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from "react";

export const OD_TOAST_TYPES = {
  success: "success",
  error: "error",
  info: "info",
} as const;

export type OdToastType = (typeof OD_TOAST_TYPES)[keyof typeof OD_TOAST_TYPES];

export interface OdToastItem {
  readonly id: string;
  readonly type: OdToastType;
  readonly text: string;
}

export interface OdToastOptions {
  readonly type?: OdToastType;
  readonly text: string;
  readonly duration?: number;
}

export interface OdToastContextValue {
  readonly toasts: readonly OdToastItem[];
  readonly push: (toast: OdToastOptions) => void;
  readonly dismiss: (id: string) => void;
}

const OdToastContext = createContext<OdToastContextValue | null>(null);

let nextToastId = 1;

export interface OdToastProviderProps {
  readonly children: ReactNode;
}

export const OdToastProvider: FC<OdToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<readonly OdToastItem[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    ({ type = OD_TOAST_TYPES.info, text, duration = 3000 }: OdToastOptions) => {
      const id = `toast-${nextToastId++}`;
      const item: OdToastItem = { id, type, text };
      setToasts((prev) => [...prev, item]);

      if (duration > 0) {
        const timeout = setTimeout(() => {
          dismiss(id);
        }, duration);
        timeoutsRef.current.set(id, timeout);
      }
    },
    [dismiss],
  );

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      for (const t of timeouts.values()) {
        clearTimeout(t);
      }
      timeouts.clear();
    };
  }, []);

  return (
    <OdToastContext.Provider value={{ toasts, push, dismiss }}>{children}</OdToastContext.Provider>
  );
};

export function useToast(): OdToastContextValue {
  const ctx = useContext(OdToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within an OdToastProvider");
  }
  return ctx;
}

export interface OdToastHostProps {
  readonly className?: string;
}

export const OdToastHost: FC<OdToastHostProps> = ({ className = "" }) => {
  const { toasts, dismiss } = useToast();
  if (toasts.length === 0) {
    return null;
  }

  const containerClass = ["od-toast-host", className].filter(Boolean).join(" ");

  return (
    <div className={containerClass} role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((toast) => {
        const typeClass =
          toast.type === OD_TOAST_TYPES.success
            ? "od-toast--success"
            : toast.type === OD_TOAST_TYPES.error
              ? "od-toast--error"
              : "od-toast--info";

        return (
          <div
            key={toast.id}
            className={`od-toast ${typeClass}`}
            role="status"
            onClick={() => dismiss(toast.id)}
          >
            <span>{toast.text}</span>
          </div>
        );
      })}
    </div>
  );
};
