# Dayflow Task Manager

A React + Vite + Tailwind task manager dashboard with daily to-dos, calendar view, and a Markdown daily plan editor. Data is saved in `localStorage`.

## Features
- Daily todo list with priority, tags, time, and date.
- Calendar month view with task indicators and day selection.
- Daily plan editor in Markdown with preview and `.md` export.
- Dashboard snapshot with totals, upcoming tasks, and focus meter.
- Light/Dark mode toggle with system preference detection.

## Tech Stack
- React 18
- Vite 5
- Tailwind CSS 3

## Getting Started
```bash
cd task-manager
npm install
npm run dev
```

## Scripts
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run preview` - Preview production build

## Notes
- All data is stored locally in the browser via `localStorage`.
- No backend required.
