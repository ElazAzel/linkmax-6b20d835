/// <reference types="vite/client" />

export type FBQ = {
    (type: string, name?: string, parameters?: Record<string, unknown>): void;
    callMethod?: (...args: unknown[]) => void;
    queue: unknown[][];
    push: FBQ;
    loaded: boolean;
    version: string;
};

export type TTQ = {
    (...args: unknown[]): void;
    methods: string[];
    setAndDefer: (t: any, e: string) => void;
    load: (e: string) => void;
    page: () => void;
    _i: Record<string, unknown[]>;
    _t: Record<string, number>;
    [key: string]: any;
};

export type GTag = (...args: unknown[]) => void;

export type YM = {
    (id: string, methodName: string, options?: Record<string, unknown> | string): void;
    a?: unknown[][];
    l?: number;
};

declare global {
    interface Window {
        fbq?: FBQ;
        _fbq?: FBQ;
        ttq?: TTQ;
        gtag?: GTag;
        dataLayer?: unknown[][];
        ym?: YM;
        yandex_metrika_callbacks2?: Array<() => void>;
        opera?: string;
    }
}
