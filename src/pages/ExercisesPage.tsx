import { useMemo, useState } from 'react'
import { Modal } from '../components/Modal'
import type { ExerciseCategory, Equipment } from '../db/schema'
import { useAppState } from '../state/AppProvider'

const categories: ExerciseCategory[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Legs',
  'Glutes',
  'Core',
  'Cardio',
  'FullBody',
  'Other',
]

const equipmentOptions: Equipment[] = [
  'Barbell',
  'Dumbbell',
  'Machine',
  'Cable',
  'Bodyweight',
  'Kettlebell',
  'Bands',
  'Smith',
  'Other',
]

export function ExercisesPage() {
  const { db, addExercise, updateExercise, deleteExercise } = useAppState()
  const [query, setQuery] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ExerciseCategory>('Other')
  const [equipment, setEquipment] = useState<Equipment>('Other')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const filteredExercises = useMemo(
    () =>
      db.exercises.filter((exercise) =>
        exercise.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [db.exercises, query],
  )
  const editingExercise = db.exercises.find((exercise) => exercise.id === editingId)

  return (
    <section className="screen">
      <header className="page-header">
        <div>
          <span className="eyebrow">Exercises</span>
          <h1>Your library</h1>
        </div>
        <button className="button button-primary button-inline" onClick={() => setIsCreateOpen(true)}>
          +
        </button>
      </header>

      <div className="panel">
        <label className="field">
          <span>Search exercises</span>
          <input
            className="input"
            placeholder="Bench, squat, row..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      <div className="stack">
        {filteredExercises.map((exercise) => (
          <button
            className="panel list-card button-reset"
            key={exercise.id}
            onClick={() => setEditingId(exercise.id)}
          >
            <div className="section-heading">
              <div>
                <h2>{exercise.name}</h2>
                <p className="muted">
                  {exercise.category} · {exercise.equipment}
                </p>
              </div>
              <span className="pill">{exercise.isBodyweight ? 'BW' : 'Weighted'}</span>
            </div>
          </button>
        ))}
      </div>

      {isCreateOpen ? (
        <Modal
          title="Add exercise"
          subtitle="Create a custom lift and add it to your private library."
          onClose={() => setIsCreateOpen(false)}
        >
          <form
            className="stack"
            onSubmit={async (event) => {
              event.preventDefault()
              if (!name.trim()) return
              await addExercise({
                name: name.trim(),
                category,
                equipment,
              })
              setName('')
              setCategory('Other')
              setEquipment('Other')
              setIsCreateOpen(false)
            }}
          >
            <label className="field">
              <span>Name</span>
              <input
                className="input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Cable Pullover"
              />
            </label>
            <label className="field">
              <span>Category</span>
              <select
                className="input"
                value={category}
                onChange={(event) => setCategory(event.target.value as ExerciseCategory)}
              >
                {categories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Equipment</span>
              <select
                className="input"
                value={equipment}
                onChange={(event) => setEquipment(event.target.value as Equipment)}
              >
                {equipmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </button>
              <button className="button button-primary">Save exercise</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {editingExercise ? (
        <Modal
          title="Edit exercise"
          subtitle="Keep your library clean and consistent."
          onClose={() => setEditingId(null)}
        >
          <div className="stack">
            <label className="field">
              <span>Name</span>
              <input
                className="input"
                value={editingExercise.name}
                onChange={(event) =>
                  void updateExercise(editingExercise.id, {
                    name: event.target.value,
                    category: editingExercise.category,
                    equipment: editingExercise.equipment,
                  })
                }
              />
            </label>
            <label className="field">
              <span>Category</span>
              <select
                className="input"
                value={editingExercise.category}
                onChange={(event) =>
                  void updateExercise(editingExercise.id, {
                    name: editingExercise.name,
                    category: event.target.value as ExerciseCategory,
                    equipment: editingExercise.equipment,
                  })
                }
              >
                {categories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Equipment</span>
              <select
                className="input"
                value={editingExercise.equipment}
                onChange={(event) =>
                  void updateExercise(editingExercise.id, {
                    name: editingExercise.name,
                    category: editingExercise.category,
                    equipment: event.target.value as Equipment,
                  })
                }
              >
                {equipmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <div className="modal-actions">
              <button
                className="button button-danger"
                onClick={async () => {
                  if (!window.confirm('Delete this exercise from your library and related routines/workouts?')) return
                  await deleteExercise(editingExercise.id)
                  setEditingId(null)
                }}
              >
                Delete
              </button>
              <button className="button button-primary" onClick={() => setEditingId(null)}>
                Done
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </section>
  )
}
