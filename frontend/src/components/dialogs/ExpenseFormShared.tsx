import React, { useEffect, useState } from 'react';
import { X, DollarSign, Calendar, Tag, FileText, Store } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api } from '../../services/api';
import type { Vendor } from '../../types';

export type ExpenseUiStatus = 'Pendente' | 'Pago';

export interface ExpenseFormValues {
  title: string;
  category: string;
  vendorId: string;
  amount: string;
  dueDate: string;
  status: ExpenseUiStatus;
}

export const EMPTY_EXPENSE_FORM: ExpenseFormValues = {
  title: '',
  category: '',
  vendorId: '',
  amount: '',
  dueDate: '',
  status: 'Pendente',
};

export const useExpenseFormOptions = (isOpen: boolean) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    api.get('/api/categories')
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error('Erro ao carregar categorias:', err));

    api.get('/api/vendors')
      .then((res) => setVendors(res.data || []))
      .catch((err) => console.error('Erro ao carregar fornecedores:', err));
  }, [isOpen]);

  return { categories, vendors };
};

interface ExpenseDialogShellProps {
  title: string;
  submitLabel: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}

export const ExpenseDialogShell: React.FC<ExpenseDialogShellProps> = ({
  title,
  submitLabel,
  loading = false,
  onClose,
  onSubmit,
  children,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
    <div className="bg-card rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-foreground font-display">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar modal"
          className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {children}

        <div className="pt-4 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Salvando...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const CONTROL_BASE =
  'w-full pr-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-ring';
const WITH_ICON = `${CONTROL_BASE} pl-11`;
const SELECT_WITH_ICON = `${WITH_ICON} cursor-pointer`;
const SELECT_NO_ICON = `${CONTROL_BASE} pl-4 cursor-pointer`;
const OPTION_CLASS = 'bg-card text-foreground';

interface FieldProps {
  id: string;
  label: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ id, label, icon: Icon, children }) => (
  <div>
    <label
      htmlFor={id}
      className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
    >
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
      )}
      {children}
    </div>
  </div>
);

interface ExpenseFormFieldsProps {
  idPrefix: string;
  values: ExpenseFormValues;
  categories: string[];
  vendors: Vendor[];
  onChange: (patch: Partial<ExpenseFormValues>) => void;
  dueDateRequired?: boolean;
}

export const ExpenseFormFields: React.FC<ExpenseFormFieldsProps> = ({
  idPrefix,
  values,
  categories,
  vendors,
  onChange,
  dueDateRequired = false,
}) => {
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <>
      <Field id={id('title')} label="Descrição" icon={FileText}>
        <input
          id={id('title')}
          type="text"
          required
          value={values.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Ex: Sinal do Buffet"
          className={WITH_ICON}
        />
      </Field>

      <Field id={id('category')} label="Categoria" icon={Tag}>
        <select
          id={id('category')}
          value={values.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className={SELECT_WITH_ICON}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat} className={OPTION_CLASS}>
              {cat}
            </option>
          ))}
        </select>
      </Field>

      <Field id={id('vendor')} label="Fornecedor (opcional)" icon={Store}>
        <select
          id={id('vendor')}
          value={values.vendorId}
          onChange={(e) => onChange({ vendorId: e.target.value })}
          className={SELECT_WITH_ICON}
        >
          <option value="" className={OPTION_CLASS}>
            Sem fornecedor específico
          </option>
          {vendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id} className={OPTION_CLASS}>
              {vendor.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field id={id('amount')} label="Valor (R$)" icon={DollarSign}>
          <input
            id={id('amount')}
            type="number"
            step="0.01"
            required
            value={values.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
            placeholder="0,00"
            className={WITH_ICON}
          />
        </Field>

        <Field id={id('due-date')} label="Vencimento" icon={Calendar}>
          <input
            id={id('due-date')}
            type="date"
            required={dueDateRequired}
            value={values.dueDate}
            onChange={(e) => onChange({ dueDate: e.target.value })}
            className={WITH_ICON}
          />
        </Field>
      </div>

      <Field id={id('status')} label="Status">
        <select
          id={id('status')}
          value={values.status}
          onChange={(e) => onChange({ status: e.target.value as ExpenseUiStatus })}
          className={SELECT_NO_ICON}
        >
          <option value="Pendente" className={OPTION_CLASS}>
            Pendente
          </option>
          <option value="Pago" className={OPTION_CLASS}>
            Pago
          </option>
        </select>
      </Field>
    </>
  );
};