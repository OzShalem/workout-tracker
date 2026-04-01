import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { getExercise, getRecentExerciseBest, getWorkout } from '../db/selectors'
import type { WorkoutSet } from '../db/schema'
import { useI18n } from '../i18n/translations'
import { useAppState } from '../state/AppProvider'
import { createWorkoutExercise, createWorkoutSet } from '../state/workoutFactories'

function toInputNumber(value: string): number | undefined {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed < 0) return undefined
  return parsed
}

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

export function ActiveWorkoutPage() {
  const { workoutId = '' } = useParams()
  const navigate = useNavigate()
  const { db, updateWorkout, finishWorkout, cancelWorkout } = useAppState()
  const { t } = useI18n()
  const workout = getWorkout(db, workoutId)
  const startedAt = workout?.startedAt ?? new Date().toISOString()
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)),
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
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)),
      )
    }, 1000)

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
              sets: entry.sets.map((set) => {
                if (set.id !== setId) return set
                const nextSet = { ...set, ...patch }
                return {
                  ...nextSet,
                  isCompleted:
                    typeof nextSet.reps === 'number' ||
                    typeof nextSet.weight === 'number',
                }
              }),
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

  async function handleCancelWorkout() {
    const confirmed = window.confirm(t('cancelWorkoutConfirm'))
    if (!confirmed) return
    await cancelWorkout(currentWorkout.id)
    navigate('/')
  }

  return (
    <section className="screen">
      <header className="page-header">
        <div>
          <span className="eyebrow">{t('activeWorkout')}</span>
          <h1>{currentWorkout.title || 'New Workout'}</h1>
          <p className="muted">{formatElapsed(elapsedSeconds)}</p>
        </div>
        <div className="header-actions">
          <button className="button button-secondary button-header-action" onClick={handleCancelWorkout}>
            {t('cancelWorkout')}
          </button>
          <button className="button button-primary button-header-action" onClick={handleFinishWorkout}>
            {t('finish')}
          </button>
        </div>
      </header>

      <div className="panel panel-live-timer">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t('liveTimer')}</span>
            <div className="timer-watch">{formatElapsed(elapsedSeconds)}</div>
            <p className="muted">
              {t('startedAt')} {new Date(currentWorkout.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <span className="pill pill-live">Live</span>
        </div>
      </div>

      <div className="panel">
        <div className="stack compact-stack">
          <label className="field">
            <span>{t('workoutTitle')}</span>
            <input
              className="input"
              value={currentWorkout.title ?? ''}
              onChange={(event) =>
                void updateWorkout(currentWorkout.id, (current) => ({ ...current, title: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>{t('notes')}</span>
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
                  {t('addSet')}
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
                  {t('removeExercise')}
                </button>
              </div>
            </div>

            <div className="sets-table">
              <div className="sets-header">
                <span>Set</span>
                <span>Weight</span>
                <span>Reps</span>
                <span>Status</span>
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
                  <span className={set.isCompleted || set.reps || set.weight ? 'status-complete' : 'status-muted'}>
                    {set.isCompleted || set.reps || set.weight ? t('completed') : t('notFinished')}
                  </span>
                </div>
              ))}
            </div>
          </article>
        )
      })}

      <div className="panel">
        <label className="field">
            <span>{t('addExercise')}</span>
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
            <option value="">{t('addExercisePrompt')}</option>
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
