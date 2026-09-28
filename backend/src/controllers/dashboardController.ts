import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { fetchDashboardData } from '../services/dashboardService.js';

export const getDashboardData = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const data = await fetchDashboardData(userId);

    return res.json(data);
  } catch (error) {
    console.error('ERRO AO BUSCAR DADOS DO DASHBOARD:', error);
    return res.status(500).json({ error: 'Erro ao carregar dados do dashboard.' });
  }
};