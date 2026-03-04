'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function OnboardingPage() {
  const supabase = createClient();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Form states
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1E4188');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
        // Check if profile has org
        const { data: profileData, error } = await (supabase
          .from('profiles') as any)
          .select('org_id')
          .eq('id', currentUser.id)
          .single();

        if (profileData && (profileData as any).org_id) {
          router.push('/dashboard');
        }
      }
    };
    checkUser();
  }, [router, supabase]);

  const handleOrgNameChange = (name: string) => {
    setOrgName(name);
    setOrgSlug(name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, ''));
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Create Organization
      const { data: org, error: orgError } = await (supabase
        .from('organizations') as any)
        .insert({
          name: orgName,
          slug: orgSlug,
          primary_color: primaryColor,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // 2. Update Profile
      const { error: profileError } = await (supabase
        .from('profiles') as any)
        .upsert({
          id: user.id,
          org_id: (org as any).id,
          role: 'admin',
        });

      if (profileError) throw profileError;

      router.push('/dashboard');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="onboarding-container">
      <div className="wizard-card">
        <div className="stepper">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className="line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className="line"></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        <div className="user-context">
          <div className="user-info">
            <span className="label">Sesión iniciada como:</span>
            <span className="email">{user?.email}</span>
          </div>
          <button className="btn-logout-small" onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}>
            Cerrar Sesión
          </button>
        </div>

        {step === 1 && (
          <div className="step-content">
            <h2>🚀 ¡Bienvenido a Bordo!</h2>
            <p>Empecemos por darle un nombre a tu organización para comenzar la misión.</p>

            <div className="input-group">
              <label>Nombre de la Empresa</label>
              <input
                type="text"
                placeholder="Ej: Fracoh Group"
                value={orgName}
                onChange={(e) => handleOrgNameChange(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>URL de acceso (Slug)</label>
              <div className="slug-preview">vibelogs.com/<b>{orgSlug || 'tu-empresa'}</b></div>
            </div>

            <div className="onboarding-actions">
              <button
                className="btn-primary"
                disabled={!orgName}
                onClick={() => setStep(2)}
              >
                Siguiente Paso
              </button>

              <div className="employee-hint">
                <p>¿Te han invitado a una empresa existente?</p>
                <Link href="/join" className="text-orange">Usa tu enlace de invitación aquí →</Link>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <h2>🎨 Identidad Visual</h2>
            <p>Elige el color que representará a tu equipo.</p>
            <div className="color-grid">
              {['#1E4188', '#FF8C15', '#D6009F', '#00D1FF', '#7000FF'].map((color) => (
                <div
                  key={color}
                  className={`color-box ${primaryColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setPrimaryColor(color)}
                />
              ))}
            </div>
            <div className="color-preview">
              <div className="preview-item" style={{ color: primaryColor }}>Texto de Ejemplo</div>
              <button className="preview-btn" style={{ backgroundColor: primaryColor }}>Botón de Misión</button>
            </div>
            <div className="actions">
              <button className="btn-secondary" onClick={() => setStep(1)}>Atrás</button>
              <button className="btn-primary" onClick={() => setStep(3)}>Siguiente Paso</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <h2>🚀 Todo Listos para el Despegue</h2>
            <p>Confirma los detalles de tu nueva organización.</p>
            <div className="summary-card">
              <p><b>Empresa:</b> {orgName}</p>
              <p><b>Slug:</b> {orgSlug}</p>
              <div className="color-summary"><b>Color:</b> <span style={{ color: primaryColor }}>■</span> {primaryColor}</div>
            </div>
            <div className="actions">
              <button className="btn-secondary" onClick={() => setStep(2)}>Atrás</button>
              <button className="btn-primary" disabled={loading} onClick={handleComplete}>
                {loading ? 'Preparando Nave...' : '¡Comenzar Misión!'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .onboarding-container {
          min-height: 100vh;
          background: #050b18;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .wizard-card {
          background: #0c1529;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 32px;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
        }

        .user-context {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.03);
          padding: 12px 20px;
          border-radius: 16px;
          margin-bottom: 30px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .user-info { display: flex; flex-direction: column; }
        .user-info .label { font-size: 0.65rem; color: rgba(255, 255, 255, 0.3); text-transform: uppercase; font-weight: 700; }
        .user-info .email { font-size: 0.85rem; color: white; font-weight: 600; }

        .btn-logout-small {
          font-size: 0.75rem;
          color: #f87171;
          background: rgba(248, 113, 113, 0.1);
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 600;
        }

        .employee-hint {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            text-align: center;
        }
        .employee-hint p { margin-bottom: 8px; font-size: 0.8rem; }
        .text-orange { color: var(--color-energy-orange); font-weight: 700; text-decoration: none; font-size: 0.85rem; }

        .stepper {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 40px;
          gap: 10px;
        }

        .step {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #1a2235;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: #4a5568;
          font-size: 0.8rem;
          transition: all 0.3s ease;
        }

        .step.active {
          background: var(--color-energy-orange);
          color: white;
          box-shadow: 0 0 15px rgba(255, 140, 21, 0.4);
        }

        .line {
          height: 2px;
          width: 40px;
          background: #1a2235;
        }

        .step-content {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        h2 {
          font-size: 1.8rem;
          margin-bottom: 8px;
          background: linear-gradient(90deg, white, #a0aec0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        p {
          color: var(--text-secondary);
          margin-bottom: 32px;
          font-size: 0.9rem;
        }

        .input-group {
          margin-bottom: 24px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-size: 0.8rem;
          color: #718096;
          font-weight: 600;
        }

        input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 14px;
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          outline: none;
        }

        .slug-preview {
          background: rgba(255, 255, 255, 0.03);
          padding: 12px;
          border-radius: 12px;
          border: 1px dashed rgba(255, 255, 255, 0.1);
          font-size: 0.8rem;
          color: #718096;
        }

        b { color: var(--color-energy-orange); }

        .color-grid {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
        }

        .color-box {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          cursor: pointer;
          transition: transform 0.2s;
          border: 3px solid transparent;
        }

        .color-box.selected {
          transform: scale(1.1);
          border-color: white;
        }

        .color-preview {
          background: rgba(255, 255, 255, 0.03);
          padding: 20px;
          border-radius: 16px;
          margin-bottom: 32px;
          text-align: center;
        }

        .preview-item { font-weight: 600; margin-bottom: 12px; }
        .preview-btn { border-radius: 8px; color: white; padding: 8px 16px; font-weight: 600; }

        .actions {
          display: flex;
          gap: 12px;
        }

        .summary-card {
          background: rgba(255, 255, 255, 0.03);
          padding: 24px;
          border-radius: 20px;
          margin-bottom: 32px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .summary-card p { margin-bottom: 12px; }

        .btn-primary { width: 100%; }
        .btn-secondary { background: #1a2235; color: white; border-radius: 12px; padding: 12px 24px; }
      `}</style>
    </div>
  );
}
