import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { getExercise } from '../db/selectors'
import type { RoutineTemplate } from '../db/schema'
import { useAppState } from '../state/AppProvider'

export function RoutinesPage() {
  const { db, saveRoutine, deleteRoutine, startWorkoutFromRoutine } = useAppState()
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
          <span className="eyebrow">Routines</span>
          <h1>Repeat what works</h1>
        </div>
        <button className="button button-secondary button-inline" onClick={openCreateRoutine}>
          + New
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
                  Edit
                </button>
                <button
                  className="button button-danger button-inline"
                  onClick={() => void handleQuickDeleteRoutine(routine.id)}
                >
                  Delete
                </button>
                <button
                  className="button button-primary button-inline"
                  onClick={() => handleStartRoutine(routine.id)}
                >
                  Start
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
          title={editingRoutine ? 'Edit routine' : 'Create routine'}
          subtitle="Build a repeatable session with real exercise blocks."
          onClose={() => {
            setEditingRoutineId(null)
            setDraft(null)
          }}
        >
          <form className="stack" onSubmit={handleSaveRoutine}>
            <label className="field">
              <span>Name</span>
              <input
                className="input"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Description</span>
              <input
                className="input"
                value={draft.description ?? ''}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </label>

            <div className="stack compact-stack">
              {draft.exerciseBlocks.map((block, index) => (
                <div className="editor-row" key={block.id}>
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
                    placeholder="Sets"
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
                    Remove
                  </button>
                  <div className="inline-actions">
                    <button
                      type="button"
                      className="icon-button"
                      disabled={index === 0}
                      onClick={() => {
                        const next = [...draft.exerciseBlocks]
                        ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                        setDraft({
                          ...draft,
                          exerciseBlocks: next.map((item, itemIndex) => ({
                            ...item,
                            order: itemIndex,
                          })),
                        })
                      }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      disabled={index === draft.exerciseBlocks.length - 1}
                      onClick={() => {
                        const next = [...draft.exerciseBlocks]
                        ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
                        setDraft({
                          ...draft,
                          exerciseBlocks: next.map((item, itemIndex) => ({
                            ...item,
                            order: itemIndex,
                          })),
                        })
                      }}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>

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
              Add exercise block
            </button>

            <div className="modal-actions">
              {editingRoutine ? (
                <button type="button" className="button button-danger" onClick={handleDeleteRoutine}>
                  Delete routine
                </button>
              ) : null}
              <button className="button button-primary">Save routine</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  )
}
