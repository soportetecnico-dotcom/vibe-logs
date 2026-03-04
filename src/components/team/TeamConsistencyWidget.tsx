import React, { useMemo } from 'react';

// Esta simplificación asume que cada log es un "día trabajado". 
export default function TeamConsistencyWidget({ logs, employees, dateFilter, isGlobal }: any) {
    const consistencyPercentage = useMemo(() => {
        if (!employees || employees.length === 0) return 0;
        if (!logs || logs.length === 0) return 0;

        // Formato simple: estimar consistencia basado en # de logs en el periodo
        // ya que el cálculo exacto de días laborales requeriría saber los 'working_days' reales de cada uno
        // Por ahora, asumiremos que un número alto de logs vs el periodo es mejor consistencia.
        // Lo que haremos es calcular: de todos los logs, ¿cuántos días únicos tienen bitácoras?

        const uniqueLogDaysByEmployee = employees.map((emp: any) => {
            const empLogs = logs.filter((l: any) => l.user_id === emp.id);
            const uniqueDays = new Set(empLogs.map((l: any) => l.report_date)).size;
            return uniqueDays;
        });

        const totalUniqueDaysLogged = uniqueLogDaysByEmployee.reduce((acc: number, val: number) => acc + val, 0);

        // Estimar días laborales en base al filtro (muy básico, 5 a la semana)
        let expectedDays = 5;
        if (dateFilter === 'today') expectedDays = 1;
        if (dateFilter === 'week') expectedDays = 5;
        if (dateFilter === 'month') expectedDays = 20;
        if (dateFilter === 'all') expectedDays = 60; // arbitrario para "all"

        const totalExpectedDays = expectedDays * employees.length;

        let percentage = (totalUniqueDaysLogged / totalExpectedDays) * 100;
        if (percentage > 100) percentage = 100;
        if (percentage < 0 || isNaN(percentage)) percentage = 0;

        return Math.round(percentage);

    }, [logs, employees, dateFilter]);

    return (
        <div className="glass-card widget-container">
            <h3>{isGlobal ? "Consistencia del Equipo" : "Consistencia"}</h3>
            <div className="content">
                <div className="percentage-display">
                    <span className="value">{consistencyPercentage}%</span>
                    <span className="label">de cumplimiento estimado</span>
                </div>
                <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${consistencyPercentage}%` }}></div>
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
                    gap: 12px;
                }
                .percentage-display {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                }
                .value {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: var(--color-energy-orange);
                }
                .label {
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.4);
                }
                .progress-bar-bg {
                    width: 100%;
                    height: 8px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 4px;
                    overflow: hidden;
                }
                .progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--color-energy-orange), var(--color-vibrant-rose));
                    transition: width 1s ease;
                }
            `}</style>
        </div>
    );
}
