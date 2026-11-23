import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EditExpenseDialog } from '../components/dialogs/EditExpenseDialog'
import { api } from '../services/api'
import type { Expense } from '../types'

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('EditExpenseDialog Component', () => {
  const mockExpense: Expense = {
    id: '1',
    title: 'Buffet Casamento',
    category: 'Buffet',
    amount: 15000,
    dueDate: '2026-10-04T00:00:00.000Z',
    status: 'pending' as unknown as Expense['status'],
    vendorId: null,
    vendor: null,
  }

  const mockCategories = ['Buffet', 'Local']
  const mockVendors = [
    { id: 'v-1', name: 'Buffet Sabor & Arte', category: 'Buffet', phone: '', status: 'Contratado' as const, cost: 15000 },
    { id: 'v-2', name: 'Espaço Jardim', category: 'Local', phone: '', status: 'Contratado' as const, cost: 10000 },
  ]

  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/categories') {
        return Promise.resolve({ data: mockCategories })
      }
      if (url === '/api/vendors') {
        return Promise.resolve({ data: mockVendors })
      }
      return Promise.resolve({ data: [] })
    })
  })

  it('não deve renderizar nada quando isOpen for falso', () => {
    render(
      <EditExpenseDialog
        isOpen={false}
        onClose={mockOnClose}
        expense={mockExpense}
        onSave={mockOnSave}
      />
    )

    expect(screen.queryByText('Editar Despesa')).not.toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalled()
  })

  it('deve preencher os campos com os dados da despesa quando isOpen for verdadeiro', async () => {
    render(
      <EditExpenseDialog
        isOpen={true}
        onClose={mockOnClose}
        expense={{
          ...mockExpense,
          vendorId: 'v-1',
          vendor: { id: 'v-1', name: 'Buffet Sabor & Arte', category: 'Buffet' },
        }}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('Editar Despesa')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Buffet Casamento')).toBeInTheDocument()
    expect(screen.getByDisplayValue('15000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2026-10-04')).toBeInTheDocument()

    await screen.findByRole('option', { name: 'Local' })
    await screen.findByRole('option', { name: 'Buffet Sabor & Arte' })

    expect(screen.getByLabelText('Categoria')).toHaveValue('Buffet')
    expect(screen.getByLabelText(/fornecedor/i)).toHaveValue('v-1')
  })

  it('deve chamar onClose ao clicar no botão de cancelar', async () => {
    const user = userEvent.setup()

    render(
      <EditExpenseDialog
        isOpen={true}
        onClose={mockOnClose}
        expense={mockExpense}
        onSave={mockOnSave}
      />
    )

    await screen.findByRole('option', { name: 'Local' })

    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('deve enviar os dados atualizados via patch e chamar onSave ao submeter o formulário', async () => {
    const user = userEvent.setup()
    const updatedResponse = {
      ...mockExpense,
      title: 'Buffet Premium',
      vendorId: 'v-1',
      vendor: { id: 'v-1', name: 'Buffet Sabor & Arte', category: 'Buffet' },
    }
    vi.mocked(api.patch).mockResolvedValueOnce({ data: updatedResponse })

    render(
      <EditExpenseDialog
        isOpen={true}
        onClose={mockOnClose}
        expense={mockExpense}
        onSave={mockOnSave}
      />
    )

    await screen.findByRole('option', { name: 'Local' })
    await screen.findByRole('option', { name: 'Buffet Sabor & Arte' })

    const titleInput = screen.getByDisplayValue('Buffet Casamento')
    await user.clear(titleInput)
    await user.type(titleInput, 'Buffet Premium')
    await user.selectOptions(screen.getByLabelText(/fornecedor/i), 'v-1')

    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledTimes(1)
      expect(api.patch).toHaveBeenCalledWith('/api/expenses/1', {
        title: 'Buffet Premium',
        category: 'Buffet',
        amount: 15000,
        dueDate: '2026-10-04',
        status: 'pending',
        vendorId: 'v-1',
      })
      expect(mockOnSave).toHaveBeenCalledWith(updatedResponse)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })
})