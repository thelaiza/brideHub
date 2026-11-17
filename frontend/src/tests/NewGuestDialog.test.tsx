import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NewGuestDialog } from '../components/dialogs/NewGuestDialog'

describe('NewGuestDialog Component', () => {
  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não deve renderizar nada se isOpen for falso', () => {
    const { container } = render(
      <NewGuestDialog isOpen={false} onClose={mockOnClose} onSave={mockOnSave} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('deve renderizar o modal de novo convidado corretamente', () => {
    render(
      <NewGuestDialog isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
    )

    expect(screen.getByText('Novo Convidado')).toBeInTheDocument()
    // Placeholder ajustado para corresponder ao componente real
    expect(screen.getByPlaceholderText(/Nome completo do convidado/i)).toBeInTheDocument()
  })

  it('deve fechar o modal ao clicar em Cancelar', async () => {
    const user = userEvent.setup()
    render(
      <NewGuestDialog isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
    )

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i })
    await user.click(cancelButton)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('deve preencher e salvar um novo convidado com sucesso', async () => {
    const user = userEvent.setup()
    mockOnSave.mockResolvedValueOnce(undefined)

    render(
      <NewGuestDialog isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
    )

    const nameInput = screen.getByPlaceholderText(/Nome completo do convidado/i)
    await user.type(nameInput, 'Ana Paula')

    const emailInput = screen.getByPlaceholderText(/email@exemplo.com/i)
    await user.type(emailInput, 'ana@email.com')

    const saveButton = screen.getByRole('button', { name: /^Adicionar$/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Ana Paula',
          email: 'ana@email.com',
          status: 'Pendente',
        })
      )
    })
  })
})