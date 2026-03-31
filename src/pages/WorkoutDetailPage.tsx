import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  getExercise,
  getSessionDurationMinutes,
  getWorkout,
  getWorkoutVolume,
} from '../db/selectors'
import { useI18n } from '../i18n/translations'
import { useAppState } from '../state/AppProvider'

export function WorkoutDetailPage() {
  const { workoutId = '' } = useParams()
  const navigate = useNavigate()
  const { db, deleteWorkout } = useAppState()
  const { t } = useI18n()
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
      <button className="button button-secondary button-inline" onClick={() => navigate('/history')}>
        ← {t('tabHistory')}
      </button>
      <header className="page-header">
        <div>
          <span className="eyebrow">{t('workoutSummary')}</span>
          <h1>{currentWorkout.title || 'Workout'}</h1>
          <p className="muted">
            {new Date(currentWorkout.startedAt).toLocaleString()} · {getSessionDurationMinutes(currentWorkout) ?? '--'} min
          </p>
        </div>
        {!currentWorkout.endedAt ? (
          <button className="button button-primary" onClick={() => navigate(`/workout/${currentWorkout.id}`)}>
            {t('resumeWorkout')}
          </button>
        ) : null}
      </header>

      <div className="metric-grid">
        <article className="metric-card">
          <span>{t('exercises')}</span>
          <strong>{currentWorkout.exercises.length}</strong>
        </article>
        <article className="metric-card">
          <span>{t('totalSets')}</span>
          <strong>{currentWorkout.exercises.reduce((sum, entry) => sum + entry.sets.length, 0)}</strong>
        </article>
        <article className="metric-card">
          <span>{t('volume')}</span>
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
                  <span>{t('sets')}</span>
                  <span>{t('weight')}</span>
                  <span>Reps</span>
                  <span>{t('status')}</span>
                </div>
                {entry.sets.map((set, index) => (
                  <div className="set-row" key={set.id}>
                    <span className="set-index">{index + 1}</span>
                    <span>{set.weight ?? '--'}</span>
                    <span>{set.reps ?? '--'}</span>
                    <span className={set.isCompleted ? 'status-complete' : 'status-muted'}>
                      {set.isCompleted ? t('completed') : t('skipped')}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          )
        })}
      </div>

      <button className="button button-danger" onClick={handleDelete}>
        {t('delete')}
      </button>
    </section>
  )
}
