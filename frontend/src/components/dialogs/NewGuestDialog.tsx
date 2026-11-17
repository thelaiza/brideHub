import React, { useState } from 'react';
import type { Guest, GuestGroup, GuestStatus } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (guest: Omit<Guest, 'id'>) => Promise<void> | void; 
}

const GUEST_GROUPS: GuestGroup[] = ['Família da noiva', 'Família do noivo', 'Amigos', 'Padrinhos', 'Fornecedores'];

export const NewGuestDialog: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [group, setGroup] = useState<GuestGroup>('Amigos');
  const [status, setStatus] = useState<GuestStatus>('Pendente');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    
    try {
      setSubmitting(true);
      await onSave({ 
        name: name.trim(), 
        group, 
        status, 
        email: email.trim() || '', 
        phone: phone.trim() || '' 
      });
      setName('');
      setGroup('Amigos');
      setStatus('Pendente');
      setEmail('');
      setPhone('');
    } catch (error) {
      console.error('Erro ao salvar convidado no dialog:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card w-full max-w-lg p-6 rounded-3xl border border-border shadow-xl space-y-6">
        <h3 className="text-xl font-bold font-display text-foreground">Novo Convidado</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-guest-name" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Nome</label>
            <input 
              id="new-guest-name"
              type="text" 
              required 
              maxLength={80}
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo do convidado"
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="new-guest-group" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Grupo</label>
              <select 
                id="new-guest-group"
                value={group} 
                onChange={(e) => setGroup(e.target.value as GuestGroup)}
                className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground"
              >
                {GUEST_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="new-guest-status" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status (RSVP)</label>
              <select 
                id="new-guest-status"
                value={status} 
                onChange={(e) => setStatus(e.target.value as GuestStatus)}
                className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground"
              >
                <option value="Pendente">Pendente</option>
                <option value="Confirmado">Confirmado</option>
                <option value="Negado">Negado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="new-guest-email" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">E-mail</label>
              <input 
                id="new-guest-email"
                type="email" 
                maxLength={120}
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground"
              />
            </div>
            <div>
              <label htmlFor="new-guest-phone" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Telefone / WhatsApp</label>
              <input 
                id="new-guest-phone"
                type="text" 
                maxLength={30}
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring text-foreground"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button 
              type="button" 
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-2xl text-sm font-semibold border border-border text-foreground hover:bg-muted transition cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};