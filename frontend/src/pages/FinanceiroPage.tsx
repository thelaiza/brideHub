import React, { useState } from 'react';
import { Plus, Search, Filter, CheckCircle2, Clock, X } from 'lucide-react';
import { NewExpenseDialog } from '../components/dialogs/NewExpenseDialog';
import type { Expense } from '../types';

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

export const FinanceiroPage: React.FC = () => {
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', title: 'Buffet Completo (Sinal)', category: 'Buffet', amount: 5000, status: 'Pago', dueDate: '2026-04-15' },
    { id: '2', title: 'Fotografia e Filme', category: 'Fotografia e Vídeo', amount: 4200, status: 'Pendente', dueDate: '2026-05-28' },
    { id: '3', title: 'Decoração da Cerimônia', category: 'Decoração e Flores', amount: 3800, status: 'Pendente', dueDate: '2026-06-10' },
  ]);

  const handleAddExpense = (newExpense: Omit<Expense, 'id'>) => {
    const expenseWithId: Expense = {
      ...newExpense,
      id: Math.random().toString(36).substring(2, 9),
    };
    setExpenses([expenseWithId, ...expenses]);
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || expense.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-foreground font-display">Controle Financeiro</h3>
          <p className="text-sm text-muted-foreground mt-1">Gerencie despesas, custos e acompanhe o que falta pagar do casamento.</p>
        </div>
        <button 
          onClick={() => setIsExpenseOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus size={18} /> Nova Despesa
        </button>
      </div>

      <div className="bg-card p-4 rounded-3xl border border-border shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar despesa ou fornecedor..." 
            className="w-full pl-11 pr-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring transition-colors text-foreground"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
          <div className="relative flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm font-medium text-foreground focus:outline-none focus:border-ring cursor-pointer"
            >
              <option value="Todas">Todas as categorias</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {selectedCategory !== 'Todas' && (
              <button 
                onClick={() => setSelectedCategory('Todas')}
                className="text-xs text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                title="Limpar filtro"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-4 px-6">Descrição</th>
                <th className="py-4 px-6">Categoria</th>
                <th className="py-4 px-6">Valor</th>
                <th className="py-4 px-6">Vencimento</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Nenhuma despesa encontrada para esta categoria.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-foreground">{expense.title}</td>
                    <td className="py-4 px-6">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground">
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-foreground">R$ {expense.amount.toLocaleString('pt-BR')}</td>
                    <td className="py-4 px-6 text-muted-foreground">{expense.dueDate}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        expense.status === 'Pago' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {expense.status === 'Pago' ? <CheckCircle2 size={14} /> : <Clock size={14} />} {expense.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-muted-foreground hover:text-foreground cursor-pointer">Editar</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewExpenseDialog 
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        onSave={handleAddExpense}
      />
    </div>
  );
};