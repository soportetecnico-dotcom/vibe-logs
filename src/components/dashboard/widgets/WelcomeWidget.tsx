'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface WelcomeWidgetProps {
  name: string;
}

export default function WelcomeWidget({ name }: WelcomeWidgetProps) {
  const supabase = createClient();
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  let greeting = 'Buenos días';
  if (hour >= 12 && hour < 19) greeting = 'Buenas tardes';
  if (hour >= 19 || hour < 5) greeting = 'Buenas noches';

  useEffect(() => {
    calculateStreak();
  }, []);

  const calculateStreak = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Obtener días laborables del perfil
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('working_days')
      .eq('id', user.id)
      .single();

    const workingDays = profile?.working_days || [1, 2, 3, 4, 5];

    // 2. Obtener fechas de bitácoras del usuario
    const { data: logs } = await supabase
      .from('logs')
      .select('report_date')
      .eq('user_id', user.id)
      .order('report_date', { ascending: false }) as { data: { report_date: string }[] | null };

    if (!logs) {
      setStreak(0);
      setLoading(false);
      return;
    }

    const logDates = new Set(logs.map((log: { report_date: string }) => log.report_date));

    let currentStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    // Si hoy es día laboral y no hay bitácora, empezamos a chequear desde ayer para la racha acumulada
    // Pero si hoy SÍ hay bitácora, empezamos desde hoy.
    const todayStr = checkDate.toISOString().split('T')[0];
    const hasLogToday = logDates.has(todayStr);

    // Si hoy es laboral y no hay bitácora, la racha "activa" depende de si ayer se cumplió.
    // Recorremos hacia atrás.
    let dateToVerify = new Date(checkDate);

    while (true) {
      const dateStr = dateToVerify.toISOString().split('T')[0];
      const dayOfWeek = dateToVerify.getDay() === 0 ? 7 : dateToVerify.getDay(); // JS: 0=Dom, Supabase/Plan: 7=Dom
      const isWorkingDay = workingDays.includes(dayOfWeek);

      if (isWorkingDay) {
        if (logDates.has(dateStr)) {
          currentStreak++;
        } else {
          // Si es un día laboral y no hay bitácora
          // Si es HOY, simplemente no sumamos pero no rompemos la racha de días anteriores todavía (hasta que acabe el día)
          // Pero para efectos visuales, si hoy no hay bitácora, la racha es la acumulada hasta ayer.
          if (dateStr !== todayStr) {
            break; // Se rompió la racha en un día laboral pasado
          }
        }
      } else {
        // No es día laboral, ignoramos y seguimos hacia atrás sin romper
      }

      // Retroceder un día
      dateToVerify.setDate(dateToVerify.getDate() - 1);

      // Seguridad para evitar bucles infinitos (máximo 365 días)
      if (currentStreak > 365 || dateToVerify < new Date(2024, 0, 1)) break;
    }

    setStreak(currentStreak);
    setLoading(false);
  };

  return (
    <div className="glass-card welcome-card animate-bento">
      <div className="content-wrapper">
        <div className="text-content">
          <h3>¡{greeting}, {(name || 'Astronauta').split(' ')[0]}! 🛰️</h3>
          <p className="mission-text">Tu misión de hoy: Mantener la inercia positiva en Fracoh Group.</p>
        </div>

        <div className="streak-stats">
          <div className="streak-info">
            <span className="streak-label">RACHA ACTUAL</span>
            <span className="streak-value">
              {loading ? '...' : `${streak} DÍAS`}
            </span>
          </div>
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min((streak / 7) * 100, 100)}%` }}></div>
            </div>
            <span className="streak-hint">{streak === 0 ? '¡Comienza tu racha hoy!' : '🔥 Vas por buen camino'}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .welcome-card {
          padding: 24px 32px;
          height: 100%;
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, rgba(30, 65, 136, 0.4) 0%, rgba(214, 0, 159, 0.1) 50%, rgba(12, 21, 41, 0.6) 100%);
          position: relative;
          overflow: hidden;
        }

        .welcome-card::after {
            content: '';
            position: absolute;
            top: -50%;
            right: -10%;
            width: 300px;
            height: 300px;
            background: var(--color-energy-orange);
            filter: blur(100px);
            opacity: 0.1;
            z-index: 0;
        }

        .content-wrapper {
            position: relative;
            z-index: 1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }

        .text-content {
            max-width: 60%;
        }

        h3 {
          font-size: 1.6rem;
          margin-bottom: 4px;
          background: linear-gradient(90deg, #fff, #aaa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 800;
        }

        .mission-text {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.95rem;
          margin: 0;
        }

        .streak-stats {
            background: rgba(255, 255, 255, 0.03);
            padding: 16px 20px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-width: 240px;
        }

        .streak-info {
            display: flex;
            flex-direction: column;
        }

        .streak-label {
            font-size: 0.6rem;
            color: rgba(255, 255, 255, 0.4);
            font-weight: 800;
            letter-spacing: 1.5px;
        }

        .streak-value {
            font-size: 1.5rem;
            font-weight: 900;
            color: var(--color-energy-orange);
        }

        .progress-container {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .streak-hint {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 500;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-energy-orange), var(--color-vibrant-rose));
          box-shadow: 0 0 15px rgba(255, 140, 21, 0.4);
          transition: width 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @media (max-width: 900px) {
            .content-wrapper {
                flex-direction: column;
                align-items: flex-start;
                gap: 24px;
            }
            .text-content { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
