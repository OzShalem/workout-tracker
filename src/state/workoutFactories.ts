import type { ID, WorkoutExerciseEntry, WorkoutSession, WorkoutSet } from '../db/schema'

function createId() {
  return crypto.randomUUID()
}

export function createWorkoutSet(preset?: Partial<WorkoutSet>): WorkoutSet {
  return {
    id: createId(),
    type: 'working',
    isCompleted: false,
    createdAt: new Date().toISOString(),
    ...preset,
  }
}

export function createWorkoutExercise(exerciseId: ID, order: number): WorkoutExerciseEntry {
  return {
    id: createId(),
    exerciseId,
    order,
    sets: [createWorkoutSet()],
  }
}

export function createEmptySession(): WorkoutSession {
  return {
    id: createId(),
    startedAt: new Date().toISOString(),
    title: 'New Workout',
    exercises: [],
  }
}
