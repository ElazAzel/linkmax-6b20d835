/**
 * Page facts block editors need for writing suggestions (niche, city, name).
 * Provided by EditorScreen so an editor never mounts a second useDashboard()
 * (which refetched the page and ran the auth guard on every block edit).
 */
import { createContext, useContext } from 'react';

export interface EditorPageInfo {
  niche: string;
  city: string;
  profileName: string;
}

const EditorPageContext = createContext<EditorPageInfo>({ niche: 'general', city: '', profileName: '' });

export const EditorPageProvider = EditorPageContext.Provider;

export function useEditorPageInfo(): EditorPageInfo {
  return useContext(EditorPageContext);
}
