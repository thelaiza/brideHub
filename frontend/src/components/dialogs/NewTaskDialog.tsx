import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Calendar, Tag, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import type { Task } from '../../types';

interface NewTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id'>) => void;
}

export const NewTaskDialog: React.FC<NewTaskDialogProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [priority, setPriority] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.get('/api/categories')
        .then((res) => {
          const list = res.data || [];
          setCategories(list);
          if (list.length > 0 && !category) {
            setCategory(list[0]);
          }
        })
        .catch((err) => console.error('Erro ao carregar categorias:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      category,
      dueDate,
      status: 'todo'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Nova Tarefa</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Título da Tarefa</label>
            <div className="relative">
              <CheckSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Definir paleta de cores" 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-rose-500 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Categoria</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-rose-500 appearance-none text-slate-800 cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-white text-slate-800">{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Prioridade</label>
              <div className="relative">
                <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-rose-500 appearance-none text-slate-800 cursor-pointer"
                >
                  <option value="Baixa" className="bg-white text-slate-800">Baixa</option>
                  <option value="Média" className="bg-white text-slate-800">Média</option>
                  <option value="Alta" className="bg-white text-slate-800">Alta</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Vencimento</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="date" 
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-rose-500 text-slate-800"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3 justify-end">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
            >
              Adicionar Tarefa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};