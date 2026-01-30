---
globs: "**/*.ts"
alwaysApply: true
---

Always use explicit `public` modifier for public methods and properties in TypeScript classes.

1. **Instance methods** intended for external use:
   ```typescript
   public methodName(): void { }
   ```

2. **Static methods** intended for external use:
   ```typescript
   public static methodName(): void { }
   ```

3. **Public properties** (if not using constructor shorthand):
   ```typescript
   public propertyName: string;
   ```

4. **Private members** should use `private` modifier:
   ```typescript
   private internalMethod(): void { }
   private readonly internalProperty: string;
   ```

Benefits:
- Explicit intent makes code more readable
- Easier to identify the public API at a glance
- Consistent with private/protected modifiers