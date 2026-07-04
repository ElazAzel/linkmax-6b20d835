## 2025-05-22 - [Rendering pipeline optimization]
**Learning:** React components in tight rendering loops (like GridBlocksRenderer) can cause cascading re-renders across the entire list if not properly memoized. Memoizing the individual list item (GridBlockItem) and the renderer (BlockRenderer) is critical for performance as the number of blocks increases.
**Action:** Always wrap list items and generic renderers in React.memo and ensure their props (including callbacks and list objects) are memoized using useMemo and useCallback.
