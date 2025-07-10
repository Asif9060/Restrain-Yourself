// Test file to verify calendar date validation functionality
// Run this in the browser console to test the date validation

// Test the date validation utilities
import {
   isDateSelectable,
   isDateInFuture,
   isDateTooOld,
   getDateValidationMessage,
} from "@/utils";

// Test cases for July 10, 2025 (current date according to context)
const today = new Date("2025-07-10");
const yesterday = new Date("2025-07-09");
const tomorrow = new Date("2025-07-11");
const dayBeforeYesterday = new Date("2025-07-08");
const futureDate = new Date("2025-07-15");

console.group("Date Validation Tests");

// Test selectable dates
console.log("Today (2025-07-10) is selectable:", isDateSelectable(today)); // Should be true
console.log("Yesterday (2025-07-09) is selectable:", isDateSelectable(yesterday)); // Should be true

// Test non-selectable dates
console.log("Tomorrow (2025-07-11) is selectable:", isDateSelectable(tomorrow)); // Should be false
console.log(
   "Day before yesterday (2025-07-08) is selectable:",
   isDateSelectable(dayBeforeYesterday)
); // Should be false
console.log("Future date (2025-07-15) is selectable:", isDateSelectable(futureDate)); // Should be false

// Test future date detection
console.log("Tomorrow is in future:", isDateInFuture(tomorrow)); // Should be true
console.log("Today is in future:", isDateInFuture(today)); // Should be false

// Test too old date detection
console.log("Day before yesterday is too old:", isDateTooOld(dayBeforeYesterday)); // Should be true
console.log("Yesterday is too old:", isDateTooOld(yesterday)); // Should be false

// Test validation messages
console.log("Future date validation message:", getDateValidationMessage(tomorrow));
console.log(
   "Too old date validation message:",
   getDateValidationMessage(dayBeforeYesterday)
);
console.log("Valid date validation message:", getDateValidationMessage(today)); // Should be null

console.groupEnd();

// Expected behavior in the Calendar component:
console.group("Expected Calendar Behavior");
console.log("✅ Today and yesterday should be clickable with normal styling");
console.log(
   "❌ Future dates should be disabled with gray styling and show error on click"
);
console.log(
   "❌ Dates older than yesterday should be disabled with gray styling and show error on click"
);
console.log(
   "💬 Error messages should appear for 3 seconds when invalid dates are clicked"
);
console.log("📱 Hover tooltips should show validation messages for disabled dates");
console.groupEnd();
