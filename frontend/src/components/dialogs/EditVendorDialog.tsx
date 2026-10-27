import React, { useState, useEffect } from 'react';
import { X, User, Tag, Phone, Mail, DollarSign } from 'lucide-react';
import { api } from '../../services/api';
import type { Vendor } from '../../types';

interface EditVendorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor | null;
  onSave: (updatedVendor: Vendor) => void;
}

const CATEGORIES = [
  'Local',
  'Buffet',
  'Fotografia e Vídeo',
  'Bolo e Doces',
  'Decoração e Flores',
  'Música e Animação',
  'Vestido e Beleza',
  'Cerimonial',
  'Outros'
];

export const EditVendorDialog: React.FC<EditVendorDialogProps> = ({ isOpen, onClose, vendor, onSave }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState<'Contratado' | 'Orçamento' | 'Pesquisando'>('Pesquisando');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vendor) {
      setName(vendor.name || '');
      setCategory(vendor.category || CATEGORIES[0]);
      setPhone(vendor.phone || '');
      setEmail(vendor.email || ''); 
      setCost(vendor.cost !== undefined ? vendor.cost.toString() : '');
      setStatus(vendor.status || 'Pesquisando');
    }
  }, [vendor]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    setLoading(true);
    try {
      const response = await api.patch(`/api/vendors/${vendor.id}`, {
        name,
        category,
        phone,
        email, // <-- Envia o e-mail para a API
        cost: parseFloat(cost) || 0,
        status,
      });

      onSave(response.data);
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-card rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-foreground font-display">Editar Fornecedor</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Nome do Fornecedor / Empresa</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Categoria</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Custo (R$)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="number" 
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@fornecedor.com"
                className="w-full pl-11 pr-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Status do Contrato</label>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground cursor-pointer"
            >
              <option value="Pesquisando">Pesquisando</option>
              <option value="Orçamento">Orçamento</option>
              <option value="Contratado">Contratado</option>
            </select>
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
              disabled={loading}
              className="px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};