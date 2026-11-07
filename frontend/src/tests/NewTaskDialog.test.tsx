import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NewTaskDialog } from '../components/dialogs/NewTaskDialog'

describe('NewTaskDialog Component', () => {
  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não deve renderizar nada quando isOpen for falso', () => {
    const { container } = render(
      <NewTaskDialog 
        isOpen={false} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('deve renderizar o formulário corretamente quando isOpen for verdadeiro', () => {
    render(
      <NewTaskDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    expect(screen.getByText('Nova Tarefa')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ex: Definir paleta de cores')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ex: Decoração')).toBeInTheDocument()
  })

  it('deve chamar onClose ao clicar no botão de cancelar ou fechar', async () => {
    const user = userEvent.setup()

    render(
      <NewTaskDialog 
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
      <NewTaskDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    const titleInput = screen.getByPlaceholderText('Ex: Definir paleta de cores')
    const categoryInput = screen.getByPlaceholderText('Ex: Decoração')
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement

    await user.clear(categoryInput)
    await user.type(titleInput, 'Escolher Convites')
    await user.type(categoryInput, 'Papelaria')
    await user.type(dateInput, '2026-07-20')

    const submitButton = screen.getByRole('button', { name: /adicionar tarefa/i })
    await user.click(submitButton)

    expect(mockOnSave).toHaveBeenCalledTimes(1)
    expect(mockOnSave).toHaveBeenCalledWith({
      title: 'Escolher Convites',
      category: 'Papelaria',
      dueDate: '2026-07-20',
      status: 'todo',
    })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})