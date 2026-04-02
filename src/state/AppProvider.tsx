import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { createDefaultDb } from '../db/defaultDb'
import { getLastCompletedRoutineWorkout } from '../db/selectors'
import { importDb, loadDbWithStatus, repairDb, resetDb, saveDb } from '../db/storage'
import {
  createEmptySession,
  createWorkoutSet,
} from './workoutFactories'
import type {
  BodyMetricEntry,
  Db,
  ExerciseCategory,
  Equipment,
  ID,
  RoutineTemplate,
  WorkoutSession,
} from '../db/schema'

type AppContextValue = {
  db: Db
  isLoading: boolean
  needsRepair: boolean
  setDisplayName: (name: string) => Promise<void>
  startEmptyWorkout: () => Promise<WorkoutSession>
  startWorkoutFromRoutine: (routineId: ID) => Promise<WorkoutSession | null>
  updateWorkout: (workoutId: ID, updater: (workout: WorkoutSession) => WorkoutSession) => Promise<void>
  finishWorkout: (workoutId: ID) => Promise<void>
  cancelWorkout: (workoutId: ID) => Promise<void>
  deleteWorkout: (workoutId: ID) => Promise<void>
  addExercise: (exercise: { name: string; category: ExerciseCategory; equipment: Equipment }) => Promise<void>
  updateExercise: (
    exerciseId: ID,
    updates: { name: string; category: ExerciseCategory; equipment: Equipment },
  ) => Promise<void>
  deleteExercise: (exerciseId: ID) => Promise<void>
  saveRoutine: (routine: Omit<RoutineTemplate, 'id'> & { id?: ID }) => Promise<void>
  deleteRoutine: (routineId: ID) => Promise<void>
  addBodyMetric: (entry: Omit<BodyMetricEntry, 'id'>) => Promise<void>
  updateSettings: (patch: Partial<Db['settings']>) => Promise<void>
  updateLanguage: (language: Db['user']['language']) => Promise<void>
  updateUnitSystem: (unitSystem: Db['user']['unitSystem']) => Promise<void>
  repairLocalData: () => Promise<void>
  importBackup: (json: string) => Promise<void>
  resetApp: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: PropsWithChildren) {
  const [db, setDb] = useState<Db>(createDefaultDb())
  const [isLoading, setIsLoading] = useState(true)
  const [needsRepair, setNeedsRepair] = useState(false)

  useEffect(() => {
    loadDbWithStatus()
      .then(({ db: loaded, neededRepair }) => {
        setDb(loaded)
        setNeedsRepair(neededRepair)
      })
      .finally(() => setIsLoading(false))
  }, [])

  async function commit(nextDb: Db) {
    setDb(nextDb)
    await saveDb(nextDb)
  }

  const value = useMemo<AppContextValue>(
    () => ({
      db,
      isLoading,
      needsRepair,
      async setDisplayName(name) {
        const nextDb = {
          ...db,
          user: {
            ...db.user,
            displayName: name.trim(),
          },
        }
        await commit(nextDb)
      },
      async startEmptyWorkout() {
        if (db.activeWorkoutId) {
          const current = db.workouts.find((workout) => workout.id === db.activeWorkoutId)
          if (current && !current.endedAt) return current
        }

        const workout = createEmptySession()
        const nextDb = {
          ...db,
          activeWorkoutId: workout.id,
          workouts: [workout, ...db.workouts],
        }
        await commit(nextDb)
        return workout
      },
      async startWorkoutFromRoutine(routineId) {
        const routine = db.routines.find((item) => item.id === routineId)
        if (!routine) return null
        const lastRoutineWorkout = getLastCompletedRoutineWorkout(db, routine.id)

        const workout: WorkoutSession = {
          id: crypto.randomUUID(),
          startedAt: new Date().toISOString(),
          title: routine.name,
          routineId: routine.id,
          exercises: routine.exerciseBlocks
            .sort((a, b) => a.order - b.order)
            .map((block, index) => {
              const previousEntry = lastRoutineWorkout?.exercises.find(
                (entry) => entry.exerciseId === block.exerciseId,
              )
              const previousSets = previousEntry?.sets ?? []
              const targetSetCount = Math.max(block.suggestedSets ?? 0, previousSets.length, 1)
              return {
                id: crypto.randomUUID(),
                exerciseId: block.exerciseId,
                order: index,
                sets: Array.from({ length: targetSetCount }, (_, setIndex) => {
                  const previousSet = previousSets[setIndex]

                  return createWorkoutSet({
                    type: previousSet?.type ?? 'working',
                    targetReps: previousSet?.reps,
                    targetWeight: previousSet?.weight,
                    rpe: previousSet?.rpe,
                    isCompleted: false,
                  })
                }),
              }
            }),
        }

        const nextDb = {
          ...db,
          activeWorkoutId: workout.id,
          workouts: [workout, ...db.workouts],
        }
        await commit(nextDb)
        return workout
      },
      async updateWorkout(workoutId, updater) {
        const nextDb = {
          ...db,
          workouts: db.workouts.map((workout) =>
            workout.id === workoutId ? updater(workout) : workout,
          ),
        }
        await commit(nextDb)
      },
      async finishWorkout(workoutId) {
        const nextDb = {
          ...db,
          activeWorkoutId: db.activeWorkoutId === workoutId ? undefined : db.activeWorkoutId,
          workouts: db.workouts.map((workout) =>
            workout.id === workoutId
              ? { ...workout, endedAt: workout.endedAt ?? new Date().toISOString() }
              : workout,
          ),
        }
        await commit(nextDb)
      },
      async cancelWorkout(workoutId) {
        const nextDb = {
          ...db,
          activeWorkoutId: db.activeWorkoutId === workoutId ? undefined : db.activeWorkoutId,
          workouts: db.workouts.filter((workout) => workout.id !== workoutId || workout.endedAt),
        }
        await commit(nextDb)
      },
      async deleteWorkout(workoutId) {
        const nextDb = {
          ...db,
          activeWorkoutId: db.activeWorkoutId === workoutId ? undefined : db.activeWorkoutId,
          workouts: db.workouts.filter((workout) => workout.id !== workoutId),
        }
        await commit(nextDb)
      },
      async addExercise(exercise) {
        const nextDb = {
          ...db,
          exercises: [
            ...db.exercises,
            {
              id: crypto.randomUUID(),
              ...exercise,
            },
          ],
        }
        await commit(nextDb)
      },
      async updateExercise(exerciseId, updates) {
        const nextDb = {
          ...db,
          exercises: db.exercises.map((exercise) =>
            exercise.id === exerciseId ? { ...exercise, ...updates } : exercise,
          ),
        }
        await commit(nextDb)
      },
      async deleteExercise(exerciseId) {
        const nextDb = {
          ...db,
          exercises: db.exercises.filter((exercise) => exercise.id !== exerciseId),
          routines: db.routines.map((routine) => ({
            ...routine,
            exerciseBlocks: routine.exerciseBlocks
              .filter((block) => block.exerciseId !== exerciseId)
              .map((block, index) => ({ ...block, order: index })),
          })),
          workouts: db.workouts.map((workout) => ({
            ...workout,
            exercises: workout.exercises
              .filter((entry) => entry.exerciseId !== exerciseId)
              .map((entry, index) => ({ ...entry, order: index })),
          })),
        }
        await commit(nextDb)
      },
      async saveRoutine(routine) {
        const routineId = routine.id ?? crypto.randomUUID()
        const payload = { ...routine, id: routineId }
        const nextDb = {
          ...db,
          routines: db.routines.some((item) => item.id === routineId)
            ? db.routines.map((item) => (item.id === routineId ? payload : item))
            : [...db.routines, payload],
        }
        await commit(nextDb)
      },
      async deleteRoutine(routineId) {
        const nextDb = {
          ...db,
          routines: db.routines.filter((routine) => routine.id !== routineId),
        }
        await commit(nextDb)
      },
      async addBodyMetric(entry) {
        const nextDb = {
          ...db,
          bodyMetrics: [...db.bodyMetrics, { id: crypto.randomUUID(), ...entry }],
        }
        await commit(nextDb)
      },
      async updateSettings(patch) {
        const nextDb = {
          ...db,
          settings: {
            ...db.settings,
            ...patch,
          },
        }
        await commit(nextDb)
      },
      async updateLanguage(language) {
        const nextDb = {
          ...db,
          user: {
            ...db.user,
            language,
          },
        }
        await commit(nextDb)
      },
      async updateUnitSystem(unitSystem) {
        const nextDb = {
          ...db,
          user: {
            ...db.user,
            unitSystem,
          },
        }
        await commit(nextDb)
      },
      async repairLocalData() {
        const repaired = await repairDb()
        setDb(repaired)
        setNeedsRepair(false)
      },
      async importBackup(json) {
        const imported = await importDb(json)
        setDb(imported)
      },
      async resetApp() {
        const fresh = await resetDb()
        setDb(fresh)
      },
    }),
    [db, isLoading, needsRepair],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppState() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppState must be used within AppProvider')
  }

  return context
}
