import { openDB } from 'idb'
import { createDefaultDb, detectPreferredLanguage, seedExercises, seedRoutines } from './defaultDb'
import type { Db } from './schema'

const DB_NAME = 'workout-tracker'
const STORE_NAME = 'app'
const APP_KEY = 'workout_app_db_v1'

async function getStore() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    },
  })
}

function isValidDb(value: unknown): value is Db {
  if (!value || typeof value !== 'object') return false
  const db = value as Partial<Db>
  return (
    db.schemaVersion === 1 &&
    Array.isArray(db.exercises) &&
    Array.isArray(db.workouts) &&
    Array.isArray(db.routines) &&
    Array.isArray(db.bodyMetrics) &&
    typeof db.user === 'object' &&
    typeof db.settings === 'object'
  )
}

function withSeeds(db: Db): Db {
  return {
    ...db,
    user: {
      ...db.user,
      language: db.user.language ?? detectPreferredLanguage(),
    },
    exercises: db.exercises.length > 0 ? db.exercises : seedExercises,
    routines: db.routines.length > 0 ? db.routines : seedRoutines,
  }
}

export async function loadDb(): Promise<Db> {
  const store = await getStore()
  const value = await store.get(STORE_NAME, APP_KEY)

  if (!value) {
    const fresh = createDefaultDb()
    await saveDb(fresh)
    return fresh
  }

  if (!isValidDb(value)) {
    console.warn('Stored workout DB was invalid. Recreating default DB.')
    const fallback = createDefaultDb()
    await saveDb(fallback)
    return fallback
  }

  const hydrated = withSeeds(value)

  if (JSON.stringify(hydrated) !== JSON.stringify(value)) {
    await saveDb(hydrated)
  }

  return hydrated
}

export async function saveDb(db: Db): Promise<void> {
  const store = await getStore()
  const nextDb: Db = {
    ...withSeeds(db),
    meta: {
      ...db.meta,
      updatedAt: new Date().toISOString(),
    },
  }

  await store.put(STORE_NAME, nextDb, APP_KEY)
}

export async function exportDb(): Promise<string> {
  const db = await loadDb()
  return JSON.stringify(db, null, 2)
}

export async function importDb(json: string): Promise<Db> {
  const parsed = JSON.parse(json) as unknown
  if (!isValidDb(parsed)) {
    throw new Error('Invalid backup format.')
  }

  const hydrated = withSeeds(parsed)
  await saveDb(hydrated)
  return hydrated
}

export async function resetDb(): Promise<Db> {
  const store = await getStore()
  await store.delete(STORE_NAME, APP_KEY)
  const fresh = createDefaultDb()
  await saveDb(fresh)
  return fresh
}
