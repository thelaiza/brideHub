import React, { useState } from 'react';
import { User, Mail, Lock, ArrowLeft } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { api, TOKEN_KEY } from '../services/api';
import logoBrideHub from '../assets/logo.png';

interface LoginPageProps {
  onLogin: (token?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      if (isForgotPassword) {
        const response = await api.post('/api/auth/forgot-password', { email });
        setInfoMessage(
          response.data?.message ||
            'Se o e-mail estiver cadastrado, enviaremos um link para redefinição de senha.'
        );
        return;
      }

      if (isRegistering) {
        await api.post('/api/auth/register', {
          name,
          email,
          password,
        });

        const response = await api.post('/api/auth/login', {
          email,
          password,
        });

        const { token } = response.data;
        localStorage.setItem(TOKEN_KEY, token);
        onLogin(token);
      } else {
        const response = await api.post('/api/auth/login', {
          email,
          password,
        });

        const { token } = response.data;
        localStorage.setItem(TOKEN_KEY, token);
        onLogin(token);
      }
    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      setErrorMessage(
        error.response?.data?.error || 'Ocorreu um erro ao processar a requisição. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      setErrorMessage('');

      const response = await api.post('/api/auth/google', {
        token: credentialResponse.credential,
      });

      const { token } = response.data;
      localStorage.setItem(TOKEN_KEY, token);
      onLogin(token);
    } catch (error: any) {
      console.error('Erro no login com Google:', error);
      setErrorMessage(
        error.response?.data?.error || 'Erro ao autenticar com o Google. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  let headingTitle = 'Bem-vinda ao BrideHub!';
  let headingSubtitle = 'Entre para continuar organizando o seu grande dia.';
  let submitLabel = 'Entrar';

  if (isForgotPassword) {
    headingTitle = 'Recuperar senha';
    headingSubtitle = 'Informe seu e-mail para receber o link de redefinição.';
    submitLabel = 'Enviar link de recuperação';
  } else if (isRegistering) {
    headingTitle = 'Crie sua conta';
    headingSubtitle = 'Comece a planejar o casamento dos seus sonhos.';
    submitLabel = 'Criar conta gratuita';
  }

  let footerContent: React.ReactNode;
  if (isForgotPassword) {
    footerContent = (
      <button
        type="button"
        onClick={() => {
          setIsForgotPassword(false);
          setErrorMessage('');
          setInfoMessage('');
        }}
        className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline cursor-pointer bg-transparent border-0 p-0"
      >
        <ArrowLeft size={14} />
        Voltar para o login
      </button>
    );
  } else if (isRegistering) {
    footerContent = (
      <span>
        Já tem uma conta?{' '}
        <button
          type="button"
          onClick={() => {
            setIsRegistering(false);
            setErrorMessage('');
          }}
          className="font-semibold text-primary hover:underline cursor-pointer bg-transparent border-0 p-0"
        >
          Fazer login
        </button>
      </span>
    );
  } else {
    footerContent = (
      <span>
        Ainda não tem conta?{' '}
        <button
          type="button"
          onClick={() => {
            setIsRegistering(true);
            setErrorMessage('');
          }}
          className="font-semibold text-primary hover:underline cursor-pointer bg-transparent border-0 p-0"
        >
          Criar conta gratuita
        </button>
      </span>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, oklch(0.97 0.02 15), oklch(0.93 0.04 30))',
      }}
    >
      <div className="bg-card/80 backdrop-blur-xl border border-border/60 shadow-2xl rounded-3xl w-full max-w-md p-8 sm:p-10 space-y-8 animate-fade-in">
        <div className="text-center space-y-3">
          <img
            src={logoBrideHub}
            alt="BrideHub Logo"
            className="mx-auto size-16 object-contain"
          />
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">BrideHub</h1>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground font-display">{headingTitle}</h2>
            <p className="text-xs text-muted-foreground">{headingSubtitle}</p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
            {errorMessage}
          </div>
        )}

        {infoMessage && (
          <div className="p-3 text-xs text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
            {infoMessage}
          </div>
        )}

        {!isForgotPassword && (
          <>
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setErrorMessage('Falha na autenticação com o Google.');
                }}
                useOneTap={false}
                theme="outline"
                shape="pill"
                width="100%"
              />
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <span className="relative px-3 text-xs text-muted-foreground bg-card uppercase tracking-widest">
                ou
              </span>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && !isForgotPassword && (
            <div className="space-y-1.5">
              <label
                htmlFor="register-name"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Nome Completo / Noivos
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  id="register-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Laíza & Marcos"
                  className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-ring transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-ring transition-colors"
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Senha
                </label>
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setErrorMessage('');
                      setInfoMessage('');
                    }}
                    className="text-xs font-medium text-primary hover:underline cursor-pointer bg-transparent border-0 p-0"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-ring transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl shadow-lg shadow-primary/20 transition-all cursor-pointer mt-2 disabled:opacity-50"
          >
            {loading ? 'Processando...' : submitLabel}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-2">{footerContent}</div>
      </div>
    </div>
  );
};