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
  email?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: 'todo' | 'doing' | 'done';
  completed?: boolean;
  dueDate: string;
}

export type GuestGroup = 'Família da noiva' | 'Família do noivo' | 'Amigos' | 'Padrinhos' | 'Fornecedores';
export type GuestStatus = 'Confirmado' | 'Pendente' | 'Negado';

export interface Guest {
  id: string;
  name: string;
  group: GuestGroup;
  status: GuestStatus;
  email?: string;
  phone?: string;
  table?: string | null;
  tableId?: string | null;
}

export interface WeddingTable {
  id: string;
  name: string;
  guests: Guest[];
  createdAt?: string;
  updatedAt?: string;
}