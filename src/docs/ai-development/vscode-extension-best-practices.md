# Best Practices for Developing a VS Code Extension

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Naming Conventions](#naming-conventions)
4. [Code Quality](#code-quality)
5. [Asynchronous Operations](#asynchronous-operations)
6. [Extension Manifest (package.json)](#extension-manifest-packagejson)
7. [Documentation](#documentation)
8. [Testing](#testing)
9. [Publishing](#publishing)
10. [Instructions for Copilot](#instructions-for-copilot)
11. [Conclusion](#conclusion)

## Introduction
This guide provides best practices for developing a Visual Studio Code extension, ensuring your project is maintainable, readable, and user-friendly.

## Project Structure
- Organize code into logical folders: `src/`, `providers/`, `utils/`, `views/`, `docs/`.
- Place extension entry point in `src/extension.ts`.
- Keep documentation in a dedicated `docs/` folder.

**Example structure:**
```
my-extension/
├── src/
│   ├── extension.ts
│   ├── providers/
│   │   └── my-tree-provider.ts
│   ├── utils/
│   │   └── helper-functions.ts
│   └── views/
│       └── webview-panel.ts
├── docs/
│   └── README.md
├── package.json
└── tsconfig.json
```

## Naming Conventions
- Use **kebab-case** for file names (e.g., `my-feature.ts`).
- Use **PascalCase** for class names (e.g., `MyFeatureProvider`).
- Use **camelCase** for variables and functions.
- Avoid spaces and special characters in file names.

## Code Quality
- Use TypeScript for type safety and maintainability.
- Enable strict mode in `tsconfig.json`.
- Use linters (e.g., ESLint) and formatters (e.g., Prettier).
- Write modular, reusable code.
- Add meaningful comments and JSDoc where appropriate.

**Before:**
```typescript
function getUser(id) {
  // fetches a user
  return fetch(`/api/users/${id}`).then(res => res.json());
}
```

**After:**
```typescript
/**
 * Fetches a user from the API.
 * @param id The ID of the user to fetch.
 * @returns A promise that resolves to the user object.
 */
async function getUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json() as Promise<User>;
}
```

## Asynchronous Operations
- Use `async/await` for all asynchronous operations to keep code readable and avoid callback hell.
- Always wrap `await` calls in `try...catch` blocks to handle potential errors gracefully.
- Avoid running long-running synchronous tasks in the activation function, as this can block the extension host and lead to a poor user experience.

**Example:**
```typescript
// Good: Properly handled async operation
export async function activate(context: vscode.ExtensionContext) {
  try {
    const data = await loadConfiguration();
    initializeExtension(data);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to activate extension: ${error.message}`);
  }
}
```

## Extension Manifest (package.json)
- Fill out all required fields: `name`, `displayName`, `description`, `version`, `publisher`, `license`.
- Specify activation events and contributions clearly.
- Use the `icon` field for a custom extension icon.
- Keep scripts and dependencies up to date.

**Example `contributes` block:**
```json
"contributes": {
  "commands": [{
    "command": "myExtension.sayHello",
    "title": "Say Hello"
  }],
  "views": {
    "explorer": [{
      "id": "myExtension.view",
      "name": "My View"
    }]
  }
}
```

## Documentation
- Include a clear `README.md` with usage, features, and installation instructions.
- Document all commands, settings, and contributions.
- Use a table of contents for long docs.
- Add code examples and screenshots where helpful.

## Testing
- Write unit and integration tests for core logic.
- Use the VS Code Extension Test Runner for automated testing.
- Test your extension on all supported platforms (Windows, macOS, Linux).

**Example test:**
```typescript
import * as assert from 'assert';
import { getUser } from '../src/utils/helper-functions';

suite('Extension Test Suite', () => {
  test('Should fetch user correctly', async () => {
    const user = await getUser('123');
    assert.strictEqual(user.id, '123');
  });
});
```

## Publishing
- Use `.gitignore` and `.vscodeignore` to exclude unnecessary files from your repo and VSIX package.
- Register as a publisher on the VS Code Marketplace.
- Use `vsce` to package and publish your extension.
- Follow semantic versioning for releases.

## Instructions for Copilot
1. **Follow the established project structure:** When creating a new file, place it in the correct directory (e.g., `providers/`, `utils/`).
2. **Adhere to naming conventions:** Use kebab-case for files and PascalCase for classes.
3. **Generate typed, asynchronous code:** Use TypeScript types and `async/await` for all I/O operations.
4. **Scaffold new components with examples:** When asked to create a new provider or command, include a basic implementation and register it in `extension.ts`.
5. **Document code with JSDoc:** Add JSDoc comments to all new functions and classes, explaining their purpose, parameters, and return values.
6. **Reference `package.json` for contributions:** When adding a command or view, ensure it is declared in the `contributes` section of `package.json`.
7. **Use VS Code APIs correctly:** Prefer stable APIs and use them as intended (e.g., `vscode.window.showInformationMessage` for notifications).
8. **Format code with triple backticks:** Always specify the language (e.g., ```typescript, ```json).
9. **Use clear, descriptive variable names:** Avoid abbreviations and use meaningful names.
10. **Handle errors gracefully:** Always include error handling in async operations and user-facing features.

## Conclusion
Following these best practices will help you create high-quality, maintainable, and user-friendly VS Code extensions that are easy for others to use and contribute to.
