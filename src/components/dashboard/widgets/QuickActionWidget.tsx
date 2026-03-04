'use client';

import Link from 'next/link';

export default function QuickActionWidget() {
  return (
    <div className="glass-card help-card animate-bento">
      <div className="quick-action-content">
        <h4>Panel de Despegue</h4>
        <div className="action-buttons">
          <Link href="/logs/new" className="action-btn primary">
            <span className="icon">🚀</span>
            <span className="text">Nueva Bitácora</span>
          </Link>
          <Link href="/logs" className="action-btn secondary">
            <span className="icon">📂</span>
            <span className="text">Historial</span>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .help-card {
          padding: 24px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .quick-action-content {
          width: 100%;
          text-align: left;
        }

        h4 {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 20px;
          font-weight: 700;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        :global(.action-btn) {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-radius: 14px;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          text-decoration: none !important;
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
        }

        :global(.action-btn.primary) {
          background: var(--color-energy-orange);
          box-shadow: 0 4px 15px rgba(255, 140, 21, 0.3);
        }

        :global(.action-btn.secondary) {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        :global(.action-btn:hover) {
          transform: translateY(-3px) scale(1.02);
        }

        :global(.action-btn.primary:hover) {
          box-shadow: 0 8px 25px rgba(255, 140, 21, 0.5);
        }

        :global(.action-btn.secondary:hover) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
