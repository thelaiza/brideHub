import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

const WEDDING_CATEGORIES = [
  'Local',
  'Buffet',
  'Fotografia e Vídeo',
  'Bolo',
  'Doces',
  'Decoração e Flores',
  'Papelaria',
  'Vestido da noiva',
  'Salão de beleza',
  'Terno do noivo',
  'DJ/Banda para festa',
  'Músicos para cerimônia',
  'Lembrancinha',
  'Cerimonial',
  'Segurança e Serviços Extras',
  'Outros'
];

export const getCategories = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    return res.json(WEDDING_CATEGORIES);
  } catch (error) {
    console.error('ERRO AO BUSCAR CATEGORIAS:', error);
    return res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
};