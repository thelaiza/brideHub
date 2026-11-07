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
  }

  const mockCategories = ['Buffet', 'Local']

  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue({ data: mockCategories })
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
        expense={mockExpense} 
        onSave={mockOnSave} 
      />
    )

    expect(screen.getByText('Editar Despesa')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Buffet Casamento')).toBeInTheDocument()
    expect(screen.getByDisplayValue('15000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2026-10-04')).toBeInTheDocument()

    await screen.findByRole('option', { name: 'Local' })
    expect(screen.getByLabelText('Categoria')).toHaveValue('Buffet')
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
    const updatedResponse = { ...mockExpense, title: 'Buffet Premium' }
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

    const titleInput = screen.getByDisplayValue('Buffet Casamento')
    await user.clear(titleInput)
    await user.type(titleInput, 'Buffet Premium')

    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledTimes(1)
      expect(api.patch).toHaveBeenCalledWith('/api/expenses/1', {
        title: 'Buffet Premium',
        category: 'Buffet',
        amount: 15000,
        dueDate: '2026-10-04',
        status: 'pending',
      })
      expect(mockOnSave).toHaveBeenCalledWith(updatedResponse)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })
})