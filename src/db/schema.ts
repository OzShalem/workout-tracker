export type ID = string

export type UnitSystem = 'metric' | 'imperial'

export type ExerciseCategory =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Legs'
  | 'Glutes'
  | 'Core'
  | 'Cardio'
  | 'FullBody'
  | 'Other'

export type Equipment =
  | 'Barbell'
  | 'Dumbbell'
  | 'Machine'
  | 'Cable'
  | 'Bodyweight'
  | 'Kettlebell'
  | 'Bands'
  | 'Smith'
  | 'Other'

export type ExerciseDef = {
  id: ID
  name: string
  category: ExerciseCategory
  equipment: Equipment
  isBodyweight?: boolean
  aliases?: string[]
}

export type WorkoutSet = {
  id: ID
  type: 'warmup' | 'working' | 'drop' | 'failure' | 'amrap'
  reps?: number
  weight?: number
  rpe?: number
  isCompleted: boolean
  createdAt: string
}

export type WorkoutExerciseEntry = {
  id: ID
  exerciseId: ID
  order: number
  notes?: string
  sets: WorkoutSet[]
}

export type WorkoutSession = {
  id: ID
  startedAt: string
  endedAt?: string
  title?: string
  notes?: string
  routineId?: ID
  exercises: WorkoutExerciseEntry[]
}

export type RoutineExerciseBlock = {
  id: ID
  exerciseId: ID
  order: number
  suggestedSets?: number
  suggestedRepRange?: string
  suggestedRestSec?: number
}

export type RoutineTemplate = {
  id: ID
  name: string
  description?: string
  exerciseBlocks: RoutineExerciseBlock[]
}

export type BodyMetricEntry = {
  id: ID
  date: string
  bodyWeight?: number
  notes?: string
}

export type Db = {
  schemaVersion: 1
  meta: {
    createdAt: string
    updatedAt: string
  }
  user: {
    displayName?: string
    unitSystem: UnitSystem
    timezone?: string
  }
  exercises: ExerciseDef[]
  workouts: WorkoutSession[]
  routines: RoutineTemplate[]
  bodyMetrics: BodyMetricEntry[]
  settings: {
    defaultRestTimerSec?: number
    showRpe: boolean
    show1rmEstimate: boolean
  }
  activeWorkoutId?: ID
}
