/**
 * TimeTracker Component - Interactive Demo
 *
 * This is a standalone demo page showcasing all features of the TimeTracker component.
 * Access at: /demo/time-tracker
 */

'use client'

import { useState } from 'react'
import { TimeTracker, TimeTrackingEntry } from './time-tracker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function TimeTrackerDemo() {
  // Demo states for different scenarios
  const [scenario1, setScenario1] = useState({
    actualMinutes: 0,
    entries: [] as TimeTrackingEntry[]
  })

  const [scenario2, setScenario2] = useState({
    actualMinutes: 105,
    entries: [] as TimeTrackingEntry[]
  })

  const [scenario3, setScenario3] = useState({
    actualMinutes: 320,
    entries: [] as TimeTrackingEntry[]
  })

  // Current user (demo)
  const currentUser = {
    id: 'demo-user',
    name: 'Demo User'
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">TimeTracker Component Demo</h1>
        <p className="text-xl text-muted-foreground">
          Interactive showcase of all time tracking features
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="default">Live Timer</Badge>
          <Badge variant="secondary">Quick Entry</Badge>
          <Badge variant="outline">Manual Entry</Badge>
        </div>
      </div>

      {/* Scenarios */}
      <Tabs defaultValue="simple" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="simple">Simple Task</TabsTrigger>
          <TabsTrigger value="over-budget">Over Budget</TabsTrigger>
          <TabsTrigger value="project">Project View</TabsTrigger>
          <TabsTrigger value="features">All Features</TabsTrigger>
        </TabsList>

        {/* Scenario 1: Simple Task */}
        <TabsContent value="simple" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scenario 1: Simple Task</CardTitle>
              <CardDescription>
                Basic task with time tracking - "Send email to client"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-sm">
                  <strong>Task:</strong> Send email to client<br />
                  <strong>Estimated:</strong> 10 minutes<br />
                  <strong>Billable:</strong> Yes (800 Kč/h)
                </p>
              </div>

              <TimeTracker
                taskId="demo-task-1"
                estimatedMinutes={10}
                actualMinutes={scenario1.actualMinutes}
                hourlyRate={800}
                isBillable={true}
                onTimeUpdate={(actualMinutes, entries) => {
                  setScenario1({ actualMinutes, entries })
                  console.log('Scenario 1 updated:', { actualMinutes, entries })
                }}
                currentUserId={currentUser.id}
                currentUserName={currentUser.name}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenario 2: Over Budget Task */}
        <TabsContent value="over-budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scenario 2: Over Budget Task</CardTitle>
              <CardDescription>
                Task that exceeded the estimated time - shows warning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <p className="text-sm">
                  <strong>Task:</strong> Verify accounting documents<br />
                  <strong>Estimated:</strong> 90 minutes<br />
                  <strong>Actual:</strong> 105 minutes (15 min over)<br />
                  <strong>Billable:</strong> Yes (1200 Kč/h)
                </p>
              </div>

              <TimeTracker
                taskId="demo-task-2"
                estimatedMinutes={90}
                actualMinutes={scenario2.actualMinutes}
                hourlyRate={1200}
                isBillable={true}
                onTimeUpdate={(actualMinutes, entries) => {
                  setScenario2({ actualMinutes, entries })
                }}
                currentUserId={currentUser.id}
                currentUserName={currentUser.name}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenario 3: Project View */}
        <TabsContent value="project" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scenario 3: Project with Subtasks</CardTitle>
              <CardDescription>
                Project view showing aggregated time from all subtasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg space-y-2">
                <p className="text-sm">
                  <strong>Project:</strong> Annual Closure 2025<br />
                  <strong>Estimated:</strong> 480 minutes (8 hours)<br />
                  <strong>Actual:</strong> 320 minutes (5.3 hours) - summed from subtasks<br />
                  <strong>Billable:</strong> Yes (1200 Kč/h)
                </p>
                <div className="text-xs space-y-1 mt-2 border-t pt-2">
                  <div>✅ Subtask 1: Request books (25 min)</div>
                  <div>✅ Subtask 2: Verify documents (105 min)</div>
                  <div>✅ Subtask 3: VAT return (190 min)</div>
                  <div>🔵 Subtask 4: Client consultation (pending)</div>
                </div>
              </div>

              <TimeTracker
                taskId="demo-project-1"
                estimatedMinutes={480}
                actualMinutes={scenario3.actualMinutes}
                hourlyRate={1200}
                isBillable={true}
                isProject={true}
                onTimeUpdate={(actualMinutes, entries) => {
                  setScenario3({ actualMinutes, entries })
                }}
                currentUserId={currentUser.id}
                currentUserName={currentUser.name}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenario 4: All Features */}
        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Timer</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="list-disc list-inside space-y-1">
                  <li>Start/Stop/Pause functionality</li>
                  <li>Real-time display (HH:MM:SS)</li>
                  <li>Updates every 100ms</li>
                  <li>Automatic save on stop</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Time Buttons</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="list-disc list-inside space-y-1">
                  <li>15 min, 30 min, 1h, 2h, 4h, 8h</li>
                  <li>One-click time logging</li>
                  <li>No timer needed</li>
                  <li>Instant save</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Manual Entry</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="list-disc list-inside space-y-1">
                  <li>Retroactive time logging</li>
                  <li>Custom date and time</li>
                  <li>Add notes</li>
                  <li>Billable flag toggle</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="list-disc list-inside space-y-1">
                  <li>Estimated vs Actual comparison</li>
                  <li>Visual progress bar</li>
                  <li>Over budget warnings</li>
                  <li>Difference calculation</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Billable Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="list-disc list-inside space-y-1">
                  <li>Automatic amount calculation</li>
                  <li>Hourly rate display</li>
                  <li>Separate billable/non-billable</li>
                  <li>Monthly invoicing ready</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Time Entries</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="list-disc list-inside space-y-1">
                  <li>Complete entry history</li>
                  <li>Edit and delete options</li>
                  <li>User attribution</li>
                  <li>Timestamp display</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Full Feature Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Feature Showcase</CardTitle>
              <CardDescription>
                Try all features in this interactive demo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimeTracker
                taskId="demo-all-features"
                estimatedMinutes={60}
                actualMinutes={0}
                hourlyRate={1000}
                isBillable={true}
                onTimeUpdate={(actualMinutes, entries) => {
                  console.log('All features demo updated:', { actualMinutes, entries })
                }}
                currentUserId={currentUser.id}
                currentUserName={currentUser.name}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
          <CardDescription>
            How to integrate TimeTracker into your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Basic Usage</h3>
            <pre className="bg-secondary p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`import { TimeTracker } from '@/components/tasks/time-tracker'

<TimeTracker
  taskId="task-123"
  estimatedMinutes={120}
  actualMinutes={0}
  hourlyRate={1200}
  isBillable={true}
  onTimeUpdate={(actualMinutes, entries) => {
    // Save to database
    console.log('Time updated:', actualMinutes)
  }}
  currentUserId="user-456"
  currentUserName="John Doe"
/>`}</code>
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Project Mode</h3>
            <pre className="bg-secondary p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<TimeTracker
  taskId="project-789"
  estimatedMinutes={480}
  actualMinutes={320}
  isProject={true}  // Disables manual tracking
  // ... other props
/>`}</code>
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>TimeTracker Component v1.0 - Created 2025-12-07</p>
        <p className="mt-2">
          See{' '}
          <a href="/components/tasks/README.md" className="underline">
            documentation
          </a>{' '}
          for more details
        </p>
      </div>
    </div>
  )
}
