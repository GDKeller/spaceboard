# NPM Scripts Convention for Full-Stack JavaScript Projects

## Overview

This convention provides a consistent, scalable approach to organizing npm scripts in projects with separate frontend and backend services. It emphasizes clarity, safety, and developer experience.

### Key Benefits
- **Predictable naming** - Easy to guess command names
- **Background execution** - Servers run without blocking the terminal
- **Unified logging** - All output captured in log files
- **Safe process management** - No accidental process termination
- **Clear hierarchy** - Frontend-first with explicit prefixes for other contexts

## Naming Convention

The convention uses a three-tier prefix system:

| Prefix | Target | Example |
|--------|--------|---------|
| (none) | Frontend only | `npm run dev` |
| `server:` | Backend only | `npm run server:dev` |
| `all:` | Both services | `npm run all:dev` |

This treats the frontend as the "default" context, which is common in frontend-first applications.

## Core Script Categories

### 1. Development Servers

Run services in the background with output redirected to log files:

```json
{
  "scripts": {
    "dev": "vite --port 3000 > ./logs/frontend.log 2>&1 &",
    "server:dev": "cd server && npm run dev",
    "all:dev": "mkdir -p logs && concurrently \"npm run dev\" \"npm run server:dev\""
  }
}
```

**Server package.json:**
```json
{
  "scripts": {
    "dev": "nodemon index.js > ../logs/backend.log 2>&1 &"
  }
}
```

### 2. Log Management

View and manage log files without cluttering the terminal:

```json
{
  "scripts": {
    "log": "tail -f ./logs/frontend.log",
    "log:last": "tail -n ${LINES:-20} ./logs/frontend.log",
    "log:clear": "rm -f ./logs/frontend.log && echo 'Frontend log cleared'",
    
    "server:log": "tail -f ./logs/backend.log",
    "server:log:last": "tail -n ${LINES:-20} ./logs/backend.log",
    "server:log:clear": "rm -f ./logs/backend.log && echo 'Backend log cleared'",
    
    "all:log:last": "echo '=== Frontend ===' && npm run log:last && echo '\n=== Backend ===' && npm run server:log:last",
    "all:log:clear": "rm -f ./logs/*.log && echo 'All logs cleared'"
  }
}
```

**Usage:**
- `npm run log` - Watch frontend logs in real-time
- `npm run log:last` - View last 20 lines
- `LINES=50 npm run log:last` - View last 50 lines

### 3. Process Management

Safely stop and restart services:

```json
{
  "scripts": {
    "kill": "(lsof -ti:3000 | xargs kill -9) 2>/dev/null || true",
    "restart": "npm run kill && npm run dev",
    
    "server:kill": "(lsof -ti:4000 | xargs kill -9) 2>/dev/null || true",
    "server:restart": "npm run server:kill && npm run server:dev",
    
    "all:kill": "npm run kill && npm run server:kill",
    "all:restart": "npm run all:kill && npm run all:dev"
  }
}
```

**Safety features:**
- Parentheses contain command failures
- `2>/dev/null` suppresses error messages
- `|| true` ensures the command always succeeds

### 4. Build & Deploy

```json
{
  "scripts": {
    "build": "vite build",
    "server:build": "cd server && npm run build",
    "all:build": "npm run build && npm run server:build",
    
    "preview": "vite preview",
    "server:start": "cd server && npm start",
    "all:start": "concurrently \"npm run preview\" \"npm run server:start\""
  }
}
```

### 5. Maintenance & Utilities

```json
{
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "server:test": "cd server && npm test",
    "all:test": "npm test && npm run server:test",
    
    "all:install": "npm install && cd server && npm install",
    "cache:clear": "rm -rf .cache/* node_modules/.cache/*",
    
    "status": "echo 'Frontend:' && (lsof -i:3000 >/dev/null 2>&1 && echo '✅ Running' || echo '❌ Stopped') && echo 'Backend:' && (lsof -i:4000 >/dev/null 2>&1 && echo '✅ Running' || echo '❌ Stopped')"
  }
}
```

## Implementation Guide

### 1. Project Structure

```
project/
├── package.json          # Root package.json
├── logs/                 # Log directory (gitignored)
│   ├── frontend.log
│   └── backend.log
├── src/                  # Frontend source
└── server/
    ├── package.json      # Server package.json
    └── index.js
```

### 2. Setup Steps

1. **Create logs directory:**
   ```bash
   mkdir -p logs
   echo "logs/" >> .gitignore
   ```

2. **Assign fixed ports:**
   - Choose ports for your project (e.g., 3000 for frontend, 4000 for backend)
   - Configure in your app config files (vite.config.js, server config)
   - Include ports in scripts for visibility

3. **Install dependencies:**
   ```bash
   npm install --save-dev concurrently
   ```

4. **Copy script templates** and adjust ports/commands for your stack

### 3. Port Management

**Best Practices:**
- Assign fixed ports per project (no random ports)
- Document port assignments in README
- Include port in script for visibility (even if redundant with config)
- Use consistent port ranges (e.g., 3000-3999 for frontend, 4000-4999 for backend)

**Example port assignment:**
```markdown
## Port Assignments
- Frontend: 3000
- Backend API: 4000
- Database: 5432 (PostgreSQL default)
```

## Common Patterns by Stack

### React + Node.js/Express
```json
{
  "scripts": {
    "dev": "vite --port 3000 > ./logs/frontend.log 2>&1 &",
    "server:dev": "cd server && nodemon index.js > ../logs/backend.log 2>&1 &"
  }
}
```

### React + Fastify
```json
{
  "scripts": {
    "dev": "vite --port 3000 > ./logs/frontend.log 2>&1 &",
    "server:dev": "cd server && tsx watch index.ts > ../logs/backend.log 2>&1 &"
  }
}
```

### Next.js + Separate API
```json
{
  "scripts": {
    "dev": "next dev -p 3000 > ./logs/frontend.log 2>&1 &",
    "server:dev": "cd server && npm run dev > ../logs/backend.log 2>&1 &"
  }
}
```

## Troubleshooting

### Issue: "Address already in use"
```bash
npm run status        # Check what's running
npm run all:kill      # Stop all services
npm run all:dev       # Start fresh
```

### Issue: Commands not found on Windows
Use cross-platform alternatives:
- Replace `lsof` with `netstat` or use `cross-env`
- Use `rimraf` instead of `rm -rf`
- Consider `concurrently` for all parallel operations

### Issue: Logs not appearing
```bash
npm run all:log:clear  # Clear old logs
npm run all:dev        # Restart services
npm run all:log:last   # Check recent output
```

## Advanced Patterns

### Environment-Specific Scripts
```json
{
  "scripts": {
    "dev:staging": "NODE_ENV=staging npm run dev",
    "server:dev:staging": "cd server && NODE_ENV=staging npm run dev",
    "all:dev:staging": "NODE_ENV=staging npm run all:dev"
  }
}
```

### Health Checks
```json
{
  "scripts": {
    "health": "curl -f http://localhost:3000/health || echo 'Frontend unhealthy'",
    "server:health": "curl -f http://localhost:4000/health || echo 'Backend unhealthy'",
    "all:health": "npm run health && npm run server:health"
  }
}
```

### Database Scripts
```json
{
  "scripts": {
    "db:migrate": "cd server && npm run migrate",
    "db:seed": "cd server && npm run seed",
    "db:reset": "cd server && npm run db:drop && npm run db:create && npm run db:migrate && npm run db:seed"
  }
}
```

## Quick Start Template

Copy this into your root `package.json` and adjust as needed:

```json
{
  "scripts": {
    "dev": "vite --port 3000 > ./logs/frontend.log 2>&1 &",
    "log": "tail -f ./logs/frontend.log",
    "log:last": "tail -n ${LINES:-20} ./logs/frontend.log",
    "log:clear": "rm -f ./logs/frontend.log && echo 'Frontend log cleared'",
    "kill": "(lsof -ti:3000 | xargs kill -9) 2>/dev/null || true",
    "restart": "npm run kill && npm run dev",
    
    "server:dev": "cd server && npm run dev",
    "server:log": "tail -f ./logs/backend.log",
    "server:log:last": "tail -n ${LINES:-20} ./logs/backend.log",
    "server:log:clear": "rm -f ./logs/backend.log && echo 'Backend log cleared'",
    "server:kill": "(lsof -ti:4000 | xargs kill -9) 2>/dev/null || true",
    "server:restart": "npm run server:kill && npm run server:dev",
    
    "all:dev": "mkdir -p logs && concurrently \"npm run dev\" \"npm run server:dev\"",
    "all:log:last": "echo '=== Frontend ===' && npm run log:last && echo '\n=== Backend ===' && npm run server:log:last",
    "all:log:clear": "rm -f ./logs/*.log && echo 'All logs cleared'",
    "all:kill": "npm run kill && npm run server:kill",
    "all:restart": "npm run all:kill && npm run all:dev",
    
    "build": "vite build",
    "server:build": "cd server && npm run build",
    "all:build": "npm run build && npm run server:build",
    
    "all:install": "npm install && cd server && npm install",
    "status": "echo 'Frontend:' && (lsof -i:3000 >/dev/null 2>&1 && echo '✅ Running' || echo '❌ Stopped') && echo 'Backend:' && (lsof -i:4000 >/dev/null 2>&1 && echo '✅ Running' || echo '❌ Stopped')"
  }
}
```

## Conclusion

This convention scales well from simple projects to complex monorepos. The key is consistency - pick the patterns that work for your team and apply them uniformly across all projects.

Remember: The goal is developer happiness. These scripts should make development smoother, not more complex.