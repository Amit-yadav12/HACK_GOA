import { describe, expect, it } from 'vitest';
import { emptyWorkspace, loadWorkspace, saveWorkspace, deleteSavedWorkspace, STORAGE_KEY } from '../lib/storage';
import { DEMO_OFFER_TEXT } from '../lib/demo';
import { createOfferRecord } from '../lib/offer';
import { DEMO_PRIORITIES } from '../lib/terms';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return Array.from(this.values.keys())[index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('local persistence', () => {
  it('saves, reloads and deletes a workspace', () => {
    const storage = new MemoryStorage();
    const state = { ...emptyWorkspace(), priorities: { ...emptyWorkspace().priorities, targetRole: 'Research' } };
    expect(saveWorkspace(state, storage)).toBeNull();
    expect(loadWorkspace(storage).state.priorities.targetRole).toBe('Research');
    expect(deleteSavedWorkspace(storage)).toBeNull();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('survives malformed data without putting it into application state', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{broken');
    const result = loadWorkspace(storage);
    expect(result.state.offers).toEqual([]);
    expect(result.error).toMatch(/malformed/i);
  });

  it('rejects structurally invalid saved data', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, offers: [{ id: 'bad' }] }));
    const result = loadWorkspace(storage);
    expect(result.state.offers).toEqual([]);
    expect(result.error).toMatch(/validation/i);
  });

  it('rejects duplicate offer IDs in persisted workspaces', () => {
    const storage = new MemoryStorage();
    const first = createOfferRecord(DEMO_OFFER_TEXT, DEMO_PRIORITIES, { sourceKind: 'demo', isDemo: true });
    const duplicate = { ...first, name: 'Duplicate identity' };
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...emptyWorkspace(), offers: [first, duplicate], activeOfferId: first.id }));
    const result = loadWorkspace(storage);
    expect(result.state.offers).toEqual([]);
    expect(result.error).toMatch(/validation/i);
  });

  it('reports quota or permission failures rather than claiming a save', () => {
    const storage = new MemoryStorage();
    storage.setItem = () => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); };
    expect(saveWorkspace(emptyWorkspace(), storage)).toMatch(/could not be saved/i);
    storage.removeItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
    expect(deleteSavedWorkspace(storage)).toMatch(/could not be deleted/i);
  });
});
