import React, { useMemo } from 'react';
import TeamConsistencyWidget from './TeamConsistencyWidget';
import TeamTaskEfficiencyWidget from './TeamTaskEfficiencyWidget';
import ActivityHeatmapWidget from './ActivityHeatmapWidget';
import TeamLogFeed from './TeamLogFeed';

interface GlobalTeamViewProps {
    logs: any[];
    employees: any[];
    loading: boolean;
    dateFilter: string;
}

export default function GlobalTeamView({ logs, employees, loading, dateFilter }: GlobalTeamViewProps) {
    if (loading) {
        return <div className="loading-state">Cargando métricas globales...</div>;
    }

    return (
        <div className="global-team-view animate-in">
            <div className="metrics-grid">
                <TeamConsistencyWidget logs={logs} employees={employees} dateFilter={dateFilter} isGlobal={true} />
                <TeamTaskEfficiencyWidget logs={logs} isGlobal={true} />
            </div>

            <div className="heatmap-section">
                <ActivityHeatmapWidget logs={logs} />
            </div>

            <div className="feed-section">
                <TeamLogFeed logs={logs} />
            </div>

            <style jsx>{`
        .global-team-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
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
