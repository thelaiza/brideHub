import React, { useState } from 'react';
import { Plus, Search, Phone, Mail, MapPin, CheckCircle2, Clock } from 'lucide-react';
import { NewVendorDialog } from '../components/dialogs/NewVendorDialog';
import type { Vendor } from '../types';

export const FornecedoresPage: React.FC = () => {
  const [isVendorOpen, setIsVendorOpen] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([
    { id: '1', name: 'Boulevard Eventos', category: 'Espaço & Buffet', phone: '(47) 99888-1234', status: 'Contratado', cost: 28000 },
    { id: '2', name: 'Luz & Cena Filmes', category: 'Fotografia', phone: '(47) 99777-5678', status: 'Orçamento', cost: 4200 },
  ]);

  const handleAddVendor = (newVendor: Omit<Vendor, 'id'>) => {
    const vendorWithId: Vendor = {
      ...newVendor,
      id: Math.random().toString(36).substring(2, 9),
    };
    setVendors([...vendors, vendorWithId]);
  };

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
            placeholder="Buscar por nome do fornecedor ou categoria (ex: Buffet, Fotógrafo)..." 
            className="w-full pl-11 pr-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-ring transition-colors text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map((vendor) => (
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
                  <span>{vendor.phone || '(47) 99999-9999'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-muted-foreground" />
                  <span>contato@{vendor.name.toLowerCase().replace(/\s+/g, '')}.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-muted-foreground" />
                  <span>Joinville, SC</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{vendor.status === 'Contratado' ? 'Custo Total' : 'Custo Previsto'}</span>
              <span className="text-base font-bold text-foreground">R$ {vendor.cost.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        ))}
      </div>

      <NewVendorDialog 
        isOpen={isVendorOpen}
        onClose={() => setIsVendorOpen(false)}
        onSave={handleAddVendor}
      />
    </div>
  );
};