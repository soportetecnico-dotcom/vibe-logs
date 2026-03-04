'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function TeamActivityWidget() {
    const supabase = createClient();
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeamActivity = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Obtener org_id del usuario actual
            const { data: profile } = await (supabase.from('profiles') as any)
                .select('org_id')
                .eq('id', user.id)
                .single();

            if (profile?.org_id) {
                // 2. Obtener logs recientes de la organización, excluyendo al usuario actual (opcional, o incluirlo)
                // Incluimos el nombre del perfil del autor
                const { data, error } = await supabase
                    .from('logs')
                    .select(`
                        id,
                        created_at,
                        profiles (
                            full_name,
                            avatar_url
                        )
                    `)
                    .eq('org_id', profile.org_id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (!error && data) {
                    setActivities(data);
                }
            }
            setLoading(false);
        };

        fetchTeamActivity();
    }, []);

    if (loading) return (
        <div className="glass-card team-activity-widget loading">
            <div className="shimmer"></div>
            <style jsx>{`
                .team-activity-widget.loading { height: 100%; min-height: 200px; display: flex; align-items: center; justify-content: center; }
                .shimmer { width: 80%; height: 20px; background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>
        </div>
    );

    return (
        <div className="glass-card team-activity-widget animate-bento">
            <h4>Actividad del Equipo</h4>

            <div className="activity-feed">
                {activities.length > 0 ? (
                    activities.map((activity, index) => (
                        <div key={activity.id} className="activity-item" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="avatar">
                                {activity.profiles?.avatar_url ? (
                                    <img src={activity.profiles.avatar_url} alt={activity.profiles.full_name} />
                                ) : (
                                    <span className="initials">{activity.profiles?.full_name?.charAt(0) || '?'}</span>
                                )}
                            </div>
                            <div className="activity-content">
                                <p><strong>{activity.profiles?.full_name || 'Alguien'}</strong> publicó una nueva bitácora</p>
                                <span className="time">{new Date(activity.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-activity">No hay actividad reciente en el equipo.</p>
                )}
            </div>

            <style jsx>{`
                .team-activity-widget {
                    padding: 16px 20px;
                    height: 100%;
                }

                h4 {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.4);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-weight: 700;
                    margin-bottom: 20px;
                }

                .activity-feed {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .activity-item {
                    display: flex;
                    gap: 12px;
                    align-items: flex-start;
                    animation: slideIn 0.5s ease backwards;
                }

                @keyframes slideIn {
                    from { transform: translateX(-10px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                .avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 25.5, 0.1);
                    flex-shrink: 0;
                }

                .avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .initials {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--color-energy-orange);
                }

                .activity-content p {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.8);
                    line-height: 1.4;
                }

                .activity-content strong {
                    color: white;
                }

                .time {
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.3);
                }

                .no-activity {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.4);
                    text-align: center;
                    padding-top: 20px;
                }
            `}</style>
        </div>
    );
}
