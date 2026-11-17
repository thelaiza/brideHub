import React, { useState, useEffect } from 'react';
import { Plus, Upload, Search, Pencil, Trash2, Mail, Phone, Check, X, Clock } from 'lucide-react';
import { NewGuestDialog } from '../components/dialogs/NewGuestDialog';
import { EditGuestDialog } from '../components/dialogs/EditGuestDialog';
import { ImportGuestsDialog } from '../components/dialogs/ImportGuestsDialog';
import type { Guest, GuestGroup, GuestStatus } from '../types';
import { api } from '../services/api';

const GUEST_GROUPS: GuestGroup[] = ['Família da noiva', 'Família do noivo', 'Amigos', 'Padrinhos', 'Fornecedores'];

const statusMeta: Record<GuestStatus, { label: string; icon: typeof Check; cls: string }> = {
  Confirmado: { label: "Confirmado", icon: Check, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Pendente: { label: "Pendente", icon: Clock, cls: "bg-amber-50 text-amber-700 border-amber-200" },
  Negado: { label: "Não vai", icon: X, cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

export const ConvidadosPage: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<"Todos" | GuestGroup>("Todos");
  const [selectedStatus, setSelectedStatus] = useState<"Todos" | GuestStatus>("Todos");
  
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchGuests = async () => {
    try {
      const response = await api.get('/api/guests');
      setGuests(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar convidados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchGuests();
  }, []);

  const total = guests.length;
  const count = (s: GuestStatus) => guests.filter((g) => g.status === s).length;
  const conf = count("Confirmado"), pend = count("Pendente"), neg = count("Negado");
  const pct = (n: number) => (total ? (n / total) * 100 : 0);

  const filteredGuests = guests.filter((g) => {
    const q = searchTerm.toLowerCase();
    const matchesGroup = selectedGroup === "Todos" || g.group === selectedGroup;
    const matchesStatus = selectedStatus === "Todos" || g.status === selectedStatus;
    const matchesSearch = !q || g.name.toLowerCase().includes(q) || (g.email?.toLowerCase() ?? "").includes(q) || (g.phone ?? "").includes(q);    
    return matchesGroup && matchesStatus && matchesSearch;
  });

  const handleAddGuest = async (newGuest: Omit<Guest, "id">): Promise<void> => {
    try {
      const response = await api.post('/api/guests', newGuest);
      setGuests([response.data, ...guests]);
      setIsNewOpen(false);
    } catch (error) {
      console.error('Erro ao criar convidado:', error);
    }
  };

  const handleUpdateGuest = async (updatedGuest: Guest) => {
    try {
      const response = await api.patch(`/api/guests/${updatedGuest.id}`, updatedGuest);
      setGuests(guests.map((g) => (g.id === updatedGuest.id ? response.data : g)));
      setEditingGuest(null);
    } catch (error) {
      console.error('Erro ao atualizar convidado:', error);
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: GuestStatus) => {
    try {
      const response = await api.patch(`/api/guests/${id}`, { status: newStatus });
      setGuests(guests.map((g) => (g.id === id ? response.data : g)));
    } catch (error) {
      console.error('Erro ao atualizar status do convidado:', error);
    }
  };

  const handleDeleteGuest = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja remover este convidado?")) return;
    try {
      await api.delete(`/api/guests/${id}`);
      setGuests(guests.filter((g) => g.id !== id));
    } catch (error) {
      console.error('Erro ao deletar convidado:', error);
    }
  };

  const handleImportSuccess = async (message: string) => {
    setNotice(message);
    await fetchGuests();
    setTimeout(() => setNotice(null), 5000);
  };

  const renderContent = () => {
    if (loading) {
      return <div className="p-12 text-center text-muted-foreground">Carregando convidados...</div>;
    }

    if (filteredGuests.length === 0) {
      return <div className="p-12 text-center text-muted-foreground">Nenhum convidado encontrado.</div>;
    }

    return (
      <ul className="divide-y divide-border">
        {filteredGuests.map((g) => (
          <li key={g.id} className="grid grid-cols-1 md:grid-cols-[2fr_1.3fr_1.8fr_auto_auto] gap-x-4 gap-y-3 items-center px-6 py-4 hover:bg-muted/20 transition">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="size-10 shrink-0 rounded-2xl bg-primary/10 grid place-items-center font-display text-sm font-bold text-primary">
                {g.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-foreground truncate">{g.name}</div>
                <div className="text-xs text-muted-foreground md:hidden mt-0.5">{g.group}</div>
              </div>
            </div>

            <div className="hidden md:block text-sm text-foreground/80 font-medium">{g.group}</div>

            <div className="hidden md:block text-xs text-muted-foreground space-y-1 min-w-0">
              {g.email && <div className="flex items-center gap-1.5 truncate"><Mail size={12} className="text-muted-foreground shrink-0" />{g.email}</div>}
              {g.phone && <div className="flex items-center gap-1.5"><Phone size={12} className="text-muted-foreground shrink-0" />{g.phone}</div>}
              {!g.email && !g.phone && <span className="text-muted-foreground">—</span>}
            </div>

            <div className="flex items-center gap-1.5">
              {(["Confirmado", "Pendente", "Negado"] as const).map((s) => {
                const M = statusMeta[s];
                const Icon = M.icon;
                const on = g.status === s;
                return (
                  <button 
                    key={s} 
                    title={M.label} 
                    onClick={() => handleQuickStatusChange(g.id, s)}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition cursor-pointer ${on ? M.cls + " shadow-sm" : "border-transparent text-muted-foreground hover:bg-muted"}`}
                  >
                    <Icon size={12} />
                    {on && M.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-1">
              <button 
                onClick={() => setEditingGuest(g)} 
                className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-muted transition-colors cursor-pointer"
                title="Editar convidado"
              >
                <Pencil size={16} />
              </button>
              <button 
                onClick={() => handleDeleteGuest(g.id)} 
                className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-muted transition-colors cursor-pointer"
                title="Remover convidado"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-foreground font-display">Convidados</h3>
          <p className="text-sm text-muted-foreground mt-1">Confirmação de presença e controle da lista de convidados (RSVP).</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsImportOpen(true)} 
            className="border border-border bg-card hover:bg-muted font-semibold px-4 py-2.5 rounded-2xl shadow-sm flex items-center gap-2 transition-all cursor-pointer text-sm"
          >
            <Upload size={16} /> Importar planilha
          </button>
          <button 
            onClick={() => setIsNewOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-all cursor-pointer text-sm"
          >
            <Plus size={18} /> Novo Convidado
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-2xl border border-border bg-muted/60 px-4 py-3 text-sm text-foreground">{notice}</div>
      )}

      <section className="bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">Confirmação de Presença</span>
            <div className="font-display text-3xl sm:text-4xl mt-1 text-foreground">
              {conf}<span className="text-muted-foreground text-xl"> / {total} convidados</span>
            </div>
          </div>
        </div>

        <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct(conf)}%` }} />
          <div className="h-full bg-amber-400 transition-all" style={{ width: `${pct(pend)}%` }} />
          <div className="h-full bg-rose-400 transition-all" style={{ width: `${pct(neg)}%` }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {(["Confirmado", "Pendente", "Negado"] as const).map((s) => {
            const M = statusMeta[s];
            const Icon = M.icon;
            const n = count(s);
            const active = selectedStatus === s;
            return (
              <button 
                key={s} 
                onClick={() => setSelectedStatus(active ? "Todos" : s)} 
                className={`text-left rounded-2xl border p-4 transition cursor-pointer ${active ? M.cls + " ring-2 ring-ring/30" : "border-border bg-muted/30 hover:bg-muted/60"}`}
              >
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Icon size={14} /> {s === 'Negado' ? 'Não comparecerão' : s + 's'}
                </div>
                <div className="font-display text-2xl sm:text-3xl mt-1 tabular-nums text-foreground">{n}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{Math.round(pct(n))}% do total</div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="bg-card p-4 rounded-3xl border border-border shadow-sm flex flex-col gap-4">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Buscar por nome, e-mail, telefone..." 
            className="w-full pl-11 pr-4 py-2.5 bg-muted/55 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring transition-colors text-foreground"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
          {(["Todos", ...GUEST_GROUPS] as const).map((g) => {
            const n = g === "Todos" ? total : guests.filter((x) => x.group === g).length;
            const active = selectedGroup === g;
            return (
              <button 
                key={g} 
                onClick={() => setSelectedGroup(g)} 
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${active ? "bg-foreground text-background border-foreground shadow-sm" : "bg-muted/40 border-border text-foreground/70 hover:bg-muted"}`}
              >
                {g} <span className="opacity-60 ml-1">({n})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1.3fr_1.8fr_auto_auto] gap-4 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/40">
          <div>Convidado</div>
          <div>Grupo</div>
          <div>Contato</div>
          <div>Presença (RSVP)</div>
          <div className="w-16" />
        </div>

        {renderContent()}
      </div>

      <NewGuestDialog 
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        onSave={handleAddGuest}
      />

      <EditGuestDialog 
        isOpen={!!editingGuest}
        onClose={() => setEditingGuest(null)}
        guest={editingGuest}
        onSave={handleUpdateGuest}
      />

      <ImportGuestsDialog 
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};