import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import VisionBoard from '@/components/VisionBoard'
import League from '@/components/League'
import CalendarStreak from '@/components/CalendarStreak'
import ActivityCircles from '@/components/ActivityCircles'
import AreasOfImprovement from '@/components/AreasOfImprovement'
import DailyPersonalizedImprovementPlan from '@/components/DailyPersonalizedImprovementPlan'
import AchievementShowcase from '@/components/AchievementShowcase'
import { Loader2 } from 'lucide-react'

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f1f7]">
      <Loader2 className="h-8 w-8 animate-spin text-[#556bc7]" />
    </div>
  )
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f1f7]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#556bc7] mb-4">Error</h1>
        <p className="text-gray-600">{error.message}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const component = new URLSearchParams(window?.location?.search).get('component')

  // Render component based on URL parameter
  function renderComponent() {
    switch (component) {
      case 'vision-board':
        return <VisionBoard />
      case 'league':
        return <League />
      case 'calendar':
        return <CalendarStreak />
      case 'activity-circles':
        return <ActivityCircles />
      case 'improvement':
        return <AreasOfImprovement />
      case 'plan':
        return <DailyPersonalizedImprovementPlan />
      case 'achievement':
        return <AchievementShowcase />
      default:
        return <VisionBoard />
    }
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingFallback />}>
        {renderComponent()}
      </Suspense>
    </ErrorBoundary>
  )
}
