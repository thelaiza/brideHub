import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, CheckCircle2, Clock, X, Trash2, Pencil } from 'lucide-react';
import { NewExpenseDialog } from '../components/dialogs/NewExpenseDialog';
import { EditExpenseDialog } from '../components/dialogs/EditExpenseDialog';
import type { Expense } from '../types';
import { api } from '../services/api';

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
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/api/expenses');
      setExpenses(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (newExpense: Omit<Expense, 'id'>) => {
    try {
      const response = await api.post('/api/expenses', {
        title: newExpense.title,
        category: newExpense.category,
        amount: Number(newExpense.amount),
        dueDate: newExpense.dueDate || null,
        status: newExpense.status === 'Pago' ? 'paid' : 'pending',
      });
      
      setExpenses([response.data, ...expenses]);
      setIsExpenseOpen(false);
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
    }
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    setExpenses(expenses.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp));
  };

  const handleToggleStatus = async (id: string, currentStatus: 'Pendente' | 'Pago') => {
    const newStatus = currentStatus === 'Pago' ? 'pending' : 'paid';
    const displayStatus = currentStatus === 'Pago' ? 'Pendente' : 'Pago';

    try {
      await api.patch(`/api/expenses/${id}`, { status: newStatus });
      setExpenses(expenses.map(exp => exp.id === id ? { ...exp, status: displayStatus } : exp));
    } catch (error) {
      console.error('Erro ao atualizar status da despesa:', error);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta despesa?')) return;
    try {
      await api.delete(`/api/expenses/${id}`);
      setExpenses(expenses.filter(exp => exp.id !== id));
    } catch (error) {
      console.error('Erro ao deletar despesa:', error);
    }
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
            placeholder="Buscar despesa ou categoria..." 
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Carregando despesas...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Nenhuma despesa encontrada.
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
                    <td className="py-4 px-6 font-bold text-foreground">R$ {Number(expense.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 px-6 text-muted-foreground">
                      {expense.dueDate ? new Date(expense.dueDate.split('T')[0] + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data'}
                    </td>
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => handleToggleStatus(expense.id, expense.status)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-transform hover:scale-105 ${
                          expense.status === 'Pago' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}
                        title="Clique para alternar o status"
                      >
                        {expense.status === 'Pago' ? <CheckCircle2 size={14} /> : <Clock size={14} />} {expense.status}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setEditingExpense(expense)}
                          className="text-muted-foreground hover:text-primary transition-colors p-1 cursor-pointer"
                          title="Editar despesa"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors p-1 cursor-pointer"
                          title="Excluir despesa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
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

      <EditExpenseDialog 
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        expense={editingExpense}
        onSave={handleUpdateExpense}
      />
    </div>
  );
};