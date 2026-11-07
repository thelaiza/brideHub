import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FinanceiroPage } from '../pages/FinanceiroPage'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('FinanceiroPage Component', () => {
  const mockExpenses = [
    { id: '1', title: 'Buffet Casamento', category: 'Buffet', amount: 15000, dueDate: '2026-10-04T00:00:00.000Z', status: 'pending' },
    { id: '2', title: 'Vestido da Noiva', category: 'Vestido da noiva', amount: 8000, dueDate: '2026-08-10T00:00:00.000Z', status: 'paid' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve carregar e exibir a lista de despesas corretamente', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockExpenses })

    render(<FinanceiroPage />)

    expect(await screen.findByText('Buffet Casamento')).toBeInTheDocument()
    expect(screen.getByText('Vestido da Noiva')).toBeInTheDocument()
    expect(screen.getByText('R$ 15.000,00')).toBeInTheDocument()
  })

  it('deve filtrar despesas pelo campo de busca', async () => {
    const user = userEvent.setup()
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockExpenses })

    render(<FinanceiroPage />)

    expect(await screen.findByText('Buffet Casamento')).toBeInTheDocument()
    expect(screen.getByText('Vestido da Noiva')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText('Buscar despesa ou categoria...')
    await user.type(searchInput, 'Buffet')

    expect(screen.getByText('Buffet Casamento')).toBeInTheDocument()
    expect(screen.queryByText('Vestido da Noiva')).not.toBeInTheDocument()
  })

  it('deve alternar o status da despesa ao clicar no botão de status', async () => {
    const user = userEvent.setup()
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockExpenses })
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { ...mockExpenses[0], status: 'paid' } })

    render(<FinanceiroPage />)

    const statusButton = await screen.findByRole('button', { name: /pendente/i })
    await user.click(statusButton)

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/expenses/1', { status: 'paid' })
    })
  })

  it('deve excluir uma despesa ao confirmar', async () => {
    const user = userEvent.setup()
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockExpenses })
    vi.mocked(api.delete).mockResolvedValueOnce({})
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true)

    render(<FinanceiroPage />)

    expect(await screen.findByText('Buffet Casamento')).toBeInTheDocument()

    const deleteButtons = screen.getAllByTitle('Excluir despesa')
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/expenses/1')
      expect(screen.queryByText('Buffet Casamento')).not.toBeInTheDocument()
    })
  })
})