import type {
  BodyMetricEntry,
  Db,
  ExerciseDef,
  ID,
  WorkoutExerciseEntry,
  WorkoutSession,
  WorkoutSet,
} from './schema'

export function getExercise(db: Db, exerciseId: ID): ExerciseDef | undefined {
  return db.exercises.find((exercise) => exercise.id === exerciseId)
}

export function getWorkout(db: Db, workoutId: ID): WorkoutSession | undefined {
  return db.workouts.find((workout) => workout.id === workoutId)
}

export function getActiveWorkout(db: Db): WorkoutSession | undefined {
  if (!db.activeWorkoutId) return undefined
  return getWorkout(db, db.activeWorkoutId)
}

export function getSessionDurationMinutes(workout: WorkoutSession): number | null {
  if (!workout.endedAt) return null
  const duration = new Date(workout.endedAt).getTime() - new Date(workout.startedAt).getTime()
  return Math.max(1, Math.round(duration / 60000))
}

export function getSetVolume(set: WorkoutSet): number {
  if (!set.isCompleted || typeof set.reps !== 'number' || typeof set.weight !== 'number') return 0
  return set.reps * set.weight
}

export function getExerciseVolume(entry: WorkoutExerciseEntry): number {
  return entry.sets.reduce((sum, set) => sum + getSetVolume(set), 0)
}

export function getWorkoutVolume(workout: WorkoutSession): number {
  return workout.exercises.reduce((sum, exercise) => sum + getExerciseVolume(exercise), 0)
}

export function getEstimated1Rm(set: WorkoutSet): number {
  if (!set.isCompleted || typeof set.weight !== 'number' || typeof set.reps !== 'number') return 0
  return set.weight * (1 + set.reps / 30)
}

export function getBestSet(entry: WorkoutExerciseEntry): WorkoutSet | undefined {
  return [...entry.sets]
    .filter((set) => set.isCompleted && typeof set.weight === 'number' && typeof set.reps === 'number')
    .sort((a, b) => getEstimated1Rm(b) - getEstimated1Rm(a))[0]
}

export function getWorkoutsForExercise(db: Db, exerciseId: ID) {
  return db.workouts
    .filter((workout) => workout.exercises.some((entry) => entry.exerciseId === exerciseId))
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
}

export function getExerciseProgress(db: Db, exerciseId: ID) {
  const sessions = getWorkoutsForExercise(db, exerciseId).map((workout) => {
    const entry = workout.exercises.find((item) => item.exerciseId === exerciseId)
    const bestSet = entry ? getBestSet(entry) : undefined
    return {
      workout,
      entry,
      bestSet,
      volume: entry ? getExerciseVolume(entry) : 0,
      e1rm: bestSet ? getEstimated1Rm(bestSet) : 0,
    }
  })

  return {
    sessions,
    bestSession: sessions.sort((a, b) => b.e1rm - a.e1rm)[0],
    totalSessions: sessions.length,
  }
}

export function getLastWorkout(db: Db): WorkoutSession | undefined {
  return [...db.workouts]
    .filter((workout) => workout.endedAt)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0]
}

export function getLatestBodyMetric(db: Db): BodyMetricEntry | undefined {
  return [...db.bodyMetrics].sort((a, b) => b.date.localeCompare(a.date))[0]
}

export function getRecentExerciseBest(workouts: Db['workouts'], exerciseId: ID) {
  const relevant = [...workouts]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .find((workout) =>
      workout.exercises.some(
        (entry) =>
          entry.exerciseId === exerciseId &&
          entry.sets.some((set) => set.isCompleted && typeof set.weight === 'number'),
      ),
    )

  if (!relevant) return undefined
  const entry = relevant.exercises.find((item) => item.exerciseId === exerciseId)
  return entry ? getBestSet(entry) : undefined
}

export function getWorkoutStreak(db: Db) {
  const dates = [...new Set(db.workouts.map((workout) => workout.startedAt.slice(0, 10)))]
    .sort()
    .reverse()

  if (dates.length === 0) return 0

  let streak = 0
  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  for (const dateString of dates) {
    const date = new Date(`${dateString}T00:00:00`)
    const diffDays = Math.round((cursor.getTime() - date.getTime()) / 86400000)

    if (diffDays === streak || (streak === 0 && diffDays <= 1)) {
      streak += 1
      cursor = date
      continue
    }

    break
  }

  return streak
}

export function getWeeklyVolume(db: Db) {
  const now = Date.now()
  return db.workouts.reduce((sum, workout) => {
    const workoutTime = new Date(workout.startedAt).getTime()
    const withinWeek = now - workoutTime <= 7 * 24 * 60 * 60 * 1000
    return withinWeek ? sum + getWorkoutVolume(workout) : sum
  }, 0)
}

export function getWeeklyWorkoutCount(db: Db) {
  const now = Date.now()
  return db.workouts.filter(
    (workout) => now - new Date(workout.startedAt).getTime() <= 7 * 24 * 60 * 60 * 1000,
  ).length
}

export function getSessionVolumeSeries(db: Db, exerciseId: ID) {
  return getWorkoutsForExercise(db, exerciseId)
    .slice(0, 8)
    .reverse()
    .map((workout) => {
      const entry = workout.exercises.find((item) => item.exerciseId === exerciseId)
      return {
        label: new Date(workout.startedAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        value: entry ? getExerciseVolume(entry) : 0,
      }
    })
}

export function getBodyweightSeries(db: Db) {
  return [...db.bodyMetrics]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-8)
    .map((entry) => ({
      label: new Date(`${entry.date}T00:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      value: entry.bodyWeight ?? 0,
    }))
}
