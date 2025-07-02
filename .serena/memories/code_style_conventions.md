# Code Style and Conventions

## TypeScript Configuration
- **Strict Mode**: Enabled (`strict: true`)
- **Target**: ES2020
- **Module**: ESNext with bundler module resolution
- **JSX**: react-jsx transform
- **Unused Code**: Errors on unused locals and parameters
- **Type Checking**: No unchecked side effect imports

## Code Style
### React Components
- **Function Components**: Using arrow functions with `React.FC` type
- **Naming**: PascalCase for components (e.g., `AstronautGrid`, `Astronaut`)
- **File Organization**: One component per file, matching component name
- **Props**: Defined as interfaces (e.g., `AstronautProps`, `AstronautData`)

### Example Pattern:
```typescript
interface ComponentProps {
  prop1: string;
  prop2: number;
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  return (
    <div>
      {/* Component content */}
    </div>
  );
};

export default Component;
```

### State Management
- Using React hooks (`useState`, `useEffect`)
- Type annotations for state variables

### Error Handling
- Using `.catch()` for promise rejections
- Console.error for logging errors

## ESLint Rules
- React Hooks rules enforced
- React Refresh rules for HMR
- TypeScript recommended rules
- JavaScript recommended rules

## Import Style
- ES6 imports
- React imports at top
- Component imports next
- Type imports where needed

## CSS
- Currently using plain CSS files
- Component-specific styles in separate CSS files
- Global styles in index.css

## Best Practices
- No direct manipulation of DOM
- Proper dependency arrays in useEffect
- Type safety throughout
- Clean, readable code structure