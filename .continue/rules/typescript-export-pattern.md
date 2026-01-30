---
globs: "**/*.ts"
alwaysApply: true
---

Use named exports at the end of TypeScript files. Do not use `export default` or inline `export class`/`export interface` declarations.

Standard pattern:
1. Define classes, interfaces, and types WITHOUT the export keyword inline
2. Add all exports at the END of the file
3. Use `export { ClassName };` for classes and values
4. Use `export type { TypeName, InterfaceName };` for types and interfaces

Example:
```typescript
interface ComponentOptions {
    option1?: string;
}

class Component {
    // implementation
}

// Exports at end of file
export { Component };
export type { ComponentOptions };
```

Do NOT do:
- `export default Component`
- `export class Component { }`
- `export interface Options { }`