import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    post: vi.fn(),
  },
}))

describe('ResetPasswordPage Component', () => {
  const mockOnBackToLogin = vi.fn()

  const renderPage = () =>
    render(<ResetPasswordPage token="reset-token-123" onBackToLogin={mockOnBackToLogin} />)

  const fillPasswords = async (
    user: ReturnType<typeof userEvent.setup>,
    password: string,
    confirm: string,
  ) => {
    await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), password)
    await user.type(screen.getByPlaceholderText('Repita a nova senha'), confirm)
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar o formulário de nova senha', () => {
    renderPage()

    expect(screen.getByText('Criar nova senha')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Mínimo 6 caracteres')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Repita a nova senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /salvar nova senha/i })).toBeInTheDocument()
  })

  it('deve exibir erro quando a senha tem menos de 6 caracteres', () => {
    const { container } = renderPage()

    fireEvent.change(screen.getByPlaceholderText('Mínimo 6 caracteres'), {
      target: { value: '123' },
    })
    fireEvent.change(screen.getByPlaceholderText('Repita a nova senha'), {
      target: { value: '123' },
    })
    // fireEvent.submit ignora a validação nativa do navegador (minLength)
    fireEvent.submit(container.querySelector('form') as HTMLFormElement)

    expect(screen.getByText('A nova senha deve ter pelo menos 6 caracteres.')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('deve exibir erro quando as senhas não coincidem', async () => {
    const user = userEvent.setup()
    renderPage()

    await fillPasswords(user, 'novasenha123', 'outrasenha456')
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('deve redefinir a senha e exibir a mensagem de sucesso da API', async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { message: 'Senha redefinida com sucesso! Você já pode fazer login.' },
    })
    renderPage()

    await fillPasswords(user, 'novasenha123', 'novasenha123')
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    expect(
      await screen.findByText('Senha redefinida com sucesso! Você já pode fazer login.'),
    ).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/api/auth/reset-password', {
      token: 'reset-token-123',
      password: 'novasenha123',
    })
    expect(screen.queryByPlaceholderText('Mínimo 6 caracteres')).not.toBeInTheDocument()
  })

  it('deve exibir a mensagem de sucesso padrão quando a API não retorna mensagem', async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockResolvedValueOnce({ data: {} })
    renderPage()

    await fillPasswords(user, 'novasenha123', 'novasenha123')
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    expect(await screen.findByText('Senha redefinida com sucesso!')).toBeInTheDocument()
  })

  it('deve chamar onBackToLogin ao clicar em "Ir para o login" após o sucesso', async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockResolvedValueOnce({ data: { message: 'Ok!' } })
    renderPage()

    await fillPasswords(user, 'novasenha123', 'novasenha123')
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    await user.click(await screen.findByRole('button', { name: /ir para o login/i }))

    expect(mockOnBackToLogin).toHaveBeenCalledTimes(1)
  })

  it('deve exibir o erro retornado pela API', async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockRejectedValueOnce({
      response: { data: { error: 'Link de redefinição inválido ou expirado.' } },
    })
    renderPage()

    await fillPasswords(user, 'novasenha123', 'novasenha123')
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    expect(
      await screen.findByText('Link de redefinição inválido ou expirado.'),
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Mínimo 6 caracteres')).toBeInTheDocument()
  })

  it('deve exibir a mensagem padrão quando o erro não vem da API', async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockRejectedValueOnce(new Error('network'))
    renderPage()

    await fillPasswords(user, 'novasenha123', 'novasenha123')
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    expect(
      await screen.findByText('Não foi possível redefinir a senha. Solicite um novo link.'),
    ).toBeInTheDocument()
  })

  it('deve mostrar "Salvando..." e desabilitar o botão durante a requisição', async () => {
    const user = userEvent.setup()
    let resolvePost!: (value: unknown) => void
    vi.mocked(api.post).mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePost = resolve
      }) as never,
    )
    renderPage()

    await fillPasswords(user, 'novasenha123', 'novasenha123')
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    const saving = await screen.findByRole('button', { name: /salvando/i })
    expect(saving).toBeDisabled()

    resolvePost({ data: { message: 'Pronto!' } })

    await waitFor(() => expect(screen.getByText('Pronto!')).toBeInTheDocument())
  })

  it('deve chamar onBackToLogin ao clicar em "Voltar para o login"', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /voltar para o login/i }))

    expect(mockOnBackToLogin).toHaveBeenCalledTimes(1)
  })
})