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
  const mockCategories = ['Buffet', 'Vestido da noiva']
  const mockVendors = [
    { id: 'v-1', name: 'Buffet Sabor & Arte', category: 'Buffet', phone: '', status: 'Contratado', cost: 15000 },
  ]

  const mockExpenses = [
    {
      id: '1',
      title: 'Buffet Casamento',
      category: 'Buffet',
      amount: 15000,
      dueDate: '2026-10-04T00:00:00.000Z',
      status: 'pending',
      vendorId: 'v-1',
      vendor: { id: 'v-1', name: 'Buffet Sabor & Arte', category: 'Buffet' },
    },
    {
      id: '2',
      title: 'Vestido da Noiva',
      category: 'Vestido da noiva',
      amount: 8000,
      dueDate: '2026-08-10T00:00:00.000Z',
      status: 'paid',
      vendorId: null,
      vendor: null,
    },
  ]

  const mockApiGet = () => {
    vi.mocked(api.get).mockImplementation((async (url: string) => {
      if (url === '/api/categories') return { data: mockCategories }
      if (url === '/api/expenses') return { data: mockExpenses }
      if (url === '/api/vendors') return { data: mockVendors }
      throw new Error(`URL não mockada: ${url}`)
    }) as never)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet()
  })

  it('deve carregar e exibir a lista de despesas e o fornecedor vinculado quando houver', async () => {
    render(<FinanceiroPage />)

    expect(await screen.findByText('Buffet Casamento')).toBeInTheDocument()
    expect(screen.getByText('Buffet Sabor & Arte')).toBeInTheDocument()
    expect(screen.getByText('Vestido da Noiva')).toBeInTheDocument()
    expect(screen.getByText('R$ 15.000,00')).toBeInTheDocument()
  })

  it('deve carregar as categorias no filtro', async () => {
    render(<FinanceiroPage />)

    expect(await screen.findByText('Buffet Casamento')).toBeInTheDocument()
    expect(await screen.findByRole('option', { name: 'Vestido da noiva' })).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/api/categories')
    expect(api.get).toHaveBeenCalledWith('/api/expenses')
  })

  it('deve criar uma nova despesa vinculada a fornecedor pelo modal', async () => {
    const user = userEvent.setup()
    const createdResponse = {
      id: '3',
      title: 'Jantar Degustação',
      category: 'Buffet',
      amount: 950,
      dueDate: '2026-09-15',
      status: 'pending',
      vendorId: 'v-1',
      vendor: { id: 'v-1', name: 'Buffet Sabor & Arte', category: 'Buffet' },
    }
    vi.mocked(api.post).mockResolvedValueOnce({ data: createdResponse })

    const { container } = render(<FinanceiroPage />)
    expect(await screen.findByText('Buffet Casamento')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /nova despesa/i }))
    await screen.findByRole('option', { name: 'Buffet Sabor & Arte' })

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement
    await user.type(screen.getByPlaceholderText('Ex: Sinal do Buffet'), 'Jantar Degustação')
    await user.type(screen.getByPlaceholderText('0,00'), '950')
    await user.selectOptions(screen.getByLabelText(/fornecedor/i), 'v-1')
    await user.type(dateInput, '2026-09-15')

    await user.click(screen.getByRole('button', { name: /salvar despesa/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/expenses', {
        title: 'Jantar Degustação',
        category: 'Buffet',
        amount: 950,
        dueDate: '2026-09-15',
        status: 'pending',
        vendorId: 'v-1',
      })
      expect(screen.getByText('Jantar Degustação')).toBeInTheDocument()
    })
  })

  it('deve filtrar despesas por categoria e limpar o filtro', async () => {
    const user = userEvent.setup()

    render(<FinanceiroPage />)
    expect(await screen.findByText('Buffet Casamento')).toBeInTheDocument()

    const categorySelect = screen.getAllByRole('combobox')[0]
    await user.selectOptions(categorySelect, 'Buffet')

    expect(screen.getByText('Buffet Casamento')).toBeInTheDocument()
    expect(screen.queryByText('Vestido da Noiva')).not.toBeInTheDocument()

    await user.click(screen.getByTitle('Limpar filtro'))
    expect(screen.getByText('Vestido da Noiva')).toBeInTheDocument()
  })

  it('deve filtrar despesas pelo campo de busca (título, categoria ou fornecedor)', async () => {
    const user = userEvent.setup()

    render(<FinanceiroPage />)

    expect(await screen.findByText('Buffet Casamento')).toBeInTheDocument()
    expect(screen.getByText('Vestido da Noiva')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText('Buscar despesa, fornecedor ou categoria...')
    await user.type(searchInput, 'Sabor & Arte')

    expect(screen.getByText('Buffet Casamento')).toBeInTheDocument()
    expect(screen.queryByText('Vestido da Noiva')).not.toBeInTheDocument()
  })

  it('deve alternar o status da despesa ao clicar no botão de status', async () => {
    const user = userEvent.setup()
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