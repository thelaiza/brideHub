import React, { useState, useEffect } from 'react';
import { Plus, Armchair, Users, UserPlus, Trash2, X } from 'lucide-react';
import { NewTableDialog } from '../components/dialogs/NewTableDialog';
import { AddGuestToTableDialog } from '../components/dialogs/AddGuestToTableDialog';
import type { Guest, WeddingTable } from '../types';
import { api } from '../services/api';

export const MesasPage: React.FC = () => {
  const [tables, setTables] = useState<WeddingTable[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewTableOpen, setIsNewTableOpen] = useState(false);
  const [selectedTableForGuest, setSelectedTableForGuest] = useState<WeddingTable | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setTimeout(() => setAlertMessage(null), 5000);
  };

  const fetchData = async () => {
    try {
      const [tablesRes, guestsRes] = await Promise.all([
        api.get('/api/tables'),
        api.get('/api/guests'),
      ]);
      setTables(tablesRes.data || []);
      setGuests(guestsRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar mapa de mesas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const unseatedGuests = guests.filter((g) => !g.tableId && !g.table);
  const seatedCount = guests.length - unseatedGuests.length;

  const handleCreateTable = async (name: string) => {
    const response = await api.post('/api/tables', { name });
    setTables((prev) => [...prev, response.data]);
  };

  const handleDeleteTable = async (table: WeddingTable) => {
    if (!window.confirm(`Tem certeza que deseja excluir a "${table.name}"? Os convidados dela voltarão para "Sem mesa".`)) {
      return;
    }

    try {
      await api.delete(`/api/tables/${table.id}`);
      setTables((prev) => prev.filter((t) => t.id !== table.id));
      setGuests((prev) =>
        prev.map((g) => (g.tableId === table.id ? { ...g, tableId: null, table: null } : g))
      );
    } catch (error: any) {
      console.error('Erro ao excluir mesa:', error);
      showAlert(error?.response?.data?.error || 'Erro ao excluir mesa.');
    }
  };

  const handleAssignGuest = async (tableId: string, guestId: string) => {
    const response = await api.post(`/api/tables/${tableId}/guests`, { guestId });
    const updatedGuest: Guest = response.data;

    setGuests((prev) => prev.map((g) => (g.id === guestId ? updatedGuest : g)));
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? { ...t, guests: [...t.guests, updatedGuest] }
          : t
      )
    );
  };

  const handleRemoveGuestFromTable = async (tableId: string, guestId: string) => {
    try {
      const response = await api.delete(`/api/tables/${tableId}/guests/${guestId}`);
      const updatedGuest: Guest = response.data;

      setGuests((prev) => prev.map((g) => (g.id === guestId ? updatedGuest : g)));
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? { ...t, guests: t.guests.filter((g) => g.id !== guestId) }
            : t
        )
      );
    } catch (error: any) {
      console.error('Erro ao remover convidado da mesa:', error);
      showAlert(error?.response?.data?.error || 'Erro ao remover convidado da mesa.');
    }
  };

  const renderTablesContent = () => {
    if (loading) {
      return <div className="py-12 text-center text-muted-foreground">Carregando mesas...</div>;
    }

    if (tables.length === 0) {
      return (
        <div className="bg-card rounded-3xl border border-border shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4">
            <Armchair size={22} />
          </div>
          <h4 className="text-xl font-bold text-foreground font-display">Comece o mapa de mesas</h4>
          <p className="text-sm text-muted-foreground max-w-md mt-2">
            Crie sua primeira mesa e depois escolha os convidados cadastrados que ficarão nela. Não há limite de pessoas por mesa.
          </p>
          <button
            onClick={() => setIsNewTableOpen(true)}
            className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-2.5 rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-all cursor-pointer text-sm"
          >
            <Plus size={16} /> Criar primeira mesa
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            Cada convidado pode participar de apenas uma mesa.
          </span>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
            Sem limite de lugares
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <div
              key={table.id}
              className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-5"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-primary/10 text-primary grid place-items-center shrink-0">
                      <Armchair size={18} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground">{table.name}</h4>
                      <span className="text-xs text-muted-foreground">
                        {table.guests.length}{' '}
                        {table.guests.length === 1 ? 'convidado' : 'convidados'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => void handleDeleteTable(table)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-muted transition-colors cursor-pointer"
                    title="Excluir mesa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {table.guests.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
                    <Users size={20} className="mx-auto text-muted-foreground mb-1.5" />
                    <div className="text-xs font-semibold text-foreground">Mesa vazia</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Adicione o primeiro convidado
                    </div>
                  </div>
                ) : (
                  <ul className="mt-5 space-y-2">
                    {table.guests.map((guest) => (
                      <li
                        key={guest.id}
                        className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-muted/40 border border-border/60"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">
                            {guest.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {guest.group}
                          </div>
                        </div>
                        <button
                          onClick={() => void handleRemoveGuestFromTable(table.id, guest.id)}
                          title={`Remover ${guest.name} da ${table.name}`}
                          className="p-1.5 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-muted transition-colors cursor-pointer shrink-0"
                        >
                          <X size={15} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                onClick={() => setSelectedTableForGuest(table)}
                className="w-full py-2.5 px-4 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <UserPlus size={15} /> Adicionar convidado
              </button>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-foreground font-display">Mesas</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Monte o mapa de assentos e saiba exatamente onde cada convidado ficará.
          </p>
        </div>
        <button
          onClick={() => setIsNewTableOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-all cursor-pointer text-sm"
        >
          <Plus size={18} /> Nova mesa
        </button>
      </div>

      {alertMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {alertMessage}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card p-5 rounded-3xl border border-border shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Armchair size={14} /> Mesas
          </div>
          <div className="font-display text-3xl mt-2 tabular-nums text-foreground">
            {tables.length}
          </div>
        </div>

        <div className="bg-card p-5 rounded-3xl border border-border shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Users size={14} /> Alocados
          </div>
          <div className="font-display text-3xl mt-2 tabular-nums text-foreground">
            {seatedCount}
          </div>
        </div>

        <div className="bg-card p-5 rounded-3xl border border-border shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <UserPlus size={14} /> Sem mesa
          </div>
          <div className="font-display text-3xl mt-2 tabular-nums text-foreground">
            {unseatedGuests.length}
          </div>
        </div>
      </section>

      {renderTablesContent()}

      {!loading && guests.length > 0 && (
        <section className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-base font-bold text-foreground font-display">
              Convidados sem mesa
            </h4>
            <span className="text-xs text-muted-foreground">
              Retire alguém de uma mesa para mover essa pessoa.
            </span>
          </div>

          {unseatedGuests.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Todos os convidados cadastrados já estão alocados em uma mesa.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {unseatedGuests.map((guest) => (
                <span
                  key={guest.id}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-muted/50 border border-border text-xs text-foreground"
                >
                  <span className="font-semibold">{guest.name}</span>
                  <span className="text-muted-foreground">· {guest.group}</span>
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      <NewTableDialog
        isOpen={isNewTableOpen}
        onClose={() => setIsNewTableOpen(false)}
        onSave={handleCreateTable}
        defaultName={`Mesa ${tables.length + 1}`}
      />

      <AddGuestToTableDialog
        isOpen={!!selectedTableForGuest}
        onClose={() => setSelectedTableForGuest(null)}
        table={selectedTableForGuest}
        availableGuests={unseatedGuests}
        onAssign={handleAssignGuest}
      />
    </div>
  );
};