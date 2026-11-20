import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoginPage } from '../pages/LoginPage'
import { api, TOKEN_KEY } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    post: vi.fn(),
  },
  TOKEN_KEY: 'bridehub_token',
}))

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (response: { credential: string }) => void
    onError: () => void
  }) => (
    <div data-testid="google-login-mock">
      <button type="button" onClick={() => onSuccess({ credential: 'google-credential' })}>
        google-success
      </button>
      <button type="button" onClick={() => onError()}>
        google-error
      </button>
    </div>
  ),
}))

describe('LoginPage Component', () => {
  const mockOnLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('deve renderizar o formulário de login por padrão', () => {
    render(<LoginPage onLogin={mockOnLogin} />)

    expect(screen.getByText('Bem-vinda de volta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^entrar$/i })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Ex: Laíza & Marcos')).not.toBeInTheDocument()
  })

  it('deve alternar para o modo de registro ao clicar em criar conta', async () => {
    const user = userEvent.setup()
    render(<LoginPage onLogin={mockOnLogin} />)

    const createAccountButton = screen.getByRole('button', { name: /criar conta gratuita/i })
    await user.click(createAccountButton)

    expect(screen.getByText('Crie sua conta')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ex: Laíza & Marcos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /criar conta gratuita/i })).toBeInTheDocument()
  })

  it('deve voltar para o login ao clicar em fazer login no modo de registro', async () => {
    const user = userEvent.setup()
    render(<LoginPage onLogin={mockOnLogin} />)

    await user.click(screen.getByRole('button', { name: /criar conta gratuita/i }))
    await user.click(screen.getByRole('button', { name: /fazer login/i }))

    expect(screen.getByText('Bem-vinda de volta')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Ex: Laíza & Marcos')).not.toBeInTheDocument()
  })

  it('deve realizar o login com sucesso e salvar o token', async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { token: 'fake-jwt-token' },
    })

    render(<LoginPage onLogin={mockOnLogin} />)

    const emailInput = screen.getByPlaceholderText('voce@email.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitButton = screen.getByRole('button', { name: /^entrar$/i })

    await user.type(emailInput, 'laiza@email.com')
    await user.type(passwordInput, 'senha123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'laiza@email.com',
        password: 'senha123',
      })
      expect(localStorage.getItem(TOKEN_KEY)).toBe('fake-jwt-token')
      expect(mockOnLogin).toHaveBeenCalledWith('fake-jwt-token')
    })
  })

  it('deve exibir mensagem de erro quando a autenticação falhar', async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockRejectedValueOnce({
      response: { data: { error: 'Credenciais inválidas' } },
    })

    render(<LoginPage onLogin={mockOnLogin} />)

    await user.type(screen.getByPlaceholderText('voce@email.com'), 'errado@email.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'senhaerrada')
    await user.click(screen.getByRole('button', { name: /^entrar$/i }))

    expect(await screen.findByText('Credenciais inválidas')).toBeInTheDocument()
    expect(mockOnLogin).not.toHaveBeenCalled()
  })

  it('deve exibir a mensagem padrão quando o erro não vem da API', async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockRejectedValueOnce(new Error('network'))

    render(<LoginPage onLogin={mockOnLogin} />)

    await user.type(screen.getByPlaceholderText('voce@email.com'), 'laiza@email.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'senha123')
    await user.click(screen.getByRole('button', { name: /^entrar$/i }))

    expect(
      await screen.findByText('Ocorreu um erro ao processar a requisição. Tente novamente.'),
    ).toBeInTheDocument()
  })

  it('deve mostrar "Processando..." e desabilitar o botão durante a requisição', async () => {
    const user = userEvent.setup()
    let resolvePost!: (value: unknown) => void
    vi.mocked(api.post).mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePost = resolve
      }) as never,
    )

    render(<LoginPage onLogin={mockOnLogin} />)

    await user.type(screen.getByPlaceholderText('voce@email.com'), 'laiza@email.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'senha123')
    await user.click(screen.getByRole('button', { name: /^entrar$/i }))

    const processing = await screen.findByRole('button', { name: /processando/i })
    expect(processing).toBeDisabled()

    resolvePost({ data: { token: 'tok' } })

    await waitFor(() => expect(mockOnLogin).toHaveBeenCalledWith('tok'))
  })

  describe('registro', () => {
    it('deve criar a conta, fazer login automático e salvar o token', async () => {
      const user = userEvent.setup()
      vi.mocked(api.post)
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: { token: 'register-token' } })

      render(<LoginPage onLogin={mockOnLogin} />)

      await user.click(screen.getByRole('button', { name: /criar conta gratuita/i }))
      await user.type(screen.getByPlaceholderText('Ex: Laíza & Marcos'), 'Laíza & Marcos')
      await user.type(screen.getByPlaceholderText('voce@email.com'), 'casal@email.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'senha123')
      await user.click(screen.getByRole('button', { name: /criar conta gratuita/i }))

      await waitFor(() => {
        expect(api.post).toHaveBeenNthCalledWith(1, '/api/auth/register', {
          name: 'Laíza & Marcos',
          email: 'casal@email.com',
          password: 'senha123',
        })
        expect(api.post).toHaveBeenNthCalledWith(2, '/api/auth/login', {
          email: 'casal@email.com',
          password: 'senha123',
        })
        expect(localStorage.getItem(TOKEN_KEY)).toBe('register-token')
        expect(mockOnLogin).toHaveBeenCalledWith('register-token')
      })
    })

    it('deve exibir o erro quando o cadastro falhar', async () => {
      const user = userEvent.setup()
      vi.mocked(api.post).mockRejectedValueOnce({
        response: { data: { error: 'E-mail já está em uso.' } },
      })

      render(<LoginPage onLogin={mockOnLogin} />)

      await user.click(screen.getByRole('button', { name: /criar conta gratuita/i }))
      await user.type(screen.getByPlaceholderText('Ex: Laíza & Marcos'), 'Casal')
      await user.type(screen.getByPlaceholderText('voce@email.com'), 'casal@email.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'senha123')
      await user.click(screen.getByRole('button', { name: /criar conta gratuita/i }))

      expect(await screen.findByText('E-mail já está em uso.')).toBeInTheDocument()
      expect(mockOnLogin).not.toHaveBeenCalled()
    })

    it('deve limpar a mensagem de erro ao alternar entre login e registro', async () => {
      const user = userEvent.setup()
      vi.mocked(api.post).mockRejectedValueOnce({
        response: { data: { error: 'Credenciais inválidas' } },
      })

      render(<LoginPage onLogin={mockOnLogin} />)

      await user.type(screen.getByPlaceholderText('voce@email.com'), 'a@email.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'senha123')
      await user.click(screen.getByRole('button', { name: /^entrar$/i }))
      expect(await screen.findByText('Credenciais inválidas')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /criar conta gratuita/i }))

      expect(screen.queryByText('Credenciais inválidas')).not.toBeInTheDocument()
    })
  })

  describe('recuperação de senha', () => {
    it('deve exibir o modo de recuperação sem campo de senha e sem login do Google', async () => {
      const user = userEvent.setup()
      render(<LoginPage onLogin={mockOnLogin} />)

      await user.click(screen.getByRole('button', { name: /esqueci minha senha/i }))

      expect(screen.getByText('Recuperar senha')).toBeInTheDocument()
      expect(screen.queryByPlaceholderText('••••••••')).not.toBeInTheDocument()
      expect(screen.queryByTestId('google-login-mock')).not.toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /enviar link de recuperação/i }),
      ).toBeInTheDocument()
    })

    it('deve enviar o e-mail e exibir a mensagem retornada pela API', async () => {
      const user = userEvent.setup()
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { message: 'Link enviado, confira seu e-mail.' },
      })

      render(<LoginPage onLogin={mockOnLogin} />)

      await user.click(screen.getByRole('button', { name: /esqueci minha senha/i }))
      await user.type(screen.getByPlaceholderText('voce@email.com'), 'laiza@email.com')
      await user.click(screen.getByRole('button', { name: /enviar link de recuperação/i }))

      expect(await screen.findByText('Link enviado, confira seu e-mail.')).toBeInTheDocument()
      expect(api.post).toHaveBeenCalledWith('/api/auth/forgot-password', {
        email: 'laiza@email.com',
      })
      expect(mockOnLogin).not.toHaveBeenCalled()
    })

    it('deve exibir a mensagem padrão quando a API não retorna mensagem', async () => {
      const user = userEvent.setup()
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} })

      render(<LoginPage onLogin={mockOnLogin} />)

      await user.click(screen.getByRole('button', { name: /esqueci minha senha/i }))
      await user.type(screen.getByPlaceholderText('voce@email.com'), 'laiza@email.com')
      await user.click(screen.getByRole('button', { name: /enviar link de recuperação/i }))

      expect(
        await screen.findByText(
          'Se o e-mail estiver cadastrado, enviaremos um link para redefinição de senha.',
        ),
      ).toBeInTheDocument()
    })

    it('deve exibir erro quando o envio do link falhar', async () => {
      const user = userEvent.setup()
      vi.mocked(api.post).mockRejectedValueOnce({
        response: { data: { error: 'Erro ao processar solicitação de redefinição de senha.' } },
      })

      render(<LoginPage onLogin={mockOnLogin} />)

      await user.click(screen.getByRole('button', { name: /esqueci minha senha/i }))
      await user.type(screen.getByPlaceholderText('voce@email.com'), 'laiza@email.com')
      await user.click(screen.getByRole('button', { name: /enviar link de recuperação/i }))

      expect(
        await screen.findByText('Erro ao processar solicitação de redefinição de senha.'),
      ).toBeInTheDocument()
    })

    it('deve voltar para o login e limpar as mensagens', async () => {
      const user = userEvent.setup()
      vi.mocked(api.post).mockResolvedValueOnce({ data: { message: 'Link enviado.' } })

      render(<LoginPage onLogin={mockOnLogin} />)

      await user.click(screen.getByRole('button', { name: /esqueci minha senha/i }))
      await user.type(screen.getByPlaceholderText('voce@email.com'), 'laiza@email.com')
      await user.click(screen.getByRole('button', { name: /enviar link de recuperação/i }))
      expect(await screen.findByText('Link enviado.')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /voltar para o login/i }))

      expect(screen.getByText('Bem-vinda de volta')).toBeInTheDocument()
      expect(screen.queryByText('Link enviado.')).not.toBeInTheDocument()
      expect(screen.getByTestId('google-login-mock')).toBeInTheDocument()
    })

    it('não deve exibir o link "Esqueci minha senha" no modo de registro', async () => {
      const user = userEvent.setup()
      render(<LoginPage onLogin={mockOnLogin} />)

      await user.click(screen.getByRole('button', { name: /criar conta gratuita/i }))

      expect(
        screen.queryByRole('button', { name: /esqueci minha senha/i }),
      ).not.toBeInTheDocument()
    })
  })

  describe('login com Google', () => {
    it('deve autenticar com o credential do Google e salvar o token', async () => {
      const user = userEvent.setup()
      vi.mocked(api.post).mockResolvedValueOnce({ data: { token: 'google-jwt' } })

      render(<LoginPage onLogin={mockOnLogin} />)

      await user.click(screen.getByText('google-success'))

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/auth/google', {
          token: 'google-credential',
        })
        expect(localStorage.getItem(TOKEN_KEY)).toBe('google-jwt')
        expect(mockOnLogin).toHaveBeenCalledWith('google-jwt')
      })
    })

    it('deve exibir o erro da API quando a autenticação com Google falhar', async () => {
      const user = userEvent.setup()
      vi.mocked(api.post).mockRejectedValueOnce({
        response: { data: { error: 'Token do Google inválido ou expirado.' } },
      })

      render(<LoginPage onLogin={mockOnLogin} />)

      await user.click(screen.getByText('google-success'))

      expect(
        await screen.findByText('Token do Google inválido ou expirado.'),
      ).toBeInTheDocument()
      expect(mockOnLogin).not.toHaveBeenCalled()
    })

    it('deve exibir a mensagem padrão quando o erro do Google não vem da API', async () => {
      const user = userEvent.setup()
      vi.mocked(api.post).mockRejectedValueOnce(new Error('network'))

      render(<LoginPage onLogin={mockOnLogin} />)

      await user.click(screen.getByText('google-success'))

      expect(
        await screen.findByText('Erro ao autenticar com o Google. Tente novamente.'),
      ).toBeInTheDocument()
    })

    it('deve exibir erro quando o widget do Google falhar', async () => {
      const user = userEvent.setup()
      render(<LoginPage onLogin={mockOnLogin} />)

      await user.click(screen.getByText('google-error'))

      expect(await screen.findByText('Falha na autenticação com o Google.')).toBeInTheDocument()
      expect(api.post).not.toHaveBeenCalled()
    })
  })
})