import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NewTableDialog } from '../components/dialogs/NewTableDialog'

describe('NewTableDialog', () => {
  const onClose = vi.fn()
  const onSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não deve renderizar nada quando isOpen for false', () => {
    render(<NewTableDialog isOpen={false} onClose={onClose} onSave={onSave} />)

    expect(screen.queryByText('Nova mesa')).not.toBeInTheDocument()
  })

  it('deve renderizar com o defaultName e fechar ao clicar em Cancelar ou fechar', async () => {
    const user = userEvent.setup()
    render(
      <NewTableDialog
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
        defaultName="Mesa 1"
      />
    )

    const input = screen.getByLabelText('Nome da mesa') as HTMLInputElement
    expect(input.value).toBe('Mesa 1')

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Fechar modal' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('deve chamar onSave com o nome limpo e fechar o modal ao enviar', async () => {
    const user = userEvent.setup()
    onSave.mockResolvedValueOnce(undefined)

    render(
      <NewTableDialog
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
        defaultName=""
      />
    )

    const input = screen.getByLabelText('Nome da mesa')
    await user.type(input, '  Mesa Família  ')
    await user.click(screen.getByRole('button', { name: 'Criar mesa' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('Mesa Família')
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('não deve submeter quando o nome contém apenas espaços', async () => {
    const user = userEvent.setup()
    render(
      <NewTableDialog
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
        defaultName=""
      />
    )

    const input = screen.getByLabelText('Nome da mesa')
    await user.type(input, '    ')
    const submitBtn = screen.getByRole('button', { name: 'Criar mesa' })
    expect(submitBtn).toBeDisabled()

    await user.click(submitBtn)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('deve exibir mensagem de erro da API quando onSave falhar', async () => {
    const user = userEvent.setup()
    onSave.mockRejectedValueOnce({
      response: { data: { error: 'Já existe uma mesa com este nome.' } },
    })

    render(
      <NewTableDialog
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
        defaultName="Mesa 1"
      />
    )

    await user.click(screen.getByRole('button', { name: 'Criar mesa' }))

    expect(await screen.findByText('Já existe uma mesa com este nome.')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('deve exibir mensagem de erro padrão quando onSave falhar sem mensagem da API', async () => {
    const user = userEvent.setup()
    onSave.mockRejectedValueOnce(new Error('Falha de rede'))

    render(
      <NewTableDialog
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
        defaultName="Mesa 2"
      />
    )

    await user.click(screen.getByRole('button', { name: 'Criar mesa' }))

    expect(await screen.findByText('Não foi possível criar a mesa.')).toBeInTheDocument()
  })
})