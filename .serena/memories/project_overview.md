# Spaceboard Project Overview

## Purpose
Spaceboard is a web application that displays a grid of astronauts currently in space. It fetches data from the Open Notify API (http://api.open-notify.org/astros.json) and presents it in a grid layout.

## Tech Stack
- **Frontend Framework**: React 19.0.0 with TypeScript
- **Build Tool**: Vite 6.3.1
- **Language**: TypeScript 5.7.2
- **Styling**: Currently using plain CSS (index.css, App.css)
- **Development Server**: Vite dev server
- **Package Manager**: npm

## Key Dependencies
- react: ^19.0.0
- react-dom: ^19.0.0
- @vitejs/plugin-react: ^4.3.4
- eslint: ^9.22.0
- typescript-eslint: ^8.26.1

## Project Structure
```
spaceboard/
├── src/
│   ├── components/
│   │   ├── AstronautGrid.tsx  # Main grid component that fetches astronaut data
│   │   └── Astronaut.tsx      # Individual astronaut display component
│   ├── assets/
│   │   └── react.svg
│   ├── App.tsx               # Main app component
│   ├── main.tsx             # Entry point
│   ├── App.css              # App-specific styles
│   ├── index.css            # Global styles
│   └── vite-env.d.ts        # Vite type definitions
├── public/                   # Static assets
├── package.json             # Project configuration
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── eslint.config.js         # ESLint configuration
└── README.md                # Project documentation
```

## Note
The project appears to be in transition - there are deleted files (tailwind.config.cjs, src/components/Astronauts.tsx) suggesting a recent refactoring or tooling change.