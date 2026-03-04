import React, { useMemo } from 'react';

export default function TeamTaskEfficiencyWidget({ logs, isGlobal }: any) {
    const { total, completed, pending, percentage } = useMemo(() => {
        let total = 0;
        let completed = 0;
        let pending = 0;

        logs.forEach((log: any) => {
            if (log.tasks && Array.isArray(log.tasks)) {
                log.tasks.forEach((t: any) => {
                    total++;
                    if (t.status === 'completed') completed++;
                    else pending++;
                });
            }
        });

        let percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        return { total, completed, pending, percentage };
    }, [logs]);

    return (
        <div className="glass-card widget-container">
            <h3>{isGlobal ? "Eficiencia de Tareas del Equipo" : "Eficiencia de Tareas"}</h3>

            <div className="content">
                <div className="stats-row">
                    <div className="stat">
                        <span className="stat-label">Completadas</span>
                        <span className="stat-value success">{completed}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">Pendientes</span>
                        <span className="stat-value warning">{pending}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">Hit Rate</span>
                        <span className="stat-value highlight">{percentage}%</span>
                    </div>
                </div>

                <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${percentage}%` }}></div>
                </div>
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
                .content {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .stats-row {
                    display: flex;
                    justify-content: space-between;
                }
                .stat {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .stat-label {
                    font-size: 0.75rem;
                    color: rgba(255,255,255,0.4);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                }
                .success { color: #10b981; }
                .warning { color: #f59e0b; }
                .highlight { color: var(--color-energy-orange); font-size: 1.8rem; }
                
                .progress-bar-bg {
                    width: 100%;
                    height: 8px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 4px;
                    overflow: hidden;
                }
                .progress-bar-fill {
                    height: 100%;
                    background: #10b981;
                    transition: width 1s ease;
                }
            `}</style>
        </div>
    );
}
