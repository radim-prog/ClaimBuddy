/**
 * GTD Wizard - Example Usage
 *
 * This file demonstrates how to use the GTD Wizard component
 * in your Next.js application.
 */

'use client'

import { GTDWizard } from './gtd-wizard'
import { useState } from 'react'

// Example of how to use the GTD Wizard in a page
export function GTDWizardExample() {
  const [isOpen, setIsOpen] = useState(false)

  // Example: Available users for delegation/assignment
  const availableUsers = [
    { id: 'user-1', name: 'Jana Nováková' },
    { id: 'user-2', name: 'Radim Svoboda' },
    { id: 'user-3', name: 'Petr Dvořák' },
  ]

  // Example: Handle completion
  const handleComplete = async (data: any) => {
    console.log('GTD Wizard completed with data:', data)

    // Example: Call your API to create the task
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          company_id: 'company-123',
          created_by: 'current-user-id',
          status: data.isQuickAction ? 'completed' : 'pending',
          priority: 'medium',
          created_at: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const task = await response.json()
        console.log('Task created:', task)
        setIsOpen(false)
        // Optionally: Show success message, redirect, etc.
      } else {
        console.error('Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  // Example: Handle cancel
  const handleCancel = () => {
    console.log('GTD Wizard cancelled')
    setIsOpen(false)
  }

  return (
    <div className="p-8">
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-primary text-white rounded-md"
      >
        Vytvořit nový úkol (GTD)
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <GTDWizard
            companyId="company-123"
            companyName="Alza.cz"
            onComplete={handleComplete}
            onCancel={handleCancel}
            availableUsers={availableUsers}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Example: Pre-fill wizard with existing task data (for editing)
 */
export function GTDWizardEditExample() {
  const [isOpen, setIsOpen] = useState(false)

  const existingTaskData = {
    title: 'Zkontrolovat DPH přiznání',
    description: 'Zkontrolovat DPH přiznání za Q4 2025',
    isProject: false,
    projectOutcome: '',
    isQuickAction: false,
    shouldDelegate: false,
    contexts: ['@počítač', '@kancelář'],
    energyLevel: 'high' as const,
    estimatedMinutes: 120,
    isBillable: true,
    hourlyRate: 1200,
    dueDate: '2025-12-31',
    assignedTo: 'user-1',
    subtasks: [],
  }

  const handleComplete = async (data: any) => {
    // Update existing task instead of creating new one
    console.log('Updating task with:', data)
    setIsOpen(false)
  }

  return (
    <div className="p-8">
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-secondary text-white rounded-md"
      >
        Upravit úkol
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <GTDWizard
            companyId="company-123"
            companyName="Alza.cz"
            onComplete={handleComplete}
            onCancel={() => setIsOpen(false)}
            initialData={existingTaskData}
            availableUsers={[
              { id: 'user-1', name: 'Jana' },
              { id: 'user-2', name: 'Radim' },
            ]}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Example: Using in a full page layout
 */
export function GTDWizardPageExample() {
  const handleComplete = async (data: any) => {
    console.log('Task data:', data)
    // Redirect back to task list after creation
    window.location.href = '/accountant/tasks'
  }

  const handleCancel = () => {
    // Go back to previous page
    window.history.back()
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <GTDWizard
        companyId="company-123"
        companyName="Alza.cz"
        onComplete={handleComplete}
        onCancel={handleCancel}
        availableUsers={[
          { id: 'user-1', name: 'Jana' },
          { id: 'user-2', name: 'Radim' },
        ]}
      />
    </div>
  )
}
