import React, { useState } from 'react';
import { X, Users, Phone, Mail, MapPin, DollarSign } from 'lucide-react';

interface NewVendorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendor: any) => void;
}

export const NewVendorDialog: React.FC<NewVendorDialogProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Espaço & Buffet');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState<'Contratado' | 'Orçamento' | 'Pesquisando'>('Orçamento');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: Math.random().toString(36).substring(2, 9),
      name,
      category,
      phone,
      email,
      cost: parseFloat(cost) || 0,
      status
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Novo Fornecedor</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nome da Empresa / Profissional</label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Boulevard Eventos" 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Categoria</label>
              <input 
                type="text" 
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Buffet" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Custo Estimado</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0,00" 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(47) 99999-9999" 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-rose-500"
              >
                <option value="Orçamento">Orçamento</option>
                <option value="Contratado">Contratado</option>
                <option value="Pesquisando">Pesquisando</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3 justify-end">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition-all"
            >
              Salvar Fornecedor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};