import { useNavigate } from 'react-router-dom'
import { getSessionDurationMinutes, getWorkoutVolume } from '../db/selectors'
import { useAppState } from '../state/AppProvider'

export function HistoryPage() {
  const { db } = useAppState()
  const navigate = useNavigate()

  const workouts = [...db.workouts].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  )

  return (
    <section className="screen">
      <header className="page-header">
        <div>
          <span className="eyebrow">History</span>
          <h1>Your sessions</h1>
        </div>
      </header>

      {workouts.length === 0 ? (
        <div className="panel empty-panel">
          <h2>No logged workouts yet</h2>
          <p className="muted">Finish a session and it’ll appear here with duration and volume.</p>
        </div>
      ) : (
        <div className="stack">
          {workouts.map((workout) => (
            <button
              className="panel list-card button-reset"
              key={workout.id}
              onClick={() => navigate(`/workout/${workout.id}/detail`)}
            >
              <div className="section-heading">
                <div>
                  <h2>{workout.title || 'Workout'}</h2>
                  <p className="muted">{new Date(workout.startedAt).toLocaleString()}</p>
                </div>
                <span className={workout.endedAt ? 'pill' : 'pill pill-live'}>
                  {workout.endedAt ? 'Saved' : 'Active'}
                </span>
              </div>

              <div className="metric-grid">
                <article className="metric-card">
                  <span>Exercises</span>
                  <strong>{workout.exercises.length}</strong>
                </article>
                <article className="metric-card">
                  <span>Duration</span>
                  <strong>{getSessionDurationMinutes(workout) ?? '--'}m</strong>
                </article>
                <article className="metric-card">
                  <span>Volume</span>
                  <strong>{Math.round(getWorkoutVolume(workout))}</strong>
                </article>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
