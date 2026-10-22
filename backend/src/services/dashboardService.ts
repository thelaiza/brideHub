import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const fetchDashboardData = async (userId: string) => {
  const wedding = await prisma.wedding.findUnique({ where: { userId } });

  const [expenses, tasks, vendors] = await Promise.all([
    prisma.expense.findMany({ where: { userId } }),
    prisma.task.findMany({ where: { userId } }),
    prisma.vendor.findMany({ where: { userId } }),
  ]);

  const totalExpensesAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const paidExpensesAmount = expenses
    .filter((e) => e.status === 'paid' || e.status === 'Pago')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  const totalVendors = vendors.length;
  const contractedVendors = vendors.filter((v) => v.status === 'contracted' || v.status === 'Contratado').length;

  return {
    wedding,
    summary: {
      expenses: {
        totalCount: expenses.length,
        totalAmount: totalExpensesAmount,
        paidAmount: paidExpensesAmount,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
      },
      vendors: {
        total: totalVendors,
        contracted: contractedVendors,
      },
    },
    expenses,
    tasks,
    vendors,
  };
};