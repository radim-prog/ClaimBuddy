# Time Tracker - Integration Guide

Rychlý průvodce pro integraci TimeTracker komponenty do existujících stránek.

## 🚀 Quick Start (5 minut)

### 1. Import komponenty

```tsx
import { TimeTracker } from '@/components/tasks/time-tracker'
```

### 2. Přidání do stránky

```tsx
'use client'

import { useState } from 'react'
import { TimeTracker } from '@/components/tasks/time-tracker'

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const [task, setTask] = useState({
    id: params.id,
    estimated_minutes: 120,
    actual_minutes: 0,
    hourly_rate: 1200,
    is_billable: true
  })

  const handleTimeUpdate = async (actualMinutes, entries) => {
    // Update state
    setTask(prev => ({ ...prev, actual_minutes: actualMinutes }))

    // Save to database
    // await saveToDatabase(task.id, { actual_minutes: actualMinutes })
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Task Detail</h1>

      <TimeTracker
        taskId={task.id}
        estimatedMinutes={task.estimated_minutes}
        actualMinutes={task.actual_minutes}
        hourlyRate={task.hourly_rate}
        isBillable={task.is_billable}
        onTimeUpdate={handleTimeUpdate}
        currentUserId="current-user-id"
        currentUserName="Current User Name"
      />
    </div>
  )
}
```

### 3. Hotovo! ✅

Komponenta je plně funkční a připravená k použití.

## 📊 Integrace s Supabase

### Krok 1: Připravit databázi

```sql
-- Add time tracking columns to tasks table
ALTER TABLE tasks
ADD COLUMN estimated_minutes INT,
ADD COLUMN actual_minutes INT DEFAULT 0,
ADD COLUMN time_tracking_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_billable BOOLEAN DEFAULT false,
ADD COLUMN hourly_rate DECIMAL(10,2);

-- Create time tracking entries table
CREATE TABLE time_tracking_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  stopped_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INT,
  note TEXT,
  billable BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_time_tracking_task_id ON time_tracking_entries(task_id);
CREATE INDEX idx_time_tracking_user_id ON time_tracking_entries(user_id);

-- Auto-calculate duration trigger
CREATE OR REPLACE FUNCTION calculate_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stopped_at IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.stopped_at - NEW.started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER time_tracking_calculate_duration
  BEFORE INSERT OR UPDATE ON time_tracking_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_duration();
```

### Krok 2: Vytvořit Supabase klienta

```typescript
// lib/supabase-client.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Krok 3: Implementovat CRUD operace

```typescript
// lib/time-tracking-api.ts
import { supabase } from './supabase-client'
import { TimeTrackingEntry } from '@/types/time-tracking'

export async function saveTimeEntry(entry: Omit<TimeTrackingEntry, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('time_tracking_entries')
    .insert({
      task_id: entry.task_id,
      user_id: entry.user_id,
      started_at: entry.started_at,
      stopped_at: entry.stopped_at,
      note: entry.note,
      billable: entry.billable
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTaskActualTime(taskId: string, actualMinutes: number) {
  const { error } = await supabase
    .from('tasks')
    .update({
      actual_minutes: actualMinutes,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)

  if (error) throw error
}

export async function getTimeEntriesForTask(taskId: string) {
  const { data, error } = await supabase
    .from('time_tracking_entries')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as TimeTrackingEntry[]
}

export async function deleteTimeEntry(entryId: string) {
  const { error } = await supabase
    .from('time_tracking_entries')
    .delete()
    .eq('id', entryId)

  if (error) throw error
}
```

### Krok 4: Použití v komponentě

```typescript
'use client'

import { useState, useEffect } from 'react'
import { TimeTracker } from '@/components/tasks/time-tracker'
import {
  saveTimeEntry,
  updateTaskActualTime,
  getTimeEntriesForTask
} from '@/lib/time-tracking-api'

export default function TaskPage({ params }) {
  const [task, setTask] = useState(null)
  const [entries, setEntries] = useState([])

  // Load task data
  useEffect(() => {
    async function loadTask() {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', params.id)
        .single()

      setTask(data)

      // Load time entries
      const timeEntries = await getTimeEntriesForTask(params.id)
      setEntries(timeEntries)
    }
    loadTask()
  }, [params.id])

  const handleTimeUpdate = async (actualMinutes, newEntries) => {
    try {
      // Update task actual time
      await updateTaskActualTime(task.id, actualMinutes)

      // Save new entries
      const unsavedEntries = newEntries.filter(
        e => !entries.find(existing => existing.id === e.id)
      )

      for (const entry of unsavedEntries) {
        await saveTimeEntry(entry)
      }

      // Update local state
      setTask(prev => ({ ...prev, actual_minutes: actualMinutes }))
      setEntries(newEntries)

      console.log('✅ Time tracking saved successfully')
    } catch (error) {
      console.error('❌ Error saving time tracking:', error)
    }
  }

  if (!task) return <div>Loading...</div>

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
```

## 🔐 Row Level Security (RLS)

Pro zabezpečení dat v Supabase:

```sql
-- Enable RLS
ALTER TABLE time_tracking_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all entries for their company
CREATE POLICY "Users can view company time entries"
  ON time_tracking_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = time_tracking_entries.task_id
      AND tasks.company_id IN (
        SELECT company_id FROM user_companies
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can insert their own time entries
CREATE POLICY "Users can insert own time entries"
  ON time_tracking_entries
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update/delete only their own entries
CREATE POLICY "Users can modify own time entries"
  ON time_tracking_entries
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own time entries"
  ON time_tracking_entries
  FOR DELETE
  USING (user_id = auth.uid());
```

## 📈 Real-time Updates (Optional)

Pro real-time synchronizaci mezi uživateli:

```typescript
// Enable real-time subscription
useEffect(() => {
  const subscription = supabase
    .channel('time_tracking_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'time_tracking_entries',
        filter: `task_id=eq.${taskId}`
      },
      (payload) => {
        console.log('Time tracking changed:', payload)
        // Reload entries
        loadTimeEntries()
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}, [taskId])
```

## 🎯 Best Practices

### 1. Optimistic Updates

```typescript
const handleTimeUpdate = async (actualMinutes, entries) => {
  // Optimistic update (update UI immediately)
  setTask(prev => ({ ...prev, actual_minutes: actualMinutes }))

  try {
    // Persist to database
    await updateTaskActualTime(task.id, actualMinutes)
  } catch (error) {
    // Rollback on error
    setTask(prev => ({ ...prev, actual_minutes: task.actual_minutes }))
    console.error('Failed to save:', error)
  }
}
```

### 2. Debouncing

Pro časté aktualizace (např. running timer):

```typescript
import { debounce } from 'lodash'

const debouncedUpdate = debounce(async (actualMinutes) => {
  await updateTaskActualTime(task.id, actualMinutes)
}, 2000) // Save every 2 seconds max
```

### 3. Error Handling

```typescript
const handleTimeUpdate = async (actualMinutes, entries) => {
  try {
    await updateTaskActualTime(task.id, actualMinutes)
    toast.success('Time saved successfully')
  } catch (error) {
    toast.error('Failed to save time tracking')
    console.error(error)
  }
}
```

### 4. Loading States

```typescript
const [isSaving, setIsSaving] = useState(false)

const handleTimeUpdate = async (actualMinutes, entries) => {
  setIsSaving(true)
  try {
    await updateTaskActualTime(task.id, actualMinutes)
  } finally {
    setIsSaving(false)
  }
}

// In component
{isSaving && <div>Saving...</div>}
```

## 🔧 Customization

### Custom Styling

```tsx
<TimeTracker
  {...props}
  className="custom-class" // Custom CSS class
/>
```

### Custom Callbacks

```tsx
<TimeTracker
  {...props}
  onTimeUpdate={(actualMinutes, entries) => {
    // Custom logic
    console.log('Time updated')

    // Call analytics
    trackEvent('time_logged', { minutes: actualMinutes })

    // Update multiple places
    updateTask(actualMinutes)
    updateTimeline(entries)
    sendNotification()
  }}
/>
```

## 📱 Responsive Design

Komponenta je plně responzivní:

- **Mobile**: Stack layout, full width buttons
- **Tablet**: Grid layout s 2 sloupci
- **Desktop**: Grid layout s 3 sloupci

Automaticky se přizpůsobuje velikosti obrazovky.

## 🐛 Common Issues

### Issue: Timer doesn't stop

**Solution**: Ensure `handleStop` is properly called and state is updated.

### Issue: Time not saving

**Solution**: Check database permissions and network connectivity.

### Issue: Entries not displaying

**Solution**: Verify `onTimeUpdate` callback is updating entries state.

## 📚 Resources

- [Main Component](/Users/Radim/Projects/UcetniWebApp/components/tasks/time-tracker.tsx)
- [Usage Examples](/Users/Radim/Projects/UcetniWebApp/components/tasks/time-tracker-example.tsx)
- [Type Definitions](/Users/Radim/Projects/UcetniWebApp/types/time-tracking.ts)
- [Utility Functions](/Users/Radim/Projects/UcetniWebApp/lib/time-utils.ts)
- [Complete Documentation](/Users/Radim/Projects/UcetniWebApp/components/tasks/README.md)

## ✅ Checklist

- [ ] Database schema created
- [ ] Supabase client configured
- [ ] API functions implemented
- [ ] Component imported
- [ ] User authentication connected
- [ ] Time update callback implemented
- [ ] Error handling added
- [ ] Testing completed

---

**Ready to go!** 🚀
