import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Clock, AlertCircle, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { NewTaskDialog } from '../components/dialogs/NewTaskDialog';
import { EditTaskDialog } from '../components/dialogs/EditTaskDialog';
import type { Task } from '../types';

export const TarefasPage: React.FC = () => {
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Definir lista final de padrinhos e madrinhas', category: 'Papelaria', status: 'todo', dueDate: '20/04' },
    { id: '2', title: 'Reunião de alinhamento com a cerimonialista', category: 'Cerimonial', status: 'doing', dueDate: 'Hoje' },
    { id: '3', title: 'Assinar contrato do salão principal', category: 'Local', status: 'done', dueDate: 'Concluído' },
  ]);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleAddTask = (newTask: Omit<Task, 'id'>) => {
    const taskWithId: Task = {
      ...newTask,
      id: Math.random().toString(36).substring(2, 9),
    };
    setTasks([...tasks, taskWithId]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    setEditingTask(null);
  };

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(tasks.filter(t => t.id !== id));
    setActiveMenuId(null);
  };

  const renderTaskCard = (task: Task) => {
    const isMenuOpen = activeMenuId === task.id;

    return (
      <div key={task.id} className="bg-card p-4 rounded-2xl border border-border shadow-sm space-y-2 relative hover:border-ring transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
            {task.category}
          </span>

          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(isMenuOpen ? null : task.id);
              }}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <MoreVertical size={16} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-7 w-36 bg-card border border-border rounded-xl shadow-xl z-20 py-1.5 animate-fade-in">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTask(task);
                    setActiveMenuId(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer text-left"
                >
                  <Edit2 size={14} className="text-muted-foreground" />
                  Editar tarefa
                </button>
                <button
                  onClick={(e) => handleDeleteTask(task.id, e)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                >
                  <Trash2 size={14} />
                  Excluir tarefa
                </button>
              </div>
            )}
          </div>
        </div>

        <p className={`text-sm font-semibold text-foreground ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
          {task.title}
        </p>

        <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border">
          <span>Vencimento: {task.dueDate}</span>
          <span className={task.status === 'done' ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
            {task.status === 'done' ? 'Feito' : 'Pendente'}
          </span>
        </div>
      </div>
    );
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
            {tasks.filter(t => t.status === 'todo').map(renderTaskCard)}
          </div>
        </div>

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
            {tasks.filter(t => t.status === 'doing').map(renderTaskCard)}
          </div>
        </div>

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
            {tasks.filter(t => t.status === 'done').map(renderTaskCard)}
          </div>
        </div>
      </div>

      <NewTaskDialog 
        isOpen={isTaskOpen}
        onClose={() => setIsTaskOpen(false)}
        onSave={handleAddTask}
      />

      <EditTaskDialog 
        isOpen={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleUpdateTask}
      />
    </div>
  );
};