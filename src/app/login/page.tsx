'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      let errorMessage = error.message;
      if (error.message.includes('rate limit exceeded')) {
        errorMessage = 'Has excedido el límite de intentos. Por favor, espera unos minutos antes de intentar de nuevo.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'El correo electrónico no es válido.';
      }
      setMessage({ type: 'error', text: errorMessage });
    } else {
      setMessage({ type: 'success', text: '¡Enlace mágico enviado! Revisa tu correo.' });
    }
    setLoading(false);
  };

  const handleDevLogin = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: 'dev@vibelogs.com',
      password: 'vibelogs_dev_pass',
    });

    if (error) {
      setMessage({
        type: 'error',
        text: 'Crea el usuario "dev@vibelogs.com" / "vibelogs_dev_pass" en tu Supabase Dashboard para usar esta función.'
      });
    } else {
      window.location.href = '/dashboard';
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="logo-text">🚀 VibeLogs</h1>
        <p className="subtitle">Tu espacio de productividad espacial</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="astronauta@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary full-width">
            {loading ? 'Lanzando...' : 'Entrar con Enlace Mágico'}
          </button>
        </form>

        {message && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' ? '✨' : '⚠️'} {message.text}
          </div>
        )}

        <div className="dev-section">
          <div className="divider">
            <span>O también</span>
          </div>
          <button
            type="button"
            onClick={handleDevLogin}
            className="btn-dev"
            disabled={loading}
          >
            🛠️ Entrar como Desarrollador
          </button>
          <p className="dev-hint">Usa esta opción si Supabase bloqueó tus correos.</p>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: radial-gradient(circle at top right, #1e4188 0%, #050b18 60%);
          padding: 20px;
        }

        .login-card {
          background: rgba(12, 21, 41, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 24px;
          width: 100%;
          max-width: 400px;
          text-align: center;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        }

        .logo-text {
          font-size: 2.5rem;
          margin-bottom: 8px;
          font-family: var(--font-logo);
          background: linear-gradient(90deg, #ff8c15, #d6009f);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          color: var(--text-secondary);
          margin-bottom: 32px;
          font-size: 0.95rem;
        }

        .login-form {
          text-align: left;
        }

        .input-group {
          margin-bottom: 24px;
        }

        .input-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 14px 16px;
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }

        input:focus {
          border-color: var(--color-energy-orange);
        }

        .full-width {
          width: 100%;
          padding: 14px;
          font-size: 1rem;
        }

        .message {
          margin-top: 24px;
          padding: 12px;
          border-radius: 12px;
          font-size: 0.9rem;
        }

        .message.success {
          background: rgba(0, 255, 0, 0.1);
          color: #4ade80;
          border: 1px solid rgba(74, 222, 128, 0.2);
        }

        .message.error {
          background: rgba(255, 0, 0, 0.1);
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.2);
        }

        .dev-section {
          margin-top: 32px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 24px;
        }

        .divider {
          position: relative;
          text-align: center;
          margin-bottom: 24px;
        }

        .divider::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
        }

        .divider span {
          position: relative;
          background: #0c1529;
          padding: 0 12px;
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        .btn-dev {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #a0aec0;
          padding: 12px;
          border-radius: 12px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-dev:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .dev-hint {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.2);
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}
