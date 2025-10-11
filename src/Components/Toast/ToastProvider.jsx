import { useCallback, useMemo, useState } from 'react';
import { ToastContext } from './useToast';

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = crypto.randomUUID();
    const duration = toast.duration ?? 3000;
    const item = { id, type: toast.type || 'info', title: toast.title, description: toast.description, duration };
    setToasts((prev) => [...prev, item]);
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
  }, [remove]);

  const api = useMemo(() => ({ push, remove }), [push, remove]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <div className="toast-content">
              {t.title && <div className="toast-title">{t.title}</div>}
              {t.description && <div className="toast-desc">{t.description}</div>}
            </div>
            <button className="toast-close" onClick={() => remove(t.id)} aria-label="Close">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

