import { DEFAULT_PRIORITIES } from './terms';
import { workspaceSchema } from './schemas';
import type { WorkspaceState } from '../types';

export const STORAGE_KEY = 'roleworth.workspace.v1';

export function emptyWorkspace(): WorkspaceState {
  return { version: 1, offers: [], activeOfferId: null, priorities: { ...DEFAULT_PRIORITIES } };
}

function browserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export interface LoadResult {
  state: WorkspaceState;
  error: string | null;
}

export function loadWorkspace(storage?: Storage | null): LoadResult {
  const target = storage === undefined ? browserStorage() : storage;
  if (!target) return { state: emptyWorkspace(), error: 'Browser storage is unavailable. This session will work, but changes may not survive a refresh.' };
  let raw: string | null;
  try {
    raw = target.getItem(STORAGE_KEY);
  } catch {
    return { state: emptyWorkspace(), error: 'RoleWorth could not access browser storage. Your changes may not survive a refresh.' };
  }
  if (!raw) return { state: emptyWorkspace(), error: null };
  if (raw.length > 8_000_000) return { state: emptyWorkspace(), error: 'Saved workspace data is too large to read safely. Reset local data or import a validated backup.' };
  try {
    const parsed = workspaceSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return { state: emptyWorkspace(), error: 'Saved workspace data failed validation. Start fresh or import a valid RoleWorth backup.' };
    }
    const state = parsed.data as WorkspaceState;
    if (state.activeOfferId && !state.offers.some((offer) => offer.id === state.activeOfferId)) {
      state.activeOfferId = state.offers[0]?.id ?? null;
    }
    return { state, error: null };
  } catch {
    return { state: emptyWorkspace(), error: 'Saved workspace data is malformed. Start fresh or import a valid RoleWorth backup.' };
  }
}

export function saveWorkspace(state: WorkspaceState, storage?: Storage | null): string | null {
  const target = storage === undefined ? browserStorage() : storage;
  if (!target) return 'Browser storage is unavailable. Export a backup before closing this tab.';
  try {
    target.setItem(STORAGE_KEY, JSON.stringify(state));
    return null;
  } catch {
    return 'This workspace could not be saved locally. Your browser storage may be full or blocked. Export a backup before closing this tab.';
  }
}

export function deleteSavedWorkspace(storage?: Storage | null): string | null {
  const target = storage === undefined ? browserStorage() : storage;
  if (!target) return 'Browser storage is unavailable, so there is no accessible saved workspace to delete.';
  try {
    target.removeItem(STORAGE_KEY);
    return null;
  } catch {
    return 'Saved data could not be deleted. Check your browser storage permissions and try again.';
  }
}
