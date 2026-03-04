import React from 'react';
import Link from 'next/link';

export default function TeamLogFeed({ logs }: any) {
    const recentLogs = [...logs]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10); // Mostrar los 10 más recientes por ahora

    return (
        <div className="glass-card widget-container">
            <h3>Feed de Bitácoras Recientes</h3>

            <div className="feed-list">
                {recentLogs.length === 0 ? (
                    <p className="empty-state">No se encontraron bitácoras en este periodo.</p>
                ) : (
                    recentLogs.map((log: any) => (
                        <Link href={`/logs/${log.id}`} key={log.id} className="feed-item">
                            <div className="avatar">
                                {log.profiles?.avatar_url ? (
                                    <img src={log.profiles.avatar_url} alt={log.profiles.full_name} />
                                ) : (
                                    log.profiles?.full_name?.charAt(0) || '?'
                                )}
                            </div>
                            <div className="log-info">
                                <div className="log-header">
                                    <span className="name">{log.profiles?.full_name || 'Desconocido'}</span>
                                    <span className="date">{new Date(log.created_at).toLocaleDateString()}</span>
                                </div>
                                <h4>{log.title || 'Bitácora sin título'}</h4>
                                <div className="tags">
                                    <span className="tag">{log.category || 'General'}</span>
                                    {log.tasks && (
                                        <span className="tag ghost">
                                            {log.tasks.filter((t: any) => t.status === 'completed').length}/{log.tasks.length} tareas
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>

            <style jsx>{`
                .widget-container {
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                h3 {
                    font-size: 1rem;
                    color: rgba(255,255,255,0.7);
                    margin: 0;
                }
                .feed-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .feed-item {
                    display: flex;
                    gap: 16px;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    text-decoration: none;
                    color: white;
                    transition: all 0.2s ease;
                }
                .feed-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.1);
                    transform: translateY(-2px);
                }
                .avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    color: var(--color-energy-orange);
                    overflow: hidden;
                    flex-shrink: 0;
                }
                .avatar img { width: 100%; height: 100%; object-fit: cover; }
                .log-info { display: flex; flex-direction: column; gap: 6px; flex: 1; }
                .log-header {
                    display: flex; justify-content: space-between; align-items: center;
                }
                .name { font-size: 0.85rem; color: rgba(255,255,255,0.5); font-weight: 600; }
                .date { font-size: 0.75rem; color: rgba(255,255,255,0.3); }
                .log-info h4 { margin: 0; font-size: 1.05rem; font-weight: 600; }
                
                .tags { display: flex; gap: 8px; margin-top: 4px; }
                .tag {
                    font-size: 0.7rem;
                    padding: 4px 10px;
                    border-radius: 20px;
                    background: rgba(255, 140, 21, 0.1);
                    color: var(--color-energy-orange);
                    font-weight: 600;
                }
                .tag.ghost {
                    background: rgba(255, 255, 255, 0.05);
                    color: rgba(255, 255, 255, 0.6);
                }

                .empty-state {
                    text-align: center;
                    color: rgba(255,255,255,0.4);
                    padding: 20px 0;
                }
            `}</style>
        </div>
    );
}
