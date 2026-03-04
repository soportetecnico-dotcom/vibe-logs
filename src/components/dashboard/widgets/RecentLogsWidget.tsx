'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function RecentLogsWidget() {
    const supabase = createClient();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecentLogs = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('logs')
                .select('id, summary, report_date, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(3);

            if (!error && data) {
                setLogs(data);
            }
            setLoading(false);
        };

        fetchRecentLogs();
    }, []);

    if (loading) return (
        <div className="glass-card recent-logs-widget loading">
            <div className="shimmer"></div>
            <style jsx>{`
                .recent-logs-widget.loading { height: 100%; min-height: 200px; display: flex; align-items: center; justify-content: center; }
                .shimmer { width: 80%; height: 20px; background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>
        </div>
    );

    return (
        <div className="glass-card recent-logs-widget animate-bento">
            <div className="widget-header">
                <h4>Bitácoras Recientes</h4>
                <Link href="/logs" className="view-all">Ver todas</Link>
            </div>

            <div className="logs-list">
                {logs.length > 0 ? (
                    logs.map((log) => (
                        <Link href={`/logs/${log.id}`} key={log.id} className="log-item">
                            <div className="log-info">
                                <span className="log-date">{new Date(log.report_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                                <p className="log-summary">{log.summary || 'Sin resumen'}</p>
                            </div>
                            <span className="arrow">→</span>
                        </Link>
                    ))
                ) : (
                    <div className="no-logs">
                        <p>No has creado bitácoras aún. ¡Empieza hoy!</p>
                        <Link href="/logs/new" className="create-btn">Nueva Bitácora</Link>
                    </div>
                )}
            </div>

            <style jsx>{`
                .recent-logs-widget {
                    padding: 16px 20px;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .widget-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                h4 {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.4);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-weight: 700;
                }

                .view-all {
                    font-size: 0.75rem;
                    color: var(--color-energy-orange);
                    text-decoration: none;
                    font-weight: 600;
                }

                .logs-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .log-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }

                .log-item:hover {
                    background: rgba(255, 255, 255, 0.06);
                    transform: translateX(4px);
                }

                .log-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    max-width: 85%;
                }

                .log-date {
                    font-size: 0.65rem;
                    color: var(--color-vibrant-rose);
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .log-summary {
                    font-size: 0.85rem;
                    color: white;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .arrow {
                    color: rgba(255, 255, 255, 0.2);
                    font-weight: bold;
                }

                .no-logs {
                    text-align: center;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                }

                .no-logs p {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.5);
                }

                .create-btn {
                    padding: 8px 16px;
                    background: var(--color-energy-orange);
                    color: white;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-decoration: none;
                }
            `}</style>
        </div>
    );
}
