'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function StatsWidget() {
    const supabase = createClient();
    const [stats, setStats] = useState({
        totalLogs: 0,
        completedTasks: 0,
        efficiency: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Obtener perfil para saber el rol y org_id
            const { data: profile } = await (supabase.from('profiles') as any)
                .select('role, org_id')
                .eq('id', user.id)
                .single();

            const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';
            const orgId = profile?.org_id;

            // 2. Count Logs (Propios o de Equipo)
            let logQuery = (supabase.from('logs') as any).select('*', { count: 'exact', head: true });
            if (isAdmin && orgId) {
                logQuery = logQuery.eq('org_id', orgId);
            } else {
                logQuery = logQuery.eq('user_id', user.id);
            }
            const { count: logCount } = await logQuery;

            // 3. Count Today's Completed Tasks
            const today = new Date().toISOString().split('T')[0];
            let taskQuery = (supabase.from('user_tasks') as any)
                .select('*', { count: 'exact', head: true })
                .eq('status', 'done')
                .gte('completed_at', today);

            if (isAdmin && orgId) {
                // Para el equipo, necesitamos filtrar perfiles de la org
                const { data: teamIds } = await (supabase.from('profiles') as any)
                    .select('id')
                    .eq('org_id', orgId);
                const ids = teamIds?.map((p: any) => p.id) || [];
                taskQuery = taskQuery.in('user_id', ids);
            } else {
                taskQuery = taskQuery.eq('user_id', user.id);
            }
            const { count: taskCount } = await taskQuery;

            setStats({
                totalLogs: logCount || 0,
                completedTasks: taskCount || 0,
                efficiency: taskCount ? Math.min(100, (taskCount as number) * 15) : 0
            });
            setLoading(false);
        };

        fetchStats();
    }, []);

    if (loading) return (
        <div className="glass-card stats-widget loading">
            <div className="shimmer"></div>
            <style jsx>{`
        .stats-widget.loading { height: 100%; min-height: 200px; display: flex; align-items: center; justify-content: center; }
        .shimmer { width: 80%; height: 20px; background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
        </div>
    );

    return (
        <div className="glass-card stats-widget animate-bento">
            <div className="stat-item">
                <div className="stat-label-group">
                    <span className="stat-label">Bitácoras</span>
                    <span className="stat-value">{stats.totalLogs}</span>
                </div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
                <div className="stat-label-group">
                    <span className="stat-label">Completado Hoy</span>
                    <span className="stat-value">{stats.completedTasks}</span>
                </div>
            </div>
            <div className="stat-divider"></div>
            <div className="efficiency-section">
                <div className="stat-item">
                    <span className="stat-label">Eficiencia</span>
                    <span className="stat-percent">{stats.efficiency}%</span>
                </div>
                <div className="efficiency-bar-container">
                    <div className="efficiency-bar" style={{ width: `${stats.efficiency}%` }}></div>
                </div>
            </div>

            <style jsx>{`
        .stats-widget {
          padding: 16px 20px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }

        .stat-label-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-label {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 700;
        }

        .stat-value {
          font-size: 1.5rem;
          color: white;
          font-weight: 700;
        }

        .stat-percent {
            font-size: 0.8rem;
            color: var(--color-energy-orange);
            font-weight: 700;
        }

        .stat-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.05);
          width: 100%;
        }

        .efficiency-section {
          margin-top: 8px;
        }

        .efficiency-bar-container {
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 2px;
            margin-top: 8px;
            overflow: hidden;
        }

        .efficiency-bar {
            height: 100%;
            background: linear-gradient(90deg, var(--color-energy-orange), var(--color-vibrant-rose));
            border-radius: 2px;
            transition: width 1s ease-out;
        }
      `}</style>
        </div>
    );
}
