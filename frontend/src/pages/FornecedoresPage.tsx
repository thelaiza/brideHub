import React from 'react';
import { Plus, Search, Phone, Mail, MapPin, CheckCircle2, Clock } from 'lucide-react';

export const FornecedoresPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-800">Gestão de Fornecedores</h3>
          <p className="text-sm text-slate-500 mt-1">Acompanhe contratos, orçamentos e meios de contato dos parceiros do casamento.</p>
        </div>
        <button className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all">
          <Plus size={18} /> Novo Fornecedor
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome do fornecedor ou categoria (ex: Buffet, Fotógrafo)..." 
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start gap-2 mb-3">
              <div>
                <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Espaço & Buffet</span>
                <h4 className="text-lg font-bold text-slate-900 mt-0.5">Boulevard Eventos</h4>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={12} /> Contratado
              </span>
            </div>
            
            <div className="space-y-2 mt-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400" />
                <span>(47) 99888-1234</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-slate-400" />
                <span>contato@boulevard.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" />
                <span>Joinville, SC</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Custo Total</span>
            <span className="text-base font-bold text-slate-900">R$ 18.000,00</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start gap-2 mb-3">
              <div>
                <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Fotografia</span>
                <h4 className="text-lg font-bold text-slate-900 mt-0.5">Luz & Cena Filmes</h4>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                <Clock size={12} /> Orçamento
              </span>
            </div>
            
            <div className="space-y-2 mt-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400" />
                <span>(47) 99777-5678</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-slate-400" />
                <span>orcamento@luzcena.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" />
                <span>Joinville, SC</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Custo Previsto</span>
            <span className="text-base font-bold text-slate-900">R$ 4.200,00</span>
          </div>
        </div>
      </div>
    </div>
  );
};