"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

const ToastContext = createContext<(message: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMessage(null), 2200);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {message && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-5">
          <div className="animate-toast-up rounded-[14px] bg-[#333d4b] px-5 py-3.5 text-[14px] font-medium text-white shadow-lg">
            {message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
