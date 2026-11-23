import React, { useRef, useState } from 'react';
import { Upload, Download, X } from 'lucide-react';
import readXlsxFile from 'read-excel-file';
import type { GuestGroup, GuestStatus } from '../../types';
import { api } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (message: string) => void;
}

interface ParsedGuest {
  line: number;
  name: string;
  group: GuestGroup;
  status: GuestStatus;
  email: string | null;
  phone: string | null;
}

const MAX_ERRORS_SHOWN = 5;

const clean = (v: unknown): string =>
  (v === null || v === undefined ? '' : String(v))
    .replaceAll('\u0000', '')
    .replace(/\s+/g, ' ')
    .normalize('NFC')
    .trim();

const key = (v: string): string =>
  v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function normalizeGroup(v: string): GuestGroup | null {
  const k = key(v);

  if (k === key('Família da noiva')) return 'Família da noiva';
  if (k === key('Família do noivo')) return 'Família do noivo';
  if (k === key('Padrinhos')) return 'Padrinhos';
  if (k === key('Fornecedores')) return 'Fornecedores';
  if (k === key('Amigos')) return 'Amigos';

  if (k.includes('padrinho') || k.includes('madrinha')) return 'Padrinhos';
  if (k.includes('fornec')) return 'Fornecedores';
  if (k.includes('noiva')) return 'Família da noiva';
  if (k.includes('noivo')) return 'Família do noivo';
  if (k.includes('amig')) return 'Amigos';

  return null;
}

function normalizeStatus(v: string): GuestStatus | null {
  const k = key(v);
  if (k === key('Confirmado') || k.startsWith('conf') || k === 'sim') return 'Confirmado';
  if (k === key('Negado') || k.startsWith('neg') || k.startsWith('nao')) return 'Negado';
  if (k === key('Pendente') || k.startsWith('pend')) return 'Pendente';
  return null;
}

const formatErrors = (errors: string[]): string => {
  const shown = errors.slice(0, MAX_ERRORS_SHOWN).join('\n');
  const rest = errors.length - MAX_ERRORS_SHOWN;
  return rest > 0 ? `${shown}\n... e mais ${rest} erro(s).` : shown;
};

interface CsvParserState {
  rows: string[][];
  row: string[];
  cell: string;
  inQuotes: boolean;
}

function handleQuoteChar(state: CsvParserState, text: string, i: number): number {
  if (text[i + 1] === '"') {
    state.cell += '"';
    return i + 1;
  }
  state.inQuotes = false;
  return i;
}

function handleSeparatorChar(state: CsvParserState): void {
  state.row.push(state.cell);
  state.cell = '';
}

function handleNewLineChar(state: CsvParserState, text: string, i: number): number {
  state.row.push(state.cell);
  state.rows.push(state.row);
  state.row = [];
  state.cell = '';
  return text[i] === '\r' && text[i + 1] === '\n' ? i + 1 : i;
}

function parseCsvRows(text: string, sep: string): string[][] {
  const state: CsvParserState = { rows: [], row: [], cell: '', inQuotes: false };
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (state.inQuotes) {
      if (ch === '"') {
        i = handleQuoteChar(state, text, i);
      } else {
        state.cell += ch;
      }
    } else if (ch === '"') {
      state.inQuotes = true;
    } else if (ch === sep) {
      handleSeparatorChar(state);
    } else if (ch === '\n' || ch === '\r') {
      i = handleNewLineChar(state, text, i);
    } else {
      state.cell += ch;
    }
    i++;
  }

  state.row.push(state.cell);
  state.rows.push(state.row);
  return state.rows;
}

async function readRows(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
    throw new Error('Formato .xls antigo não é suportado. Salve como .xlsx ou CSV UTF-8.');
  }

  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    const rows = await readXlsxFile(file);
    return rows.map((r) => r.map((c) => (c instanceof Date ? c.toISOString() : clean(c))));
  }

  let encoding = 'utf-8';
  if (bytes[0] === 0xff && bytes[1] === 0xfe) encoding = 'utf-16le';
  else if (bytes[0] === 0xfe && bytes[1] === 0xff) encoding = 'utf-16be';

  let text = new TextDecoder(encoding).decode(buffer);
  if (encoding === 'utf-8' && text.includes('\uFFFD')) {
    text = new TextDecoder('windows-1252').decode(buffer);
  }
  text = text.replace('\uFEFF', '');

  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const sep = firstLine.split(';').length >= firstLine.split(',').length ? ';' : ',';
  return parseCsvRows(text, sep);
}

interface ColumnIndices {
  iName: number;
  iGroup: number;
  iStatus: number;
  iEmail: number;
  iPhone: number;
  hasHeader: boolean;
}

function resolveColumns(header: string[]): ColumnIndices {
  const hasHeader = header.some((h) => h === 'nome' || h === 'name');
  const find = (keys: string[], fallback: number) =>
    hasHeader ? header.findIndex((h) => keys.some((k) => h.includes(k))) : fallback;

  return {
    iName: find(['nome', 'name'], 0),
    iGroup: find(['grupo', 'group'], 1),
    iStatus: find(['status'], 2),
    iEmail: find(['mail'], 3),
    iPhone: find(['telefone', 'phone', 'celular', 'whatsapp'], 4),
    hasHeader,
  };
}

function validateMissingColumns(cols: ColumnIndices): string | null {
  if (!cols.hasHeader) return null;
  const missingCols: string[] = [];
  if (cols.iGroup < 0) missingCols.push('grupo');
  if (cols.iStatus < 0) missingCols.push('status');
  if (missingCols.length) {
    return `Coluna obrigatória ausente: ${missingCols.join(', ')}.`;
  }
  return null;
}

interface ProcessedRowResult {
  guest?: ParsedGuest;
  error?: string;
}

function processSingleRow(
  line: number,
  cells: string[],
  cols: ColumnIndices
): ProcessedRowResult {
  const name = cells[cols.iName] ?? '';
  const groupRaw = cells[cols.iGroup] ?? '';
  const statusRaw = cells[cols.iStatus] ?? '';

  const missing: string[] = [];
  if (!name) missing.push('nome');
  if (!groupRaw) missing.push('grupo');
  if (!statusRaw) missing.push('status');

  if (missing.length) {
    return { error: `Linha ${line}: campo obrigatório vazio (${missing.join(', ')}).` };
  }

  const group = normalizeGroup(groupRaw);
  const status = normalizeStatus(statusRaw);

  if (!group) return { error: `Linha ${line}: grupo inválido "${groupRaw}".` };
  if (!status) return { error: `Linha ${line}: status inválido "${statusRaw}".` };

  const email = cols.iEmail >= 0 ? cells[cols.iEmail] : '';
  const phone = cols.iPhone >= 0 ? cells[cols.iPhone] : '';

  return {
    guest: {
      line,
      name: name.slice(0, 80),
      group,
      status,
      email: email ? email.slice(0, 120) : null,
      phone: phone ? phone.slice(0, 30) : null,
    },
  };
}

function buildGuests(rawRows: string[][]): { guests: ParsedGuest[]; errors: string[] } {
  const rows = rawRows
    .map((cells, i) => ({ line: i + 1, cells: cells.map(clean) }))
    .filter((r) => r.cells.some((c) => c !== ''));

  if (!rows.length) return { guests: [], errors: [] };

  const header = rows[0].cells.map(key);
  const cols = resolveColumns(header);
  const headerError = validateMissingColumns(cols);
  if (headerError) return { guests: [], errors: [headerError] };

  const guests: ParsedGuest[] = [];
  const errors: string[] = [];
  const targetRows = cols.hasHeader ? rows.slice(1) : rows;

  for (const { line, cells } of targetRows) {
    const result = processSingleRow(line, cells, cols);
    if (result.error) {
      errors.push(result.error);
    } else if (result.guest) {
      guests.push(result.guest);
    }
  }

  return { guests, errors };
}

function downloadTemplate() {
  const csv =
    'nome;grupo;status;email;telefone\nMaria Exemplo;Família da noiva;Pendente;maria@email.com;(47) 99999-0000\n';
  const url = URL.createObjectURL(
    new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modelo-convidados.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export const ImportGuestsDialog: React.FC<Props> = ({ isOpen, onClose, onImportSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      setSubmitting(true);
      const rows = await readRows(file);
      const { guests, errors } = buildGuests(rows);

      if (errors.length) {
        alert(`Importação recusada. Corrija a planilha:\n\n${formatErrors(errors)}`);
        return;
      }

      if (!guests.length) {
        alert('Nenhum convidado encontrado na planilha.');
        return;
      }

      const response = await api.post('/api/guests/import', { guests });
      onImportSuccess(
        response.data?.message ||
          `${guests.length} convidado(s) importado(s) com sucesso de "${file.name}".`
      );
      onClose();
    } catch (error: any) {
      console.error('Erro ao importar planilha:', error);
      alert(error.response?.data?.error || error.message || 'Erro ao processar o arquivo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card w-full max-w-md p-6 rounded-3xl border border-border shadow-xl space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold font-display text-foreground">Importar Convidados</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            Envie uma planilha CSV ou Excel (.xlsx). Nome, grupo e status são obrigatórios; e-mail e
            telefone são opcionais.
          </p>

          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            <Download size={14} /> Baixar modelo de planilha CSV
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={handleFileChange}
        />

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
            <Upload size={16} /> {submitting ? 'Importando...' : 'Selecionar arquivo'}
          </button>
        </div>
      </div>
    </div>
  );
};