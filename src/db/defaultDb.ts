import type { Db, ExerciseDef, RoutineTemplate } from './schema'

const now = new Date().toISOString()

export const seedExercises: ExerciseDef[] = [
  { id: 'bench-press', name: 'Bench Press', category: 'Chest', equipment: 'Barbell' },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', category: 'Chest', equipment: 'Dumbbell' },
  { id: 'pull-up', name: 'Pull-Up', category: 'Back', equipment: 'Bodyweight', isBodyweight: true },
  { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'Back', equipment: 'Machine' },
  { id: 'barbell-row', name: 'Barbell Row', category: 'Back', equipment: 'Barbell' },
  { id: 'overhead-press', name: 'Overhead Press', category: 'Shoulders', equipment: 'Barbell' },
  { id: 'lateral-raise', name: 'Lateral Raise', category: 'Shoulders', equipment: 'Dumbbell' },
  { id: 'barbell-curl', name: 'Barbell Curl', category: 'Biceps', equipment: 'Barbell' },
  { id: 'hammer-curl', name: 'Hammer Curl', category: 'Biceps', equipment: 'Dumbbell' },
  { id: 'rope-pushdown', name: 'Rope Pushdown', category: 'Triceps', equipment: 'Cable' },
  { id: 'back-squat', name: 'Back Squat', category: 'Legs', equipment: 'Barbell' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', category: 'Legs', equipment: 'Barbell' },
  { id: 'leg-press', name: 'Leg Press', category: 'Legs', equipment: 'Machine' },
  { id: 'hip-thrust', name: 'Hip Thrust', category: 'Glutes', equipment: 'Barbell' },
  { id: 'plank', name: 'Plank', category: 'Core', equipment: 'Bodyweight', isBodyweight: true },
  { id: 'running', name: 'Running', category: 'Cardio', equipment: 'Other' },
]

export const seedRoutines: RoutineTemplate[] = [
  {
    id: 'push-day',
    name: 'Push Day',
    description: 'Chest, shoulders, triceps',
    exerciseBlocks: [
      { id: 'push-1', exerciseId: 'bench-press', order: 0, suggestedSets: 4, suggestedRepRange: '5-8', suggestedRestSec: 120 },
      { id: 'push-2', exerciseId: 'incline-db-press', order: 1, suggestedSets: 3, suggestedRepRange: '8-12', suggestedRestSec: 90 },
      { id: 'push-3', exerciseId: 'overhead-press', order: 2, suggestedSets: 3, suggestedRepRange: '6-10', suggestedRestSec: 90 },
      { id: 'push-4', exerciseId: 'rope-pushdown', order: 3, suggestedSets: 3, suggestedRepRange: '10-15', suggestedRestSec: 60 },
    ],
  },
  {
    id: 'lower-power',
    name: 'Lower Power',
    description: 'Strength-first lower body session',
    exerciseBlocks: [
      { id: 'lower-1', exerciseId: 'back-squat', order: 0, suggestedSets: 4, suggestedRepRange: '4-6', suggestedRestSec: 150 },
      { id: 'lower-2', exerciseId: 'romanian-deadlift', order: 1, suggestedSets: 4, suggestedRepRange: '6-8', suggestedRestSec: 120 },
      { id: 'lower-3', exerciseId: 'leg-press', order: 2, suggestedSets: 3, suggestedRepRange: '10-15', suggestedRestSec: 90 },
      { id: 'lower-4', exerciseId: 'plank', order: 3, suggestedSets: 3, suggestedRepRange: '45-60 sec', suggestedRestSec: 45 },
    ],
  },
]

export function createDefaultDb(): Db {
  return {
    schemaVersion: 1,
    meta: {
      createdAt: now,
      updatedAt: now,
    },
    user: {
      unitSystem: 'metric',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    exercises: seedExercises,
    workouts: [],
    routines: seedRoutines,
    bodyMetrics: [],
    settings: {
      defaultRestTimerSec: 90,
      showRpe: true,
      show1rmEstimate: true,
    },
    activeWorkoutId: undefined,
  }
}
