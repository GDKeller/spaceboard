# Task Completion Checklist

When completing any development task, follow these steps:

## 1. Code Quality Checks
```bash
npm run lint        # Run ESLint - fix any errors or warnings
npm run build       # Ensure build succeeds with no TypeScript errors
```

## 2. Testing
- Currently no test framework configured
- Manual testing in browser via `npm run dev`
- Check browser console for any errors or warnings

## 3. Git Workflow
Before committing:
1. Review changes: `git status` and `git diff`
2. Stage appropriate files: `git add <files>` or `git add .`
3. Write clear commit message: `git commit -m "feat: description"` or `git commit -m "fix: description"`

## 4. Documentation
- Update README.md if functionality changes
- Add JSDoc comments for complex functions if needed
- Ensure component props are properly typed

## 5. Final Verification
- [ ] No ESLint errors or warnings
- [ ] Build completes successfully
- [ ] No console errors in browser
- [ ] Feature works as expected
- [ ] Code follows existing patterns
- [ ] Types are properly defined
- [ ] Imports are clean and organized

## Common Issues to Check
- Unused imports or variables (TypeScript will error)
- Missing dependency arrays in useEffect
- Proper error handling for API calls
- Responsive design considerations
- Accessibility basics (alt text, semantic HTML)