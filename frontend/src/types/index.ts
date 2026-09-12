export interface WeddingSummary {
  brideName: string;
  groomName: string;
  weddingDate: string;
  totalBudget: number;
  spentAmount: number;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  status: 'Pendente' | 'Pago';
  dueDate: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  phone: string;
  status: 'Contratado' | 'Orçamento' | 'Pesquisando';
  cost: number;
}

export interface Task {
  id: string;
  title: string;
  category: string;
  status: 'todo' | 'doing' | 'done';
  dueDate: string;
}