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
  GoogleLogin: () => <div data-testid="google-login-mock">Google Login</div>,
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
  })
})