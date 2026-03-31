import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  getExercise,
  getSessionDurationMinutes,
  getWorkout,
  getWorkoutVolume,
} from '../db/selectors'
import { useAppState } from '../state/AppProvider'

export function WorkoutDetailPage() {
  const { workoutId = '' } = useParams()
  const navigate = useNavigate()
  const { db, deleteWorkout } = useAppState()
  const workout = getWorkout(db, workoutId)

  if (!workout) {
    return <Navigate to="/history" replace />
  }

  const currentWorkout = workout

  async function handleDelete() {
    const confirmed = window.confirm('Delete this workout permanently from this device?')
    if (!confirmed) return
    await deleteWorkout(currentWorkout.id)
    navigate('/history')
  }

  return (
    <section className="screen">
      <header className="page-header">
        <div>
          <span className="eyebrow">Workout summary</span>
          <h1>{currentWorkout.title || 'Workout'}</h1>
          <p className="muted">
            {new Date(currentWorkout.startedAt).toLocaleString()} · {getSessionDurationMinutes(currentWorkout) ?? '--'} min
          </p>
        </div>
        {!currentWorkout.endedAt ? (
          <button className="button button-primary" onClick={() => navigate(`/workout/${currentWorkout.id}`)}>
            Resume
          </button>
        ) : null}
      </header>

      <div className="metric-grid">
        <article className="metric-card">
          <span>Exercises</span>
          <strong>{currentWorkout.exercises.length}</strong>
        </article>
        <article className="metric-card">
          <span>Total sets</span>
          <strong>{currentWorkout.exercises.reduce((sum, entry) => sum + entry.sets.length, 0)}</strong>
        </article>
        <article className="metric-card">
          <span>Volume</span>
          <strong>{Math.round(getWorkoutVolume(currentWorkout))}</strong>
        </article>
      </div>

      <div className="stack">
        {currentWorkout.exercises.map((entry) => {
          const exercise = getExercise(db, entry.exerciseId)

          return (
            <article className="panel" key={entry.id}>
              <div className="section-heading">
                <h2>{exercise?.name ?? 'Exercise'}</h2>
                <span className="muted">{entry.sets.length} sets</span>
              </div>
              <div className="sets-table compact-data-table">
                <div className="sets-header">
                  <span>Set</span>
                  <span>Weight</span>
                  <span>Reps</span>
                  <span>Status</span>
                </div>
                {entry.sets.map((set, index) => (
                  <div className="set-row" key={set.id}>
                    <span className="set-index">{index + 1}</span>
                    <span>{set.weight ?? '--'}</span>
                    <span>{set.reps ?? '--'}</span>
                    <span className={set.isCompleted ? 'status-complete' : 'status-muted'}>
                      {set.isCompleted ? 'Done' : 'Skipped'}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          )
        })}
      </div>

      <button className="button button-danger" onClick={handleDelete}>
        Delete workout
      </button>
    </section>
  )
}
