import React from 'react';
import { Plus, CheckSquare, Clock, AlertCircle } from 'lucide-react';

export const TarefasPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-800">Quadro de Tarefas</h3>
          <p className="text-sm text-slate-500 mt-1">Organize o fluxo de preparativos do casamento por etapas e prioridades.</p>
        </div>
        <button className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all">
          <Plus size={18} /> Nova Tarefa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="bg-slate-100/70 p-4 rounded-3xl border border-slate-200/60 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-amber-500" />
              <h4 className="font-bold text-slate-800 text-sm">A Fazer</h4>
            </div>
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">2</span>
          </div>

          <div className="space-y-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-2 cursor-pointer hover:border-rose-300 transition-colors">
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 uppercase tracking-wider">Convidados</span>
              <p className="text-sm font-semibold text-slate-800">Definir lista final de padrinhos e madrinhas</p>
              <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-100">
                <span>Vencimento: 20/04</span>
                <span className="text-amber-600 font-medium">Média</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-100/70 p-4 rounded-3xl border border-slate-200/60 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-500" />
              <h4 className="font-bold text-slate-800 text-sm">Em Andamento</h4>
            </div>
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">1</span>
          </div>

          <div className="space-y-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-2 cursor-pointer hover:border-rose-300 transition-colors">
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 uppercase tracking-wider">Fornecedores</span>
              <p className="text-sm font-semibold text-slate-800">Reunião de alinhamento com a cerimonialista</p>
              <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-100">
                <span>Vencimento: Hoje</span>
                <span className="text-rose-600 font-medium">Alta</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-100/70 p-4 rounded-3xl border border-slate-200/60 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} className="text-emerald-500" />
              <h4 className="font-bold text-slate-800 text-sm">Concluído</h4>
            </div>
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">1</span>
          </div>

          <div className="space-y-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-2 cursor-pointer opacity-75">
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 uppercase tracking-wider">Espaço</span>
              <p className="text-sm font-semibold text-slate-800 line-through">Assinar contrato do salão principal</p>
              <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-100">
                <span>Concluído</span>
                <span className="text-emerald-600 font-medium">Feito</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};