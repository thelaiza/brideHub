import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EditWeddingDialog } from '../components/dialogs/EditWeddingDialog'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    put: vi.fn(),
  },
}))

describe('EditWeddingDialog Component', () => {
  const mockInitialData = {
    bride: 'Laíza',
    groom: 'Marcos',
    date: '2026-10-04T00:00:00.000Z',
    venue: 'Joinville, SC',
    budget: 50000,
  }

  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar os children e abrir o modal ao clicar', async () => {
    const user = userEvent.setup()

    render(
      <EditWeddingDialog initialData={mockInitialData} onSave={mockOnSave}>
        <button>Editar Casamento</button>
      </EditWeddingDialog>
    )

    const triggerButton = screen.getByRole('button', { name: /editar casamento/i })
    expect(triggerButton).toBeInTheDocument()

    expect(screen.queryByText('Editar Dados do Casamento')).not.toBeInTheDocument()

    await user.click(triggerButton)

    expect(screen.getByText('Editar Dados do Casamento')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Laíza')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Marcos')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2026-10-04')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Joinville, SC')).toBeInTheDocument()
    expect(screen.getByDisplayValue('50000')).toBeInTheDocument()
  })

  it('deve fechar o modal ao clicar em cancelar', async () => {
    const user = userEvent.setup()

    render(
      <EditWeddingDialog initialData={mockInitialData} onSave={mockOnSave}>
        <button>Editar Casamento</button>
      </EditWeddingDialog>
    )

    await user.click(screen.getByRole('button', { name: /editar casamento/i }))
    expect(screen.getByText('Editar Dados do Casamento')).toBeInTheDocument()

    const cancelButton = screen.getByRole('button', { name: /cancelar/i })
    await user.click(cancelButton)

    expect(screen.queryByText('Editar Dados do Casamento')).not.toBeInTheDocument()
  })

  it('deve enviar os dados atualizados via put e chamar onSave ao submeter o formulário', async () => {
    const user = userEvent.setup()
    const updatedResponse = { ...mockInitialData, venue: 'Balneário Camboriú, SC' }
    vi.mocked(api.put).mockResolvedValueOnce({ data: updatedResponse })

    render(
      <EditWeddingDialog initialData={mockInitialData} onSave={mockOnSave}>
        <button>Editar Casamento</button>
      </EditWeddingDialog>
    )

    await user.click(screen.getByRole('button', { name: /editar casamento/i }))

    const venueInput = screen.getByDisplayValue('Joinville, SC')
    await user.clear(venueInput)
    await user.type(venueInput, 'Balneário Camboriú, SC')

    const submitButton = screen.getByRole('button', { name: /salvar alterações/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledTimes(1)
      expect(api.put).toHaveBeenCalledWith('/api/wedding', {
        bride: 'Laíza',
        groom: 'Marcos',
        date: '2026-10-04',
        venue: 'Balneário Camboriú, SC',
        budget: 50000,
      })
      expect(mockOnSave).toHaveBeenCalledWith(updatedResponse)
      expect(screen.queryByText('Editar Dados do Casamento')).not.toBeInTheDocument()
    })
  })
})