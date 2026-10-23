import { createContext, useContext } from 'react';

type RenderMode = 'editor' | 'public-preview' | 'live';

const RenderContext = createContext<RenderMode>('live');

export const RenderContextProvider = RenderContext.Provider;

export function useRenderContext(): RenderMode {
  return useContext(RenderContext);
}
