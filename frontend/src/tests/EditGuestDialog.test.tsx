import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EditGuestDialog } from '../components/dialogs/EditGuestDialog'
import type { Guest } from '../types'

describe('EditGuestDialog Component', () => {
  const mockGuest: Guest = {
    id: '1',
    name: 'João Silva',
    group: 'Amigos',
    status: 'Pendente',
    email: 'joao@email.com',
    phone: '47999998888',
  }

  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não deve renderizar nada se isOpen for falso ou guest for nulo', () => {
    const { container } = render(
      <EditGuestDialog isOpen={false} onClose={mockOnClose} guest={mockGuest} onSave={mockOnSave} />
    )
    expect(container.firstChild).toBeNull()

    const { container: containerNull } = render(
      <EditGuestDialog isOpen={true} onClose={mockOnClose} guest={null} onSave={mockOnSave} />
    )
    expect(containerNull.firstChild).toBeNull()
  })

  it('deve renderizar o modal preenchido quando isOpen for verdadeiro e guest existir', () => {
    render(
      <EditGuestDialog isOpen={true} onClose={mockOnClose} guest={mockGuest} onSave={mockOnSave} />
    )

    expect(screen.getByText('Editar Convidado')).toBeInTheDocument()
    expect(screen.getByDisplayValue('João Silva')).toBeInTheDocument()
    expect(screen.getByDisplayValue('joao@email.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('47999998888')).toBeInTheDocument()
  })

  it('deve fechar o modal ao clicar em Cancelar', async () => {
    const user = userEvent.setup()
    render(
      <EditGuestDialog isOpen={true} onClose={mockOnClose} guest={mockGuest} onSave={mockOnSave} />
    )

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i })
    await user.click(cancelButton)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('deve submeter o formulário com os dados atualizados', async () => {
    const user = userEvent.setup()
    render(
      <EditGuestDialog isOpen={true} onClose={mockOnClose} guest={mockGuest} onSave={mockOnSave} />
    )

    const nameInput = screen.getByDisplayValue('João Silva')
    await user.clear(nameInput)
    await user.type(nameInput, 'João da Silva Atualizado')

    const saveButton = screen.getByRole('button', { name: /^Salvar$/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          name: 'João da Silva Atualizado',
          group: 'Amigos',
          status: 'Pendente',
        })
      )
    })
  })
})