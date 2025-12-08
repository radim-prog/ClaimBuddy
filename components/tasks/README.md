# Time Tracker Component

Kompletní komponenta pro sledování času práce na úkolech a projektech s podporou fakturace.

## 📁 Soubory

- **`time-tracker.tsx`** - Hlavní komponenta pro time tracking
- **`time-tracker-example.tsx`** - Příklady použití komponenty
- **`/lib/time-utils.ts`** - Helper funkce pro práci s časem

## ✨ Hlavní funkce

### 1. Live Timer (Měření v reálném čase)

- **Start/Stop/Pause** - Spuštění, pozastavení a zastavení časomíry
- **Běžící displej** - Živý displej běžícího času (HH:MM:SS)
- **Automatické ukládání** - Při zastavení se čas automaticky uloží jako entry

```tsx
// Timer běží na pozadí
⏱ 01:23:45
[⏸ Pause] [⏹ Stop & Save]
```

### 2. Quick Time Buttons (Rychlé tlačítka)

Rychlé přidání času bez nutnosti běžícího timeru:

- 15 minut
- 30 minut
- 1 hodina
- 2 hodiny
- 4 hodiny (půl dne)
- 8 hodin (celý den)

### 3. Manual Time Entry (Ruční zadání)

Pro retroaktivní logování času:

- **Datum a čas** - Kdy byla práce provedena
- **Trvání** - Kolik minut trvalo
- **Poznámka** - Co bylo děláno
- **Billable flag** - Zda je čas fakturovatelný

### 4. Time Tracking Entries (Historie záznamů)

Zobrazení všech time entries s možností:

- **Editace** - Úprava záznamu
- **Smazání** - Odstranění záznamu
- **Billable/Non-billable** - Vizuální rozlišení
- **User info** - Kdo čas zalogoval
- **Note** - Poznámka k práci

### 5. Progress Tracking

- **Estimated vs Actual** - Porovnání odhadovaného a skutečného času
- **Progress bar** - Vizuální ukazatel postupu
- **Over budget warning** - Upozornění při překročení odhadu

```
Estimated: 2h
Actual: 2h 30min
Difference: +30 min
Progress: ████████░ 125% ⚠️ Over budget
```

### 6. Billable Time Summary

Pro fakturovatelné úkoly:

- **Billable Hours** - Celkový počet fakturovatelných hodin
- **Hourly Rate** - Hodinová sazba
- **Total Amount** - Celková částka k fakturaci

```
Billable Hours: 5.3h
Hourly Rate: 1200 Kč/h
Total Amount: 6,360 Kč
```

### 7. Project Support

Pro projekty se automaticky:

- **Sčítá čas** ze všech dílčích úkolů
- **Agreguje data** pro celkový přehled
- **Zobrazuje note** - Informace o automatickém sčítání

## 🎯 Props API

```typescript
interface TimeTrackerProps {
  taskId: string                    // ID úkolu/projektu
  estimatedMinutes?: number         // Odhadovaný čas (minuty)
  actualMinutes?: number            // Skutečný čas (minuty)
  hourlyRate?: number               // Hodinová sazba (Kč/h)
  isBillable?: boolean              // Je fakturovatelné?
  isProject?: boolean               // Je to projekt? (readonly view)
  onTimeUpdate?: (                  // Callback při změně času
    actualMinutes: number,
    entries: TimeTrackingEntry[]
  ) => void
  currentUserId: string             // ID aktuálního uživatele
  currentUserName: string           // Jméno uživatele
}
```

## 📦 Instalace a použití

### 1. Základní použití

```tsx
import { TimeTracker } from '@/components/tasks/time-tracker'

function TaskDetailPage() {
  const handleTimeUpdate = (actualMinutes, entries) => {
    console.log('Time updated:', actualMinutes)
    // Save to database
  }

  return (
    <TimeTracker
      taskId="task-123"
      estimatedMinutes={120}
      actualMinutes={0}
      hourlyRate={1200}
      isBillable={true}
      isProject={false}
      onTimeUpdate={handleTimeUpdate}
      currentUserId="user-456"
      currentUserName="Radim Dvořák"
    />
  )
}
```

### 2. Pro projekt (readonly)

```tsx
<TimeTracker
  taskId="project-789"
  estimatedMinutes={480}
  actualMinutes={320}  // Summed from subtasks
  hourlyRate={1200}
  isBillable={true}
  isProject={true}     // Shows note, disables manual tracking
  onTimeUpdate={handleTimeUpdate}
  currentUserId="user-456"
  currentUserName="Radim Dvořák"
/>
```

### 3. S Supabase

```tsx
import { TimeTracker } from '@/components/tasks/time-tracker'
import { supabase } from '@/lib/supabase'

function TaskPage() {
  const handleTimeUpdate = async (actualMinutes, entries) => {
    // Update task
    await supabase
      .from('tasks')
      .update({ actual_minutes: actualMinutes })
      .eq('id', taskId)

    // Save entries
    const newEntries = entries.filter(e => !e.saved)
    await supabase
      .from('time_tracking_entries')
      .insert(newEntries)
  }

  return <TimeTracker {...props} onTimeUpdate={handleTimeUpdate} />
}
```

## 🗄️ Database Schema

### Tabulka: `time_tracking_entries`

```sql
CREATE TABLE time_tracking_entries (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  stopped_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INT,
  note TEXT,
  billable BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

### Tabulka: `tasks` (rozšíření)

```sql
ALTER TABLE tasks ADD COLUMN estimated_minutes INT;
ALTER TABLE tasks ADD COLUMN actual_minutes INT DEFAULT 0;
ALTER TABLE tasks ADD COLUMN time_tracking_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN is_billable BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN hourly_rate DECIMAL(10,2);
ALTER TABLE tasks ADD COLUMN billable_hours DECIMAL(10,2) DEFAULT 0;
```

## 🔧 Helper Functions (`/lib/time-utils.ts`)

### Formátování

```typescript
import { formatDuration, formatTimeDisplay } from '@/lib/time-utils'

formatDuration(90.5)        // "1:30:30"
formatTimeDisplay(90)       // "1h 30min"
formatTimeDisplay(45)       // "45 min"
```

### Výpočty

```typescript
import {
  calculateBillableAmount,
  calculateProgress,
  isOverBudget
} from '@/lib/time-utils'

calculateBillableAmount(90, 1200)  // 1800 (1.5h × 1200)
calculateProgress(90, 60)           // 150 (%)
isOverBudget(90, 60)                // true
```

### Konverze

```typescript
import { hoursToMinutes, minutesToHours } from '@/lib/time-utils'

hoursToMinutes(2.5)    // 150
minutesToHours(150)    // 2.50
```

### Agregace

```typescript
import {
  sumDurations,
  sumBillableDurations,
  calculateInvoiceableAmount
} from '@/lib/time-utils'

const entries = [
  { duration_minutes: 60, billable: true },
  { duration_minutes: 30, billable: false },
  { duration_minutes: 90, billable: true }
]

sumDurations(entries)              // 180 (total)
sumBillableDurations(entries)      // 150 (only billable)
calculateInvoiceableAmount(entries, 1200)  // 3000 Kč
```

### Datum/čas

```typescript
import {
  getCurrentDate,
  getCurrentTime,
  groupEntriesByDate,
  getEntriesForMonth
} from '@/lib/time-utils'

getCurrentDate()  // "2025-12-07"
getCurrentTime()  // "15:30"

groupEntriesByDate(entries)  // Map<string, Entry[]>
getEntriesForMonth(entries, "2025-12")  // Entry[] for December
```

## 🎨 Styling

Komponenta používá existující UI komponenty:

- `Card` - Hlavní kontejner
- `Button` - Tlačítka
- `Input` - Vstupní pole
- `Label` - Popisky
- `Badge` - Billable/Non-billable značky
- `Switch` - Toggle pro billable
- `Separator` - Oddělovače sekcí

Všechny styly jsou v souladu s existujícím designem aplikace (Tailwind + shadcn/ui).

## 🚀 Pokročilé funkce

### Real-time Updates

Timer se aktualizuje každých 100ms pro plynulý displej:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    // Update elapsed time
  }, 100)
  return () => clearInterval(interval)
}, [isRunning, isPaused])
```

### Timezone Handling

Všechny časové značky jsou v ISO 8601 formátu s timezone:

```typescript
started_at: "2025-12-07T10:00:00.000Z"
stopped_at: "2025-12-07T11:30:00.000Z"
```

### Billable Filtering

Entries jsou automaticky filtrovány podle billable flagu:

```typescript
const billableEntries = entries.filter(e => e.billable)
const totalBillable = billableEntries.reduce(
  (sum, e) => sum + (e.duration_minutes || 0),
  0
)
```

## 📋 Příklady use cases

### Use Case 1: Jednoduchý úkol

```typescript
// "Poslat email klientovi" - 10 minut
<TimeTracker
  taskId="email-task"
  estimatedMinutes={10}
  actualMinutes={12}
  isBillable={true}
  hourlyRate={800}
/>

// Výsledek:
// Estimated: 10 min
// Actual: 12 min
// Difference: +2 min (20% over)
// Amount: 160 Kč
```

### Use Case 2: Projekt s dílčími úkoly

```typescript
// Projekt: "Roční uzávěrka"
// Subtask 1: 25 min (completed)
// Subtask 2: 105 min (completed)
// Subtask 3: 190 min (completed)
// Total: 320 min

<TimeTracker
  taskId="annual-closure"
  estimatedMinutes={480}
  actualMinutes={320}  // Auto-summed
  isBillable={true}
  hourlyRate={1200}
  isProject={true}      // Read-only mode
/>

// Výsledek:
// Estimated: 8h
// Actual: 5h 20min
// Progress: 67%
// Amount: 6,360 Kč
```

### Use Case 3: Měsíční fakturace

```typescript
// Všechny billable entries za prosinec 2025
const decemberEntries = getEntriesForMonth(entries, "2025-12")
const totalAmount = calculateInvoiceableAmount(decemberEntries, 1200)

console.log(totalAmount)  // 52,875 Kč
```

## 🐛 Troubleshooting

### Timer se nezastavuje

- Zkontrolujte `isRunning` state
- Ujistěte se, že `handleStop` je správně zavolána

### Čas se nesčítá správně

- Ověřte, že `onTimeUpdate` callback je implementován
- Zkontrolujte, že `actualMinutes` je aktualizován v parent komponentě

### Billable amount je nesprávný

- Zkontrolujte `hourlyRate` prop
- Ověřte billable flag v entries

## 📚 Související dokumentace

- [Design Document](/Users/Radim/Projects/UcetniWebApp/.claude-context/2025-12-06-task-management-final.md)
- [Time Utils API](/Users/Radim/Projects/UcetniWebApp/lib/time-utils.ts)
- [Usage Examples](/Users/Radim/Projects/UcetniWebApp/components/tasks/time-tracker-example.tsx)

## 🔄 Verze

- **v1.0** (2025-12-07) - Iniciální implementace
  - Live timer s start/pause/stop
  - Quick time buttons
  - Manual entry form
  - Time entries list
  - Billable summary
  - Project support
  - Progress tracking

## 👨‍💻 Autor

Vytvořeno podle specifikace v design dokumentu:
- Design: Radim Dvořák
- Implementace: Claude Code
- Datum: 2025-12-07
