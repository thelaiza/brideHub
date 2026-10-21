import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, FileText } from 'lucide-react';
import { api } from '../../services/api';
import type { Expense } from '../../types';

interface EditExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  onSave: (updatedExpense: Expense) => void;
}

const CATEGORIES = [
  'Local',
  'Buffet',
  'Fotografia e Vídeo',
  'Bolo',
  'Doces',
  'Decoração e Flores',
  'Papelaria',
  'Vestido da noiva',
  'Salão de beleza',
  'Terno do noivo',
  'DJ/Banda para festa',
  'Músicos para cerimônia',
  'Lembrancinha',
  'Cerimonial',
  'Segurança e Serviços Extras',
  'Outros'
];

export const EditExpenseDialog: React.FC<EditExpenseDialogProps> = ({ isOpen, onClose, expense, onSave }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'Pendente' | 'Pago'>('Pendente');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expense) {
      setTitle(expense.title || '');
      setCategory(expense.category || CATEGORIES[0]);
      setAmount(expense.amount ? expense.amount.toString() : '');
      setDueDate(expense.dueDate ? expense.dueDate.split('T')[0] : '');
      setStatus(expense.status || 'Pendente');
    }
  }, [expense]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;

    setLoading(true);
    try {
      const response = await api.patch(`/api/expenses/${expense.id}`, {
        title,
        category,
        amount: parseFloat(amount) || 0,
        dueDate: dueDate || null,
        status: status === 'Pago' ? 'paid' : 'pending',
      });

      onSave(response.data);
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-card rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-foreground font-display">Editar Despesa</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Descrição</label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Categoria</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Valor (R$)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Vencimento</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Status</label>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Pendente' | 'Pago')}
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground cursor-pointer"
            >
              <option value="Pendente">Pendente</option>
              <option value="Pago">Pago</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3 justify-end">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};