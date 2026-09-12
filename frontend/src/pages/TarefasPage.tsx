import React, { useState } from 'react';
import { Plus, CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { NewTaskDialog } from '../components/dialogs/NewTaskDialog';
import type { Task } from '../types';

export const TarefasPage: React.FC = () => {
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Definir lista final de padrinhos e madrinhas', category: 'Convidados', status: 'todo', dueDate: '20/04' },
    { id: '2', title: 'Reunião de alinhamento com a cerimonialista', category: 'Fornecedores', status: 'doing', dueDate: 'Hoje' },
    { id: '3', title: 'Assinar contrato do salão principal', category: 'Espaço', status: 'done', dueDate: 'Concluído' },
  ]);

  const handleAddTask = (newTask: Omit<Task, 'id'>) => {
    const taskWithId: Task = {
      ...newTask,
      id: Math.random().toString(36).substring(2, 9),
    };
    setTasks([...tasks, taskWithId]);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-foreground font-display">Quadro de Tarefas</h3>
          <p className="text-sm text-muted-foreground mt-1">Organize o fluxo de preparativos do casamento por etapas e prioridades.</p>
        </div>
        <button 
          onClick={() => setIsTaskOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus size={18} /> Nova Tarefa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Coluna A Fazer */}
        <div className="bg-muted/70 p-4 rounded-3xl border border-border space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-amber-500" />
              <h4 className="font-bold text-foreground text-sm">A Fazer</h4>
            </div>
            <span className="w-6 h-6 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-bold">
              {tasks.filter(t => t.status === 'todo').length}
            </span>
          </div>

          <div className="space-y-3">
            {tasks.filter(t => t.status === 'todo').map(task => (
              <div key={task.id} className="bg-card p-4 rounded-2xl border border-border shadow-sm space-y-2 cursor-pointer hover:border-ring transition-colors">
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 uppercase tracking-wider">{task.category}</span>
                <p className="text-sm font-semibold text-foreground">{task.title}</p>
                <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border">
                  <span>Vencimento: {task.dueDate}</span>
                  <span className="text-amber-600 font-medium">Média</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna Em Andamento */}
        <div className="bg-muted/70 p-4 rounded-3xl border border-border space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-500" />
              <h4 className="font-bold text-foreground text-sm">Em Andamento</h4>
            </div>
            <span className="w-6 h-6 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-bold">
              {tasks.filter(t => t.status === 'doing').length}
            </span>
          </div>

          <div className="space-y-3">
            {tasks.filter(t => t.status === 'doing').map(task => (
              <div key={task.id} className="bg-card p-4 rounded-2xl border border-border shadow-sm space-y-2 cursor-pointer hover:border-ring transition-colors">
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 uppercase tracking-wider">{task.category}</span>
                <p className="text-sm font-semibold text-foreground">{task.title}</p>
                <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border">
                  <span>Vencimento: {task.dueDate}</span>
                  <span className="text-rose-600 font-medium">Alta</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna Concluído */}
        <div className="bg-muted/70 p-4 rounded-3xl border border-border space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} className="text-emerald-500" />
              <h4 className="font-bold text-foreground text-sm">Concluído</h4>
            </div>
            <span className="w-6 h-6 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-bold">
              {tasks.filter(t => t.status === 'done').length}
            </span>
          </div>

          <div className="space-y-3">
            {tasks.filter(t => t.status === 'done').map(task => (
              <div key={task.id} className="bg-card p-4 rounded-2xl border border-border shadow-sm space-y-2 cursor-pointer opacity-75">
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 uppercase tracking-wider">{task.category}</span>
                <p className="text-sm font-semibold text-foreground line-through">{task.title}</p>
                <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border">
                  <span>Concluído</span>
                  <span className="text-emerald-600 font-medium">Feito</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <NewTaskDialog 
        isOpen={isTaskOpen}
        onClose={() => setIsTaskOpen(false)}
        onSave={handleAddTask}
      />
    </div>
  );
};