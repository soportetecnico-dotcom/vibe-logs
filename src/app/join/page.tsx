'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

function JoinPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [invitation, setInvitation] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Form inputs
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Falta el token de invitación.');
            setLoading(false);
            return;
        }

        const validInvitation = async () => {
            const { data, error: invError } = await supabase
                .from('invitations')
                .select('*, organizations(name)')
                .eq('token', token)
                .eq('is_used', false)
                .gt('expires_at', new Date().toISOString())
                .returns<any>() // Usamos any temporalmente solo en el retorno para manejar la relación anidada compleja si tsc falla
                .single();

            if (invError || !data) {
                setError('La invitación es inválida o ha expirado.');
            } else {
                setInvitation(data);
                // Si la invitación tiene email pre-definido, lo usamos
                if ((data as any).email) setEmail((data as any).email);
            }
            setLoading(false);
        };

        validInvitation();
    }, [token, supabase]);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 1. Registro de Usuario en Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("No se pudo crear el usuario.");

            // 2. Crear Perfil vinculado a la invitación
            const { error: profileError } = await (supabase as any).from('profiles').upsert({
                id: authData.user.id,
                full_name: fullName,
                org_id: invitation.org_id,
                role: 'contributor' // Default role for new joins via invitation
            });

            if (profileError) throw profileError;

            // 3. Marcar invitación como usada
            await (supabase as any)
                .from('invitations')
                .update({ is_used: true })
                .eq('id', invitation.id);

            alert("¡Bienvenido al equipo! Tu cuenta ha sido creada.");
            router.push('/dashboard');

        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="loading-vibe">Validando invitación espacial...</div>;

    if (error) {
        return (
            <div className="join-container">
                <div className="glass-card error-card">
                    <h2>⚠️ Acceso Denegado</h2>
                    <p>{error}</p>
                    <Link href="/login" className="btn-primary">Ir al Inicio</Link>
                </div>
                <style jsx>{`
                    .join-container { min-height: 100vh; background: #050b18; display: flex; align-items: center; justify-content: center; padding: 20px; }
                    .error-card { padding: 40px; text-align: center; max-width: 400px; }
                    h2 { color: white; margin-bottom: 16px; }
                    p { color: rgba(255, 255, 255, 0.5); margin-bottom: 24px; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="join-container">
            <div className="glass-card join-card animate-pop">
                <div className="org-header">
                    <span className="rocket">🚀</span>
                    <h1>¡Te han invitado!</h1>
                    <p>Únete a la tripulación de <b>{invitation?.organizations?.name}</b></p>
                </div>

                <form onSubmit={handleJoin} className="join-form">
                    <div className="input-group">
                        <label>Nombre Completo</label>
                        <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ej: John Doe" />
                    </div>
                    <div className="input-group">
                        <label>Correo Electrónico</label>
                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
                    </div>
                    <div className="input-group">
                        <label>Contraseña</label>
                        <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Elige tu acceso" />
                    </div>

                    <button type="submit" className="btn-join" disabled={isSubmitting}>
                        {isSubmitting ? 'Iniciando Despegue...' : 'Unirse a la Misión'}
                    </button>
                </form>

                <p className="footer-text">¿Ya tienes cuenta? <Link href="/login">Inicia Sesión</Link></p>
            </div>

            <style jsx>{`
                .join-container { min-height: 100vh; background: #050b18; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .join-card { width: 100%; max-width: 450px; padding: 40px; }
                
                .org-header { text-align: center; margin-bottom: 32px; }
                .rocket { font-size: 2.5rem; display: block; margin-bottom: 10px; }
                h1 { font-size: 1.8rem; color: white; margin-bottom: 8px; }
                p { color: var(--text-secondary); font-size: 0.95rem; }

                .join-form { display: flex; flex-direction: column; gap: 20px; }
                .input-group { display: flex; flex-direction: column; gap: 8px; }
                .input-group label { font-size: 0.8rem; color: rgba(255, 255, 255, 0.4); font-weight: 600; padding-left: 5px; }
                .input-group input {
                    background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white; padding: 14px; border-radius: 12px; outline: none; transition: all 0.3s;
                }
                .input-group input:focus { border-color: var(--color-energy-orange); background: rgba(255, 255, 255, 0.08); }

                .btn-join {
                    background: var(--color-energy-orange); color: white; padding: 16px; border-radius: 14px;
                    font-weight: 700; margin-top: 10px; box-shadow: 0 4px 15px rgba(255, 140, 21, 0.3);
                }
                .btn-join:disabled { opacity: 0.5; }

                .footer-text { text-align: center; margin-top: 24px; font-size: 0.85rem; color: rgba(255, 255, 255, 0.3); }
                .footer-text a { color: var(--color-energy-orange); text-decoration: none; font-weight: 600; }

                .loading-vibe { height: 100vh; display: flex; align-items: center; justify-content: center; background: #050b18; color: white; }
                .animate-pop { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
}

export default function JoinPage() {
    return (
        <Suspense fallback={<div className="loading-vibe">Preparando despegue...</div>}>
            <JoinPageContent />
        </Suspense>
    );
}
