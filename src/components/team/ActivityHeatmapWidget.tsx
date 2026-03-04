import React, { useMemo } from 'react';

export default function ActivityHeatmapWidget({ logs }: any) {
    const { maxActivity, heatmapData } = useMemo(() => {
        // Obtenemos los últimos 14-30 días
        const data = [];
        const today = new Date();
        const countsByDate: Record<string, number> = {};

        logs.forEach((log: any) => {
            const dateStr = new Date(log.report_date).toISOString().split('T')[0];
            countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
            // Sumar un extra si tiene muchas tareas (opcional), por ahora 1 bitácora = 1 actividad base.
            if (log.tasks && log.tasks.length > 0) {
                countsByDate[dateStr] += log.tasks.length * 0.5;
            }
        });

        let maxActivity = 1;

        // Generar los últimos 30 días
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            const count = countsByDate[dateStr] || 0;
            if (count > maxActivity) maxActivity = count;

            data.push({
                date: d,
                count: count
            });
        }

        return { maxActivity, heatmapData: data };
    }, [logs]);

    const getIntensityClass = (count: number) => {
        if (count === 0) return 'level-0';
        const ratio = count / maxActivity;
        if (ratio < 0.25) return 'level-1';
        if (ratio < 0.5) return 'level-2';
        if (ratio < 0.75) return 'level-3';
        return 'level-4';
    };

    return (
        <div className="glass-card widget-container">
            <h3>Mapa de Actividad (Últimos 30 días)</h3>

            <div className="heatmap-grid">
                {heatmapData.map((day, i) => (
                    <div
                        key={i}
                        className={`heatmap-cell ${getIntensityClass(day.count)}`}
                        title={`${day.date.toLocaleDateString()}: ${day.count} act.`}
                    ></div>
                ))}
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
                .heatmap-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }
                .heatmap-cell {
                    width: 14px;
                    height: 14px;
                    border-radius: 3px;
                    transition: all 0.2s ease;
                }
                .heatmap-cell:hover {
                    transform: scale(1.2);
                    box-shadow: 0 0 10px rgba(255,255,255,0.2);
                }
                .level-0 { background: rgba(255, 255, 255, 0.05); }
                .level-1 { background: rgba(255, 140, 21, 0.3); }
                .level-2 { background: rgba(255, 140, 21, 0.5); }
                .level-3 { background: rgba(255, 140, 21, 0.8); }
                .level-4 { background: var(--color-energy-orange); box-shadow: 0 0 8px rgba(255,140,21,0.6); }
            `}</style>
        </div>
    );
}
