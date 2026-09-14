import React, { useState } from 'react';
import { Heart, User, Mail, Lock } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, oklch(0.97 0.02 15), oklch(0.93 0.04 30))'
    }}>
      <div className="bg-card/80 backdrop-blur-xl border border-border/60 shadow-2xl rounded-3xl w-full max-w-md p-8 sm:p-10 space-y-8 animate-fade-in">
        
        <div className="text-center space-y-3">
          <div className="mx-auto size-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/20">
            <Heart className="size-6 fill-current" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">BrideHub</h1>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground font-display">
              {isRegistering ? 'Crie sua conta' : 'Bem-vinda de volta'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isRegistering ? 'Comece a planejar o casamento dos seus sonhos.' : 'Entre para continuar organizando o seu grande dia.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-border rounded-2xl text-sm font-semibold text-foreground bg-card hover:bg-muted/50 transition-all shadow-sm cursor-pointer"
        >
          <svg className="size-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.8 7.3l3.7 2.9C6.4 7.2 9 5 12 5z"/>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
            <path fill="#FBBC05" d="M5.5 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.8 7.3C.7 9.5 0 10.7 0 12s.7 2.5 1.8 4.7l3.7-2.9z"/>
            <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.6-2.2-6.5-5.2L1.8 16c1.9 3.7 5.7 7 10.2 7z"/>
          </svg>
          Continuar com o Google
        </button>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <span className="relative px-3 text-xs text-muted-foreground bg-card uppercase tracking-widest">ou</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isRegistering && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome Completo / Noivos</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
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
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-ring transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Senha</label>
              {!isRegistering && (
                <a href="#esqueci" onClick={(e) => { e.preventDefault(); alert('Função de recuperar senha em breve!'); }} className="text-xs font-medium text-primary hover:underline">
                  Esqueci minha senha
                </a>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-ring transition-colors"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl shadow-lg shadow-primary/20 transition-all cursor-pointer mt-2"
          >
            {isRegistering ? 'Criar conta gratuita' : 'Entrar'}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-2">
          {isRegistering ? (
            <span>
              Já tem uma conta?{' '}
              <button 
                type="button"
                onClick={() => setIsRegistering(false)} 
                className="font-semibold text-primary hover:underline cursor-pointer bg-transparent border-0 p-0"
              >
                Fazer login
              </button>
            </span>
          ) : (
            <span>
              Ainda não tem conta?{' '}
              <button 
                type="button"
                onClick={() => setIsRegistering(true)} 
                className="font-semibold text-primary hover:underline cursor-pointer bg-transparent border-0 p-0"
              >
                Criar conta gratuita
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
};