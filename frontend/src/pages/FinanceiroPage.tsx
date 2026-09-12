import React from 'react';
import { Plus, Search, Filter, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const FinanceiroPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-800">Controle Financeiro</h3>
          <p className="text-sm text-slate-500 mt-1">Gerencie despesas, custos e acompanhe o que falta pagar do casamento.</p>
        </div>
        <button className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all">
          <Plus size={18} /> Nova Despesa
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar despesa ou fornecedor..." 
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-2xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={16} /> Filtrar por Categoria
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Descrição</th>
                <th className="py-4 px-6">Categoria</th>
                <th className="py-4 px-6">Valor</th>
                <th className="py-4 px-6">Vencimento</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-800">Buffet Completo (Sinal)</td>
                <td className="py-4 px-6 text-slate-600">Espaço & Buffet</td>
                <td className="py-4 px-6 font-bold text-slate-900">R$ 5.000,00</td>
                <td className="py-4 px-6 text-slate-600">15/04/2026</td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                    <CheckCircle2 size={14} /> Pago
                  </span>
                </td>
                <td className="py-4 px-6 text-right font-medium text-slate-400 hover:text-slate-600 cursor-pointer">Editar</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-800">Fotografia e Filme</td>
                <td className="py-4 px-6 text-slate-600">Registro</td>
                <td className="py-4 px-6 font-bold text-slate-900">R$ 4.200,00</td>
                <td className="py-4 px-6 text-slate-600">28/05/2026</td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                    <Clock size={14} /> Pendente
                  </span>
                </td>
                <td className="py-4 px-6 text-right font-medium text-slate-400 hover:text-slate-600 cursor-pointer">Editar</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-800">Decoração da Cerimônia</td>
                <td className="py-4 px-6 text-slate-600">Decoração</td>
                <td className="py-4 px-6 font-bold text-slate-900">R$ 3.800,00</td>
                <td className="py-4 px-6 text-slate-600">10/06/2026</td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                    <AlertCircle size={14} /> Atrasado
                  </span>
                </td>
                <td className="py-4 px-6 text-right font-medium text-slate-400 hover:text-slate-600 cursor-pointer">Editar</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};