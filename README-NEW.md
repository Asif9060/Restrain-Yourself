# Restrain Yourself - Habit Tracker

A comprehensive single-page habit tracking application built with Next.js, TypeScript, and Tailwind CSS. This application helps users track and build better habits while providing motivational content and detailed analytics.

## 🌟 Features

### 📅 Interactive Calendar

-  Visual calendar interface with date selection
-  Color-coded indicators for habit completion status
-  Navigate between months and years
-  Visual legend for different completion states

### 🎯 Habit Management

-  **Predefined Habits**: Ready-to-use habits for common goals
   -  No Smoking
   -  No Drinking
   -  No Adult Content
   -  Limit Social Media
   -  No Junk Food
-  **Custom Habits**: Create personalized habits with custom icons and colors
-  **Daily Tracking**: Simple toggle interface for marking habits as complete
-  **Habit Categories**: Organized by behavioral categories

### 📊 Statistics & Analytics

-  **Current Streak**: Track your ongoing success
-  **Best Streak**: Historical peak performance
-  **Success Rate**: Overall completion percentage
-  **Visual Charts**: 30-day progress visualization using Recharts
-  **Period Analysis**: Weekly and monthly success rates
-  **Interactive Graphs**: Hover for detailed information

### 💡 Motivational Content

-  **Daily Quotes**: Inspirational quotes based on your tracked habits
-  **Health Tips**: Educational content from reputable health organizations
-  **Progress Celebrations**: Encouraging messages for achievements
-  **Category-Specific Content**: Tailored advice for different habit types

### 🎨 User Experience

-  **Modern UI**: Clean, minimalist design with subtle animations
-  **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
-  **Accessibility**: Keyboard navigation and screen reader support
-  **Real-time Updates**: Instant feedback on habit completion
-  **Local Storage**: Data persists between sessions

## 🚀 Getting Started

### Prerequisites

-  Node.js 18+
-  npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/restrain-yourself.git
cd restrain-yourself
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🛠️ Tech Stack

### Core Technologies

-  **Next.js 15** - React framework with App Router
-  **TypeScript** - Type-safe JavaScript
-  **Tailwind CSS** - Utility-first CSS framework
-  **React 19** - Latest React features

### Key Dependencies

-  **Framer Motion** - Smooth animations and transitions
-  **Lucide React** - Beautiful, customizable icons
-  **Recharts** - Responsive chart library
-  **date-fns** - Modern date utility library
-  **@headlessui/react** - Unstyled, accessible UI components

### Development Tools

-  **ESLint** - Code linting and quality
-  **TypeScript** - Static type checking
-  **PostCSS** - CSS processing

## 📱 Application Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout component
│   ├── page.tsx            # Main application page
│   └── globals.css         # Global styles
├── components/
│   ├── Calendar.tsx        # Interactive calendar component
│   ├── HabitCard.tsx       # Individual habit tracking card
│   ├── StatsModal.tsx      # Statistics and analytics modal
│   ├── AddHabitModal.tsx   # Add new habit modal
│   ├── MotivationalContent.tsx # Quotes and tips
│   ├── Header.tsx          # Application header
│   ├── DateInfo.tsx        # Selected date information
│   └── EmptyState.tsx      # No habits placeholder
├── hooks/
│   └── useHabitTracker.ts  # Main state management hook
├── utils/
│   └── index.ts            # Utility functions
├── data/
│   └── index.ts            # Static data (quotes, tips, habits)
└── types/
    └── index.ts            # TypeScript type definitions
```

## 📋 Usage Guide

### Adding Your First Habit

1. Click the "Add Habit" button in the header
2. Choose from predefined habits or create a custom one
3. For custom habits:
   -  Enter a name and description
   -  Select a category and color
   -  Choose an icon
4. Click "Create Habit" to save

### Tracking Daily Progress

1. Select a date on the calendar
2. Toggle habits as complete/incomplete
3. View your progress indicators
4. Check motivational content for encouragement

### Viewing Statistics

1. Click "Stats" on any habit card
2. Review your current and best streaks
3. Analyze success rates and patterns
4. Use the 30-day chart to track trends

### Calendar Navigation

-  Click arrows to navigate between months
-  Click any date to select it
-  Color indicators show completion status:
   -  🟢 Green: All habits completed
   -  🟡 Yellow: Partially completed
   -  🔴 Red: No habits completed

## 🎯 Key Features in Detail

### Smart Data Management

-  **Local Storage**: All data saved locally for privacy
-  **Real-time Sync**: Instant updates across components
-  **Data Persistence**: No data loss between sessions

### Accessibility Features

-  **Keyboard Navigation**: Full app usable with keyboard
-  **Screen Reader Support**: Proper ARIA labels
-  **High Contrast**: Readable color combinations
-  **Focus Management**: Clear focus indicators

### Performance Optimizations

-  **Code Splitting**: Lazy loading of components
-  **Optimized Rendering**: Minimal re-renders
-  **Efficient State**: Centralized state management
-  **Fast Navigation**: Client-side routing

## 🔧 Customization

### Adding New Predefined Habits

Edit `src/data/index.ts` to add new predefined habits:

```typescript
{
  name: 'New Habit',
  category: 'custom',
  color: '#6366f1',
  icon: 'Target',
  isCustom: false,
  description: 'Description of the habit'
}
```

### Adding Motivational Content

Add quotes and health tips in the same file:

```typescript
// New quote
{
  text: "Your inspiring quote here",
  author: "Author Name",
  category: "habit-category"
}

// New health tip
{
  title: "Tip Title",
  content: "Detailed tip content...",
  category: "habit-category",
  source: "Health Organization"
}
```

## 🏗️ Development

### Building for Production

```bash
npm run build
npm start
```

### Code Quality

```bash
npm run lint          # Run ESLint
npm run type-check    # TypeScript checking
```

### Project Goals

This application was designed to meet specific requirements:

-  ✅ Single-page application with no scrolling needed
-  ✅ Interactive calendar with visual indicators
-  ✅ Predefined and custom habit support
-  ✅ Real-time date synchronization
-  ✅ Statistical analysis and visualization
-  ✅ Motivational content integration
-  ✅ Modern, responsive design
-  ✅ Accessibility compliance
-  ✅ Local storage for privacy

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you have any questions or need help with the application, please open an issue on GitHub.

---

**Built with ❤️ using Next.js and modern web technologies**
