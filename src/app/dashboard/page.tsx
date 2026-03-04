'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

// Componentes
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import WelcomeWidget from '@/components/dashboard/widgets/WelcomeWidget';
import TaskWidget from '@/components/dashboard/widgets/TaskWidget';
import QuickActionWidget from '@/components/dashboard/widgets/QuickActionWidget';
import StatsWidget from '@/components/dashboard/widgets/StatsWidget';
import RecentLogsWidget from '@/components/dashboard/widgets/RecentLogsWidget';
import TeamActivityWidget from '@/components/dashboard/widgets/TeamActivityWidget';
import StreakCalendarWidget from '@/components/dashboard/widgets/StreakCalendarWidget';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profileData, error }: { data: any, error: any } = await supabase
        .from('profiles')
        .select(`
          *,
          organizations (
            name,
            primary_color,
            slug
          )
        `)
        .eq('id', user.id)
        .single();

      if (error || !profileData || !profileData.org_id) {
        router.push('/onboarding');
      } else {
        setProfile(profileData);
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  if (loading) return (
    <div className="loading-screen">
      <div className="rocket-loader">🚀</div>
      <p>Cargando Centro de Control...</p>
      <style jsx>{`
        .loading-screen {
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #050b18;
          color: white;
        }
        .rocket-loader {
          font-size: 3rem;
          animation: flight 2s infinite ease-in-out;
        }
        @keyframes flight {
          0%, 100% { transform: translateY(0) rotate(45deg); }
          50% { transform: translateY(-20px) rotate(45deg); }
        }
      `}</style>
    </div>
  );

  return (
    <div className="dashboard-wrapper">
      <Sidebar />

      <main className="main-content">
        <DashboardHeader profile={profile} />

        <div className="bento-grid">
          {/* Fila 1: Bienvenida ocupando todo el ancho */}
          <div className="grid-item welcome-area">
            <WelcomeWidget name={profile.full_name} />
          </div>

          {/* Principal Area: Tareas (Left) and Quick Controls (Right) */}
          <div className="grid-item task-area">
            <TaskWidget />
          </div>

          <div className="grid-item quick-action-area">
            <QuickActionWidget />
          </div>

          {/* This slots under QuickAction because Task spans 2 rows */}
          <div className="grid-item stats-area">
            <StatsWidget />
          </div>

          {/* Bottom Row */}
          <div className="grid-item recent-logs-area">
            <RecentLogsWidget />
          </div>

          <div className="grid-item streak-area">
            <StreakCalendarWidget />
          </div>

          <div className="grid-item team-activity-area">
            <TeamActivityWidget />
          </div>
        </div>
      </main>

      <style jsx>{`
        .dashboard-wrapper {
          min-height: 100vh;
          width: 100%;
          background: radial-gradient(circle at 10% 20%, rgba(30, 65, 136, 0.08) 0%, transparent 40%),
                      radial-gradient(circle at 90% 80%, rgba(214, 0, 159, 0.05) 0%, transparent 40%),
                      var(--bg-deep);
          display: flex;
        }

        .main-content {
          margin-left: 300px;
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: calc(100vw - 300px);
        }

        .bento-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: auto;
          gap: 12px;
          align-items: stretch;
          width: 100%;
        }

        .grid-item {
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        .grid-item > :global(*) {
          height: 100%;
        }

        .welcome-area {
          grid-column: span 3;
        }

        .task-area {
          grid-column: span 2;
          grid-row: span 2;
        }

        .quick-action-area {
          grid-column: span 1;
        }

        .stats-area {
          grid-column: span 1;
        }

        .recent-logs-area {
          grid-column: span 1;
        }

        .streak-area {
          grid-column: span 1;
        }

        .team-activity-area {
          grid-column: span 1;
        }

        @media (max-width: 1400px) {
          .main-content {
            margin-left: 280px;
          }
           .bento-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .welcome-area { grid-column: span 2; }
          .task-area { grid-column: span 2; grid-row: auto; }
          .quick-action-area, .stats-area, .recent-logs-area, .streak-area, .team-activity-area {
            grid-column: span 1;
          }
        }

        @media (max-width: 900px) {
           .main-content {
             margin-left: 0;
             padding: 16px;
             max-width: 100%;
           }
           .bento-grid {
             grid-template-columns: 1fr;
           }
           .welcome-area, .task-area, .quick-action-area, .stats-area, .recent-logs-area, .streak-area, .team-activity-area {
             grid-column: span 1;
           }
        }
      `}</style>
    </div>
  );
}
