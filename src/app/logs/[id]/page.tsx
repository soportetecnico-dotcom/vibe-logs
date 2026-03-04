'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function LogDetailPage() {
    const params = useParams();
    const id = params?.id;
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [log, setLog] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [evidences, setEvidences] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return router.push('/login');

            const { data: profileData } = await (supabase.from('profiles') as any).select('*, organizations(*)').eq('id', user.id).single();
            setProfile(profileData);

            const { data: logData } = await (supabase.from('logs') as any).select('*').eq('id', id).single();
            if (!logData) return router.push('/logs');
            setLog(logData);

            const { data: activitiesData } = await (supabase.from('log_activities') as any).select('*').eq('log_id', id).order('created_at', { ascending: true });
            setActivities(activitiesData || []);

            const { data: evidencesData, error: evError } = await (supabase.from('log_evidences') as any).select('*').eq('log_id', id);
            if (evError) console.error("Error al cargar evidencias:", evError);
            setEvidences(evidencesData || []);

            setLoading(false);
        };
        fetchData();
    }, [id, router]);

    const generatePDF = () => {
        const doc = new jsPDF();
        const dateStr = new Date(log.report_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

        // Estilos y Cabecera
        doc.setFontSize(22);
        doc.setTextColor(5, 11, 24); // Space Blue
        doc.text('REPORTE DE BITÁCORA', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`ID Misión: ${log.id}`, 14, 30);
        doc.text(`Fecha de Reporte: ${dateStr}`, 14, 35);
        doc.text(`Colaborador: ${profile?.full_name || 'Astronauta'}`, 14, 40);
        doc.text(`Organización: ${profile?.organizations?.name || 'VibeLogs'}`, 14, 45);

        // Actividades Realizadas
        doc.setFontSize(14);
        doc.setTextColor(255, 94, 94); // Energy Orange/Vibrant Rose
        doc.text('TAREAS REALIZADAS', 14, 58);

        const tableData = activities
            .filter(a => a.status === 'completed')
            .map(a => [a.execution_time || '--:--', a.activity_description, a.observations || '-']);

        autoTable(doc, {
            startY: 62,
            head: [['Hora', 'Actividad', 'Detalles']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [5, 11, 24], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 15;

        // Pendientes
        doc.setFontSize(14);
        doc.text('PENDIENTES MAÑANA', 14, finalY);
        doc.setFontSize(10);
        doc.setTextColor(50);
        const pendingText = activities
            .filter(a => a.status === 'pending')
            .map(a => `• ${a.activity_description}`)
            .join('\n');
        doc.text(pendingText || 'Sin pendientes registrados.', 14, finalY + 7);

        // Aprendizaje y Notas
        const learningY = finalY + 30;
        doc.setFontSize(14);
        doc.text('APRENDIZAJE Y NOTAS', 14, learningY);
        doc.setFontSize(10);
        doc.text(`Aprendizaje: ${log.learning || 'N/A'}`, 14, learningY + 7, { maxWidth: 180 });
        doc.text(`Notas: ${log.notes || 'N/A'}`, 14, learningY + 20, { maxWidth: 180 });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Generado automáticamente por VibeLogs - Tu Bitácora Espacial', 14, 285);

        doc.save(`Bitacora_${log.report_date}.pdf`);
    };

    if (loading) return <div className="loading-vibe">Abriendo archivos de la misión...</div>;

    return (
        <div className="vibelogs-container">
            <Sidebar />
            <main className="vibe-main">
                <DashboardHeader profile={profile} />

                <div className="detail-panel animate-in">
                    <header className="detail-header">
                        <div className="title-area">
                            <button className="btn-back-vibe" onClick={() => router.push('/logs')}>← Volver</button>
                            <h1>Reporte de Misión</h1>
                            <span className="mission-id">ID: {log.id.slice(0, 8)}</span>
                        </div>
                        <div className="header-meta">
                            <div className="meta-item">
                                <span className="label">Fecha</span>
                                <span className="value">{new Date(log.report_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <button className="btn-pdf-generate" onClick={generatePDF}>📄 Generar PDF</button>
                        </div>
                    </header>

                    <div className="detail-grid">
                        <section className="glass-panel full">
                            <h3>✅ Tareas Realizadas</h3>
                            <div className="scrollable-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '100px' }}>Hora</th>
                                            <th>Actividad</th>
                                            <th>Detalles</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activities.filter(a => a.status === 'completed').map((act, i) => (
                                            <tr key={i}>
                                                <td className="time-cell">{act.execution_time || '--:--'}</td>
                                                <td className="desc-cell">{act.activity_description}</td>
                                                <td className="obs-cell">{act.observations || '-'}</td>
                                            </tr>
                                        ))}
                                        {activities.filter(a => a.status === 'completed').length === 0 && (
                                            <tr><td colSpan={3} className="empty-msg">No se registraron actividades realizadas.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="glass-panel full">
                            <h3>⏳ Pendientes Mañana</h3>
                            <div className="pending-tags">
                                {activities.filter(a => a.status === 'pending').map((act, i) => (
                                    <div key={i} className="pending-tag">
                                        <span className="bullet">⚡</span>
                                        {act.activity_description}
                                    </div>
                                ))}
                                {activities.filter(a => a.status === 'pending').length === 0 && (
                                    <p className="empty-msg">Todo despejado para mañana. 🌌</p>
                                )}
                            </div>
                        </section>

                        <section className="glass-panel half">
                            <h3>🧠 Aprendizaje del Día</h3>
                            <div className="text-content">
                                {log.learning || 'Sin registros de aprendizaje hoy.'}
                            </div>
                        </section>

                        <section className="glass-panel half">
                            <h3>📝 Notas Adicionales</h3>
                            <div className="text-content">
                                {log.notes || 'Sin notas adicionales.'}
                            </div>
                        </section>

                        <section className="glass-panel full">
                            <h3>📸 Evidencias y Adjuntos</h3>
                            <div className="evidences-display">
                                {evidences.length === 0 ? (
                                    <p className="empty-msg">No hay evidencias adjuntas a este reporte.</p>
                                ) : (
                                    <div className="ev-grid-vibe">
                                        {evidences.map((ev, i) => (
                                            <div key={i} className="ev-item-vibe">
                                                {ev.type === 'image' ? (
                                                    <a href={ev.url} target="_blank" rel="noreferrer" className="ev-img-link">
                                                        <img src={ev.url} alt={ev.description || 'Evidencia'} />
                                                    </a>
                                                ) : (
                                                    <div className="evidence-link-card">
                                                        <span className="icon">🔗</span>
                                                        <div className="ev-info">
                                                            <span className="ev-desc">{ev.description || 'Archivo adjunto'}</span>
                                                            <a href={ev.url} target="_blank" rel="noreferrer" className="ev-url">{ev.url}</a>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <style jsx>{`
        .vibelogs-container { display: flex; min-height: 100vh; background: #050b18; }
        .vibe-main { flex: 1; margin-left: 280px; padding: 30px 40px; }
        .detail-panel { max-width: 1000px; margin: 0 auto; }
        .detail-header { margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
        .btn-back-vibe { 
          display: inline-block;
          background: transparent;
          color: rgba(255, 255, 255, 0.5); 
          margin-bottom: 12px; 
          font-size: 0.95rem; 
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn-back-vibe:hover { 
          color: white; 
          transform: translateX(-4px); 
        }
        h1 { font-size: 2.2rem; color: white; font-weight: 800; }
        .mission-id { font-size: 0.8rem; color: var(--color-energy-orange); font-weight: 700; opacity: 0.6; }
        .header-meta { display: flex; align-items: center; gap: 30px; }
        .meta-item { display: flex; flex-direction: column; }
        .label { font-size: 0.75rem; color: rgba(255, 255, 255, 0.3); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .value { color: white; font-weight: 600; font-size: 1rem; }
        .btn-pdf-generate {
          background: white; color: #050b18; padding: 10px 20px; border-radius: 12px;
          font-weight: 700; font-size: 0.9rem; transition: all 0.3s;
        }
        .btn-pdf-generate:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(255, 255, 255, 0.2); }
        .detail-grid { display: flex; flex-wrap: wrap; gap: 20px; }
        .glass-panel {
          background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px; padding: 24px;
        }
        .full { width: 100%; }
        .half { width: calc(50% - 10px); }
        h3 { color: var(--color-energy-orange); font-size: 1.1rem; margin-bottom: 20px; font-weight: 700; }
        .scrollable-table { width: 100%; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 12px; color: rgba(255, 255, 255, 0.3); font-size: 0.8rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        td { padding: 15px 12px; color: white; font-size: 0.95rem; border-bottom: 1px solid rgba(255, 255, 255, 0.03); }
        .time-cell { font-family: 'Montserrat', sans-serif; font-weight: 700; color: var(--color-energy-orange); }
        .obs-cell { color: rgba(255, 255, 255, 0.5); font-style: italic; font-size: 0.85rem; }
        .pending-tags { display: flex; flex-direction: column; gap: 10px; }
        .pending-tag {
          display: flex; align-items: center; gap: 12px; background: rgba(255, 255, 255, 0.02);
          padding: 12px 20px; border-radius: 14px; color: white; border: 1px solid rgba(255, 255, 255, 0.04);
        }
        .bullet { font-size: 1.1rem; }
        .text-content {
          line-height: 1.6; color: rgba(255, 255, 255, 0.8); font-size: 1rem;
          background: rgba(255, 255, 255, 0.02); padding: 15px; border-radius: 12px;
        }
        .evidences-display { display: flex; flex-direction: column; gap: 12px; }
        .ev-grid-vibe { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; }
        .ev-img-link { display: block; height: 150px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.05); }
        .ev-img-link img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .ev-img-link:hover img { transform: scale(1.05); }
        .evidence-link-card {
          display: flex; align-items: center; gap: 15px; background: rgba(255, 255, 255, 0.02); 
          padding: 15px; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.04);
        }
        .icon { font-size: 1.5rem; }
        .ev-info { display: flex; flex-direction: column; }
        .ev-desc { font-weight: 600; color: white; }
        .ev-url { font-size: 0.8rem; color: var(--color-energy-orange); text-decoration: underline; opacity: 0.7; }
        .empty-msg { text-align: center; color: rgba(255, 255, 255, 0.3); font-size: 0.9rem; margin: 20px 0; }
        .loading-vibe { height: 100vh; display: flex; align-items: center; justify-content: center; background: #050b18; color: white; }
        .animate-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </div>
    );
}
