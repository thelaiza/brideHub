import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NewExpenseDialog } from '../components/dialogs/NewExpenseDialog'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

describe('NewExpenseDialog Component', () => {
  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue({ data: ['Buffet', 'Local'] })
  })

  it('não deve renderizar nada quando isOpen for falso', () => {
    const { container } = render(
      <NewExpenseDialog 
        isOpen={false} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    expect(container).toBeEmptyDOMElement()
    expect(api.get).not.toHaveBeenCalled()
  })

  it('deve renderizar o formulário e carregar as categorias quando isOpen for verdadeiro', async () => {
    render(
      <NewExpenseDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    expect(screen.getByText('Nova Despesa')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ex: Sinal do Buffet')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0,00')).toBeInTheDocument()

    expect(await screen.findByRole('option', { name: 'Buffet' })).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/api/categories')
    expect(screen.getByLabelText('Categoria')).toHaveValue('Buffet')
  })

  it('deve chamar onClose ao clicar no botão de cancelar', async () => {
    const user = userEvent.setup()

    render(
      <NewExpenseDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    await screen.findByRole('option', { name: 'Buffet' })

    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('deve chamar onSave com os dados preenchidos e fechar o modal ao submeter', async () => {
    const user = userEvent.setup()

    const { container } = render(
      <NewExpenseDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    await screen.findByRole('option', { name: 'Local' })

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement

    await user.type(screen.getByPlaceholderText('Ex: Sinal do Buffet'), 'Decoração Igreja')
    await user.selectOptions(screen.getByLabelText('Categoria'), 'Local')
    await user.type(screen.getByPlaceholderText('0,00'), '3500')
    await user.type(dateInput, '2026-10-04')

    await user.click(screen.getByRole('button', { name: /salvar despesa/i }))

    expect(mockOnSave).toHaveBeenCalledTimes(1)
    expect(mockOnSave).toHaveBeenCalledWith({
      title: 'Decoração Igreja',
      category: 'Local',
      amount: 3500,
      dueDate: '2026-10-04',
      status: 'Pendente',
    })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})