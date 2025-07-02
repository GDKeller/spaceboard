# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server (default: http://localhost:5173)
npm run dev

# Build for production (TypeScript check + Vite build)
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## Architecture Overview

### Application Flow
1. **Entry Point**: `src/main.tsx` renders the root App component in StrictMode
2. **Main Component**: `src/App.tsx` displays the Vite/React logos and renders `AstronautGrid`
3. **Data Fetching**: `AstronautGrid` component fetches astronaut data from Open Notify API on mount
4. **Display**: Individual `Astronaut` components are rendered in a grid layout

### Component Hierarchy
```
App (src/App.tsx)
└── AstronautGrid (src/components/AstronautGrid.tsx)
    └── Astronaut[] (src/components/Astronaut.tsx)
```

### API Integration
- **Endpoint**: `http://api.open-notify.org/astros.json`
- **Data Flow**: Fetch in `useEffect` → Update state → Map to `Astronaut` components
- **Data Shape**: `{ people: Array<{ name: string, craft: string }> }`

### TypeScript Configuration
- Strict mode enabled
- Target: ES2020
- JSX: react-jsx transform
- No unused locals/parameters allowed

## Key Development Notes

- Components use React functional components with TypeScript (`React.FC`)
- State management via React hooks (useState, useEffect)
- Currently no test framework configured
- CSS styling (no CSS framework currently integrated)
- Git status shows some deleted files (tailwind.config.cjs, src/components/Astronauts.tsx) indicating recent refactoring