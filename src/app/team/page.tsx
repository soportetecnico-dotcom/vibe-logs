'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import GlobalTeamView from '@/components/team/GlobalTeamView';
import IndividualTeamView from '@/components/team/IndividualTeamView';

export default function TeamPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [employees, setEmployees] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);

    // Tab State
    const [activeTab, setActiveTab] = useState<'global' | 'directory'>('global');
    const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
    const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');

    // Invitation State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [invitationLink, setInvitationLink] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push('/login');

        const { data: profileData } = await (supabase.from('profiles') as any).select('*, organizations(*)').eq('id', user.id).single();

        if (!profileData || (profileData.role !== 'admin' && profileData.role !== 'owner')) {
            return router.push('/dashboard');
        }

        setProfile(profileData);

        // Fetch team members
        const { data: teamData } = await (supabase.from('profiles') as any)
            .select('*')
            .eq('org_id', profileData.org_id)
            .neq('id', user.id);

        setEmployees(teamData || []);

        // Fetch all logs from the org
        const { data: logsData } = await supabase
            .from('logs')
            .select(`
                *,
                profiles:user_id ( full_name, avatar_url, role )
            `)
            .eq('org_id', profileData.org_id);

        setLogs(logsData || []);

        setLoading(false);
    };

    const fetchLogsFiltered = async (filter: string) => {
        // Aqui idealmente re-hacemos el fetch con .gte('report_date', startDate), pero para el demo lo filtramos localmente si no son muchísimos.  
        // Como es front-end, actualizamos el state de dateFilter y los widgets lo usan.
        setDateFilter(filter as any);
    };

    const getFilteredLogs = () => {
        // Simulación de filtro local por fecha
        if (dateFilter === 'all') return logs;

        const now = new Date();
        return logs.filter(log => {
            const logDate = new Date(log.report_date);
            if (dateFilter === 'today') {
                return logDate.toDateString() === now.toDateString();
            }
            if (dateFilter === 'week') {
                const diff = now.getTime() - logDate.getTime();
                return diff <= 7 * 24 * 60 * 60 * 1000;
            }
            if (dateFilter === 'month') {
                const diff = now.getTime() - logDate.getTime();
                return diff <= 30 * 24 * 60 * 60 * 1000;
            }
            return true;
        });
    };

    const generateInviteLink = async () => {
        setIsGenerating(true);
        try {
            const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            const { data, error } = await (supabase.from('invitations') as any)
                .insert({
                    org_id: profile.org_id,
                    token: token,
                    created_by: profile.id
                })
                .select()
                .single();

            if (error) throw error;

            const baseUrl = window.location.origin;
            setInvitationLink(`${baseUrl}/join?token=${token}`);
        } catch (err: any) {
            alert("Error al generar enlace: " + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(invitationLink);
        alert("¡Enlace copiado al portapapeles!");
    };

    if (loading) return <div className="loading-vibe">Abriendo el Centro de Mando...</div>;

    const filteredLogs = getFilteredLogs();

    return (
        <div className="vibelogs-container">
            <Sidebar />
            <main className="vibe-main">
                <DashboardHeader profile={profile} />

                <div className="team-panel animate-in">
                    <header className="team-header">
                        <div className="header-titles">
                            <h1>Centro de Mando</h1>
                            <p>Supervisa y analiza el rendimiento de <b>{profile?.organizations?.name}</b></p>
                        </div>

                        <div className="header-actions">
                            <select
                                className="date-filter"
                                value={dateFilter}
                                onChange={(e) => fetchLogsFiltered(e.target.value)}
                            >
                                <option value="today">Hoy</option>
                                <option value="week">Esta Semana</option>
                                <option value="month">Este Mes</option>
                                <option value="all">Todo el tiempo</option>
                            </select>
                            <button className="btn-add-team" onClick={() => setShowInviteModal(true)}>
                                + Añadir Miembro
                            </button>
                        </div>
                    </header>

                    {!selectedEmployee && (
                        <div className="tabs-container">
                            <button
                                className={`tab-btn ${activeTab === 'global' ? 'active' : ''}`}
                                onClick={() => setActiveTab('global')}
                            >
                                Dashboard Global
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
                                onClick={() => setActiveTab('directory')}
                            >
                                Directorio del Equipo
                            </button>
                        </div>
                    )}

                    <div className="tab-content">
                        {selectedEmployee ? (
                            <IndividualTeamView
                                user={selectedEmployee}
                                logs={filteredLogs}
                                loading={false}
                                dateFilter={dateFilter}
                                onBack={() => setSelectedEmployee(null)}
                            />
                        ) : activeTab === 'global' ? (
                            <GlobalTeamView
                                logs={filteredLogs}
                                employees={employees}
                                loading={false}
                                dateFilter={dateFilter}
                            />
                        ) : (
                            <div className="employees-list animate-in">
                                {employees.length === 0 ? (
                                    <div className="glass-card empty-state">
                                        <p>Aún no tienes empleados registrados. ¡Construye tu tripulación!</p>
                                    </div>
                                ) : (
                                    <div className="employees-grid">
                                        {employees.map(emp => (
                                            <div key={emp.id} className="glass-card employee-card">
                                                <div className="avatar">
                                                    {emp.avatar_url ? <img src={emp.avatar_url} alt={emp.full_name} /> : (emp.full_name?.charAt(0) || 'E')}
                                                </div>
                                                <div className="info">
                                                    <h3>{emp.full_name}</h3>
                                                    <span className="role-tag">{emp.role}</span>
                                                </div>
                                                <div className="actions">
                                                    <button className="btn-mini" onClick={() => setSelectedEmployee(emp)}>Ver Análisis</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {showInviteModal && (
                        <div className="modal-overlay">
                            <div className="glass-card modal-content animate-pop">
                                <h2>Invitar Astronauta</h2>
                                <p className="modal-description">Genera un enlace único para que tu empleado se registre y sea asignado automáticamente a tu organización.</p>

                                {!invitationLink ? (
                                    <button
                                        className="btn-save"
                                        onClick={generateInviteLink}
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? 'Generando...' : 'Generar Enlace Único'}
                                    </button>
                                ) : (
                                    <div className="link-box">
                                        <input type="text" readOnly value={invitationLink} />
                                        <button onClick={copyToClipboard} className="btn-copy">Copiar</button>
                                    </div>
                                )}

                                <div className="modal-actions">
                                    <button type="button" className="btn-cancel" onClick={() => {
                                        setShowInviteModal(false);
                                        setInvitationLink('');
                                    }}>Cerrar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <style jsx>{`
                .vibelogs-container { display: flex; min-height: 100vh; background: #050b18; }
                .vibe-main { flex: 1; margin-left: 280px; padding: 30px 40px; }
                .team-panel { max-width: 1000px; margin: 0 auto; }
                .team-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; }
                .header-titles h1 { font-size: 2rem; color: white; font-weight: 800; margin-bottom: 4px; }
                .header-titles p { color: rgba(255, 255, 255, 0.4); margin: 0; }
                
                .header-actions { display: flex; gap: 16px; align-items: center; }
                .date-filter {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 10px 16px;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    outline: none;
                }
                .date-filter option { background: #0c1529; }

                .btn-add-team {
                    background: var(--color-energy-orange); color: white; padding: 10px 20px;
                    border-radius: 12px; font-weight: 700; box-shadow: 0 4px 15px rgba(255, 140, 21, 0.3); border: none; cursor: pointer;
                }

                .tabs-container {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 30px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    padding-bottom: 12px;
                }
                .tab-btn {
                    background: transparent;
                    border: none;
                    color: rgba(255,255,255,0.4);
                    font-size: 1rem;
                    font-weight: 600;
                    padding: 8px 16px;
                    cursor: pointer;
                    position: relative;
                    transition: color 0.2s;
                }
                .tab-btn:hover { color: rgba(255,255,255,0.8); }
                .tab-btn.active { color: white; }
                .tab-btn.active::after {
                    content: '';
                    position: absolute;
                    bottom: -13px;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: var(--color-energy-orange);
                    border-radius: 2px;
                }

                .employees-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
                .employee-card { padding: 24px; display: flex; align-items: center; gap: 20px; }
                
                .avatar {
                    width: 50px; height: 50px; border-radius: 50%; background: rgba(255, 255, 255, 0.05);
                    display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--color-energy-orange);
                    border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden;
                }
                .avatar img { width: 100%; height: 100%; object-fit: cover; }

                .info { flex: 1; }
                .info h3 { font-size: 1rem; color: white; margin: 0 0 4px 0; }
                .role-tag { font-size: 0.7rem; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; font-weight: 700; letter-spacing: 1px; }

                .btn-mini { background: rgba(255,255,255,0.1); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: background 0.2s;}
                .btn-mini:hover { background: rgba(255,255,255,0.2); }

                .empty-state { padding: 60px; text-align: center; color: rgba(255, 255, 255, 0.3); }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8);
                    backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000;
                }
                .modal-content { width: 100%; max-width: 450px; padding: 40px; }
                .modal-content h2 { color: white; margin: 0 0 12px 0; text-align: center; }
                .modal-description { font-size: 0.9rem; text-align: center; margin: 0 0 24px 0; color: rgba(255,255,255,0.6); }
                
                .link-box {
                    display: flex; gap: 10px; background: rgba(0, 0, 0, 0.2); border-radius: 12px; padding: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 20px;
                }
                .link-box input { flex: 1; background: transparent; border: none; color: white; font-size: 0.8rem; outline: none; }
                .btn-copy { background: var(--color-energy-orange); color: white; padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 0.8rem; border: none; cursor: pointer; }

                .modal-actions { display: flex; gap: 10px; margin-top: 10px; }
                .btn-cancel { flex: 1; padding: 14px; color: rgba(255, 255, 255, 0.5); text-align: center; background: transparent; border: none; cursor: pointer;}
                .btn-save { width: 100%; background: var(--color-energy-orange); color: white; border-radius: 12px; padding: 14px; font-weight: 700; border: none; cursor: pointer; }

                .animate-in { animation: fadeIn 0.4s ease-out forwards; }
                .animate-pop { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                .loading-vibe { height: 100vh; display: flex; align-items: center; justify-content: center; background: #050b18; color: white; }
            `}</style>
        </div>
    );
}

