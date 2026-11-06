// src/shared/components/ui/ConfirmDialog.tsx
// Reemplazo de window.confirm: `const ok = await confirmDialog({...})`
// Monta <ConfirmDialogHost /> una sola vez en la raíz de la app.
import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" para acciones destructivas: muestra el ícono de alerta y enfoca "Cancelar" */
  tone?: "danger" | "default";
}

type Pending = { options: ConfirmOptions; resolve: (value: boolean) => void } | null;

let pending: Pending = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const confirmDialog = (options: ConfirmOptions) =>
  new Promise<boolean>((resolve) => {
    pending?.resolve(false); // si había uno abierto, se cancela
    pending = { options, resolve };
    emit();
  });

const close = (value: boolean) => {
  pending?.resolve(value);
  pending = null;
  emit();
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const ConfirmDialogHost = () => {
  const current = useSyncExternalStore(subscribe, () => pending);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();
  const options = current?.options;
  const danger = options?.tone === "danger";

  useEffect(() => {
    if (!options) return;
    const previous = document.activeElement as HTMLElement | null;
    // En acciones destructivas el foco inicial va a "Cancelar" para evitar un Enter accidental
    (danger ? cancelRef : confirmRef).current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close(false);
      }
      // Mantiene el foco dentro del diálogo
      if (e.key === "Tab") {
        const els = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[];
        const idx = els.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        els[(idx + (e.shiftKey ? -1 : 1) + els.length) % els.length]?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      previous?.focus?.();
    };
  }, [options, danger]);

  if (!options) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && close(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={options.description ? descId : undefined}
        className="w-full max-w-md bg-[#0f0f0f] border border-zinc-800 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex gap-4">
          {danger && (
            <div className="w-10 h-10 shrink-0 rounded-full bg-red-600/15 text-red-500 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-white">
              {options.title}
            </h2>
            {options.description && (
              <div id={descId} className="mt-1.5 text-sm text-zinc-400 leading-relaxed">
                {options.description}
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => close(false)}
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
          >
            {options.cancelLabel ?? "Cancelar"}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => close(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f]"
          >
            {options.confirmLabel ?? "Aceptar"}
          </button>
        </div>
      </div>
    </div>
  );
};