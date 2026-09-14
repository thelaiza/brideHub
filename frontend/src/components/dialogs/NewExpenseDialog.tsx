import React, { useState } from 'react';
import { X, DollarSign, Calendar, Tag, FileText } from 'lucide-react';
import type { Expense } from '../../types';

interface NewExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id'>) => void;
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

export const NewExpenseDialog: React.FC<NewExpenseDialogProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'Pendente' | 'Pago'>('Pendente');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      category,
      amount: parseFloat(amount) || 0,
      dueDate,
      status
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-card rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-foreground font-display">Nova Despesa</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Descrição</label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Sinal do Buffet" 
                className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Categoria</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-ring appearance-none cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-card text-foreground">{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Valor (R$)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00" 
                  className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-ring"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Vencimento</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type="date" 
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-ring"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Status</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Pendente' | 'Pago')}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-ring cursor-pointer"
              >
                <option value="Pendente" className="bg-card text-foreground">Pendente</option>
                <option value="Pago" className="bg-card text-foreground">Pago</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3 justify-end">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 transition-all cursor-pointer"
            >
              Salvar Despesa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};