import { useMemo, useState, type FormEvent } from 'react'
import { BarChart, LineChart } from '../components/Charts'
import {
  getBodyweightSeries,
  getEstimated1Rm,
  getExerciseProgress,
  getLatestBodyMetric,
  getSessionVolumeSeries,
  getWeeklyVolume,
  getWeeklyWorkoutCount,
} from '../db/selectors'
import { useI18n } from '../i18n/translations'
import { useAppState } from '../state/AppProvider'

export function ProgressPage() {
  const { db, addBodyMetric } = useAppState()
  const { t } = useI18n()
  const [selectedExerciseId, setSelectedExerciseId] = useState(db.exercises[0]?.id ?? '')
  const [bodyWeight, setBodyWeight] = useState('')

  const progress = useMemo(
    () => getExerciseProgress(db, selectedExerciseId),
    [db, selectedExerciseId],
  )
  const volumeSeries = useMemo(() => getSessionVolumeSeries(db, selectedExerciseId), [db, selectedExerciseId])
  const bodyweightSeries = useMemo(() => getBodyweightSeries(db), [db])

  const latestBodyMetric = getLatestBodyMetric(db)
  const weeklyVolume = Math.round(getWeeklyVolume(db))
  const weeklyCount = getWeeklyWorkoutCount(db)

  async function handleAddBodyWeight(event: FormEvent) {
    event.preventDefault()
    const value = Number(bodyWeight)
    if (Number.isNaN(value) || value <= 0) return
    await addBodyMetric({
      date: new Date().toISOString().slice(0, 10),
      bodyWeight: value,
    })
    setBodyWeight('')
  }

  return (
    <section className="screen">
      <header className="page-header">
        <div>
          <span className="eyebrow">{t('tabProgress')}</span>
          <h1>{t('progressTitle')}</h1>
        </div>
      </header>

      <div className="progress-hero-grid">
        <article className="widget-card widget-card-hero">
          <span className="eyebrow">{t('momentum')}</span>
          <strong>{progress.bestSession?.bestSet ? Math.round(getEstimated1Rm(progress.bestSession.bestSet)) : '--'}</strong>
          <p className="muted">Best projected 1RM for the selected lift.</p>
        </article>
        <article className="widget-card">
          <span className="eyebrow">{t('volume')}</span>
          <strong>{weeklyVolume}</strong>
          <p className="muted">{weeklyCount} sessions in the last 7 days.</p>
        </article>
      </div>

      <div className="panel">
        <label className="field">
          <span>{t('exercise')}</span>
          <select
            className="input"
            value={selectedExerciseId}
            onChange={(event) => setSelectedExerciseId(event.target.value)}
          >
            {db.exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="metric-grid metric-grid-compact">
        <article className="metric-card">
          <span>{t('bestEstimated1Rm')}</span>
          <strong>
            {progress.bestSession?.bestSet ? Math.round(getEstimated1Rm(progress.bestSession.bestSet)) : '--'}
          </strong>
        </article>
        <article className="metric-card">
          <span>{t('totalSessions')}</span>
          <strong>{progress.totalSessions}</strong>
        </article>
        <article className="metric-card">
          <span>{t('currentWeight')}</span>
          <strong>{latestBodyMetric?.bodyWeight ?? '--'}</strong>
        </article>
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <h2>{t('momentum')}</h2>
            <p className="muted">Use these widgets as your quick-read training dashboard.</p>
          </div>
        </div>
        <LineChart
          data={progress.sessions
            .slice(0, 8)
            .reverse()
            .map((session) => ({
              label: new Date(session.workout.startedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              }),
              value: Math.round(session.e1rm),
            }))}
        />
      </div>

      <div className="panel">
        <div className="section-heading">
          <h2>{t('volumeFlow')}</h2>
          <span className="muted">Recent load by session</span>
        </div>
        <BarChart data={volumeSeries} />
      </div>

      <div className="panel">
        <div className="section-heading">
          <h2>{t('last10Sessions')}</h2>
        </div>
        <div className="sets-table compact-data-table">
          <div className="sets-header">
            <span>{t('date')}</span>
            <span>{t('bestSet')}</span>
            <span>{t('volume')}</span>
            <span>e1RM</span>
          </div>
          {progress.sessions.slice(0, 10).map((session) => (
            <div className="set-row" key={session.workout.id}>
              <span>{new Date(session.workout.startedAt).toLocaleDateString()}</span>
              <span>
                {session.bestSet?.weight ?? '--'} x {session.bestSet?.reps ?? '--'}
              </span>
              <span>{Math.round(session.volume)}</span>
              <span>{Math.round(session.e1rm) || '--'}</span>
            </div>
          ))}
          {progress.sessions.length === 0 ? (
            <p className="muted">{t('noCompletedSetsYet')}</p>
          ) : null}
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <h2>{t('bodyweight')}</h2>
          <span className="muted">{db.bodyMetrics.length} entries</span>
        </div>
        <form className="inline-form inline-form-weights" onSubmit={handleAddBodyWeight}>
          <input
            className="input"
            inputMode="decimal"
            placeholder="84.2"
            value={bodyWeight}
            onChange={(event) => setBodyWeight(event.target.value)}
          />
            <button className="button button-primary">{t('addWeight')}</button>
        </form>
        {latestBodyMetric ? (
          <p className="muted">
            Latest check-in: {latestBodyMetric.bodyWeight} on {latestBodyMetric.date}
          </p>
        ) : (
          <p className="muted">{t('noWeighInsYet')}</p>
        )}
        <LineChart data={bodyweightSeries} color="#9dff7a" />
      </div>
    </section>
  )
}
