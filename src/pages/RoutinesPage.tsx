import { useMemo, useState, type FormEvent } from 'react'
import { Reorder } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { getExercise } from '../db/selectors'
import type { RoutineTemplate } from '../db/schema'
import { useI18n } from '../i18n/translations'
import { useAppState } from '../state/AppProvider'

export function RoutinesPage() {
  const { db, saveRoutine, deleteRoutine, startWorkoutFromRoutine } = useAppState()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null)
  const [draft, setDraft] = useState<RoutineTemplate | null>(null)

  const editingRoutine = useMemo(
    () => db.routines.find((routine) => routine.id === editingRoutineId),
    [db.routines, editingRoutineId],
  )

  function openCreateRoutine() {
    setEditingRoutineId('new')
    setDraft({
      id: 'new',
      name: '',
      description: '',
      exerciseBlocks: db.exercises.slice(0, 2).map((exercise, index) => ({
        id: crypto.randomUUID(),
        exerciseId: exercise.id,
        order: index,
        suggestedSets: 3,
        suggestedRepRange: '8-12',
        suggestedRestSec: 90,
      })),
    })
  }

  function openEditRoutine(routine: RoutineTemplate) {
    setEditingRoutineId(routine.id)
    setDraft({
      ...routine,
      exerciseBlocks: [...routine.exerciseBlocks].sort((a, b) => a.order - b.order),
    })
  }

  async function handleStartRoutine(routineId: string) {
    const workout = await startWorkoutFromRoutine(routineId)
    if (workout) navigate(`/workout/${workout.id}`)
  }

  async function handleSaveRoutine(event: FormEvent) {
    event.preventDefault()
    if (!draft || !draft.name.trim()) return
    await saveRoutine({
      id: draft.id === 'new' ? undefined : draft.id,
      name: draft.name.trim(),
      description: draft.description?.trim() || undefined,
      exerciseBlocks: draft.exerciseBlocks.map((block, index) => ({ ...block, order: index })),
    })
    setEditingRoutineId(null)
    setDraft(null)
  }

  async function handleDeleteRoutine() {
    if (!editingRoutine || !window.confirm('Delete this routine?')) return
    await deleteRoutine(editingRoutine.id)
    setEditingRoutineId(null)
    setDraft(null)
  }

  async function handleQuickDeleteRoutine(routineId: string) {
    if (!window.confirm('Delete this routine?')) return
    await deleteRoutine(routineId)
    if (editingRoutineId === routineId) {
      setEditingRoutineId(null)
      setDraft(null)
    }
  }

  return (
    <section className="screen">
      <header className="page-header">
        <div>
          <span className="eyebrow">{t('tabRoutines')}</span>
          <h1>{t('routinesTitle')}</h1>
        </div>
        <button className="button button-secondary button-inline" onClick={openCreateRoutine}>
          + {t('newRoutine')}
        </button>
      </header>

      <div className="stack">
        {db.routines.map((routine) => (
          <article className="panel" key={routine.id}>
            <div className="section-heading">
              <div>
                <h2>{routine.name}</h2>
                <p className="muted">{routine.description || 'No description yet'}</p>
              </div>
              <div className="inline-actions">
                <button
                  className="button button-secondary button-inline"
                  onClick={() => openEditRoutine(routine)}
                >
                  {t('edit')}
                </button>
                <button
                  className="button button-danger button-inline"
                  onClick={() => void handleQuickDeleteRoutine(routine.id)}
                >
                  {t('delete')}
                </button>
                <button
                  className="button button-primary button-inline"
                  onClick={() => handleStartRoutine(routine.id)}
                >
                  {t('start')}
                </button>
              </div>
            </div>
            <div className="routine-grid">
              {routine.exerciseBlocks.map((block) => (
                <div className="routine-chip" key={block.id}>
                  <strong>{getExercise(db, block.exerciseId)?.name ?? 'Exercise'}</strong>
                  <span>{block.suggestedSets ?? '--'} sets</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      {draft ? (
        <Modal
          title={editingRoutine ? t('editRoutine') : t('createRoutine')}
          subtitle={t('routineSubtitle')}
          onClose={() => {
            setEditingRoutineId(null)
            setDraft(null)
          }}
        >
          <form className="stack" onSubmit={handleSaveRoutine}>
            <label className="field">
              <span>{t('name')}</span>
              <input
                className="input"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </label>
            <label className="field">
              <span>{t('description')}</span>
              <input
                className="input"
                value={draft.description ?? ''}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </label>

            <Reorder.Group
              axis="y"
              values={draft.exerciseBlocks}
              onReorder={(next) =>
                setDraft({
                  ...draft,
                  exerciseBlocks: next.map((item, itemIndex) => ({ ...item, order: itemIndex })),
                })
              }
              className="stack compact-stack reorder-group"
            >
              {draft.exerciseBlocks.map((block) => (
                <Reorder.Item className="editor-row" key={block.id} value={block}>
                  <select
                    className="input"
                    value={block.exerciseId}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        exerciseBlocks: draft.exerciseBlocks.map((item) =>
                          item.id === block.id ? { ...item, exerciseId: event.target.value } : item,
                        ),
                      })
                    }
                  >
                    {db.exercises.map((exercise) => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input"
                    inputMode="numeric"
                    value={block.suggestedSets ?? ''}
                    placeholder={t('sets')}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        exerciseBlocks: draft.exerciseBlocks.map((item) =>
                          item.id === block.id
                            ? { ...item, suggestedSets: Number(event.target.value) || undefined }
                            : item,
                        ),
                      })
                    }
                  />
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        exerciseBlocks: draft.exerciseBlocks
                          .filter((item) => item.id !== block.id)
                          .map((item, itemIndex) => ({ ...item, order: itemIndex })),
                      })
                    }
                  >
                    {t('remove')}
                  </button>
                  <div className="drag-hint">
                    {db.user.language === 'pl'
                      ? 'Przeciągnij, aby zmienić kolejność'
                      : db.user.language === 'uk'
                        ? 'Перетягни, щоб змінити порядок'
                        : 'Drag to reorder'}
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>

            <button
              type="button"
              className="button button-secondary"
              onClick={() =>
                setDraft({
                  ...draft,
                  exerciseBlocks: [
                    ...draft.exerciseBlocks,
                    {
                      id: crypto.randomUUID(),
                      exerciseId: db.exercises[0]?.id ?? '',
                      order: draft.exerciseBlocks.length,
                      suggestedSets: 3,
                      suggestedRepRange: '8-12',
                      suggestedRestSec: 90,
                    },
                  ],
                })
              }
            >
              {t('addExerciseBlock')}
            </button>

            <div className="modal-actions">
              {editingRoutine ? (
                <button type="button" className="button button-danger" onClick={handleDeleteRoutine}>
                  {t('delete')}
                </button>
              ) : null}
              <button className="button button-primary">{t('saveRoutine')}</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  )
}
