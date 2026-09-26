import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AccentKey } from '../theme';

const STORAGE_KEY = '@gbena-grant/store-v1';
const MAX_RECENT = 16;
const MAX_SEARCHES = 8;

export interface StoreState {
  watchlist: string[];
  liked: string[];
  watched: string[];
  recent: string[];
  searches: string[];
  downloads: Record<string, number>;
  accent: AccentKey;
  notifications: boolean;
  autoplayPreviews: boolean;
  matureContent: boolean;
}

const DEFAULT_STATE: StoreState = {
  watchlist: ['dune-two', 'oppenheimer', 'jagun-jagun'],
  liked: ['parasite', 'inception'],
  watched: ['shawshank', 'matrix', 'whiplash'],
  recent: [],
  searches: [],
  downloads: {},
  accent: 'gold',
  notifications: true,
  autoplayPreviews: true,
  matureContent: false,
};

export type ListKey = 'watchlist' | 'liked' | 'watched';

interface StoreValue extends StoreState {
  hydrated: boolean;
  inList: (key: ListKey, id: string) => boolean;
  toggleList: (key: ListKey, id: string) => boolean;
  markViewed: (id: string) => void;
  pushSearch: (term: string) => void;
  removeSearch: (term: string) => void;
  clearSearches: () => void;
  startDownload: (id: string) => void;
  cancelDownload: (id: string) => void;
  downloadProgress: (id: string) => number | undefined;
  setAccent: (accent: AccentKey) => void;
  setFlag: (flag: 'notifications' | 'autoplayPreviews' | 'matureContent', value: boolean) => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function sanitize(raw: unknown): StoreState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STATE };
  const value = raw as Partial<StoreState>;
  const strArray = (v: unknown, fallback: string[]): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : fallback;
  return {
    watchlist: strArray(value.watchlist, DEFAULT_STATE.watchlist),
    liked: strArray(value.liked, DEFAULT_STATE.liked),
    watched: strArray(value.watched, DEFAULT_STATE.watched),
    recent: strArray(value.recent, []),
    searches: strArray(value.searches, []),
    downloads:
      value.downloads && typeof value.downloads === 'object'
        ? (value.downloads as Record<string, number>)
        : {},
    accent: (value.accent as AccentKey) ?? 'gold',
    notifications: value.notifications ?? true,
    autoplayPreviews: value.autoplayPreviews ?? true,
    matureContent: value.matureContent ?? false,
  };
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  stateRef.current = state;

  // ---- hydrate ----
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!alive) return;
        if (raw) setState(sanitize(JSON.parse(raw)));
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setHydrated(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // ---- persist (debounced) ----
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current)).catch(() => undefined);
    }, 220);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, hydrated]);

  // ---- cleanup download timers ----
  useEffect(() => {
    const registry = timers.current;
    return () => {
      Object.values(registry).forEach((t) => clearInterval(t));
    };
  }, []);

  const patch = useCallback((next: Partial<StoreState>) => {
    setState((prev) => ({ ...prev, ...next }));
  }, []);

  const inList = useCallback((key: ListKey, id: string) => stateRef.current[key].includes(id), []);

  const toggleList = useCallback((key: ListKey, id: string): boolean => {
    const current = stateRef.current[key];
    const has = current.includes(id);
    const next = has ? current.filter((x) => x !== id) : [id, ...current];
    setState((prev) => ({ ...prev, [key]: next }));
    return !has;
  }, []);

  const markViewed = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      recent: [id, ...prev.recent.filter((x) => x !== id)].slice(0, MAX_RECENT),
    }));
  }, []);

  const pushSearch = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setState((prev) => ({
      ...prev,
      searches: [clean, ...prev.searches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(
        0,
        MAX_SEARCHES,
      ),
    }));
  }, []);

  const removeSearch = useCallback((term: string) => {
    setState((prev) => ({ ...prev, searches: prev.searches.filter((s) => s !== term) }));
  }, []);

  const clearSearches = useCallback(() => {
    setState((prev) => ({ ...prev, searches: [] }));
  }, []);

  const startDownload = useCallback((id: string) => {
    if (timers.current[id]) return;
    const existing = stateRef.current.downloads[id] ?? 0;
    if (existing >= 100) return;

    setState((prev) => ({ ...prev, downloads: { ...prev.downloads, [id]: 0 } }));

    timers.current[id] = setInterval(() => {
      const cur = stateRef.current.downloads[id] ?? 0;
      const next = cur + 5 + Math.random() * 11;
      if (next >= 100) {
        clearInterval(timers.current[id]);
        delete timers.current[id];
        setState((prev) => ({ ...prev, downloads: { ...prev.downloads, [id]: 100 } }));
      } else {
        setState((prev) => ({ ...prev, downloads: { ...prev.downloads, [id]: next } }));
      }
    }, 380);
  }, []);

  const cancelDownload = useCallback((id: string) => {
    if (timers.current[id]) {
      clearInterval(timers.current[id]);
      delete timers.current[id];
    }
    setState((prev) => {
      const next = { ...prev.downloads };
      delete next[id];
      return { ...prev, downloads: next };
    });
  }, []);

  const downloadProgress = useCallback((id: string): number | undefined => {
    const value = stateRef.current.downloads[id];
    return value === undefined ? undefined : value;
  }, []);

  const setAccent = useCallback(
    (accent: AccentKey) => patch({ accent }),
    [patch],
  );

  const setFlag = useCallback(
    (flag: 'notifications' | 'autoplayPreviews' | 'matureContent', value: boolean) =>
      patch({ [flag]: value } as Partial<StoreState>),
    [patch],
  );

  const resetAll = useCallback(() => {
    Object.values(timers.current).forEach((t) => clearInterval(t));
    timers.current = {};
    setState({
      ...DEFAULT_STATE,
      watchlist: [],
      liked: [],
      watched: [],
      accent: stateRef.current.accent,
    });
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      hydrated,
      inList,
      toggleList,
      markViewed,
      pushSearch,
      removeSearch,
      clearSearches,
      startDownload,
      cancelDownload,
      downloadProgress,
      setAccent,
      setFlag,
      resetAll,
    }),
    [
      state,
      hydrated,
      inList,
      toggleList,
      markViewed,
      pushSearch,
      removeSearch,
      clearSearches,
      startDownload,
      cancelDownload,
      downloadProgress,
      setAccent,
      setFlag,
      resetAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useAppStore must be used inside <AppStoreProvider>');
  return ctx;
}
