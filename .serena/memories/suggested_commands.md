# Suggested Development Commands

## Core Development Commands

### Development Server
```bash
npm run dev         # Start Vite development server (default: http://localhost:5173)
```

### Build & Production
```bash
npm run build       # TypeScript check + Vite production build
npm run preview     # Preview production build locally
```

### Code Quality
```bash
npm run lint        # Run ESLint for code quality checks
```

## Git Commands
```bash
git status          # Check current changes
git add .           # Stage all changes
git commit -m "message"  # Commit with message
git push            # Push to remote
git pull            # Pull latest changes
```

## Package Management
```bash
npm install         # Install dependencies
npm install <package>  # Add new dependency
npm install -D <package>  # Add dev dependency
npm update          # Update dependencies
```

## System Commands (macOS/Darwin)
```bash
ls -la              # List files with details
find . -name "*.tsx"  # Find TypeScript React files
grep -r "pattern" src/  # Search in source files
ps aux | grep node  # Check running Node processes
lsof -i :5173       # Check what's using port 5173
```

## TypeScript
```bash
npx tsc --noEmit    # Type check without emitting files
```

## Common Workflow
1. `npm run dev` - Start development
2. Make changes
3. `npm run lint` - Check code quality
4. `npm run build` - Verify build works
5. `git add .` and `git commit -m "message"` - Commit changes