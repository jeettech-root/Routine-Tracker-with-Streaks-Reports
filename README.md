# Routine Enforcement System

A strict productivity web application designed to enforce daily discipline through task management, scheduling, and consistency tracking.

## Overview

Routine Enforcement System is a frontend-only productivity tool that helps users maintain strict daily routines. It enforces discipline through automatic task state management, prevents task editing after deadlines, and provides comprehensive analytics on productivity patterns.

## Features

### Core Functionality

- **Task Definition**: Create tasks with title, category, priority, time slots, duration, and critical flag
- **Daily Schedule**: Visual 24-hour timeline view with hourly task blocks
- **Task Management**: View, edit, and delete tasks with strict state enforcement
- **Consistency Tracking**: Monitor daily streaks and completion rates
- **Weekly Reports**: 7-day performance summaries
- **Yearly Reports**: Annual discipline patterns with monthly consistency charts

### Key Characteristics

- **Strict State Management**: Tasks automatically become "missed" after end time passes
- **No Undo**: Completed and missed tasks are permanently locked
- **Edit Restrictions**: Tasks cannot be edited after their start time
- **Dark Theme**: Minimal, dense UI optimized for focus
- **Fully Responsive**: Works on desktop and mobile devices
- **Local Storage**: All data persists locally in the browser

## Tech Stack

- **HTML5**: Semantic markup
- **CSS3**: Custom styling with CSS Grid and Flexbox
- **Vanilla JavaScript**: No frameworks or dependencies
- **Chart.js**: Data visualization (via CDN)
- **LocalStorage**: Client-side data persistence

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd routine-enforcement-system
```

2. Open `index.html` in a web browser:
   - Double-click `index.html`, or
   - Use a local server (recommended):
     ```bash
     # Python 3
     python -m http.server 8000
     
     # Python 2
     python -m SimpleHTTPServer 8000
     
     # Node.js (with http-server)
     npx http-server
     ```

3. Navigate to `http://localhost:8000` in your browser

## Project Structure

```
routine-enforcement-system/
├── index.html          # Main HTML file
├── css/
│   └── style.css      # All styles
├── js/
│   ├── app.js         # Main application logic
│   ├── storage.js     # LocalStorage management
│   ├── charts.js     # Chart initialization and updates
│   └── utils.js      # Utility functions
└── README.md          # This file
```

## Usage

### Creating Tasks

1. Navigate to **Define Task** tab
2. Fill in task details:
   - Title (required)
   - Category: Study, Health, Coding, or Personal
   - Priority: Low, Medium, or High
   - Start time and End time
   - Estimated duration in minutes
   - Critical task checkbox (optional)
3. Click **Save Task**

### Viewing Schedule

- **Daily Schedule** tab shows a 24-hour timeline
- Current hour is highlighted when viewing today's schedule
- Tasks appear as colored pills:
  - **Blue**: Pending
  - **Green**: Completed
  - **Red**: Missed

### Task States

- **Pending**: Task is scheduled and not yet completed
- **Completed**: Task was marked as done (permanently locked)
- **Missed**: Task end time passed without completion (automatically set, permanently locked)

### Navigation

- Use date selector in navbar to view different dates
- Switch between views using navigation tabs:
  - Define Task
  - Daily Schedule
  - Tasks
  - Consistency
  - Report (7-day)
  - Yearly Report

## Design Principles

- **Dense UI**: Maximum information density without clutter
- **No Animations**: Predictable, instant interactions
- **Strict Constraints**: Hard layout rules prevent glitches
- **Mobile-First**: Responsive design starting from mobile
- **Dark Theme**: Reduced eye strain for extended use

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with LocalStorage support

## Data Storage

All data is stored locally in the browser's LocalStorage:
- Tasks and their states
- Daily completion logs
- Streak information

**Note**: Clearing browser data will delete all stored information.

## Limitations

- Frontend-only (no backend synchronization)
- Single-device storage (no cloud sync)
- No user accounts or authentication
- No data export/import functionality

## License

This project is open source and available for personal use.

## Contributing

Contributions are welcome. Please ensure:
- Code follows existing style (no frameworks, vanilla JS)
- UI remains dense and minimal
- No animations or gradients
- Maintains strict layout constraints

## Version

Current Version: 1.0.0

---

**Built with discipline in mind.**


