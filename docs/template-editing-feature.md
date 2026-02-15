# Workout Editing and Deletion Feature

## Overview
Implemented full CRUD (Create, Read, Update, Delete) functionality for user workouts (workout templates) in the Hira AI mobile app.

## Features Implemented

### 1. **Workout Editing**
- Click any workout card (in Workout Tracker or My Workouts screen) to open it in edit mode
- Workout data is automatically loaded including:
  - Title and description
  - All exercises with their sets
- Changes are saved back to the same workout (updates existing record)

### 2. **Workout Deletion**
- Delete button appears in the header when editing a workout
- Confirmation dialog prevents accidental deletion
- Cascade deletion removes all associated exercises and sets

### 3. **New Hooks Added**

#### `useWorkoutTemplate(templateId)`
Fetches a single template with all its exercises and sets:
```typescript
const { data: templateData } = useWorkoutTemplate(templateId);
```

#### `useUpdateWorkoutTemplate()`
Updates an existing template:
```typescript
const updateTemplate = useUpdateWorkoutTemplate();
updateTemplate.mutate({
  templateId,
  title,
  description,
  exercises
});
```

#### `useDeleteWorkoutTemplate()`
Deletes a template:
```typescript
const deleteTemplate = useDeleteWorkoutTemplate();
deleteTemplate.mutate(templateId);
```

## User Flow

### Editing a workout
1. Navigate to **Workout Tracker** or **My Workouts** screen
2. **Tap on any workout card** (not the "Start" button)
3. Workout opens in **TemplateCreateScreen** with all data loaded
4. Make changes to title, description, exercises, or sets
5. Tap **"Save"** to update the workout
6. Navigate back to see updated workout

### Deleting a workout
1. Open a workout in edit mode (tap on workout card)
2. Tap the **trash icon** in the top-left header
3. Confirm deletion in the alert dialog
4. Workout is permanently deleted and you're navigated back

### Creating a new workout
1. Tap **"Create New"** button (FAB in My Workouts or from Workout Tracker)
2. No workout data is loaded (blank form)
3. Fill in details and save
4. New workout is created

## Technical Details

### State Management
- `editingTemplateId` state in `App.tsx` tracks which template is being edited
- Set to `null` for create mode, or a template ID for edit mode
- Automatically cleared when navigating back

### Data Loading
- Template data is fetched using React Query when `templateId` is provided
- `useEffect` hook transforms the database format to the local state format
- `isLoaded` flag prevents re-loading on every render

### Update Strategy
- Delete all existing exercises and sets
- Insert new exercises and sets
- This ensures clean state without orphaned records

### UI Indicators
- Screen title changes: "Create" vs "Edit" workout
- Delete button only visible in edit mode
- Save button shows "Saving..." during mutation

## Files Modified

1. **`hooks/useWorkoutTemplates.ts`**
   - Added `useWorkoutTemplate()` hook
   - Added `useUpdateWorkoutTemplate()` hook
   - Added `useDeleteWorkoutTemplate()` hook

2. **`screens/TemplateCreateScreen.tsx`**
   - Added `templateId` prop
   - Added template loading logic
   - Added delete button in header
   - Updated save logic to handle both create and update

3. **`screens/MyWorkoutsScreen.tsx`** (formerly MyTemplatesScreen)
   - Added `onEditTemplate` prop
   - Made workout cards clickable
   - Added `stopPropagation` to "Start" button

4. **`screens/WorkoutTrackerScreen.tsx`**
   - Added `onEditTemplate` prop
   - Made workout cards clickable
   - Added `stopPropagation` to "Start" button

5. **`App.tsx`**
   - Added `editingTemplateId` state
   - Added `handleEditTemplate()` function
   - Added `handleCreateNewTemplate()` function
   - Wired up all callbacks

## Database Operations

### Fetch Single Template
```sql
SELECT *,
  workout_template_exercises (
    id, exercise_id, exercise_name, order_index,
    workout_template_sets (
      id, set_number, reps, rest_seconds
    )
  )
FROM workout_templates
WHERE id = ?
```

### Update Template
```sql
UPDATE workout_templates
SET title = ?, description = ?
WHERE id = ?
```

### Delete Template
```sql
DELETE FROM workout_templates WHERE id = ?
-- Cascade deletes workout_template_exercises and workout_template_sets
```

## Error Handling
- All mutations show error alerts on failure
- TypeScript ensures type safety
- Validation prevents saving workouts without a name
- Confirmation dialog prevents accidental deletion

## Next Steps (Optional Enhancements)
- Add undo/redo for workout edits
- Add workout duplication feature
- Add workout sharing/export
- Add workout versioning/history
- Add bulk delete functionality
