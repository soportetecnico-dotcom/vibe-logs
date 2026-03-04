'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function StreakCalendarWidget() {
    const supabase = createClient();
    const [logDates, setLogDates] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogDates = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('logs')
                .select('report_date')
                .eq('user_id', user.id)
                .gte('report_date', firstDayOfMonth) as { data: { report_date: string }[] | null, error: any };

            if (!error && data) {
                const dates = new Set(data.map((log: { report_date: string }) => log.report_date));
                setLogDates(dates);
            }
            setLoading(false);
        };

        fetchLogDates();
    }, []);

    const renderCalendar = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)

        // Ajustar para que el lunes sea 0
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

        const days = [];
        // Celdas vacías al inicio
        for (let i = 0; i < adjustedFirstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Días del mes
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const hasLog = logDates.has(dateStr);
            const isToday = d === now.getDate();

            days.push(
                <div key={d} className={`calendar-day ${hasLog ? 'has-log' : ''} ${isToday ? 'today' : ''}`} title={dateStr}>
                    <span className="day-number">{d}</span>
                </div>
            );
        }

        return days;
    };

    if (loading) return (
        <div className="glass-card streak-calendar-widget loading">
            <div className="shimmer"></div>
            <style jsx>{`
                .streak-calendar-widget.loading { height: 100%; min-height: 180px; display: flex; align-items: center; justify-content: center; }
                .shimmer { width: 80%; height: 20px; background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>
        </div>
    );

    const monthName = new Date().toLocaleString('es-ES', { month: 'long' });

    return (
        <div className="glass-card streak-calendar-widget animate-bento">
            <div className="calendar-header">
                <h4>Consistencia: {monthName}</h4>
                <div className="legend">
                    <span className="dot active"></span> <span className="label">Bitácora</span>
                </div>
            </div>

            <div className="calendar-grid-wrapper">
                <div className="weekdays">
                    <span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span>
                </div>
                <div className="calendar-grid">
                    {renderCalendar()}
                </div>
            </div>

            <style jsx>{`
                .streak-calendar-widget {
                    padding: 16px 20px;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .calendar-header {
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

                .legend {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }

                .dot.active {
                    background: var(--color-energy-orange);
                    box-shadow: 0 0 8px var(--color-energy-orange);
                }

                .label {
                    font-size: 0.65rem;
                    color: rgba(255, 255, 255, 0.4);
                    font-weight: 600;
                }

                .calendar-grid-wrapper {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .weekdays {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    text-align: center;
                    font-size: 0.65rem;
                    color: rgba(255, 255, 255, 0.3);
                    font-weight: 700;
                }

                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 6px;
                    flex: 1;
                }

                .calendar-day {
                    aspect-ratio: 1;
                    border-radius: 6px;
                    background: rgba(255, 255, 255, 0.03);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .day-number {
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.4);
                    font-weight: 500;
                }

                .calendar-day.has-log {
                    background: rgba(255, 140, 21, 0.15);
                    border-color: rgba(255, 140, 21, 0.3);
                }

                .calendar-day.has-log .day-number {
                    color: var(--color-energy-orange);
                    font-weight: 800;
                }

                .calendar-day.today {
                    border-color: var(--color-vibrant-rose);
                    box-shadow: inset 0 0 4px rgba(214, 0, 159, 0.3);
                }

                .calendar-day.today .day-number {
                    color: var(--color-vibrant-rose);
                }

                .calendar-day.empty {
                    background: transparent;
                    border: none;
                }
            `}</style>
        </div>
    );
}
