import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface NewTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void> | void;
  defaultName?: string;
}

export const NewTableDialog: React.FC<NewTableDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultName = '',
}) => {
  const [name, setName] = useState(defaultName);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setErrorMessage(null);
    }
  }, [isOpen, defaultName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || submitting) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await onSave(trimmed);
      setName('');
      onClose();
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Não foi possível criar a mesa.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-card rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border space-y-5">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-xl font-bold text-foreground font-display">Nova mesa</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Crie um card para organizar os convidados que se sentarão juntos.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="new-table-name"
              className="block text-xs font-semibold text-foreground mb-1.5"
            >
              Nome da mesa
            </label>
            <input
              id="new-table-name"
              type="text"
              required
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mesa 1"
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground"
            />
          </div>

          {errorMessage && (
            <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {errorMessage}
            </p>
          )}

          <div className="pt-2 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-2xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Criando...' : 'Criar mesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};