import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, Mail, MapPin, CheckCircle2, Clock, Trash2, Pencil } from 'lucide-react';
import { NewVendorDialog } from '../components/dialogs/NewVendorDialog';
import { EditVendorDialog } from '../components/dialogs/EditVendorDialog';
import type { Vendor } from '../types';
import { api } from '../services/api';

export const FornecedoresPage: React.FC = () => {
  const [isVendorOpen, setIsVendorOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVendors = async () => {
    try {
      const response = await api.get('/api/vendors');
      setVendors(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleAddVendor = async (newVendor: Omit<Vendor, 'id'>) => {
    try {
      const response = await api.post('/api/vendors', {
        name: newVendor.name,
        category: newVendor.category,
        phone: newVendor.phone,
        email: newVendor.email, 
        status: newVendor.status,
        cost: Number(newVendor.cost || 0),
      });

      setVendors([response.data, ...vendors]);
      setIsVendorOpen(false);
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
    }
  };

  const handleUpdateVendor = (updatedVendor: Vendor) => {
    setVendors(vendors.map(v => v.id === updatedVendor.id ? updatedVendor : v));
  };

  const handleDeleteVendor = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este fornecedor?')) return;
    try {
      await api.delete(`/api/vendors/${id}`);
      setVendors(vendors.filter(v => v.id !== id));
    } catch (error) {
      console.error('Erro ao deletar fornecedor:', error);
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    return vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           vendor.category.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-foreground font-display">Gestão de Fornecedores</h3>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe contratos, orçamentos e meios de contato dos parceiros do casamento.</p>
        </div>
        <button 
          onClick={() => setIsVendorOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus size={18} /> Novo Fornecedor
        </button>
      </div>

      <div className="bg-card p-4 rounded-3xl border border-border shadow-sm flex items-center gap-4">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome do fornecedor ou categoria (ex: Buffet, Fotógrafo)..." 
            className="w-full pl-11 pr-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring transition-colors text-foreground"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Carregando fornecedores...</div>
      ) : filteredVendors.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">Nenhum fornecedor encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <div key={vendor.id} className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">{vendor.category}</span>
                    <h4 className="text-lg font-bold text-foreground mt-0.5">{vendor.name}</h4>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    vendor.status === 'Contratado' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {vendor.status === 'Contratado' ? <CheckCircle2 size={12} /> : <Clock size={12} />} {vendor.status}
                  </span>
                </div>
                
                <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-muted-foreground" />
                    <span>{vendor.phone || 'Não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-muted-foreground" />
                    <span>{vendor.email || 'E-mail não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-muted-foreground" />
                    <span>Joinville, SC</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground block">{vendor.status === 'Contratado' ? 'Custo Total' : 'Custo Previsto'}</span>
                  <span className="text-base font-bold text-foreground">R$ {Number(vendor.cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setEditingVendor(vendor)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-muted transition-colors cursor-pointer"
                    title="Editar fornecedor"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteVendor(vendor.id)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-muted transition-colors cursor-pointer"
                    title="Excluir fornecedor"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewVendorDialog 
        isOpen={isVendorOpen}
        onClose={() => setIsVendorOpen(false)}
        onSave={handleAddVendor}
      />

      <EditVendorDialog 
        isOpen={!!editingVendor}
        onClose={() => setEditingVendor(null)}
        vendor={editingVendor}
        onSave={handleUpdateVendor}
      />
    </div>
  );
};