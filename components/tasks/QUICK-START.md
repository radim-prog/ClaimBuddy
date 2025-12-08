# TimeTracker - Quick Start Guide

## 1-Minute Integration

### Import
```tsx
import { TimeTracker } from '@/components/tasks'
```

### Use
```tsx
<TimeTracker
  taskId="your-task-id"
  estimatedMinutes={120}
  actualMinutes={0}
  hourlyRate={1200}
  isBillable={true}
  onTimeUpdate={(minutes, entries) => console.log(minutes)}
  currentUserId="user-id"
  currentUserName="User Name"
/>
```

### Done! ✅

---

## Common Patterns

### Simple Task
```tsx
<TimeTracker
  taskId="task-123"
  estimatedMinutes={60}
  actualMinutes={0}
  hourlyRate={800}
  isBillable={true}
  onTimeUpdate={handleSave}
  currentUserId={user.id}
  currentUserName={user.name}
/>
```

### Project (Read-only)
```tsx
<TimeTracker
  taskId="project-456"
  estimatedMinutes={480}
  actualMinutes={320}
  isProject={true}
  {...otherProps}
/>
```

### Non-billable Internal Task
```tsx
<TimeTracker
  taskId="internal-789"
  estimatedMinutes={30}
  actualMinutes={0}
  isBillable={false}
  {...otherProps}
/>
```

---

## Features at a Glance

| Feature | Description |
|---------|-------------|
| Live Timer | Start/Stop/Pause with real-time display |
| Quick Buttons | 15min, 30min, 1h, 2h, 4h, 8h presets |
| Manual Entry | Retroactive time logging with date/time |
| Progress Bar | Visual tracking vs estimate |
| Billable Calc | Automatic hourly rate × time |
| Entries List | Complete history with edit/delete |
| Project Mode | Aggregated time from subtasks |

---

## Props Reference

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `taskId` | string | ✅ | - | Unique task identifier |
| `estimatedMinutes` | number | ❌ | 0 | Estimated duration |
| `actualMinutes` | number | ❌ | 0 | Current actual time |
| `hourlyRate` | number | ❌ | 0 | Rate in currency/hour |
| `isBillable` | boolean | ❌ | false | Is billable to client? |
| `isProject` | boolean | ❌ | false | Project mode (read-only) |
| `onTimeUpdate` | function | ❌ | - | Callback on time change |
| `currentUserId` | string | ✅ | - | Current user's ID |
| `currentUserName` | string | ✅ | - | Current user's name |

---

## Database Setup (Copy-Paste)

```sql
-- Add columns to tasks table
ALTER TABLE tasks
ADD COLUMN estimated_minutes INT,
ADD COLUMN actual_minutes INT DEFAULT 0,
ADD COLUMN is_billable BOOLEAN DEFAULT false,
ADD COLUMN hourly_rate DECIMAL(10,2);

-- Create time tracking table
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

-- Auto-calculate duration
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
  FOR EACH ROW EXECUTE FUNCTION calculate_duration();
```

---

## Helper Functions

```typescript
import {
  formatTimeDisplay,
  calculateBillableAmount,
  sumBillableDurations
} from '@/lib/time-utils'

// Format: "2h 30min"
formatTimeDisplay(150)

// Calculate: 1800 Kč
calculateBillableAmount(90, 1200)

// Sum billable: 150 min
sumBillableDurations(entries)
```

---

## Next Steps

1. **See Full Docs**: `/components/tasks/README.md`
2. **Integration Guide**: `/components/tasks/INTEGRATION.md`
3. **View Demo**: `/components/tasks/time-tracker-demo.tsx`
4. **Run Tests**: `npm test time-tracker.test.tsx`

---

**Ready to track time!** ⏱️
