import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { OnboardingPage } from './pages/OnboardingPage'
import { TodayPage } from './pages/TodayPage'
import { ActiveWorkoutPage } from './pages/ActiveWorkoutPage'
import { HistoryPage } from './pages/HistoryPage'
import { WorkoutDetailPage } from './pages/WorkoutDetailPage'
import { ProgressPage } from './pages/ProgressPage'
import { RoutinesPage } from './pages/RoutinesPage'
import { ExercisesPage } from './pages/ExercisesPage'
import { SettingsPage } from './pages/SettingsPage'
import { AppProvider, useAppState } from './state/AppProvider'

function AppRoutes() {
  const { db, isLoading } = useAppState()

  if (isLoading) {
    return (
      <div className="screen-center">
        <div className="loading-card">
          <div className="loading-ring" />
          <p>Loading your locker...</p>
        </div>
      </div>
    )
  }

  if (!db.user.displayName) {
    return <OnboardingPage />
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<TodayPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/routines" element={<RoutinesPage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/workout/:workoutId" element={<ActiveWorkoutPage />} />
          <Route
            path="/workout/:workoutId/detail"
            element={<WorkoutDetailPage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
