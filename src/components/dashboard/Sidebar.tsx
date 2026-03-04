'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function Sidebar() {
  const pathname = usePathname();
  const supabase = createClient();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await (supabase as any).from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile) setRole(profile.role);
    };
    fetchRole();
  }, [supabase]);

  const menuItems = [
    { name: 'Mi Espacio', icon: '🏠', path: '/dashboard' },
    { name: 'Bitácoras', icon: '📝', path: '/logs' },
  ];

  // Solo admin/owner/manager ven "Equipo"
  if (role === 'admin' || role === 'owner' || role === 'manager') {
    menuItems.push({ name: 'Equipo', icon: '👥', path: '/team' });
  }

  menuItems.push({ name: 'Configuración', icon: '⚙️', path: '/settings' });

  return (
    <aside className="sidebar glass-card">
      <div className="sidebar-logo">
        <span className="rocket">🚀</span>
        <span className="logo-text">VibeLogs</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`nav-item ${pathname === item.path ? 'active' : ''}`}
          >
            <span className="icon">{item.icon}</span>
            <span className="name">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="help-card">
          <p>¿Necesitas ayuda?</p>
          <button className="btn-help">Centro de Soporte</button>
        </div>
      </div>

      <style jsx>{`
        .sidebar {
          width: 260px;
          height: calc(100vh - 40px);
          position: fixed;
          left: 20px;
          top: 20px;
          display: flex;
          flex-direction: column;
          padding: 32px 24px;
          z-index: 100;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 48px;
          text-decoration: none !important;
        }

        .rocket {
          font-size: 1.8rem;
        }

        .logo-text {
          font-weight: 800;
          font-family: var(--font-logo);
          background: linear-gradient(90deg, var(--color-energy-orange), var(--color-vibrant-rose));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-size: 1.4rem;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        :global(.nav-item) {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 18px;
          border-radius: 16px;
          color: var(--text-secondary);
          text-decoration: none !important;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        :global(.nav-item:hover) {
          background: rgba(255, 255, 255, 0.05);
          color: white;
          transform: translateX(5px);
        }

        :global(.nav-item.active) {
          background: rgba(255, 140, 21, 0.1);
          color: var(--color-energy-orange);
          font-weight: 700;
          box-shadow: inset 0 0 0 1px rgba(255, 140, 21, 0.2);
        }

        .icon {
          font-size: 1.3rem;
        }

        .name {
          font-size: 1rem;
        }

        .sidebar-footer {
          margin-top: auto;
        }

        .help-card {
          background: rgba(255, 255, 255, 0.03);
          padding: 20px;
          border-radius: 20px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .help-card p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }

        .btn-help {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 10px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .btn-help:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </aside>
  );
}
