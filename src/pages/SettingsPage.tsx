import { exportDb } from '../db/storage'
import { useAppState } from '../state/AppProvider'

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function SettingsPage() {
  const { db, setDisplayName, updateSettings, updateUnitSystem, importBackup, resetApp } =
    useAppState()

  async function handleExport() {
    const json = await exportDb()
    const date = new Date().toISOString().slice(0, 10)
    downloadTextFile(`workout-backup-${date}.json`, json)
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      await importBackup(text)
      window.alert('Backup imported successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed.'
      window.alert(message)
    } finally {
      event.target.value = ''
    }
  }

  async function handleReset() {
    const confirmText = window.prompt('Type RESET to clear local data and start fresh.')
    if (confirmText !== 'RESET') return
    await resetApp()
  }

  return (
    <section className="screen">
      <header className="page-header">
        <div>
          <span className="eyebrow">Settings</span>
          <h1>Preferences & backup</h1>
        </div>
      </header>

      <div className="panel">
        <div className="section-heading">
          <h2>Personal</h2>
        </div>
        <label className="field">
          <span>Display name</span>
          <input
            className="input"
            value={db.user.displayName ?? ''}
            onChange={(event) => void setDisplayName(event.target.value)}
          />
        </label>
      </div>

      <div className="panel">
        <div className="section-heading">
          <h2>Training preferences</h2>
        </div>
        <div className="settings-row">
          <span>Weight units</span>
          <div className="segmented">
            <button
              className={db.user.unitSystem === 'metric' ? 'segment segment-active' : 'segment'}
              onClick={() => void updateUnitSystem('metric')}
            >
              KG
            </button>
            <button
              className={db.user.unitSystem === 'imperial' ? 'segment segment-active' : 'segment'}
              onClick={() => void updateUnitSystem('imperial')}
            >
              LB
            </button>
          </div>
        </div>

        <label className="settings-row">
          <span>Show RPE</span>
          <input
            type="checkbox"
            checked={db.settings.showRpe}
            onChange={(event) => void updateSettings({ showRpe: event.target.checked })}
          />
        </label>

        <label className="settings-row">
          <span>Show estimated 1RM</span>
          <input
            type="checkbox"
            checked={db.settings.show1rmEstimate}
            onChange={(event) => void updateSettings({ show1rmEstimate: event.target.checked })}
          />
        </label>
      </div>

      <div className="panel">
        <div className="section-heading">
          <h2>Data</h2>
        </div>
        <div className="stack compact-stack">
          <button className="button button-secondary" onClick={handleExport}>
            Export JSON backup
          </button>
          <label className="button button-secondary input-button">
            Import JSON backup
            <input type="file" accept="application/json,.json" onChange={handleImport} />
          </label>
          <button className="button button-danger" onClick={handleReset}>
            Reset app
          </button>
        </div>
      </div>
    </section>
  )
}
