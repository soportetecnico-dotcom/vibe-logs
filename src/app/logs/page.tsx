'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import Link from 'next/link';

export default function LogsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Cargar perfil con organización
      const { data: profileData } = await (supabase
        .from('profiles') as any)
        .select(`
          *,
          organizations (
            name,
            primary_color,
            slug
          )
        `)
        .eq('id', user.id)
        .single();

      if (!profileData || !(profileData as any).org_id) {
        router.push('/onboarding');
        return;
      }

      const isAdmin = (profileData as any).role === 'admin';
      setProfile(profileData);

      // Cargar bitácoras
      let query = supabase
        .from('logs')
        .select(`
          *,
          profiles (full_name)
        `);

      if (isAdmin) {
        // El admin ve todo lo de la organización
        query = query.eq('org_id', (profileData as any).org_id);
      } else {
        // El empleado solo ve lo suyo
        query = query.eq('user_id', user.id);
      }

      const { data: logsData, error } = await query.order('report_date', { ascending: false });

      if (error) {
        console.error("Error cargando bitácoras (detalle):", error.message, error.details, error.hint, error);
      }
      console.log("LogsData recibido:", logsData);

      setLogs(logsData || []);
      setFilteredLogs(logsData || []);
      setLoading(false);
    };

    loadData();
  }, [router]);

  if (loading) return <div className="loading">Cargando bitácoras...</div>;

  return (
    <div className="dashboard-wrapper">
      <Sidebar />

      <main className="main-content">
        <DashboardHeader profile={profile} />

        <div className="section-header animate-bento">
          <div className="title-block">
            <h2>Mis Bitácoras 📝</h2>
            <p className="subtitle">Historial de misiones y reportes diarios.</p>
          </div>

          <div className="header-actions">
            <input
              type="text"
              placeholder="Buscar por fecha o contenido..."
              className="search-input"
              onChange={(e) => {
                const term = e.target.value.toLowerCase();
                // Opcional: Filtro en cliente para velocidad
                setFilteredLogs(logs.filter(log =>
                  log.report_date.includes(term) ||
                  (log.learning && log.learning.toLowerCase().includes(term)) ||
                  (log.notes && log.notes.toLowerCase().includes(term))
                ));
              }}
            />
            <Link href="/logs/new" className="btn-primary">
              + Nueva Bitácora
            </Link>
          </div>
        </div>

        <div className="logs-grid animate-bento">
          {filteredLogs.length === 0 ? (
            <div className="glass-card empty-logs">
              <p>No se encontraron bitácoras que coincidan.</p>
              {logs.length === 0 && <Link href="/logs/new" className="text-link">Comenzar mi primer reporte →</Link>}
            </div>
          ) : (
            filteredLogs.map(log => (
              <Link href={`/logs/${log.id}`} key={log.id} className="glass-card log-item">
                <div className="log-header">
                  <span className="log-date">{new Date(log.report_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span className="log-author">{log.profiles?.full_name || 'Yo'}</span>
                </div>
                <div className="log-preview">
                  <p className="log-learning-preview">🧠 {log.learning ? (log.learning.slice(0, 80) + '...') : 'Sin registros de aprendizaje.'}</p>
                </div>
                <div className="log-footer">
                  <span className="btn-view">Ver Detalles →</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>

      <style jsx>{`
        .dashboard-wrapper {
          min-height: 100vh;
          background-color: var(--bg-deep);
          display: flex;
        }

        .main-content {
          margin-left: 300px;
          padding: 20px 40px 40px 0;
          flex: 1;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .header-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .search-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 10px 20px;
          border-radius: 12px;
          outline: none;
          width: 250px;
          transition: all 0.3s;
        }

        .search-input:focus {
          border-color: var(--color-energy-orange);
          width: 300px;
        }

        h2 {
          font-size: 1.8rem;
          margin-bottom: 4px;
        }

        .subtitle {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .logs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        :global(.log-item) {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          text-decoration: none !important;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          color: inherit;
        }

        :global(.log-item:hover) {
          transform: translateY(-5px) scale(1.02);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .log-date {
          font-weight: 700;
          font-size: 0.95rem;
          color: white;
        }

        .log-author {
          font-size: 0.7rem;
          background: rgba(255, 140, 21, 0.1);
          color: var(--color-energy-orange);
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .log-preview {
          flex: 1;
        }

        .log-learning-preview {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.6;
        }

        .btn-view {
          color: var(--color-energy-orange);
          font-weight: 700;
          font-size: 0.85rem;
        }

        .empty-logs {
          grid-column: 1 / -1;
          padding: 60px;
          text-align: center;
          color: var(--text-secondary);
        }

        .text-link {
          color: var(--color-energy-orange);
          text-decoration: none;
          display: block;
          margin-top: 12px;
          font-weight: 600;
        }

        .loading {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          background: var(--bg-deep);
        }
      `}</style>
    </div>
  );
}
