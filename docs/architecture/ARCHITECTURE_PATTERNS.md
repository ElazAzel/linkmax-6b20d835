# Architecture & Patterns Guide

> **Objective:** Maintain code scalability and readability as the platform grows.

## 1. State Management

We follow a hierarchy of state management to avoid complexity.

### 1.1 Local State (`useState`)
Use for UI-only state that doesn't need to be shared.
- *Example:* Toggle a dropdown, input field value.

### 1.2 URL State (Single Source of Truth)
Store state in the URL whenever possible to make views shareable and bookmarkable.
- *Use for:* Filters, Search queries, Active Tab, Modal open state (optional).
- *Library:* `react-router-dom` (`useSearchParams`).

### 1.3 Server State (`React Query`)
All data from Supabase is "Server State".
- **Do not** copy server data into `useState` unless you need to mutate it locally for a form (and even then, prefer `react-hook-form`).
- Use `useQuery` for reading and `useMutation` for writing.

### 1.4 Global Client State (`Context`)
Use sparingly for truly global app configuration.
- *Examples:* `UserSessionContext`, `ThemeContext`, `ToastContext`.
- **Avoid:** Storing complex data flows in Context (causes re-renders).

---

## 2. Component Patterns

### 2.1 Atomic Design (Modified)
We structure components by feature, not just by "atom/molecule".

- `components/ui/` -> Primitives (Button, Input) - *Do not modify logic here.*
- `components/[feature]/` -> Domain-specific components (e.g., `components/editor/BlockEditor.tsx`).

### 2.2 Container vs. Presentational
Although Hooks blur this line, separating logic from view is still valuable.

**Pattern:**
```tsx
// FeatureContainer.tsx (Logic)
export function FeatureContainer() {
  const { data, isLoading } = useFeatureData();
  if (isLoading) return <Spinner />;
  return <FeatureView items={data} />;
}

// FeatureView.tsx (UI only)
export function FeatureView({ items }) {
  return <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}
```

### 2.3 Custom Hooks (`use[Feature]`)
Extract complex logic into custom hooks.
- Logic files should be in `src/hooks/`.
- Naming: `use[Action][Resource]`, e.g., `useSavePage`, `useFetchBlocks`.

---

## 3. Service Layer (`src/services/`)

Do not call `supabase.from('table')` directly in components.
Use the Service Layer to encapsulate database logic.

**Why?**
- Consistency in error handling.
- Type safety central point.
- Easier to mock for testing.

**Example:**
```ts
// src/services/pages.ts
export async function getPage(slug: string) {
  const { data, error } = await supabase.from('pages').select('*').eq('slug', slug);
  if (error) throw new Error(error.message);
  return data;
}
```

---

## 4. Error Handling

### 4.1 Boundary
Use `ErrorBoundary` at the route level to catch unexpected crashes.

### 4.2 User Feedback
- **Toast (`sonner`)**: For transient success/error messages ("Saved successfully").
- **Alert/Banner**: For persistent errors ("Payment failed").
- **Form Error**: Inline validation messages via `react-hook-form`.
