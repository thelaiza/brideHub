import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AddGuestToTableDialog } from '../components/dialogs/AddGuestToTableDialog'
import type { Guest, WeddingTable } from '../types'

const mockTable: WeddingTable = {
  id: 'table-1',
  name: 'Mesa 1',
  guests: [],
}

const mockGuests: Guest[] = [
  { id: 'guest-1', name: 'Ana Paula Silva', group: 'Família da noiva', status: 'Confirmado' },
  { id: 'guest-2', name: 'Lucas Ferreira', group: 'Amigos', status: 'Pendente' },
]

describe('AddGuestToTableDialog', () => {
  const onClose = vi.fn()
  const onAssign = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não deve renderizar quando isOpen for false ou table for null', () => {
    const { rerender } = render(
      <AddGuestToTableDialog
        isOpen={false}
        onClose={onClose}
        table={mockTable}
        availableGuests={mockGuests}
        onAssign={onAssign}
      />
    )
    expect(screen.queryByText('Adicionar à Mesa 1')).not.toBeInTheDocument()

    rerender(
      <AddGuestToTableDialog
        isOpen={true}
        onClose={onClose}
        table={null}
        availableGuests={mockGuests}
        onAssign={onAssign}
      />
    )
    expect(screen.queryByText(/Adicionar à/)).not.toBeInTheDocument()
  })

  it('deve exibir mensagem quando não há convidados disponíveis', () => {
    render(
      <AddGuestToTableDialog
        isOpen={true}
        onClose={onClose}
        table={mockTable}
        availableGuests={[]}
        onAssign={onAssign}
      />
    )

    expect(screen.getByText('Todos os convidados já possuem mesa')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeDisabled()
  })

  it('deve selecionar um convidado e chamar onAssign ao enviar', async () => {
    const user = userEvent.setup()
    onAssign.mockResolvedValueOnce(undefined)

    render(
      <AddGuestToTableDialog
        isOpen={true}
        onClose={onClose}
        table={mockTable}
        availableGuests={mockGuests}
        onAssign={onAssign}
      />
    )

    const select = screen.getByLabelText('Convidado')
    await user.selectOptions(select, 'guest-1')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))

    await waitFor(() => {
      expect(onAssign).toHaveBeenCalledWith('table-1', 'guest-1')
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('deve exibir alerta de erro quando onAssign retornar conflito de mesa', async () => {
    const user = userEvent.setup()
    onAssign.mockRejectedValueOnce({
      response: {
        data: { error: 'Este convidado já está alocado na mesa "Mesa 2". Remova-o dela antes de mover.' },
      },
    })

    render(
      <AddGuestToTableDialog
        isOpen={true}
        onClose={onClose}
        table={mockTable}
        availableGuests={mockGuests}
        onAssign={onAssign}
      />
    )

    await user.selectOptions(screen.getByLabelText('Convidado'), 'guest-2')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))

    expect(
      await screen.findByText('Este convidado já está alocado na mesa "Mesa 2". Remova-o dela antes de mover.')
    ).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('deve fechar ao clicar em Cancelar ou no botão de fechar', async () => {
    const user = userEvent.setup()
    render(
      <AddGuestToTableDialog
        isOpen={true}
        onClose={onClose}
        table={mockTable}
        availableGuests={mockGuests}
        onAssign={onAssign}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Fechar modal' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})