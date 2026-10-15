/** Build-time flag stays identical during SSR and hydration. Draft storage is independent. */
export const LINKMAX_UI_V2 = import.meta.env.VITE_LINKMAX_UI_V2 !== 'false';
