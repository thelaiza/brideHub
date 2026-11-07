import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DashboardPage } from '../pages/DashboardPage'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

describe('DashboardPage Component', () => {
  const mockDashboardData = {
    wedding: {
      bride: 'Laíza',
      groom: 'Marcos',
      date: '2026-10-04T00:00:00.000Z',
      venue: 'Joinville, SC',
      budget: 50000,
    },
    tasks: [
      { id: '1', title: 'Comprar alianças', category: 'Joias', completed: false, dueDate: '2026-09-01T00:00:00.000Z' },
      { id: '2', title: 'Escolher vestido', category: 'Vestido da noiva', completed: true, dueDate: '2026-05-01T00:00:00.000Z' }
    ],
    vendors: [
      { id: '1', name: 'Buffet Master', category: 'Buffet', status: 'Contratado' }
    ],
    expenses: [
      { id: '1', title: 'Sinal Buffet', category: 'Buffet', amount: 15000, status: 'Pago' }
    ]
  }

  const mockOnNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve carregar e exibir os dados do dashboard corretamente', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockDashboardData })

    render(<DashboardPage onNavigate={mockOnNavigate} />)

    expect(await screen.findByText('Olá, Laíza')).toBeInTheDocument()
    expect(screen.getByText('Comprar alianças')).toBeInTheDocument()
    expect(screen.getAllByText('R$ 15.000')[0]).toBeInTheDocument()
  })

  it('deve navegar para a aba correta ao clicar em um card de resumo', async () => {
    const user = userEvent.setup()
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockDashboardData })

    render(<DashboardPage onNavigate={mockOnNavigate} />)

    const welcomeTitle = await screen.findByText('Olá, Laíza')
    expect(welcomeTitle).toBeInTheDocument()

    const financeCard = screen.getByText('Orçamento Comprometido').closest('div[class*="cursor-pointer"]')
    await user.click(financeCard!)

    expect(mockOnNavigate).toHaveBeenCalledWith('financeiro')
  })

  it('deve lidar com falhas na API de forma segura', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Erro de rede'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<DashboardPage onNavigate={mockOnNavigate} />)

    expect(await screen.findByText('Olá, Convidado(a)')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})