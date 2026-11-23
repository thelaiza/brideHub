import React, { useState } from 'react';
import {
  ExpenseDialogShell,
  ExpenseFormFields,
  EMPTY_EXPENSE_FORM,
  useExpenseFormOptions,
  type ExpenseFormValues,
} from './ExpenseFormShared';
import type { Expense } from '../../types';

interface NewExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id'>) => void;
}

export const NewExpenseDialog: React.FC<NewExpenseDialogProps> = ({ isOpen, onClose, onSave }) => {
  const [values, setValues] = useState<ExpenseFormValues>(EMPTY_EXPENSE_FORM);
  const { categories, vendors } = useExpenseFormOptions(isOpen);

  if (!isOpen) return null;

  const category = values.category || categories[0] || '';

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const selectedVendor = vendors.find((v) => v.id === values.vendorId);
    onSave({
      title: values.title,
      category,
      amount: Number.parseFloat(values.amount) || 0,
      dueDate: values.dueDate,
      status: values.status,
      vendorId: values.vendorId || null,
      vendor: selectedVendor
        ? { id: selectedVendor.id, name: selectedVendor.name, category: selectedVendor.category }
        : null,
    });
    setValues({ ...EMPTY_EXPENSE_FORM, category: values.category });
    onClose();
  };

  return (
    <ExpenseDialogShell title="Nova Despesa" submitLabel="Salvar Despesa" onClose={onClose} onSubmit={handleSubmit}>
      <ExpenseFormFields
        idPrefix="new-expense"
        values={{ ...values, category }}
        categories={categories}
        vendors={vendors}
        onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
        dueDateRequired
      />
    </ExpenseDialogShell>
  );
};