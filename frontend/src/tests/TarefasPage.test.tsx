import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TarefasPage } from '../pages/TarefasPage'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('TarefasPage Component', () => {
  const mockTasks = [
    { id: '1', title: 'Reservar Igreja', category: 'Local', dueDate: '2026-06-15T00:00:00.000Z', status: 'todo' },
    { id: '2', title: 'Procurar Buffet', category: 'Buffet', dueDate: '2026-07-20T00:00:00.000Z', status: 'doing' },
    { id: '3', title: 'Definir Convidados', category: 'Convidados', dueDate: '2026-04-10T00:00:00.000Z', status: 'done' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve carregar e exibir o quadro de tarefas dividido por colunas corretamente', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockTasks })

    render(<TarefasPage />)

    expect(await screen.findByText('Reservar Igreja')).toBeInTheDocument()
    expect(screen.getByText('Procurar Buffet')).toBeInTheDocument()
    expect(screen.getByText('Definir Convidados')).toBeInTheDocument()
  })

  it('deve abrir o menu de opções da tarefa e permitir excluir', async () => {
    const user = userEvent.setup()
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockTasks })
    vi.mocked(api.delete).mockResolvedValueOnce({})
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true)

    render(<TarefasPage />)

    expect(await screen.findByText('Reservar Igreja')).toBeInTheDocument()

    const menuButtons = screen.getAllByRole('button', { name: '' })
    await user.click(menuButtons[0])

    const deleteOption = await screen.findByText('Excluir tarefa')
    await user.click(deleteOption)

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/tasks/1')
      expect(screen.queryByText('Reservar Igreja')).not.toBeInTheDocument()
    })
  })
})