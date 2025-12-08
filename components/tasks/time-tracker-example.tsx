/**
 * TimeTracker Component - Usage Example
 *
 * This file demonstrates how to integrate the TimeTracker component
 * into your task management pages.
 */

'use client'

import { useState } from 'react'
import { TimeTracker, TimeTrackingEntry } from './time-tracker'

// Example: Task Detail Page
export function TaskDetailPageExample() {
  // State management (in real app, this would come from your database/API)
  const [task, setTask] = useState({
    id: 'task-123',
    title: 'Prepare annual closure',
    estimated_minutes: 120, // 2 hours
    actual_minutes: 0,
    hourly_rate: 1200,
    is_billable: true,
    is_project: false
  })

  // Current user info (would come from auth context)
  const currentUser = {
    id: 'user-456',
    name: 'Radim Dvořák'
  }

  // Handle time updates
  const handleTimeUpdate = async (actualMinutes: number, entries: TimeTrackingEntry[]) => {
    // Update local state
    setTask(prev => ({
      ...prev,
      actual_minutes: actualMinutes
    }))

    // In real app, persist to database
    // await updateTask(task.id, { actual_minutes: actualMinutes })
    // await saveTimeEntries(entries)

    console.log('Time updated:', {
      actualMinutes,
      entriesCount: entries.length,
      totalBillable: entries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration_minutes || 0), 0)
    })
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{task.title}</h1>
        <p className="text-muted-foreground">Task ID: {task.id}</p>
      </div>

      <TimeTracker
        taskId={task.id}
        estimatedMinutes={task.estimated_minutes}
        actualMinutes={task.actual_minutes}
        hourlyRate={task.hourly_rate}
        isBillable={task.is_billable}
        isProject={task.is_project}
        onTimeUpdate={handleTimeUpdate}
        currentUserId={currentUser.id}
        currentUserName={currentUser.name}
      />
    </div>
  )
}

// Example: Project with Subtasks
export function ProjectDetailPageExample() {
  const [project, setProject] = useState({
    id: 'project-789',
    title: 'Annual Closure 2025',
    estimated_minutes: 480, // 8 hours total
    actual_minutes: 320, // 5.3 hours (summed from subtasks)
    hourly_rate: 1200,
    is_billable: true,
    is_project: true,
    subtasks: [
      {
        id: 'task-1',
        title: 'Request accounting books',
        estimated_minutes: 30,
        actual_minutes: 25,
        completed: true
      },
      {
        id: 'task-2',
        title: 'Verify documents',
        estimated_minutes: 90,
        actual_minutes: 105,
        completed: true
      },
      {
        id: 'task-3',
        title: 'Prepare VAT return',
        estimated_minutes: 180,
        actual_minutes: 190,
        completed: true
      },
      {
        id: 'task-4',
        title: 'Client consultation',
        estimated_minutes: 30,
        actual_minutes: 0,
        completed: false
      }
    ]
  })

  const currentUser = {
    id: 'user-456',
    name: 'Radim Dvořák'
  }

  const handleTimeUpdate = async (actualMinutes: number, entries: TimeTrackingEntry[]) => {
    // For projects, this might recalculate from all subtasks
    console.log('Project time updated:', {
      actualMinutes,
      entriesCount: entries.length
    })
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{project.title}</h1>
        <p className="text-muted-foreground">Project ID: {project.id}</p>
      </div>

      {/* Project-level time tracking (shows aggregated data) */}
      <TimeTracker
        taskId={project.id}
        estimatedMinutes={project.estimated_minutes}
        actualMinutes={project.actual_minutes}
        hourlyRate={project.hourly_rate}
        isBillable={project.is_billable}
        isProject={project.is_project}
        onTimeUpdate={handleTimeUpdate}
        currentUserId={currentUser.id}
        currentUserName={currentUser.name}
      />

      {/* Subtasks list would go here */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Subtasks</h2>
        {/* Each subtask would have its own TimeTracker component */}
      </div>
    </div>
  )
}

// Example: Integration with Supabase
export function SupabaseIntegrationExample() {
  const [task, setTask] = useState({
    id: 'task-123',
    estimated_minutes: 60,
    actual_minutes: 0,
    hourly_rate: 800,
    is_billable: true
  })

  const currentUser = {
    id: 'user-456',
    name: 'Jana Nováková'
  }

  const handleTimeUpdate = async (actualMinutes: number, entries: TimeTrackingEntry[]) => {
    try {
      // 1. Update task actual_minutes
      // const { error: taskError } = await supabase
      //   .from('tasks')
      //   .update({
      //     actual_minutes: actualMinutes,
      //     updated_at: new Date().toISOString()
      //   })
      //   .eq('id', task.id)

      // 2. Save new time tracking entries
      // const newEntries = entries.filter(e => !e.saved) // Filter unsaved entries
      // const { error: entriesError } = await supabase
      //   .from('time_tracking_entries')
      //   .insert(newEntries)

      // 3. Update local state
      setTask(prev => ({
        ...prev,
        actual_minutes: actualMinutes
      }))

      // 4. If billable, update invoice data
      // if (task.is_billable) {
      //   await updateMonthlyInvoicing(task.id, entries)
      // }

      console.log('Successfully saved to Supabase')
    } catch (error) {
      console.error('Error saving time tracking:', error)
    }
  }

  return (
    <TimeTracker
      taskId={task.id}
      estimatedMinutes={task.estimated_minutes}
      actualMinutes={task.actual_minutes}
      hourlyRate={task.hourly_rate}
      isBillable={task.is_billable}
      onTimeUpdate={handleTimeUpdate}
      currentUserId={currentUser.id}
      currentUserName={currentUser.name}
    />
  )
}

// Example: Monthly Invoicing View
export function MonthlyInvoicingExample() {
  const invoiceData = {
    period: '2025-12',
    company_id: 'company-123',
    company_name: 'Alza.cz',
    projects: [
      {
        id: 'project-1',
        title: 'Annual Closure 2025',
        billable_minutes: 320,
        hourly_rate: 1200,
        amount: 6360 // 5.3h × 1200
      },
      {
        id: 'project-2',
        title: 'Monthly VAT Returns',
        billable_minutes: 180,
        hourly_rate: 1200,
        amount: 3600 // 3h × 1200
      }
    ],
    total_hours: 8.33,
    total_amount: 9960
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Monthly Invoicing - {invoiceData.period}</h1>
        <p className="text-muted-foreground">{invoiceData.company_name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 border rounded-lg">
          <div className="text-sm text-muted-foreground">Total Hours</div>
          <div className="text-3xl font-bold">{invoiceData.total_hours}h</div>
        </div>

        <div className="p-6 border rounded-lg">
          <div className="text-sm text-muted-foreground">Projects</div>
          <div className="text-3xl font-bold">{invoiceData.projects.length}</div>
        </div>

        <div className="p-6 border rounded-lg">
          <div className="text-sm text-muted-foreground">Total Amount</div>
          <div className="text-3xl font-bold text-green-600">
            {invoiceData.total_amount.toLocaleString()} Kč
          </div>
        </div>
      </div>

      {/* Project breakdown */}
      <div className="space-y-4">
        {invoiceData.projects.map(project => (
          <div key={project.id} className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Hours: </span>
                <span className="font-semibold">{(project.billable_minutes / 60).toFixed(2)}h</span>
              </div>
              <div>
                <span className="text-muted-foreground">Rate: </span>
                <span className="font-semibold">{project.hourly_rate} Kč/h</span>
              </div>
              <div>
                <span className="text-muted-foreground">Amount: </span>
                <span className="font-semibold text-green-600">
                  {project.amount.toLocaleString()} Kč
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
