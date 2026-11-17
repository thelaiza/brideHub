import React, { useRef, useState } from 'react';
import { Upload, Download, X } from 'lucide-react';
import type { Guest, GuestGroup, GuestStatus } from '../../types';
import { api } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (message: string) => void;
}

function normalizeGroup(v: string): GuestGroup {
  const s = v.toLowerCase();
  if (s.includes("noiva")) return "Família da noiva";
  if (s.includes("noivo")) return "Família do noivo";
  if (s.includes("padrinho") || s.includes("madrinha")) return "Padrinhos";
  if (s.includes("fornec")) return "Fornecedores";
  return "Amigos";
}

function normalizeStatus(v: string): GuestStatus {
  const s = v.toLowerCase();
  if (s.startsWith("conf") || s === "sim") return "Confirmado";
  if (s.startsWith("neg") || s.startsWith("não") || s.startsWith("nao")) return "Negado";
  return "Pendente";
}

function parseCsv(text: string): Omit<Guest, "id">[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const cells = (l: string) => l.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
  const header = cells(lines[0]).map((h) => h.toLowerCase());
  const hasHeader = header.some((h) => ["nome", "name"].includes(h));
  const idx = (keys: string[], fb: number) => {
    const i = header.findIndex((h) => keys.some((k) => h.includes(k)));
    return hasHeader ? i : fb;
  };
  const iName = idx(["nome", "name"], 0), iGroup = idx(["grupo", "group"], 1), iStatus = idx(["status"], 2),
    iEmail = idx(["mail"], 3), iPhone = idx(["telefone", "phone", "celular"], 4);
  return (hasHeader ? lines.slice(1) : lines)
    .map(cells)
    .filter((c) => c[iName])
    .map((c) => ({
      name: c[iName].slice(0, 80),
      group: normalizeGroup(iGroup >= 0 ? c[iGroup] ?? "" : ""),
      status: normalizeStatus(iStatus >= 0 ? c[iStatus] ?? "" : ""),
      email: iEmail >= 0 ? (c[iEmail] ?? "").slice(0, 120) : "",
      phone: iPhone >= 0 ? (c[iPhone] ?? "").slice(0, 30) : "",
    }));
}

function downloadTemplate() {
  const csv = "nome;grupo;status;email;telefone\nMaria Exemplo;Família da noiva;Pendente;maria@email.com;(47) 99999-0000\n";
  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = "modelo-convidados.csv"; a.click();
  URL.revokeObjectURL(url);
}

export const ImportGuestsDialog: React.FC<Props> = ({ isOpen, onClose, onImportSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      setSubmitting(true);
      const list = parseCsv(await file.text());
      if (list.length > 0) {
        const response = await api.post('/api/guests/import', { guests: list });
        onImportSuccess(response.data?.message || `${list.length} convidado(s) importado(s) com sucesso de "${file.name}".`);
        onClose();
      } else {
        alert("Nenhum convidado encontrado na planilha. Verifique o modelo CSV.");
      }
    } catch (error: any) {
      console.error('Erro ao importar planilha:', error);
      alert(error.response?.data?.error || "Erro ao processar o arquivo CSV.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card w-full max-w-md p-6 rounded-3xl border border-border shadow-xl space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold font-display text-foreground">Importar Convidados</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 text-sm text-muted-foreground">
          <p>Faça o upload de uma planilha em formato CSV contendo os dados dos convidados seguindo o modelo padrão.</p>
          
          <button 
            onClick={downloadTemplate} 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            <Download size={14} /> Baixar modelo de planilha CSV
          </button>
        </div>

        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />

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
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={submitting}
            className="px-5 py-2.5 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Upload size={16} /> {submitting ? 'Importando...' : 'Selecionar arquivo CSV'}
          </button>
        </div>
      </div>
    </div>
  );
};