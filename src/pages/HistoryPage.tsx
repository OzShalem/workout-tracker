import { useNavigate } from 'react-router-dom'
import { getSessionDurationMinutes, getWorkoutVolume } from '../db/selectors'
import { useI18n } from '../i18n/translations'
import { useAppState } from '../state/AppProvider'

export function HistoryPage() {
  const { db } = useAppState()
  const { t } = useI18n()
  const navigate = useNavigate()

  const workouts = [...db.workouts].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  )

  return (
    <section className="screen">
      <header className="page-header">
        <div>
          <span className="eyebrow">{t('tabHistory')}</span>
          <h1>{t('historyTitle')}</h1>
        </div>
      </header>

      {workouts.length === 0 ? (
        <div className="panel empty-panel">
          <h2>{t('noLoggedWorkouts')}</h2>
          <p className="muted">{t('noLoggedWorkoutsBody')}</p>
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
                  {workout.endedAt ? t('saved') : t('active')}
                </span>
              </div>

              <div className="metric-grid">
                <article className="metric-card">
                  <span>{t('exercises')}</span>
                  <strong>{workout.exercises.length}</strong>
                </article>
                <article className="metric-card">
                  <span>{t('duration')}</span>
                  <strong>{getSessionDurationMinutes(workout) ?? '--'}m</strong>
                </article>
                <article className="metric-card">
                  <span>{t('volume')}</span>
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
