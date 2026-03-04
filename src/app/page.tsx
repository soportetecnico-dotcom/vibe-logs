'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="home-container">
      <div className="hero">
        <h1 className="logo-text">🚀 VibeLogs</h1>
        <p className="subtitle">La bitácora de trabajo del futuro, hoy.</p>

        <div className="cta-group">
          <Link href="/login" className="btn-primary">
            Lanzar Misión (Login)
          </Link>
          <Link href="#features" className="btn-secondary">Saber más</Link>
        </div>
      </div>

      <style jsx>{`
        .home-container {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #1e4188 0%, #050b18 80%);
          text-align: center;
        }
        .logo-text {
          font-size: 4rem;
          margin-bottom: 1rem;
          font-family: var(--font-logo);
          background: linear-gradient(90deg, #ff8c15, #d6009f);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .subtitle {
          font-size: 1.2rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
          max-width: 600px;
        }
        .cta-group {
          display: flex;
          gap: 20px;
          justify-content: center;
        }
        .btn-secondary {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.8rem 2rem;
          border-radius: 12px;
          font-weight: 600;
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: white;
        }
      `}</style>
    </main>
  );
}
