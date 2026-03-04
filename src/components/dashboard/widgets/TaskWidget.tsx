'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function TaskWidget() {
  const supabase = createClient();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const [editingTime, setEditingTime] = useState(false);

  const setNowTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    setCompletedAt(`${h}:${m}`);
  };

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: taskData } = await (supabase.from('user_tasks') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (taskData) setTasks(taskData);

    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCompletedAt('');
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (task: any) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setCompletedAt(task.completed_at ? task.completed_at.slice(0, 16) : '');
    setIsAdding(true);
  };

  const titleInputRef = useRef<HTMLInputElement>(null);

  const saveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const getFullIsoDate = (timeStr: string) => {
      if (!timeStr) return null;
      if (timeStr.includes('T')) return timeStr;
      const [hours, minutes] = timeStr.split(':');
      const d = new Date();
      d.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return d.toISOString();
    };

    const taskData = {
      title,
      description,
      user_id: user.id,
      completed_at: getFullIsoDate(completedAt),
      status: completedAt ? 'done' : 'pending'
    };

    if (editingId) {
      const { data, error } = await (supabase.from('user_tasks') as any)
        .update(taskData)
        .eq('id', editingId)
        .select('*')
        .single();

      if (!error && data) {
        setTasks(tasks.map(t => t.id === editingId ? data : t));
        resetForm();
      }
    } else {
      const { data, error } = await (supabase.from('user_tasks') as any)
        .insert([taskData])
        .select('*')
        .single();

      if (!error && data) {
        setTasks(prev => [data, ...prev]);
        // Limpiar campos pero mantener el formulario abierto para la siguiente tarea
        setTitle('');
        setDescription('');
        setCompletedAt('');
        setEditingTime(false);
        setTimeout(() => titleInputRef.current?.focus(), 50);
      }
    }
  };

  const toggleStatus = async (task: any) => {
    const isDone = task.status === 'done';
    const newStatus = isDone ? 'pending' : 'done';
    const newCompletedAt = isDone ? null : new Date().toISOString();

    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus, completed_at: newCompletedAt } : t));

    const { error } = await (supabase.from('user_tasks') as any)
      .update({ status: newStatus, completed_at: newCompletedAt })
      .eq('id', task.id);

    if (error) setTasks(previousTasks);
  };

  const deleteTask = async (id: string) => {
    const { error } = await (supabase.from('user_tasks') as any).delete().eq('id', id);
    if (!error) setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="glass-card task-card-tabular animate-bento">
      <div className="card-header">
        <h4 className="title-handwritten">Gestor de tareas</h4>
        <button className={`btn-plus-vibe ${isAdding ? 'active' : ''}`} onClick={() => isAdding ? resetForm() : setIsAdding(true)}>
          {isAdding ? '×' : '+'}
        </button>
      </div>

      <div className="table-container">
        <div className="table-header-row">
          <div className="col-check"></div>
          <div className="col-name">MISIÓN</div>
          <div className="col-time">FINALIZADO</div>
          <div className="col-details">NOTAS</div>
          <div className="col-actions"></div>
        </div>

        {isAdding && (
          <form onSubmit={saveTask} className="task-row-form animate-in">
            <div className="col-check"></div>
            <div className="col-name">
              <input
                ref={titleInputRef}
                required autoFocus type="text"
                placeholder="Nombre... (Enter para guardar y agregar otro)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="col-time">
              {completedAt ? (
                editingTime ? (
                  <input
                    type="time"
                    className="time-input-inline"
                    value={completedAt}
                    autoFocus
                    onChange={(e) => setCompletedAt(e.target.value)}
                    onBlur={() => setEditingTime(false)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTime(false); }}
                  />
                ) : (
                  <span className="time-pill set" title="Clic para editar">
                    <span onClick={() => setEditingTime(true)} style={{ cursor: 'text' }}>{completedAt}</span>
                    <button type="button" className="time-clear" onClick={() => setCompletedAt('')}>×</button>
                  </span>
                )
              ) : (
                <button type="button" className="time-pill empty" onClick={() => { setNowTime(); }}>
                  + Ahora
                </button>
              )}
            </div>
            <div className="col-details">
              <input
                placeholder="Detalles..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="col-actions">
              <button type="submit" className="btn-done-small">💾</button>
            </div>
          </form>
        )}

        <div className="task-list-scroll">
          {loading ? (
            <div className="loading-state">Cargando misiones...</div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">No hay tareas hoy. ¡Todo despejado! 🌌</div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className={`task-tabular-row ${task.status === 'done' ? 'is-done' : ''}`}>
                <div className="col-check">
                  <div className="custom-check" onClick={() => toggleStatus(task)}>
                    {task.status === 'done' && '✓'}
                  </div>
                </div>
                <div className="col-name" onClick={() => startEdit(task)}>
                  <span className="task-title-text">{task.title}</span>
                </div>
                <div className="col-time">
                  <span className="time-text">
                    {task.completed_at ? new Date(task.completed_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}
                  </span>
                </div>
                <div className="col-details">
                  <span className="details-text" title={task.description}>{task.description || '-'}</span>
                </div>
                <div className="col-actions">
                  <button className="btn-action" onClick={() => startEdit(task)}>✏️</button>
                  <button className="btn-action" onClick={() => deleteTask(task.id)}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .task-card-tabular {
          padding: 20px;
          display: flex;
          flex-direction: column;
          min-height: 250px;
          border-radius: 20px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .title-handwritten {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.9);
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
        }

        .btn-plus-vibe {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          font-size: 1.2rem;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .btn-plus-vibe:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1.1);
        }

        .btn-plus-vibe.active {
          background: #ff5e5e;
          transform: rotate(90deg);
        }

        .table-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .table-header-row {
          display: flex;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 700;
          letter-spacing: 1px;
        }

        .task-list-scroll {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 260px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .task-list-scroll::-webkit-scrollbar { width: 4px; }
        .task-list-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }

        .task-tabular-row {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 14px;
          transition: all 0.2s ease;
        }

        .task-tabular-row:hover {
          background: rgba(255, 255, 255, 0.04);
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .task-tabular-row.is-done {
          opacity: 0.6;
        }

        .col-check { width: 40px; flex-shrink: 0; }
        .col-name { flex: 5; padding-right: 15px; }
        .col-time { flex: 2; text-align: center; min-width: 100px; }
        .col-details { flex: 4; padding-left: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .col-actions { width: 80px; flex-shrink: 0; display: flex; gap: 8px; justify-content: flex-end; }

        .custom-check {
          width: 22px;
          height: 22px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          color: var(--color-energy-orange);
          transition: all 0.2s;
        }

        .is-done .custom-check {
          background: rgba(255, 140, 21, 0.1);
          border-color: var(--color-energy-orange);
        }

        .task-title-text {
          font-size: 0.95rem;
          color: white;
          cursor: pointer;
        }

        .is-done .task-title-text {
          text-decoration: line-through;
          color: rgba(255, 255, 255, 0.4);
        }

        .time-text, .details-text {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .btn-action {
          background: transparent;
          font-size: 0.9rem;
          opacity: 0.3;
          transition: opacity 0.2s;
        }

        .task-tabular-row:hover .btn-action {
          opacity: 0.8;
        }

        .btn-action:hover {
          opacity: 1 !important;
          transform: scale(1.1);
        }

        .task-row-form {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--color-energy-orange);
          border-radius: 14px;
          margin-bottom: 8px;
        }

        .task-row-form input {
          width: 100%;
          background: transparent;
          border: none;
          color: white;
          font-size: 0.9rem;
          padding: 4px;
          outline: none;
        }

        .btn-done-small {
          background: var(--color-energy-orange);
          padding: 6px;
          border-radius: 8px;
          font-size: 0.8rem;
          box-shadow: 0 0 10px rgba(255, 140, 21, 0.3);
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: 40px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.9rem;
        }

        .animate-in {
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Time pill */
        .time-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .time-pill.empty {
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.4);
          border: 1px dashed rgba(255, 255, 255, 0.15);
        }

        .time-pill.empty:hover {
          background: rgba(255, 140, 21, 0.1);
          color: var(--color-energy-orange);
          border-color: var(--color-energy-orange);
        }

        .time-pill.set {
          background: rgba(255, 140, 21, 0.12);
          color: var(--color-energy-orange);
          border: 1px solid rgba(255, 140, 21, 0.3);
        }

        .time-clear {
          background: none;
          border: none;
          color: var(--color-energy-orange);
          font-size: 1rem;
          line-height: 1;
          padding: 0;
          cursor: pointer;
          opacity: 0.7;
          display: inline-flex;
        }

        .time-clear:hover { opacity: 1; }

        .time-input-inline {
          background: rgba(255, 140, 21, 0.1);
          border: 1px solid var(--color-energy-orange);
          border-radius: 20px;
          color: var(--color-energy-orange);
          font-size: 0.8rem;
          font-weight: 600;
          padding: 3px 10px;
          outline: none;
          width: 90px;
          font-family: inherit;
          color-scheme: dark;
        }
      `}</style>
    </div>
  );
}
