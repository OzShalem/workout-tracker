import { useState, type FormEvent } from 'react'
import { useAppState } from '../state/AppProvider'

export function OnboardingPage() {
  const { setDisplayName } = useAppState()
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    setIsSaving(true)
    await setDisplayName(name)
    setIsSaving(false)
  }

  return (
    <div className="screen-center">
      <form className="hero-card" onSubmit={handleSubmit}>
        <span className="eyebrow">First time setup</span>
        <h1>What should this locker call you?</h1>
        <p className="muted">
          Your name stays on this device and makes the app feel like yours from day one.
        </p>
        <label className="field">
          <span>Name</span>
          <input
            autoFocus
            className="input"
            placeholder="Oz"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <button className="button button-primary" disabled={!name.trim() || isSaving}>
          {isSaving ? 'Saving...' : 'Enter Gym Mode'}
        </button>
      </form>
    </div>
  )
}
