import React, { useState, useEffect } from 'react';
import { X, Users, Tag, Phone, Mail, DollarSign } from 'lucide-react';
import { api } from '../../services/api';
import type { Vendor } from '../../types';

interface NewVendorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendor: Omit<Vendor, 'id'>) => void;
}

export const NewVendorDialog: React.FC<NewVendorDialogProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(''); 
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState<'Contratado' | 'Orçamento' | 'Pesquisando'>('Orçamento');

  useEffect(() => {
    if (isOpen) {
      api.get('/api/categories')
        .then((res) => {
          const list: string[] = res.data || [];
          setCategories(list);
          setCategory((current) => current || list[0] || '');
        })
        .catch((err) => console.error('Erro ao carregar categorias:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
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
      <div className="bg-card rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-foreground font-display">Novo Fornecedor</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Nome da Empresa / Profissional</label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Boulevard Eventos" 
                className="w-full pl-11 pr-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="new-vendor-category" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Categoria</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <select 
                  id="new-vendor-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground cursor-pointer appearance-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-card text-foreground">{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Custo Estimado</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0,00" 
                  className="w-full pl-11 pr-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(47) 99999-9999" 
                  className="w-full pl-11 pr-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Status</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground cursor-pointer"
              >
                <option value="Orçamento" className="bg-card text-foreground">Orçamento</option>
                <option value="Contratado" className="bg-card text-foreground">Contratado</option>
                <option value="Pesquisando" className="bg-card text-foreground">Pesquisando</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@fornecedor.com" 
                className="w-full pl-11 pr-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3 justify-end">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all cursor-pointer"
            >
              Salvar Fornecedor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};