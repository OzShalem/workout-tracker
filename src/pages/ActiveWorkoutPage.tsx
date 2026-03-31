import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { getExercise, getRecentExerciseBest, getWorkout } from '../db/selectors'
import type { WorkoutSet } from '../db/schema'
import { useAppState } from '../state/AppProvider'
import { createWorkoutExercise, createWorkoutSet } from '../state/workoutFactories'

function toInputNumber(value: string): number | undefined {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed < 0) return undefined
  return parsed
}

export function ActiveWorkoutPage() {
  const { workoutId = '' } = useParams()
  const navigate = useNavigate()
  const { db, updateWorkout, finishWorkout } = useAppState()
  const workout = getWorkout(db, workoutId)
  const startedAt = workout?.startedAt ?? new Date().toISOString()
  const [elapsedMinutes, setElapsedMinutes] = useState(() =>
    Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / 60000)),
  )

  const availableExercises = useMemo(
    () =>
      db.exercises.filter(
        (exercise) => !workout?.exercises.some((entry) => entry.exerciseId === exercise.id),
      ),
    [db.exercises, workout],
  )

  useEffect(() => {
    if (!workout) return undefined

    const interval = window.setInterval(() => {
      setElapsedMinutes(
        Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / 60000)),
      )
    }, 30000)

    return () => window.clearInterval(interval)
  }, [startedAt, workout])

  if (!workout) {
    return <Navigate to="/" replace />
  }

  if (workout.endedAt) {
    return <Navigate to={`/workout/${workout.id}/detail`} replace />
  }

  const currentWorkout = workout

  async function handleAddExercise(exerciseId: string) {
    if (!exerciseId) return
    await updateWorkout(currentWorkout.id, (current) => ({
      ...current,
      exercises: [...current.exercises, createWorkoutExercise(exerciseId, current.exercises.length)],
    }))
  }

  async function handleUpdateSet(
    exerciseEntryId: string,
    setId: string,
    patch: Partial<WorkoutSet>,
  ) {
    await updateWorkout(currentWorkout.id, (current) => ({
      ...current,
      exercises: current.exercises.map((entry) =>
        entry.id === exerciseEntryId
          ? {
              ...entry,
              sets: entry.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)),
            }
          : entry,
      ),
    }))
  }

  async function handleAddSet(exerciseEntryId: string) {
    await updateWorkout(currentWorkout.id, (current) => ({
      ...current,
      exercises: current.exercises.map((entry) =>
        entry.id === exerciseEntryId
          ? { ...entry, sets: [...entry.sets, createWorkoutSet()] }
          : entry,
      ),
    }))
  }

  async function handleFinishWorkout() {
    await finishWorkout(currentWorkout.id)
    navigate('/history')
  }

  return (
    <section className="screen">
      <header className="page-header">
        <div>
          <span className="eyebrow">Active workout</span>
          <h1>{currentWorkout.title || 'New Workout'}</h1>
          <p className="muted">{elapsedMinutes} min elapsed</p>
        </div>
        <button className="button button-primary" onClick={handleFinishWorkout}>
          Finish
        </button>
      </header>

      <div className="panel">
        <div className="stack compact-stack">
          <label className="field">
            <span>Workout title</span>
            <input
              className="input"
              value={currentWorkout.title ?? ''}
              onChange={(event) =>
                void updateWorkout(currentWorkout.id, (current) => ({ ...current, title: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>Notes</span>
            <input
              className="input"
              placeholder="Sleep, energy, pain, wins..."
              value={currentWorkout.notes ?? ''}
              onChange={(event) =>
                void updateWorkout(currentWorkout.id, (current) => ({ ...current, notes: event.target.value }))
              }
            />
          </label>
        </div>
      </div>

      {currentWorkout.exercises.map((entry, index) => {
        const exercise = getExercise(db, entry.exerciseId)
        const lastBest = getRecentExerciseBest(
          db.workouts.filter((session) => session.id !== currentWorkout.id),
          entry.exerciseId,
        )

        return (
          <article className="panel exercise-panel" key={entry.id}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">Exercise {index + 1}</span>
                <h2>{exercise?.name ?? 'Exercise'}</h2>
                {lastBest ? (
                  <p className="muted">
                    Last best: {lastBest.weight ?? '--'} x {lastBest.reps ?? '--'}
                  </p>
                ) : null}
              </div>
              <div className="inline-actions">
                <button className="button button-ghost" onClick={() => handleAddSet(entry.id)}>
                  Add Set
                </button>
                <button
                  className="button button-ghost button-danger-text"
                  onClick={() =>
                    void updateWorkout(currentWorkout.id, (current) => ({
                      ...current,
                      exercises: current.exercises
                        .filter((item) => item.id !== entry.id)
                        .map((item, itemIndex) => ({ ...item, order: itemIndex })),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="sets-table">
              <div className="sets-header">
                <span>Set</span>
                <span>Weight</span>
                <span>Reps</span>
                <span>Done</span>
              </div>
              {entry.sets.map((set, setIndex) => (
                <div className="set-row" key={set.id}>
                  <span className="set-index">{setIndex + 1}</span>
                  <input
                    className="input input-inline"
                    inputMode="decimal"
                    placeholder="0"
                    value={set.weight ?? ''}
                    onChange={(event) =>
                      void handleUpdateSet(entry.id, set.id, { weight: toInputNumber(event.target.value) })
                    }
                  />
                  <input
                    className="input input-inline"
                    inputMode="numeric"
                    placeholder="0"
                    value={set.reps ?? ''}
                    onChange={(event) =>
                      void handleUpdateSet(entry.id, set.id, { reps: toInputNumber(event.target.value) })
                    }
                  />
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={set.isCompleted}
                      onChange={(event) =>
                        void handleUpdateSet(entry.id, set.id, { isCompleted: event.target.checked })
                      }
                    />
                    <span />
                  </label>
                </div>
              ))}
            </div>
          </article>
        )
      })}

      <div className="panel">
        <label className="field">
          <span>Add exercise</span>
          <select
            className="input"
            defaultValue=""
            onChange={(event) => {
              const value = event.target.value
              if (value) {
                void handleAddExercise(value)
                event.currentTarget.value = ''
              }
            }}
          >
            <option value="">Choose from your library</option>
            {availableExercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}
