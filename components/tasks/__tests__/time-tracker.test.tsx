/**
 * TimeTracker Component Tests
 *
 * Test suite for the TimeTracker component
 * Run with: npm test components/tasks/__tests__/time-tracker.test.tsx
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { TimeTracker } from '../time-tracker'
import type { TimeTrackingEntry } from '../time-tracker'

// Mock data
const mockProps = {
  taskId: 'task-123',
  estimatedMinutes: 120,
  actualMinutes: 0,
  hourlyRate: 1200,
  isBillable: true,
  isProject: false,
  currentUserId: 'user-456',
  currentUserName: 'Test User',
  onTimeUpdate: jest.fn()
}

describe('TimeTracker Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the component', () => {
      render(<TimeTracker {...mockProps} />)
      expect(screen.getByText('Time Tracking')).toBeInTheDocument()
    })

    it('displays estimated time correctly', () => {
      render(<TimeTracker {...mockProps} />)
      expect(screen.getByText('2h')).toBeInTheDocument()
    })

    it('shows start timer button when not running', () => {
      render(<TimeTracker {...mockProps} />)
      expect(screen.getByText('Start Timer')).toBeInTheDocument()
    })

    it('displays billable summary when isBillable is true', () => {
      render(<TimeTracker {...mockProps} />)
      expect(screen.getByText('Billable Summary')).toBeInTheDocument()
    })

    it('hides billable summary when isBillable is false', () => {
      render(<TimeTracker {...mockProps} isBillable={false} />)
      expect(screen.queryByText('Billable Summary')).not.toBeInTheDocument()
    })

    it('shows project note when isProject is true', () => {
      render(<TimeTracker {...mockProps} isProject={true} />)
      expect(screen.getByText(/Project Time Tracking/)).toBeInTheDocument()
    })
  })

  describe('Timer Functionality', () => {
    it('starts timer when Start Timer button is clicked', () => {
      render(<TimeTracker {...mockProps} />)

      const startButton = screen.getByText('Start Timer')
      fireEvent.click(startButton)

      expect(screen.getByText(/Running/)).toBeInTheDocument()
    })

    it('displays running timer with correct format', async () => {
      render(<TimeTracker {...mockProps} />)

      const startButton = screen.getByText('Start Timer')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/\d:\d{2}/)).toBeInTheDocument()
      })
    })

    it('pauses timer when Pause button is clicked', () => {
      render(<TimeTracker {...mockProps} />)

      const startButton = screen.getByText('Start Timer')
      fireEvent.click(startButton)

      const pauseButton = screen.getByText('Pause')
      fireEvent.click(pauseButton)

      expect(screen.getByText(/Paused/)).toBeInTheDocument()
    })

    it('stops timer and calls onTimeUpdate', async () => {
      const onTimeUpdate = jest.fn()
      render(<TimeTracker {...mockProps} onTimeUpdate={onTimeUpdate} />)

      const startButton = screen.getByText('Start Timer')
      fireEvent.click(startButton)

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      const stopButton = screen.getByText('Stop & Save')
      fireEvent.click(stopButton)

      expect(onTimeUpdate).toHaveBeenCalled()
    })
  })

  describe('Quick Time Buttons', () => {
    it('adds 15 minutes when 15min button is clicked', () => {
      const onTimeUpdate = jest.fn()
      render(<TimeTracker {...mockProps} onTimeUpdate={onTimeUpdate} />)

      const button15min = screen.getByText('15min')
      fireEvent.click(button15min)

      expect(onTimeUpdate).toHaveBeenCalledWith(
        15,
        expect.arrayContaining([
          expect.objectContaining({
            duration_minutes: 15
          })
        ])
      )
    })

    it('adds 60 minutes when 1h button is clicked', () => {
      const onTimeUpdate = jest.fn()
      render(<TimeTracker {...mockProps} onTimeUpdate={onTimeUpdate} />)

      const button1h = screen.getByText('1h')
      fireEvent.click(button1h)

      expect(onTimeUpdate).toHaveBeenCalledWith(
        60,
        expect.arrayContaining([
          expect.objectContaining({
            duration_minutes: 60
          })
        ])
      )
    })

    it('accumulates time from multiple quick buttons', () => {
      const onTimeUpdate = jest.fn()
      render(<TimeTracker {...mockProps} onTimeUpdate={onTimeUpdate} />)

      fireEvent.click(screen.getByText('15min'))
      fireEvent.click(screen.getByText('30min'))

      expect(onTimeUpdate).toHaveBeenLastCalledWith(
        45,
        expect.any(Array)
      )
    })
  })

  describe('Manual Entry', () => {
    it('shows manual entry form when button is clicked', () => {
      render(<TimeTracker {...mockProps} />)

      const showManualButton = screen.getByText('Show Manual Entry')
      fireEvent.click(showManualButton)

      expect(screen.getByLabelText('Duration (minutes)')).toBeInTheDocument()
    })

    it('hides manual entry form when Hide button is clicked', () => {
      render(<TimeTracker {...mockProps} />)

      const showButton = screen.getByText('Show Manual Entry')
      fireEvent.click(showButton)

      const hideButton = screen.getByText('Hide Manual Entry')
      fireEvent.click(hideButton)

      expect(screen.queryByLabelText('Duration (minutes)')).not.toBeInTheDocument()
    })

    it('submits manual entry with correct data', () => {
      const onTimeUpdate = jest.fn()
      render(<TimeTracker {...mockProps} onTimeUpdate={onTimeUpdate} />)

      fireEvent.click(screen.getByText('Show Manual Entry'))

      const minutesInput = screen.getByLabelText('Duration (minutes)')
      fireEvent.change(minutesInput, { target: { value: '45' } })

      const addButton = screen.getByText('Add Entry')
      fireEvent.click(addButton)

      expect(onTimeUpdate).toHaveBeenCalledWith(
        45,
        expect.arrayContaining([
          expect.objectContaining({
            duration_minutes: 45,
            user_id: 'user-456',
            user_name: 'Test User'
          })
        ])
      )
    })

    it('validates manual entry input', () => {
      const onTimeUpdate = jest.fn()
      render(<TimeTracker {...mockProps} onTimeUpdate={onTimeUpdate} />)

      fireEvent.click(screen.getByText('Show Manual Entry'))

      const addButton = screen.getByText('Add Entry')
      expect(addButton).toBeDisabled()

      const minutesInput = screen.getByLabelText('Duration (minutes)')
      fireEvent.change(minutesInput, { target: { value: '0' } })

      expect(addButton).toBeDisabled()
    })
  })

  describe('Progress Tracking', () => {
    it('calculates progress percentage correctly', () => {
      render(<TimeTracker {...mockProps} estimatedMinutes={100} actualMinutes={50} />)

      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('shows over budget warning when actual exceeds estimate', () => {
      render(<TimeTracker {...mockProps} estimatedMinutes={60} actualMinutes={90} />)

      expect(screen.getByText(/Over budget/)).toBeInTheDocument()
    })

    it('displays difference correctly', () => {
      render(<TimeTracker {...mockProps} estimatedMinutes={60} actualMinutes={75} />)

      expect(screen.getByText('+15 min')).toBeInTheDocument()
    })
  })

  describe('Billable Calculations', () => {
    it('calculates billable amount correctly', () => {
      const entries: TimeTrackingEntry[] = [
        {
          id: '1',
          task_id: 'task-123',
          user_id: 'user-456',
          user_name: 'Test User',
          started_at: new Date().toISOString(),
          stopped_at: new Date().toISOString(),
          duration_minutes: 60,
          billable: true,
          created_at: new Date().toISOString()
        }
      ]

      const onTimeUpdate = jest.fn()
      render(<TimeTracker {...mockProps} onTimeUpdate={onTimeUpdate} />)

      // Add billable entry
      fireEvent.click(screen.getByText('1h'))

      // Should calculate: 1 hour × 1200 Kč/h = 1200 Kč
      expect(screen.getByText(/1,200 Kč/)).toBeInTheDocument()
    })

    it('shows correct hourly rate', () => {
      render(<TimeTracker {...mockProps} hourlyRate={800} />)

      expect(screen.getByText('800 Kč/h')).toBeInTheDocument()
    })
  })

  describe('Time Entries List', () => {
    it('displays time entries', () => {
      const onTimeUpdate = jest.fn()
      render(<TimeTracker {...mockProps} onTimeUpdate={onTimeUpdate} />)

      fireEvent.click(screen.getByText('15min'))

      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('15 min')).toBeInTheDocument()
    })

    it('deletes entry when delete button is clicked', () => {
      const onTimeUpdate = jest.fn()
      render(<TimeTracker {...mockProps} onTimeUpdate={onTimeUpdate} actualMinutes={15} />)

      fireEvent.click(screen.getByText('15min'))

      const deleteButton = screen.getAllByRole('button').find(
        btn => btn.querySelector('[class*="trash"]')
      )

      if (deleteButton) {
        fireEvent.click(deleteButton)

        expect(onTimeUpdate).toHaveBeenLastCalledWith(
          0, // Should subtract the 15 minutes
          []
        )
      }
    })

    it('shows billable badge for billable entries', () => {
      const onTimeUpdate = jest.fn()
      render(<TimeTracker {...mockProps} isBillable={true} onTimeUpdate={onTimeUpdate} />)

      fireEvent.click(screen.getByText('15min'))

      expect(screen.getByText('Billable')).toBeInTheDocument()
    })

    it('shows non-billable badge for non-billable entries', () => {
      const onTimeUpdate = jest.fn()
      render(<TimeTracker {...mockProps} isBillable={false} onTimeUpdate={onTimeUpdate} />)

      fireEvent.click(screen.getByText('15min'))

      expect(screen.getByText('Non-billable')).toBeInTheDocument()
    })
  })

  describe('Project Mode', () => {
    it('hides timer controls in project mode', () => {
      render(<TimeTracker {...mockProps} isProject={true} />)

      expect(screen.queryByText('Start Timer')).not.toBeInTheDocument()
    })

    it('shows project information note', () => {
      render(<TimeTracker {...mockProps} isProject={true} />)

      expect(screen.getByText(/automatically summed from all subtasks/)).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles zero estimated minutes', () => {
      render(<TimeTracker {...mockProps} estimatedMinutes={0} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('handles missing hourly rate', () => {
      render(<TimeTracker {...mockProps} hourlyRate={undefined} />)

      // Should still render without errors
      expect(screen.getByText('Time Tracking')).toBeInTheDocument()
    })

    it('handles rapid timer start/stop', async () => {
      const onTimeUpdate = jest.fn()
      render(<TimeTracker {...mockProps} onTimeUpdate={onTimeUpdate} />)

      fireEvent.click(screen.getByText('Start Timer'))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      fireEvent.click(screen.getByText('Stop & Save'))

      expect(onTimeUpdate).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<TimeTracker {...mockProps} />)

      expect(screen.getByLabelText(/Duration/)).toBeInTheDocument()
    })

    it('supports keyboard navigation', () => {
      render(<TimeTracker {...mockProps} />)

      const startButton = screen.getByText('Start Timer')
      startButton.focus()

      expect(document.activeElement).toBe(startButton)
    })
  })
})

describe('Time Utility Functions', () => {
  // Import utilities
  const {
    formatDuration,
    formatTimeDisplay,
    calculateBillableAmount,
    calculateProgress,
    isOverBudget
  } = require('@/lib/time-utils')

  describe('formatDuration', () => {
    it('formats minutes to MM:SS', () => {
      expect(formatDuration(5)).toBe('5:00')
    })

    it('formats hours to HH:MM:SS', () => {
      expect(formatDuration(90)).toBe('1:30:00')
    })

    it('handles decimals for seconds', () => {
      expect(formatDuration(1.5)).toBe('1:30')
    })
  })

  describe('formatTimeDisplay', () => {
    it('formats minutes only', () => {
      expect(formatTimeDisplay(45)).toBe('45 min')
    })

    it('formats hours and minutes', () => {
      expect(formatTimeDisplay(90)).toBe('1h 30min')
    })

    it('formats hours only', () => {
      expect(formatTimeDisplay(120)).toBe('2h')
    })
  })

  describe('calculateBillableAmount', () => {
    it('calculates correct amount', () => {
      expect(calculateBillableAmount(60, 1200)).toBe(1200)
    })

    it('rounds to nearest integer', () => {
      expect(calculateBillableAmount(45, 1200)).toBe(900)
    })

    it('handles fractional hours', () => {
      expect(calculateBillableAmount(30, 1200)).toBe(600)
    })
  })

  describe('calculateProgress', () => {
    it('calculates percentage correctly', () => {
      expect(calculateProgress(50, 100)).toBe(50)
    })

    it('handles over 100%', () => {
      expect(calculateProgress(150, 100)).toBe(150)
    })

    it('returns 0 for zero estimate', () => {
      expect(calculateProgress(50, 0)).toBe(0)
    })
  })

  describe('isOverBudget', () => {
    it('returns true when over budget', () => {
      expect(isOverBudget(100, 80)).toBe(true)
    })

    it('returns false when under budget', () => {
      expect(isOverBudget(80, 100)).toBe(false)
    })

    it('returns false for zero estimate', () => {
      expect(isOverBudget(50, 0)).toBe(false)
    })
  })
})
