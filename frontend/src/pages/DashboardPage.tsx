import React, { useState } from 'react';
import { CalendarHeart, TrendingUp, Users, Wallet, CheckSquare, ArrowUpRight, Pencil } from 'lucide-react';
import type { Expense, Vendor, Task } from '../types';
import { EditWeddingDialog } from '../components/dialogs/EditWeddingDialog';

interface DashboardPageProps {
  onNavigate?: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [wedding, setWedding] = useState({
    bride: 'Laíza',
    groom: 'Marcos',
    date: '2026-10-04',
    venue: 'Joinville, SC',
    budget: 55000,
  });

  const tasks: Task[] = [
    { id: '1', title: 'Agendar prova do vestido', category: 'Vestido', status: 'todo', dueDate: '2026-05-20' },
    { id: '2', title: 'Escolher músicas da cerimônia', category: 'Música', status: 'doing', dueDate: '2026-06-02' },
    { id: '3', title: 'Confirmar menu degustação', category: 'Buffet', status: 'todo', dueDate: '2026-09-12' },
    { id: '4', title: 'Aprovar arte do convite', category: 'Papelaria', status: 'todo', dueDate: '2026-09-21' },
  ];

  const vendors: Vendor[] = [
    { id: '1', name: 'Boulevard Eventos', category: 'Buffet', phone: '(47) 99888-1234', status: 'Contratado', cost: 28000 },
    { id: '2', name: 'Decor Encanto', category: 'Decoração', phone: '(47) 99777-5678', status: 'Contratado', cost: 9800 },
    { id: '3', name: 'Luz & Cena Filmes', category: 'Foto & Vídeo', phone: '(47) 99666-4321', status: 'Contratado', cost: 7600 },
    { id: '4', name: 'Cerimonial Perfeito', category: 'Cerimonial', phone: '(47) 99555-1122', status: 'Contratado', cost: 6500 },
  ];

  // Despesas / orçamentos lançados por categoria
  const expenses: Expense[] = [
    { id: '1', title: 'Buffet Principal', category: 'Buffet', amount: 28000, status: 'Pago', dueDate: '2026-09-15' },
    { id: '2', title: 'Decoração Floral', category: 'Decoração', amount: 9800, status: 'Pendente', dueDate: '2026-09-20' },
    { id: '3', title: 'Foto e Vídeo', category: 'Foto & Vídeo', amount: 7600, status: 'Pendente', dueDate: '2026-09-25' },
    { id: '4', title: 'Assessoria do Dia', category: 'Cerimonial', amount: 6500, status: 'Pendente', dueDate: '2026-09-28' },
  ];

  // Cálculos dinâmicos
  const targetDate = new Date(wedding.date + 'T00:00:00');
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  const days = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);

  const formattedDate = targetDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const spent = expenses.filter((e) => e.status === 'Pago').reduce((a, b) => a + b.amount, 0);
  const committed = expenses.reduce((a, b) => a + b.amount, 0);
  const budgetPct = wedding.budget > 0 ? Math.min(Math.round((committed / wedding.budget) * 100), 100) : 0;
  
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const taskPct = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const contractedVendors = vendors.filter((v) => v.status === 'Contratado').length;
  const vendorPct = vendors.length > 0 ? Math.round((contractedVendors / vendors.length) * 100) : 0;

  const upcomingTasks = tasks.filter((t) => t.status !== 'done').slice(0, 4);

  // Agrupamento dinâmico do orçamento por categoria para a seção "Para onde vai o orçamento"
  const budgetByCategory = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  // Garante que categorias principais apareçam mesmo se zeradas, ou pega direto do array
  const budgetEntries = Object.entries(budgetByCategory);
  const maxCategoryValue = Math.max(...Object.values(budgetByCategory), 1);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Cabeçalho de Saudação */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-display flex items-center gap-2">
            Olá, {wedding.bride} 
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Faltam {days} dias para o seu casamento.
          </p>
        </div>
        <EditWeddingDialog onSave={(updated) => setWedding(updated)}>
          <button className="inline-flex items-center gap-2 text-xs font-semibold bg-card hover:bg-muted/60 transition rounded-2xl px-4 py-3 border border-border cursor-pointer text-foreground shadow-sm">
            <Pencil size={14} /> Editar casamento
          </button>
        </EditWeddingDialog>
      </div>

      {/* Hero countdown card */}
      <div className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl" style={{
        background: 'linear-gradient(120deg, oklch(0.55 0.09 15), oklch(0.45 0.06 350))'
      }}>
        <div className="absolute -right-10 -top-10 size-60 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute right-6 sm:right-12 bottom-0 opacity-20 pointer-events-none">
          <CalendarHeart className="size-32 sm:size-44" />
        </div>
        <div className="relative">
          <div className="text-xs sm:text-sm text-rose-100 uppercase tracking-widest font-semibold font-sans">
            {wedding.bride.toUpperCase()} & {wedding.groom.toUpperCase()}
          </div>
          <div className="flex items-baseline gap-3 sm:gap-4 mt-2 flex-wrap">
            <span className="text-5xl sm:text-7xl font-extrabold tracking-tight font-display">{days}</span>
            <span className="text-rose-100 text-sm sm:text-base font-medium">dias para o sim</span>
          </div>
          <div className="mt-3 text-rose-50 text-sm sm:text-base font-display capitalize">
            {capitalizedDate} · {wedding.venue}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => onNavigate?.('financeiro')} className="rounded-3xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition cursor-pointer group">
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-2xl bg-rose-50 text-rose-600 grid place-items-center"><Wallet size={20} /></div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground transition" />
          </div>
          <div className="mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Orçamento Comprometido</div>
          <div className="text-2xl font-bold text-foreground mt-1 font-display">R$ {committed.toLocaleString('pt-BR')}</div>
          <div className="text-xs text-muted-foreground mt-1">De R$ {wedding.budget.toLocaleString('pt-BR')} planejados</div>
          <div className="h-1.5 rounded-full bg-muted mt-4 overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: `${budgetPct}%` }} />
          </div>
        </div>

        <div onClick={() => onNavigate?.('tarefas')} className="rounded-3xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition cursor-pointer group">
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-2xl bg-purple-50 text-purple-600 grid place-items-center"><CheckSquare size={20} /></div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground transition" />
          </div>
          <div className="mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tarefas</div>
          <div className="text-2xl font-bold text-foreground mt-1 font-display">{doneTasks}/{tasks.length}</div>
          <div className="text-xs text-purple-600 mt-1 font-medium">{taskPct}% concluídas no Kanban</div>
          <div className="h-1.5 rounded-full bg-muted mt-4 overflow-hidden">
            <div className="h-full rounded-full bg-purple-600" style={{ width: `${taskPct}%` }} />
          </div>
        </div>

        <div onClick={() => onNavigate?.('fornecedores')} className="rounded-3xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition cursor-pointer group">
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-2xl bg-indigo-50 text-indigo-600 grid place-items-center"><Users size={20} /></div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground transition" />
          </div>
          <div className="mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fornecedores</div>
          <div className="text-2xl font-bold text-foreground mt-1 font-display">{contractedVendors} / {vendors.length}</div>
          <div className="text-xs text-indigo-600 mt-1 font-medium">{vendorPct}% contratos fechados</div>
          <div className="h-1.5 rounded-full bg-muted mt-4 overflow-hidden">
            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${vendorPct}%` }} />
          </div>
        </div>

        <div onClick={() => onNavigate?.('financeiro')} className="rounded-3xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition cursor-pointer group">
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-600 grid place-items-center"><TrendingUp size={20} /></div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground transition" />
          </div>
          <div className="mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Pago</div>
          <div className="text-2xl font-bold text-foreground mt-1 font-display">R$ {spent.toLocaleString('pt-BR')}</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">Baixas realizadas</div>
          <div className="h-1.5 rounded-full bg-muted mt-4 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.round((spent / wedding.budget) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Grid inferior com Próximas Tarefas e Para onde vai o orçamento */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Próximas Tarefas */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground font-display">Próximas tarefas</h3>
            <button onClick={() => onNavigate?.('tarefas')} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer">
              Ver todas <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Nenhuma tarefa pendente no momento.</p>
            ) : (
              upcomingTasks.map((t) => (
                <div key={t.id} className="p-4 rounded-2xl bg-muted/50 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="size-2 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.title}</p>
                      <span className="text-xs text-muted-foreground">{t.dueDate}</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent text-accent-foreground">{t.category}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Para onde vai o orçamento (Dinâmico por Categoria) */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
          <h3 className="text-lg font-bold text-foreground font-display">Para onde vai o orçamento</h3>
          <div className="space-y-4 pt-1">
            {budgetEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Nenhum orçamento lançado ainda.</p>
            ) : (
              budgetEntries.map(([category, value]) => {
                const percentage = Math.min(Math.round((value / maxCategoryValue) * 100), 100);
                return (
                  <div key={category} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-foreground">{category}</span>
                      <span className="font-bold text-foreground">R$ {value.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-primary transition-all duration-500" 
                        style={{ width: `${percentage}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};