'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

export default function SettingsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Form States
    const [fullName, setFullName] = useState('');
    const [orgName, setOrgName] = useState('');
    const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);

    const daysOfWeek = [
        { id: 1, name: 'Lunes' },
        { id: 2, name: 'Martes' },
        { id: 3, name: 'Miércoles' },
        { id: 4, name: 'Jueves' },
        { id: 5, name: 'Viernes' },
        { id: 6, name: 'Sábado' },
        { id: 7, name: 'Domingo' },
    ];

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push('/login');

        const { data: profileData } = await (supabase.from('profiles') as any).select('*, organizations(*)').eq('id', user.id).single();
        if (profileData) {
            setProfile(profileData);
            setFullName(profileData.full_name || '');
            setOrgName(profileData.organizations?.name || '');
            setWorkingDays(profileData.working_days || [1, 2, 3, 4, 5]);
        }
        setLoading(false);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Update Profile
        const { error: pError } = await (supabase.from('profiles') as any)
            .update({
                full_name: fullName,
                working_days: workingDays
            })
            .eq('id', user.id);

        // 2. Update Organization
        if (profile?.org_id) {
            const { error: oError } = await (supabase.from('organizations') as any)
                .update({ name: orgName })
                .eq('id', profile.org_id);
        }

        alert('¡Perfil actualizado con éxito!');
        setIsUpdating(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) return <div className="loading-vibe">Preparando cabina de mando...</div>;

    return (
        <div className="vibelogs-container">
            <Sidebar />
            <main className="vibe-main">
                <DashboardHeader profile={profile} />

                <div className="settings-panel animate-in">
                    <header className="settings-header">
                        <h1>Configuración</h1>
                        <p>Personaliza tu experiencia en la misión.</p>
                    </header>

                    <div className="settings-grid">
                        {/* Perfil */}
                        <section className="glass-section">
                            <div className="section-title">
                                <span className="icon">👤</span>
                                <h3>Perfil de Astronauta</h3>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="settings-form">
                                <div className="input-group">
                                    <label>Rol en la Misión</label>
                                    <div className="role-badge">{profile?.role === 'admin' || profile?.role === 'owner' ? '🚀 Administrador' : '👨‍🚀 Empleado'}</div>
                                </div>

                                <div className="input-group">
                                    <label>Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Tu nombre aquí..."
                                    />
                                </div>

                                <div className="input-group">
                                    <label>Nombre de la Organización</label>
                                    <input
                                        type="text"
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        placeholder="Tu empresa o equipo..."
                                        disabled={profile?.role !== 'admin' && profile?.role !== 'owner'}
                                        title={profile?.role !== 'admin' && profile?.role !== 'owner' ? "Solo el administrador puede cambiar esto" : ""}
                                    />
                                </div>

                                <button type="submit" className="btn-save" disabled={isUpdating}>
                                    {isUpdating ? 'Actualizando...' : 'Guardar Cambios'}
                                </button>
                            </form>
                        </section>

                        {/* Configuración de Racha */}
                        <section className="glass-section">
                            <div className="section-title">
                                <span className="icon">🔥</span>
                                <h3>Días de Misión (Racha)</h3>
                            </div>
                            <p className="settings-desc">Selecciona los días que trabajas. La racha solo se contará en estos días.</p>

                            <div className="days-selector">
                                {daysOfWeek.map(day => (
                                    <label key={day.id} className={`day-checkbox ${workingDays.includes(day.id) ? 'active' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={workingDays.includes(day.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setWorkingDays([...workingDays, day.id].sort());
                                                } else {
                                                    setWorkingDays(workingDays.filter(d => d !== day.id));
                                                }
                                            }}
                                        />
                                        <span>{day.name}</span>
                                    </label>
                                ))}
                            </div>
                        </section>


                        {/* Seguridad / Sesión */}
                        <section className="glass-section warning">
                            <div className="section-title">
                                <span className="icon">🛡️</span>
                                <h3>Seguridad y Sesión</h3>
                            </div>
                            <div className="security-actions">
                                <button className="btn-logout" onClick={handleLogout}>Finalizar Misión (Cerrar Sesión)</button>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <style jsx>{`
        .vibelogs-container { display: flex; min-height: 100vh; background: #050b18; }
        .vibe-main { flex: 1; margin-left: 280px; padding: 30px 40px; }
        
        .settings-panel { max-width: 800px; margin: 0 auto; }
        .settings-header { margin-bottom: 40px; }
        .settings-header h1 { font-size: 2rem; color: white; font-weight: 800; margin-bottom: 8px; }
        .settings-header p { color: rgba(255, 255, 255, 0.4); }

        .settings-grid { display: flex; flex-direction: column; gap: 24px; }
        .glass-section {
          background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px; padding: 30px; transition: all 0.3s;
        }
        .glass-section:hover { border-color: rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.04); }
        .warning { border-color: rgba(255, 94, 94, 0.2); }

        .section-title { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; }
        .section-title .icon { fontSize: 1.5rem; }
        .section-title h3 { color: white; font-size: 1.2rem; font-weight: 700; }

        .settings-form { display: flex; flex-direction: column; gap: 20px; }
        .input-group { display: flex; flex-direction: column; gap: 10px; }
        .input-group label { font-size: 0.85rem; color: rgba(255, 255, 255, 0.4); font-weight: 600; padding-left: 5px; }
        .role-badge {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.9rem;
          width: fit-content;
        }
        .input-group input {
          background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1);
          color: white; padding: 14px 20px; border-radius: 14px; outline: none; transition: all 0.3s;
        }
        .input-group input:focus { border-color: var(--color-energy-orange); background: rgba(255, 255, 255, 0.08); }

        .btn-save {
          background: var(--color-energy-orange); color: white; padding: 14px; border-radius: 14px;
          font-weight: 700; margin-top: 10px; box-shadow: 0 4px 15px rgba(255, 140, 21, 0.2);
          transition: all 0.3s;
        }
        .btn-save:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255, 140, 21, 0.4); }
        .btn-save:disabled { opacity: 0.5; transform: none; box-shadow: none; }


        .settings-desc { color: rgba(255, 255, 255, 0.4); font-size: 0.9rem; margin-bottom: 20px; }
        .days-selector { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
        .day-checkbox {
            background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 12px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 10px;
            transition: all 0.2s;
        }
        .day-checkbox:hover { background: rgba(255, 255, 255, 0.06); }
        .day-checkbox.active { border-color: var(--color-energy-orange); background: rgba(255, 140, 21, 0.05); }
        .day-checkbox input { display: none; }
        .day-checkbox span { font-size: 0.9rem; color: rgba(255, 255, 255, 0.7); font-weight: 500; }
        .day-checkbox.active span { color: white; font-weight: 600; }

        .security-actions { display: flex; }
        .btn-logout {
          background: rgba(255, 94, 94, 0.1); color: #ff5e5e; padding: 12px 24px;
          border: 1px solid rgba(255, 94, 94, 0.2); border-radius: 12px; font-weight: 600;
          transition: all 0.3s;
        }
        .btn-logout:hover { background: #ff5e5e; color: white; }

        .animate-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .loading-vibe { height: 100vh; display: flex; align-items: center; justify-content: center; background: #050b18; color: white; }
      `}</style>
        </div>
    );
}
