import { useMemo, useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { BarChart, LineChart, ProgressMeter } from '../components/Charts'
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
  const e1rmSeries = useMemo(
    () =>
      progress.sessions
        .slice(0, 6)
        .reverse()
        .map((session) => ({
          label: new Date(session.workout.startedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          }),
          value: Math.round(session.e1rm),
        })),
    [progress.sessions],
  )
  const latestSession = progress.sessions[0]
  const previousSession = progress.sessions[1]
  const momentumDelta = latestSession && previousSession
    ? Math.round(latestSession.e1rm - previousSession.e1rm)
    : null
  const nextTarget = useMemo(() => {
    const bestSet = progress.bestSession?.bestSet
    if (!bestSet?.weight) return '--'
    const suggestedWeight = typeof bestSet.reps === 'number' && bestSet.reps >= 8
      ? bestSet.weight + 2.5
      : bestSet.weight
    return `${suggestedWeight}${db.user.unitSystem === 'metric' ? 'kg' : 'lb'}`
  }, [db.user.unitSystem, progress.bestSession])

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

      <div className="progress-hero-grid progress-widget-grid">
        <motion.article
          className="widget-card widget-card-hero"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          <div className="widget-header">
            <div>
              <span className="eyebrow">{t('momentum')}</span>
              <strong>{progress.bestSession?.bestSet ? Math.round(getEstimated1Rm(progress.bestSession.bestSet)) : '--'}</strong>
            </div>
            <div className={`trend-pill ${momentumDelta && momentumDelta > 0 ? 'trend-pill-positive' : ''}`}>
              {momentumDelta === null ? '—' : momentumDelta > 0 ? `+${momentumDelta}` : `${momentumDelta}`}
            </div>
          </div>
          <p className="muted">
            {db.user.language === 'pl'
              ? 'Twój trend siły z ostatnich sesji.'
              : db.user.language === 'uk'
                ? 'Твоя силова динаміка за останні сесії.'
                : 'Your strength trend across recent sessions.'}
          </p>
          <LineChart data={e1rmSeries} />
        </motion.article>

        <motion.article
          className="widget-card"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34 }}
        >
          <div className="widget-header">
            <span className="eyebrow">{t('volume')}</span>
          </div>
          <div className="numbers-stack numbers-stack-premium">
            <div>
              <strong>{weeklyVolume}</strong>
              <p className="muted">{t('volume')}</p>
            </div>
            <div>
              <strong>{weeklyCount}</strong>
              <p className="muted">{t('totalSessions')}</p>
            </div>
            <div>
              <strong>{latestBodyMetric?.bodyWeight ?? '--'}</strong>
              <p className="muted">{t('currentWeight')}</p>
            </div>
          </div>
          <p className="muted widget-footnote">
            {db.user.language === 'pl'
              ? 'Tydzień w liczbach.'
              : db.user.language === 'uk'
                ? 'Тиждень у цифрах.'
                : 'Your week in numbers.'}
          </p>
        </motion.article>

        <motion.article
          className="widget-card widget-card-coach"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="widget-header">
            <div>
              <span className="eyebrow">
                {db.user.language === 'pl'
                  ? 'Następny cel'
                  : db.user.language === 'uk'
                    ? 'Наступна ціль'
                    : 'Next target'}
              </span>
              <strong>{nextTarget}</strong>
            </div>
          </div>
          <p className="muted">
            {db.user.language === 'pl'
              ? 'Praktyczna sugestia na kolejny trening tego ćwiczenia.'
              : db.user.language === 'uk'
                ? 'Практична підказка для наступного тренування цієї вправи.'
                : 'A practical suggestion for your next session on this lift.'}
          </p>
          <ProgressMeter
            value={latestSession?.e1rm ? Math.round(latestSession.e1rm) : 0}
            max={progress.bestSession?.e1rm ? Math.round(progress.bestSession.e1rm) : 1}
            label={db.user.language === 'pl' ? 'top' : db.user.language === 'uk' ? 'пік' : 'peak'}
          />
          <div className="coach-notes">
            <span>
              {db.user.language === 'pl'
                ? `Ostatnia objętość: ${Math.round(latestSession?.volume ?? 0)}`
                : db.user.language === 'uk'
                  ? `Останній об’єм: ${Math.round(latestSession?.volume ?? 0)}`
                  : `Last volume: ${Math.round(latestSession?.volume ?? 0)}`}
            </span>
            <span>
              {db.user.language === 'pl'
                ? `Sesji: ${progress.totalSessions}`
                : db.user.language === 'uk'
                  ? `Сесій: ${progress.totalSessions}`
                  : `Sessions: ${progress.totalSessions}`}
            </span>
          </div>
        </motion.article>
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

      <div className="panel">
        <div className="section-heading">
          <div>
            <h2>{t('momentum')}</h2>
            <p className="muted">
              {db.user.language === 'pl'
                ? 'Szybki odczyt Twojego postępu.'
                : db.user.language === 'uk'
                  ? 'Швидкий огляд твого прогресу.'
                  : 'Quick read on your training momentum.'}
            </p>
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
          <span className="muted">
            {db.user.language === 'pl'
              ? 'Ostatnie obciążenie sesji'
              : db.user.language === 'uk'
                ? 'Останнє навантаження по сесіях'
                : 'Recent load by session'}
          </span>
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
          <span className="muted">
            {db.bodyMetrics.length}{' '}
            {db.user.language === 'pl'
              ? 'wpisów'
              : db.user.language === 'uk'
                ? 'записів'
                : 'entries'}
          </span>
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
            {db.user.language === 'pl'
              ? `Ostatni pomiar: ${latestBodyMetric.bodyWeight} dnia ${latestBodyMetric.date}`
              : db.user.language === 'uk'
                ? `Останній запис: ${latestBodyMetric.bodyWeight} за ${latestBodyMetric.date}`
                : `Latest check-in: ${latestBodyMetric.bodyWeight} on ${latestBodyMetric.date}`}
          </p>
        ) : (
          <p className="muted">{t('noWeighInsYet')}</p>
        )}
        <LineChart data={bodyweightSeries} color="#9dff7a" />
      </div>
    </section>
  )
}
