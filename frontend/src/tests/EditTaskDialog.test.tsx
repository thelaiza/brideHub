import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EditTaskDialog } from '../components/dialogs/EditTaskDialog'
import { api } from '../services/api'
import type { Task } from '../types'

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('EditTaskDialog Component', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Reservar Igreja',
    description: 'Confirmar data e horário com o padre',
    category: 'Local',
    dueDate: '2026-06-15T00:00:00.000Z',
    status: 'todo',
  }

  const mockCategories = ['Local', 'Buffet']

  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue({ data: mockCategories })
  })

  it('não deve renderizar nada quando isOpen for falso', () => {
    const { container } = render(
      <EditTaskDialog 
        isOpen={false} 
        task={mockTask} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    expect(container).toBeEmptyDOMElement()
    expect(api.get).not.toHaveBeenCalled()
  })

  it('não deve renderizar nada quando task for nula', () => {
    const { container } = render(
      <EditTaskDialog 
        isOpen={true} 
        task={null} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('deve preencher os campos com os dados da tarefa quando isOpen for verdadeiro', async () => {
    render(
      <EditTaskDialog 
        isOpen={true} 
        task={mockTask} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    expect(screen.getByText('Editar Tarefa')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Reservar Igreja')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Confirmar data e horário com o padre')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2026-06-15')).toBeInTheDocument()

    await screen.findByRole('option', { name: 'Buffet' })
    expect(screen.getByLabelText('Categoria')).toHaveValue('Local')
  })

  it('deve chamar onClose ao clicar no botão de cancelar', async () => {
    const user = userEvent.setup()

    render(
      <EditTaskDialog 
        isOpen={true} 
        task={mockTask} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    await screen.findByRole('option', { name: 'Buffet' })

    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('deve enviar os dados atualizados via patch e chamar onSave ao submeter o formulário', async () => {
    const user = userEvent.setup()
    const updatedResponse = { ...mockTask, title: 'Reservar Catedral' }
    vi.mocked(api.patch).mockResolvedValueOnce({ data: updatedResponse })

    render(
      <EditTaskDialog 
        isOpen={true} 
        task={mockTask} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    )

    await screen.findByRole('option', { name: 'Buffet' })

    const titleInput = screen.getByDisplayValue('Reservar Igreja')
    await user.clear(titleInput)
    await user.type(titleInput, 'Reservar Catedral')

    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledTimes(1)
      expect(api.patch).toHaveBeenCalledWith('/api/tasks/1', {
        title: 'Reservar Catedral',
        description: 'Confirmar data e horário com o padre',
        category: 'Local',
        dueDate: '2026-06-15',
        status: 'todo',
      })
      expect(mockOnSave).toHaveBeenCalledWith(updatedResponse)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })
})