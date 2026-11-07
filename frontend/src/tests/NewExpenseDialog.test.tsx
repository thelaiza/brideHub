import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NewExpenseDialog } from '../components/dialogs/NewExpenseDialog'

describe('NewExpenseDialog Component', () => {
  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
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
  })

  it('deve renderizar o formulário corretamente quando isOpen for verdadeiro', () => {
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
  })

  it('deve chamar onClose ao clicar no botão de cancelar ou fechar', async () => {
    const user = userEvent.setup()

    render(
      <NewExpenseDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancelar/i })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('deve chamar onSave com os dados preenchidos e fechar o modal ao submeter', async () => {
    const user = userEvent.setup()

    render(
      <NewExpenseDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    const titleInput = screen.getByPlaceholderText('Ex: Sinal do Buffet')
    const amountInput = screen.getByPlaceholderText('0,00')
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement

    await user.type(titleInput, 'Decoração Igreja')
    await user.type(amountInput, '3500')
    await user.type(dateInput, '2026-10-04')

    const submitButton = screen.getByRole('button', { name: /salvar despesa/i })
    await user.click(submitButton)

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