import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Guest, WeddingTable } from '../../types';

interface AddGuestToTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  table: WeddingTable | null;
  availableGuests: Guest[];
  onAssign: (tableId: string, guestId: string) => Promise<void> | void;
}

export const AddGuestToTableDialog: React.FC<AddGuestToTableDialogProps> = ({
  isOpen,
  onClose,
  table,
  availableGuests,
  onAssign,
}) => {
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedGuestId('');
      setErrorMessage(null);
    }
  }, [isOpen, table?.id]);

  if (!isOpen || !table) return null;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!selectedGuestId || submitting) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await onAssign(table.id, selectedGuestId);
      setSelectedGuestId('');
      onClose();
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Não foi possível adicionar o convidado à mesa.';
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
            <h3 className="text-xl font-bold text-foreground font-display">
              Adicionar à {table.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Apenas convidados que ainda não estão em outra mesa aparecem na seleção.
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
              htmlFor="select-guest-for-table"
              className="block text-xs font-semibold text-foreground mb-1.5"
            >
              Convidado
            </label>
            <select
              id="select-guest-for-table"
              value={selectedGuestId}
              onChange={(e) => setSelectedGuestId(e.target.value)}
              disabled={availableGuests.length === 0 || submitting}
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground cursor-pointer"
            >
              <option value="" className="bg-card text-foreground">
                {availableGuests.length === 0
                  ? 'Todos os convidados já possuem mesa'
                  : 'Selecione um convidado'}
              </option>
              {availableGuests.map((guest) => (
                <option key={guest.id} value={guest.id} className="bg-card text-foreground">
                  {guest.name} — {guest.group}
                </option>
              ))}
            </select>
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
              disabled={!selectedGuestId || submitting}
              className="px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};