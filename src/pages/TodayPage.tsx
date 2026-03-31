import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getActiveWorkout,
  getLastWorkout,
  getSessionDurationMinutes,
  getLatestBodyMetric,
  getWeeklyVolume,
  getWeeklyWorkoutCount,
  getWorkoutStreak,
  getWorkoutVolume,
} from '../db/selectors'
import { useAppState } from '../state/AppProvider'

export function TodayPage() {
  const { db, startEmptyWorkout, startWorkoutFromRoutine } = useAppState()
  const navigate = useNavigate()
  const activeWorkout = getActiveWorkout(db)
  const lastWorkout = getLastWorkout(db)
  const latestBodyMetric = getLatestBodyMetric(db)
  const firstRoutine = db.routines[0]
  const streak = getWorkoutStreak(db)
  const weeklyVolume = Math.round(getWeeklyVolume(db))
  const weeklyCount = getWeeklyWorkoutCount(db)
  const [motivationalLine] = useState(() => {
    const lines = [
      'Show up and move.',
      'Small reps, big results.',
      'Earn today.',
      'Train like it matters.',
      'One more set.',
    ]
    const dayIndex = Math.floor(Date.now() / 86400000) % lines.length
    return lines[dayIndex]
  })

  async function handleStartEmptyWorkout() {
    const workout = await startEmptyWorkout()
    navigate(`/workout/${workout.id}`)
  }

  async function handleStartRoutine() {
    if (!firstRoutine) return
    const workout = await startWorkoutFromRoutine(firstRoutine.id)
    if (workout) {
      navigate(`/workout/${workout.id}`)
    }
  }

  return (
    <section className="screen">
      <header className="page-header">
        <div>
          <span className="eyebrow">Today</span>
          <h1>Ready to lift, {db.user.displayName}?</h1>
        </div>
        <div className="pill pill-live">{activeWorkout ? 'Workout live' : 'Offline ready'}</div>
      </header>

      <div className="panel panel-hero">
        <p className="muted hero-support">{motivationalLine}</p>
        <div className="action-stack">
          {activeWorkout ? (
            <button
              className="button button-primary"
              onClick={() => navigate(`/workout/${activeWorkout.id}`)}
            >
              Resume Workout
            </button>
          ) : (
            <button className="button button-primary" onClick={handleStartEmptyWorkout}>
              Start Empty Workout
            </button>
          )}
          <button
            className="button button-secondary"
            onClick={handleStartRoutine}
            disabled={!firstRoutine}
          >
            Start from Routine
          </button>
        </div>
      </div>

      <div className="glance-grid">
        <article className="glance-card">
          <span className="eyebrow">Streak</span>
          <strong>{streak} days</strong>
        </article>
        <article className="glance-card">
          <span className="eyebrow">This week</span>
          <strong>{weeklyCount} workouts</strong>
        </article>
        <article className="glance-card glance-card-wide">
          <span className="eyebrow">Volume</span>
          <strong>{weeklyVolume}</strong>
          <p className="muted">
            {latestBodyMetric
              ? `Bodyweight ${latestBodyMetric.bodyWeight} · ${latestBodyMetric.date}`
              : 'Add a weigh-in from Progress when you want body trends.'}
          </p>
        </article>
      </div>

      {lastWorkout ? (
        <div className="panel">
          <div className="section-heading">
            <h2>Last Workout</h2>
            <button
              className="button button-ghost"
              onClick={() => navigate(`/workout/${lastWorkout.id}/detail`)}
            >
              Open
            </button>
          </div>
          <div className="last-workout-grid">
            <div>
              <div className="stat-value">{lastWorkout.title || 'Workout'}</div>
              <div className="muted">
                {new Date(lastWorkout.startedAt).toLocaleDateString()} ·{' '}
                {getSessionDurationMinutes(lastWorkout) ?? '--'} min
              </div>
            </div>
            <div className="mini-metric-grid">
              <article className="metric-card">
                <span>Exercises</span>
                <strong>{lastWorkout.exercises.length}</strong>
              </article>
              <article className="metric-card">
                <span>Volume</span>
                <strong>{Math.round(getWorkoutVolume(lastWorkout))}</strong>
              </article>
            </div>
          </div>
        </div>
      ) : (
        <div className="panel empty-panel">
          <h2>No sessions yet</h2>
          <p className="muted">Start your first workout and your history will begin building here.</p>
        </div>
      )}

      <div className="panel tip-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Quick launch</span>
            <h2>Favorite routine</h2>
          </div>
          {firstRoutine ? (
            <button className="button button-ghost" onClick={handleStartRoutine}>
              Launch
            </button>
          ) : null}
        </div>
        <p className="muted">
          {firstRoutine
            ? `${firstRoutine.name} · ${firstRoutine.exerciseBlocks.length} exercise blocks ready to go.`
            : 'Build a routine once, then fire it instantly whenever you need a repeatable session.'}
        </p>
      </div>
    </section>
  )
}
