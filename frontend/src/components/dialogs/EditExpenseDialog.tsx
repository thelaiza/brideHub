import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  ExpenseDialogShell,
  ExpenseFormFields,
  EMPTY_EXPENSE_FORM,
  useExpenseFormOptions,
  type ExpenseFormValues,
  type ExpenseUiStatus,
} from './ExpenseFormShared';
import type { Expense } from '../../types';

interface EditExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  onSave: (updatedExpense: Expense) => void;
}

const toUiStatus = (apiStatus?: string): ExpenseUiStatus => (apiStatus === 'paid' ? 'Pago' : 'Pendente');

const toApiStatus = (uiStatus: ExpenseUiStatus): 'pending' | 'paid' => (uiStatus === 'Pago' ? 'paid' : 'pending');

export const EditExpenseDialog: React.FC<EditExpenseDialogProps> = ({ isOpen, onClose, expense, onSave }) => {
  const [values, setValues] = useState<ExpenseFormValues>(EMPTY_EXPENSE_FORM);
  const [loading, setLoading] = useState(false);
  const { categories, vendors } = useExpenseFormOptions(isOpen);

  useEffect(() => {
    if (!expense) return;
    setValues({
      title: expense.title || '',
      category: expense.category || '',
      amount: expense.amount ? expense.amount.toString() : '',
      dueDate: expense.dueDate ? expense.dueDate.split('T')[0] : '',
      status: toUiStatus(expense.status),
      vendorId: expense.vendorId || expense.vendor?.id || '',
    });
  }, [expense]);

  if (!isOpen) return null;

  const category = values.category || categories[0] || '';

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!expense) return;

    setLoading(true);
    try {
      const response = await api.patch(`/api/expenses/${expense.id}`, {
        title: values.title,
        category,
        amount: Number.parseFloat(values.amount) || 0,
        dueDate: values.dueDate || null,
        status: toApiStatus(values.status),
        vendorId: values.vendorId || null,
      });

      onSave(response.data);
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ExpenseDialogShell
      title="Editar Despesa"
      submitLabel="Salvar Alterações"
      loading={loading}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <ExpenseFormFields
        idPrefix="edit-expense"
        values={{ ...values, category }}
        categories={categories}
        vendors={vendors}
        onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
      />
    </ExpenseDialogShell>
  );
};