import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NewTaskDialog } from '../components/dialogs/NewTaskDialog'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

describe('NewTaskDialog Component', () => {
  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue({ data: ['Decoração', 'Papelaria'] })
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
    expect(api.get).not.toHaveBeenCalled()
  })

  it('deve renderizar o formulário e carregar as categorias quando isOpen for verdadeiro', async () => {
    render(
      <NewTaskDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    expect(screen.getByText('Nova Tarefa')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ex: Definir paleta de cores')).toBeInTheDocument()

    expect(await screen.findByRole('option', { name: 'Decoração' })).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/api/categories')
    expect(screen.getByLabelText('Categoria')).toHaveValue('Decoração')
  })

  it('deve chamar onClose ao clicar no botão de cancelar', async () => {
    const user = userEvent.setup()

    render(
      <NewTaskDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    await screen.findByRole('option', { name: 'Decoração' })

    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('deve chamar onSave com os dados preenchidos e fechar o modal ao submeter', async () => {
    const user = userEvent.setup()

    const { container } = render(
      <NewTaskDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    await screen.findByRole('option', { name: 'Papelaria' })

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement

    await user.type(screen.getByPlaceholderText('Ex: Definir paleta de cores'), 'Escolher Convites')
    await user.selectOptions(screen.getByLabelText('Categoria'), 'Papelaria')
    await user.type(dateInput, '2026-07-20')

    await user.click(screen.getByRole('button', { name: /adicionar tarefa/i }))

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