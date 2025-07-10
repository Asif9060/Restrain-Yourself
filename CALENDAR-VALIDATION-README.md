# Calendar Date Validation Implementation

## Overview

This implementation adds date selection restrictions to the Calendar component as specified in the requirements. Users can only select:

-  **Today** (current date)
-  **Yesterday** (previous day)

All other dates are visually disabled and show error messages when clicked.

## Implementation Details

### 1. Date Validation Utilities (`src/utils/index.ts`)

Added four new utility functions:

-  `isDateSelectable(date: Date)`: Returns true only for today and yesterday
-  `isDateInFuture(date: Date)`: Checks if date is after today
-  `isDateTooOld(date: Date)`: Checks if date is before yesterday
-  `getDateValidationMessage(date: Date)`: Returns appropriate error message

### 2. Calendar Component Updates (`src/components/Calendar.tsx`)

**Visual Changes:**

-  Future dates and dates older than yesterday are displayed with gray styling and reduced opacity
-  Disabled dates show `cursor-not-allowed` and no hover effects
-  Tooltip messages appear on hover for disabled dates

**Interaction Changes:**

-  Clicking disabled dates shows an error message instead of selecting the date
-  Error messages auto-disappear after 3 seconds
-  Only valid dates (today/yesterday) can be selected

**UI Enhancements:**

-  Added error message display with smooth animations
-  Updated legend to explain date restrictions
-  Maintained all existing calendar functionality

### 3. Error Handling

**User Feedback:**

-  Clear error messages: "Future dates cannot be selected. Please choose today or yesterday."
-  Visual indicators: Disabled styling for non-selectable dates
-  Tooltips: Hover messages explaining why dates cannot be selected

**Technical Details:**

-  Uses consistent date formatting and timezone handling
-  All date comparisons normalized to start of day
-  Error state managed with React hooks

## Usage Example

```typescript
// Valid selections (will work)
onDateSelect(new Date("2025-07-10")); // Today
onDateSelect(new Date("2025-07-09")); // Yesterday

// Invalid selections (will show error)
onDateSelect(new Date("2025-07-11")); // Future date
onDateSelect(new Date("2025-07-08")); // Too old
```

## Testing

The implementation preserves all existing calendar functionality while adding the date restrictions. The calendar will:

1. ✅ Display all dates in the month view
2. ✅ Show habit completion status for valid dates
3. ✅ Allow navigation between months
4. ❌ Prevent selection of future dates
5. ❌ Prevent selection of dates older than yesterday
6. 💬 Show clear error messages for invalid selections
7. 🎨 Visually distinguish selectable vs non-selectable dates

## Current Date Reference

The system uses `new Date()` for current date reference, ensuring timezone-appropriate validation based on the user's local system time.
