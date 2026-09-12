import React, { useState } from 'react';
import { X, Calendar, Heart, MapPin, DollarSign } from 'lucide-react';

interface EditWeddingDialogProps {
  children: React.ReactNode;
  onSave?: (data: any) => void;
}

export const EditWeddingDialog: React.FC<EditWeddingDialogProps> = ({ children, onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [bride, setBride] = useState('Laíza');
  const [groom, setGroom] = useState('Noivo');
  const [date, setDate] = useState('2026-10-04');
  const [venue, setVenue] = useState('Joinville, SC');
  const [budget, setBudget] = useState('55000');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave({ bride, groom, date, venue, budget: parseFloat(budget) || 0 });
    }
    setIsOpen(false);
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
        {children}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Editar Dados do Casamento</h3>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Noiva</label>
                  <div className="relative">
                    <Heart className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      required
                      value={bride}
                      onChange={(e) => setBride(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:border-rose-500 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Noivo</label>
                  <div className="relative">
                    <Heart className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      required
                      value={groom}
                      onChange={(e) => setGroom(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:border-rose-500 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Data do Casamento</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:border-rose-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Local / Cidade</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:border-rose-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Orçamento Total (R$)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:border-rose-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};