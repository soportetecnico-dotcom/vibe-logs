import React, { useMemo } from 'react';
import TeamConsistencyWidget from './TeamConsistencyWidget';
import TeamTaskEfficiencyWidget from './TeamTaskEfficiencyWidget';
import ActivityHeatmapWidget from './ActivityHeatmapWidget';
import TeamLogFeed from './TeamLogFeed';

interface IndividualTeamViewProps {
    user: any; // Empleado seleccionado
    logs: any[]; // Todos los logs del equipo (o los filtramos aquí)
    loading: boolean;
    dateFilter: string;
    onBack: () => void;
}

export default function IndividualTeamView({ user, logs, loading, dateFilter, onBack }: IndividualTeamViewProps) {
    const userLogs = useMemo(() => {
        return logs.filter((log: any) => log.user_id === user.id);
    }, [logs, user.id]);

    if (loading) {
        return <div className="loading-state">Cargando métricas de {user.full_name}...</div>;
    }

    return (
        <div className="individual-team-view animate-in">
            <div className="individual-header">
                <button className="btn-back" onClick={onBack}>← Volver al equipo</button>
                <div className="user-info">
                    <div className="avatar">
                        {user.avatar_url ? <img src={user.avatar_url} alt={user.full_name} /> : user.full_name.charAt(0)}
                    </div>
                    <div>
                        <h2>{user.full_name}</h2>
                        <span className="role-tag">{user.role}</span>
                    </div>
                </div>
            </div>

            <div className="metrics-grid">
                <TeamConsistencyWidget logs={userLogs} employees={[user]} dateFilter={dateFilter} isGlobal={false} />
                <TeamTaskEfficiencyWidget logs={userLogs} isGlobal={false} />
            </div>

            <div className="heatmap-section">
                <ActivityHeatmapWidget logs={userLogs} />
            </div>

            <div className="feed-section">
                <TeamLogFeed logs={userLogs} />
            </div>

            <style jsx>{`
        .individual-team-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .individual-header {
           display: flex;
           flex-direction: column;
           gap: 16px;
           margin-bottom: 10px;
        }
        .btn-back {
           align-self: flex-start;
           background: transparent;
           border: none;
           color: rgba(255, 255, 255, 0.6);
           font-size: 0.9rem;
           cursor: pointer;
           padding: 0;
        }
        .btn-back:hover {
           color: white;
           text-decoration: underline;
        }
        .user-info {
           display: flex;
           align-items: center;
           gap: 16px;
        }
        .avatar {
           width: 50px;
           height: 50px;
           border-radius: 50%;
           background: rgba(255, 255, 255, 0.1);
           display: flex; align-items: center; justify-content: center;
           font-weight: bold; color: var(--color-energy-orange);
           overflow: hidden;
        }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }
        .user-info h2 { font-size: 1.5rem; color: white; margin: 0; }
        .role-tag { font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); text-transform: uppercase; }

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 900px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }
        .loading-state {
            color: rgba(255,255,255,0.5);
            text-align: center;
            padding: 40px;
        }
      `}</style>
        </div>
    );
}
