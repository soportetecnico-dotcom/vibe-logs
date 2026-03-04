'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

export default function NewLogPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Data
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  // Task Panel (sidebar source)
  const [allDoneTasks, setAllDoneTasks] = useState<any[]>([]);
  const [allPendingTasks, setAllPendingTasks] = useState<any[]>([]);

  // Realizadas (table rows)
  const [activities, setActivities] = useState<any[]>([
    { hour: '', description: '', observations: '' }
  ]);

  // Pendientes Mañana
  const [pendingActivities, setPendingActivities] = useState<string[]>(['']);

  // Learning & Notes
  const [learning, setLearning] = useState('');
  const [notes, setNotes] = useState('');
  const [evidences, setEvidences] = useState<any[]>([]);

  // Drag state
  const [draggingOver, setDraggingOver] = useState<string | null>(null);

  useEffect(() => {
    init();
    return () => {
      evidences.forEach(ev => {
        if (ev.preview) URL.revokeObjectURL(ev.preview);
      });
    };
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/login');

    const { data: profileData } = await (supabase.from('profiles') as any).select('*, organizations(*)').eq('id', user.id).single();
    if (profileData) setProfile(profileData);

    const { data: tasksData } = await (supabase.from('user_tasks') as any)
      .select('*').eq('user_id', user.id).order('created_at', { ascending: false });

    if (tasksData) {
      setAllDoneTasks(tasksData.filter((t: any) => t.status === 'done'));
      setAllPendingTasks(tasksData.filter((t: any) => t.status !== 'done'));
    }

    setLoading(false);
  };

  // ── Activity Rows ──────────────────────────────────────
  const addActivity = () => setActivities([...activities, { hour: '', description: '', observations: '' }]);
  const updateActivity = (index: number, field: string, val: string) => {
    const newArr = [...activities];
    newArr[index][field] = val;
    setActivities(newArr);
  };
  const removeActivity = (index: number) => setActivities(activities.filter((_, i) => i !== index));

  // ── Pending ────────────────────────────────────────────
  const addPending = () => setPendingActivities([...pendingActivities, '']);
  const updatePending = (index: number, val: string) => {
    const newArr = [...pendingActivities];
    newArr[index] = val;
    setPendingActivities(newArr);
  };
  const removePending = (index: number) => setPendingActivities(pendingActivities.filter((_, i) => i !== index));

  // ── Drag & Drop ────────────────────────────────────────
  const onDragStart = (e: React.DragEvent, task: any, type: 'done' | 'pending') => {
    e.dataTransfer.setData('task', JSON.stringify({ ...task, sourceType: type }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const onDropToRealizadas = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingOver(null);
    try {
      const task = JSON.parse(e.dataTransfer.getData('task'));
      const hour = task.completed_at
        ? new Date(task.completed_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })
        : '';
      // Remove empty placeholder if it's the only one and empty
      const cleaned = activities.filter(a => a.description.trim() !== '' || a.hour.trim() !== '');
      setActivities([...cleaned, { hour, description: task.title, observations: task.description || '' }]);
    } catch { }
  };

  const onDropToPendientes = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingOver(null);
    try {
      const task = JSON.parse(e.dataTransfer.getData('task'));
      const cleaned = pendingActivities.filter(p => p.trim() !== '');
      setPendingActivities([...cleaned, task.title]);
    } catch { }
  };

  const onDragOver = (e: React.DragEvent, zone: string) => {
    e.preventDefault();
    setDraggingOver(zone);
  };

  // ── Evidences ──────────────────────────────────────────
  const handleFileAction = (files: FileList | null) => {
    if (!files) return;
    const newEvidences = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: 'image',
      description: file.name
    }));
    setEvidences([...evidences, ...newEvidences]);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      const newEvidences = files.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        type: 'image',
        description: `Captura ${new Date().toLocaleTimeString()}`
      }));
      setEvidences([...evidences, ...newEvidences]);
    }
  };

  const removeEvidence = (index: number) => {
    const newEv = [...evidences];
    URL.revokeObjectURL(newEv[index].preview);
    newEv.splice(index, 1);
    setEvidences(newEv);
  };

  // ── Save ───────────────────────────────────────────────
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: log, error: logError } = await (supabase.from('logs') as any).insert([{
        user_id: user?.id,
        org_id: profile?.org_id,
        report_date: reportDate,
        learning,
        notes
      }]).select().single();

      if (logError) throw logError;
      const logId = (log as any).id;

      const activitiesToSave = activities
        .filter(a => a.description.trim() !== '')
        .map(a => ({
          log_id: logId,
          activity_description: a.description,
          execution_time: a.hour,
          observations: a.observations,
          status: 'completed'
        }));

      const pendingToSave = pendingActivities
        .filter(p => p.trim() !== '')
        .map(p => ({
          log_id: logId,
          activity_description: p,
          status: 'pending'
        }));

      const allActivities = [...activitiesToSave, ...pendingToSave];
      if (allActivities.length > 0) {
        const { error: activitiesError } = await (supabase.from('log_activities') as any).insert(allActivities);
        if (activitiesError) throw activitiesError;
      }

      if (evidences.length > 0) {
        const evidenceRecords = [];
        for (const ev of evidences) {
          if (ev.file) {
            const fileName = `${logId}/${Date.now()}_${ev.file.name}`;
            const { error: uploadError } = await supabase.storage.from('evidences').upload(fileName, ev.file);
            if (uploadError) { console.error(uploadError); continue; }
            const { data: { publicUrl } } = supabase.storage.from('evidences').getPublicUrl(fileName);
            evidenceRecords.push({ log_id: logId, type: 'image', url: publicUrl, description: ev.description });
          }
        }
        if (evidenceRecords.length > 0) {
          await (supabase.from('log_evidences') as any).insert(evidenceRecords);
        }
      }

      router.push('/logs');
    } catch (err: any) {
      console.error('Error al guardar:', err);
      setIsSaving(false);
      alert('Error al guardar la bitácora: ' + (err.message || 'Error desconocido'));
    }
  };

  if (loading) return <div className="loading-vibe">Inicializando motores... 🚀</div>;

  return (
    <div className="vibelogs-container">
      <Sidebar />
      <main className="vibe-main">
        <DashboardHeader profile={profile} />

        {/* ── Top Header ── */}
        <header className="panel-top animate-in">
          <div className="title-group">
            <h1>Nueva Bitácora</h1>
            <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="date-picker-vibe" />
          </div>
          <div className="btn-group">
            <button className="btn-cancel-vibe" onClick={() => router.back()}>Cancelar</button>
            <button className="btn-save-vibe" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Bitácora'}
            </button>
          </div>
        </header>

        {/* ── Main 2-column layout ── */}
        <div className="page-grid animate-in">

          {/* ════ LEFT COLUMN: Form ════ */}
          <div className="form-column">

            {/* Tareas Realizadas */}
            <section
              className={`glass-section ${draggingOver === 'realizadas' ? 'drop-active' : ''}`}
              onDragOver={(e) => onDragOver(e, 'realizadas')}
              onDragLeave={() => setDraggingOver(null)}
              onDrop={onDropToRealizadas}
            >
              <div className="section-header">
                <h3>Tareas Realizadas</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="drop-hint">⬅ Arrastra desde el panel</span>
                  <button className="btn-add-row" onClick={addActivity}>+ Fila</button>
                </div>
              </div>

              <div className="table-vibe">
                <div className="table-header">
                  <div className="col-check-h"></div>
                  <div className="col-name-h">MISIÓN</div>
                  <div className="col-time-h">FINALIZADO</div>
                  <div className="col-obs-h">NOTAS</div>
                  <div className="col-del-h"></div>
                </div>
                {activities.map((act, i) => (
                  <div key={i} className="table-row">
                    <div className="col-check-h">
                      <span className="row-dot"></span>
                    </div>
                    <div className="col-name-h">
                      <input
                        placeholder="Nombre de la actividad..."
                        value={act.description}
                        onChange={(e) => updateActivity(i, 'description', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            // Move focus to the time input of this row
                            const rows = document.querySelectorAll<HTMLInputElement>('.col-time-h input');
                            rows[i]?.focus();
                          }
                        }}
                      />
                    </div>
                    <div className="col-time-h">
                      <input
                        type="time"
                        value={act.hour}
                        onChange={(e) => updateActivity(i, 'hour', e.target.value)}
                        className="time-input-compact"
                      />
                    </div>
                    <div className="col-obs-h">
                      <input
                        placeholder="Notas..."
                        value={act.observations}
                        onChange={(e) => updateActivity(i, 'observations', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addActivity();
                            // Focus the new row's name input after render
                            setTimeout(() => {
                              const inputs = document.querySelectorAll<HTMLInputElement>('.col-name-h input');
                              const last = inputs[inputs.length - 1];
                              last?.focus();
                            }, 50);
                          }
                        }}
                      />
                    </div>
                    <div className="col-del-h">
                      <button onClick={() => removeActivity(i)} className="btn-del">×</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Pendientes Mañana */}
            <section
              className={`glass-section ${draggingOver === 'pendientes' ? 'drop-active' : ''}`}
              onDragOver={(e) => onDragOver(e, 'pendientes')}
              onDragLeave={() => setDraggingOver(null)}
              onDrop={onDropToPendientes}
            >
              <div className="section-header">
                <h3>Pendientes Mañana</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="drop-hint">⬅ Arrastra desde el panel</span>
                  <button className="btn-add-circle" onClick={addPending}>+</button>
                </div>
              </div>
              <div className="pending-list">
                {pendingActivities.map((p, i) => (
                  <div key={i} className="pending-row">
                    <span className="pending-dot">→</span>
                    <input
                      placeholder="Tarea para mañana..."
                      value={p}
                      onChange={(e) => updatePending(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addPending();
                          setTimeout(() => {
                            const inputs = document.querySelectorAll<HTMLInputElement>('.pending-row input');
                            const last = inputs[inputs.length - 1];
                            last?.focus();
                          }, 50);
                        }
                      }}
                    />
                    <button className="btn-del-mini" onClick={() => removePending(i)}>×</button>
                  </div>
                ))}
              </div>
            </section>

            {/* Aprendizaje + Notas */}
            <div className="half-grid">
              <section className="glass-section">
                <h3>Aprendizaje</h3>
                <textarea placeholder="¿Qué aprendiste hoy?" value={learning} onChange={(e) => setLearning(e.target.value)} />
              </section>
              <section className="glass-section">
                <h3>Notas</h3>
                <textarea placeholder="Notas adicionales..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </section>
            </div>

            {/* Evidencias */}
            <section className="glass-section">
              <h3>📸 Evidencias / Adjuntos</h3>
              <div className="evidence-zones">
                <input type="file" multiple accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => handleFileAction(e.target.files)} />
                <div className="dropzone-vibe" onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFileAction(e.dataTransfer.files); }}>
                  <strong>Subir Fotos</strong>
                  <span>O arrastra y suelta aquí</span>
                </div>
                <div className="clipboard-zone" onPaste={handlePaste} tabIndex={0}>
                  <span>Haz clic aquí y <strong>PEGA (Ctrl+V)</strong> capturas</span>
                </div>
              </div>
              {evidences.length > 0 && (
                <div className="previews-grid">
                  {evidences.map((ev, i) => (
                    <div key={i} className="preview-card">
                      <img src={ev.preview} alt="preview" />
                      <button className="btn-remove-ev" onClick={() => removeEvidence(i)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ════ RIGHT COLUMN: Task Panel ════ */}
          <aside className="task-panel glass-section">
            <h3>🗂 Mis Tareas</h3>

            <div className="task-panel-section">
              <p className="task-panel-label">✅ COMPLETADAS — arrastra a Tareas Realizadas</p>
              <div className="task-panel-list">
                {allDoneTasks.length === 0 ? (
                  <p className="no-tasks">No hay tareas completadas.</p>
                ) : (
                  allDoneTasks.map(task => (
                    <div
                      key={task.id}
                      className="task-chip done"
                      draggable
                      onDragStart={(e) => onDragStart(e, task, 'done')}
                      title="Arrastra a Tareas Realizadas"
                    >
                      <span className="chip-icon">✓</span>
                      <div className="chip-content">
                        <span className="chip-title">{task.title}</span>
                        {task.completed_at && (
                          <span className="chip-time">
                            {new Date(task.completed_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </span>
                        )}
                      </div>
                      <span className="drag-handle">⠿</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="task-panel-section">
              <p className="task-panel-label">⏳ PENDIENTES — arrastra a Pendientes Mañana</p>
              <div className="task-panel-list">
                {allPendingTasks.length === 0 ? (
                  <p className="no-tasks">No hay tareas pendientes.</p>
                ) : (
                  allPendingTasks.map(task => (
                    <div
                      key={task.id}
                      className="task-chip pending"
                      draggable
                      onDragStart={(e) => onDragStart(e, task, 'pending')}
                      title="Arrastra a Pendientes Mañana"
                    >
                      <span className="chip-icon">○</span>
                      <div className="chip-content">
                        <span className="chip-title">{task.title}</span>
                      </div>
                      <span className="drag-handle">⠿</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <style jsx>{`
        /* ─── Layout ─────────────────────────────────── */
        .vibelogs-container { display: flex; min-height: 100vh; background: #050b18; }
        .vibe-main { flex: 1; margin-left: 280px; padding: 20px 24px; display: flex; flex-direction: column; }

        .panel-top {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 16px;
        }
        .title-group { display: flex; align-items: center; gap: 16px; }
        h1 { font-size: 1.8rem; color: white; font-weight: 700; }
        .date-picker-vibe {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: white; padding: 7px 14px; border-radius: 10px; font-size: 0.9rem; color-scheme: dark;
        }
        .btn-group { display: flex; gap: 12px; }
        .btn-cancel-vibe {
          background: transparent; color: rgba(255,255,255,0.6); font-weight: 600;
          padding: 9px 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);
        }
        .btn-cancel-vibe:hover { color: white; background: rgba(255,255,255,0.05); }
        .btn-save-vibe {
          background: var(--color-energy-orange); color: white; padding: 9px 22px;
          border-radius: 10px; font-weight: 700; box-shadow: 0 4px 15px rgba(255,140,21,0.3);
        }

        .page-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 16px;
          align-items: start;
          flex: 1;
        }

        .form-column { display: flex; flex-direction: column; gap: 14px; }

        /* ─── Glass Sections ─────────────────────────── */
        .glass-section {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 18px; padding: 18px;
          transition: border-color 0.2s ease;
        }
        .drop-active {
          border-color: var(--color-energy-orange) !important;
          background: rgba(255, 140, 21, 0.04) !important;
          box-shadow: 0 0 0 1px rgba(255, 140, 21, 0.2);
        }
        h3 { color: var(--color-energy-orange); font-size: 1rem; margin-bottom: 14px; font-weight: 700; }

        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .section-header h3 { margin: 0; }
        
        .drop-hint { font-size: 0.65rem; color: rgba(255,255,255,0.25); font-style: italic; white-space: nowrap; }
        .btn-add-row {
          background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); padding: 5px 12px;
          border-radius: 7px; font-size: 0.8rem; font-weight: 600; border: 1px solid rgba(255,255,255,0.08);
        }
        .btn-add-row:hover { background: rgba(255,255,255,0.1); color: white; }
        .btn-add-circle {
          background: var(--color-vibrant-rose); color: white; width: 26px; height: 26px;
          border-radius: 50%; font-size: 1.1rem; display: flex; align-items: center; justify-content: center;
        }

        /* ─── Tareas Realizadas Table ─────────────────── */
        .table-vibe { display: flex; flex-direction: column; gap: 6px; }
        .table-header {
          display: flex; align-items: center; padding: 6px 8px;
          font-size: 0.65rem; color: rgba(255,255,255,0.35); font-weight: 700;
          letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.04);
          margin-bottom: 2px;
        }
        .table-row {
          display: flex; gap: 8px; align-items: center;
          background: rgba(255,255,255,0.02); padding: 6px 8px;
          border-radius: 10px; border: 1px solid rgba(255,255,255,0.03);
        }

        .col-check-h { width: 24px; flex-shrink: 0; }
        .col-name-h  { flex: 5; }
        .col-time-h  { flex: 2; min-width: 90px; }
        .col-obs-h   { flex: 4; }
        .col-del-h   { width: 28px; flex-shrink: 0; text-align: right; }

        .row-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(255,140,21,0.5); display: inline-block;
        }
        .btn-del { background: transparent; color: rgba(255,94,94,0.6); font-size: 1.1rem; }
        .btn-del:hover { color: #ff5e5e; }

        input, select, textarea {
          width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          color: white; padding: 7px 10px; border-radius: 8px; outline: none; font-size: 0.85rem;
          font-family: inherit;
        }
        input:focus, textarea:focus { border-color: rgba(255,140,21,0.4); }

        .time-input-compact {
          padding: 6px 8px; font-size: 0.8rem; color-scheme: dark;
          text-align: center; min-width: 0;
        }
        textarea { height: 110px; resize: none; }

        /* ─── Pendientes ─────────────────────────────── */
        .pending-list { display: flex; flex-direction: column; gap: 6px; }
        .pending-row { display: flex; gap: 8px; align-items: center; }
        .pending-dot { color: rgba(255,255,255,0.3); font-size: 0.9rem; flex-shrink: 0; }
        .btn-del-mini { color: rgba(255,94,94,0.6); font-size: 1.2rem; flex-shrink: 0; }
        .btn-del-mini:hover { color: #ff5e5e; }

        /* ─── Half Grid ──────────────────────────────── */
        .half-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        /* ─── Evidencias ─────────────────────────────── */
        .evidence-zones { display: flex; gap: 16px; }
        .dropzone-vibe, .clipboard-zone {
          flex: 1; height: 90px; border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 14px; display: flex; flex-direction: column; align-items: center;
          justify-content: center; background: rgba(255,255,255,0.01); transition: all 0.3s; cursor: pointer; gap: 4px;
        }
        .dropzone-vibe:hover, .clipboard-zone:hover { background: rgba(255,255,255,0.03); border-color: var(--color-energy-orange); }
        .dropzone-vibe strong, .clipboard-zone strong { font-size: 0.85rem; color: white; }
        .dropzone-vibe span, .clipboard-zone span { font-size: 0.75rem; color: rgba(255,255,255,0.4); text-align: center; }
        .clipboard-zone:focus { border-color: var(--color-energy-orange); outline: none; }

        .previews-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px; margin-top: 14px; }
        .preview-card { position: relative; border-radius: 10px; overflow: hidden; height: 110px; border: 1px solid rgba(255,255,255,0.1); }
        .preview-card img { width: 100%; height: 100%; object-fit: cover; }
        .btn-remove-ev {
          position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.6); color: white;
          width: 22px; height: 22px; border-radius: 50%; font-size: 1rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .btn-remove-ev:hover { background: #ff5e5e; }

        /* ─── Task Panel (Sidebar) ───────────────────── */
        .task-panel {
          position: sticky;
          top: 20px;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 18px 14px;
        }
        .task-panel::-webkit-scrollbar { width: 4px; }
        .task-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

        .task-panel-section { display: flex; flex-direction: column; gap: 8px; }

        .task-panel-label {
          font-size: 0.6rem; font-weight: 800; letter-spacing: 1px;
          color: rgba(255,255,255,0.3); text-transform: uppercase; margin-bottom: 4px;
        }

        .task-panel-list { display: flex; flex-direction: column; gap: 6px; }

        .task-chip {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px; border-radius: 10px; cursor: grab;
          border: 1px solid transparent; transition: all 0.2s ease;
          user-select: none;
        }
        .task-chip:active { cursor: grabbing; }

        .task-chip.done {
          background: rgba(255, 140, 21, 0.08);
          border-color: rgba(255, 140, 21, 0.2);
        }
        .task-chip.done:hover {
          background: rgba(255, 140, 21, 0.15);
          border-color: rgba(255, 140, 21, 0.4);
          transform: translateX(-2px);
        }
        .task-chip.pending {
          background: rgba(255,255,255,0.03);
          border-color: rgba(255,255,255,0.07);
        }
        .task-chip.pending:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.15);
          transform: translateX(-2px);
        }

        .chip-icon {
          font-size: 0.75rem;
          color: var(--color-energy-orange);
          flex-shrink: 0;
          width: 16px;
          text-align: center;
        }
        .task-chip.pending .chip-icon { color: rgba(255,255,255,0.3); }

        .chip-content {
          flex: 1; display: flex; flex-direction: column; gap: 1px; overflow: hidden; min-width: 0;
        }
        .chip-title {
          font-size: 0.8rem; color: white; font-weight: 500;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .chip-time { font-size: 0.65rem; color: var(--color-energy-orange); font-weight: 600; }

        .drag-handle {
          font-size: 0.9rem; color: rgba(255,255,255,0.15); flex-shrink: 0;
          letter-spacing: -2px;
        }

        .no-tasks { font-size: 0.75rem; color: rgba(255,255,255,0.25); text-align: center; padding: 8px 0; }

        /* ─── Animations ─────────────────────────────── */
        .animate-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .loading-vibe { height: 100vh; display: flex; align-items: center; justify-content: center; background: #050b18; color: white; font-family: 'Montserrat', sans-serif; }
      `}</style>
    </div>
  );
}
