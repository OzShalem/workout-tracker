import { useState, type FormEvent } from 'react'
import { useAppState } from '../state/AppProvider'
import { useI18n } from '../i18n/translations'

export function OnboardingPage() {
  const { setDisplayName } = useAppState()
  const { t } = useI18n()
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
        <span className="eyebrow">{t('firstTimeSetup')}</span>
        <h1>{t('onboardingTitle')}</h1>
        <p className="muted">{t('onboardingBody')}</p>
        <label className="field">
          <span>{t('name')}</span>
          <input
            autoFocus
            className="input"
            placeholder="Oz"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <button className="button button-primary" disabled={!name.trim() || isSaving}>
          {isSaving ? t('saving') : t('enterGymMode')}
        </button>
      </form>
    </div>
  )
}
