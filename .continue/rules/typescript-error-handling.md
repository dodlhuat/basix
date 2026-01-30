---
globs: "**/*.ts"
alwaysApply: true
---

Use consistent error handling in TypeScript components:

1. **Required elements**: Throw an Error (no console.error before throwing)
   ```typescript
   if (!element) {
       throw new Error(`ComponentName: Element not found for selector "${selector}"`);
   }
   ```

2. **Error message format**: `ComponentName: Description of error`
   - Include the component/class name as prefix
   - Include the selector or identifier that failed
   - Use backticks for variable interpolation

3. **Optional/enhancement elements**: Use console.warn and continue gracefully
   ```typescript
   if (!optionalElement) {
       console.warn('ComponentName: Optional feature unavailable');
       return;
   }
   ```

4. **Do NOT**:
   - Use `console.error()` followed by `throw new Error()` (redundant)
   - Create dummy elements as fallback for required elements
   - Silently return without any indication of failure for required elements

5. **Runtime validation errors**: Use console.warn for non-critical issues
   ```typescript
   if (index < 0 || index >= items.length) {
       console.warn(`ComponentName: Invalid index ${index}`);
       return;
   }
   ```