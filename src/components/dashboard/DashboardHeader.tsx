'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface HeaderProps {
  profile: any;
}

export default function DashboardHeader({ profile }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="dashboard-header animate-bento">
      <div className="org-info">
        <div
          className="org-badge"
          style={{ background: profile.organizations?.primary_color || 'var(--color-space-blue)' }}
        ></div>
        <span className="org-name">{profile.organizations?.name || 'VibeLogs'}</span>
      </div>

      <div className="user-controls">
        <div className="notifications">
          <span className="bell">🔔</span>
        </div>

        <div className="user-profile">
          <div className="avatar">
            {profile.full_name?.charAt(0) || 'A'}
          </div>
          <div className="user-details">
            <span className="user-name">{profile.full_name || 'Astronauta'}</span>
            <span className="user-role">Administrador</span>
          </div>
        </div>

        <button onClick={handleLogout} className="btn-logout">
          Salir
        </button>
      </div>

      <style jsx>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          margin-bottom: 8px;
        }

        .org-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .org-badge {
          width: 12px;
          height: 12px;
          border-radius: 4px;
        }

        .org-name {
          font-weight: 600;
          color: var(--text-secondary);
        }

        .user-controls {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .notifications {
          font-size: 1.2rem;
          cursor: pointer;
          opacity: 0.6;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #1e4188, #4a90e2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .user-role {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .btn-logout {
          background: rgba(255, 0, 0, 0.05);
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.1);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
        }

        .btn-logout:hover {
          background: rgba(255, 0, 0, 0.1);
        }
      `}</style>
    </header>
  );
}
