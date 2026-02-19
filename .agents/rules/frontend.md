# Frontend Rules (React)

1.  **Component Structure**:
    -   Use `src/components/` for shared components.
    -   Use `src/pages/` for page-specific components.
    -   Use `src/hooks/` for custom hooks.
2.  **State Management**:
    -   Prefer `useState` for local state.
    -   Use `React Query` for server state.
    -   Use Context for small global state needs (Auth, Theme).
3.  **Styling**:
    -   Use **Shadcn UI** components from `@/components/ui/`.
    -   Use **Tailwind CSS** for layout and custom styling.
    -   Avoid custom CSS files unless absolutely necessary.
4.  **Performance**:
    -   Memoize heavy computations with `useMemo`.
    -   Memoize callbacks passed to children with `useCallback`.
    -   Lazy load route components with `React.lazy`.
5.  **Testing**:
    -   Use `vitest` + `react-testing-library` for unit tests.
    -   Test user interactions, not implementation details.
6.  **Design Rules**:
    -   **Divider & Social Blocks**: Must NOT have borders/frames. Ensure they are clean and borderless.
