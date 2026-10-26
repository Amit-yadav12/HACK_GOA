import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../app/App';
import { DEMO_OFFER_TEXT } from '../lib/demo';
import { appendOfferToWorkspace, createOfferRecord } from '../lib/offer';
import { STORAGE_KEY } from '../lib/storage';
import { DEMO_PRIORITIES } from '../lib/terms';

beforeEach(() => {
  cleanup();
  window.localStorage.clear();
  Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
  Object.defineProperty(window, 'confirm', { value: vi.fn(() => true), writable: true });
});

function openDemo() {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Try the synthetic demo' }));
  expect(screen.getByRole('heading', { name: 'A decision you can explain.' })).toBeInTheDocument();
}

function workspaceNav() {
  return within(screen.getByRole('navigation', { name: 'Promise to proof steps' }));
}

describe('RoleWorth user journey', () => {
  it('validates pasted text before creating a ledger', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Don’t just read the offer/ })).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Build my evidence ledger' });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Offer text'), { target: { value: 'Too short' } });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Offer text'), { target: { value: 'Organisation: Example Studio\nRole: Design Intern\nDuration: 8 weeks\nStipend: Unknown' } });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(screen.getByRole('heading', { name: 'A decision you can explain.' })).toBeInTheDocument();
  });

  it('recalculates priorities and applies a linked reply with a visible delta', () => {
    openDemo();
    fireEvent.click(screen.getByRole('button', { name: 'Edit personal priorities' }));
    fireEvent.change(screen.getByLabelText('Hours available per week'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update my brief' }));
    expect(screen.getByText('Time exceeds your availability')).toBeInTheDocument();

    fireEvent.click(workspaceNav().getByRole('button', { name: /Clarify/ }));
    fireEvent.click(screen.getByRole('button', { name: /Insert a clearly labelled synthetic reply/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply reply & view delta' }));
    expect(screen.getByRole('heading', { name: 'What changed—and what didn’t.' })).toBeInTheDocument();
    expect(screen.getAllByText('Weekly 30-minute feedback session with the recruiter on Fridays').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Before recruiter reply').length).toBeGreaterThan(0);
    expect(screen.getAllByText('After recruiter reply').length).toBeGreaterThan(0);

    fireEvent.click(workspaceNav().getByRole('button', { name: /Learn/ }));
    const status = screen.getByLabelText(/Status for Map your/);
    fireEvent.change(status, { target: { value: 'completed' } });
    expect(status).toHaveValue('completed');
    expect(screen.getAllByText('Suggested personal goal')).toHaveLength(3);
  });

  it('compares separate synthetic offers without mixing their values', () => {
    openDemo();
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Primary navigation' })).getByRole('button', { name: 'Compare offers' }));
    fireEvent.click(screen.getByRole('button', { name: 'Load synthetic second offer' }));
    expect(screen.getByRole('heading', { name: 'Term-by-term comparison' })).toBeInTheDocument();
    expect(screen.getByText('Product Design Intern')).toBeInTheDocument();
    expect(screen.getByText('UX Research Intern')).toBeInTheDocument();
    expect(screen.getAllByText('Unknown — not established').length).toBeGreaterThan(0);
  });

  it('creates two distinct demo ledgers when comparison starts empty', () => {
    render(<App />);
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Primary navigation' })).getByRole('button', { name: 'Compare offers' }));
    fireEvent.click(screen.getByRole('button', { name: 'Load synthetic second offer' }));
    expect(screen.getByRole('heading', { name: 'Term-by-term comparison' })).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Northstar Studio/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Fieldwork Systems/)).toBeInTheDocument();
  });

  it('keeps a valid active offer when a background addition reaches the 50-offer cap', () => {
    const template = createOfferRecord(DEMO_OFFER_TEXT, DEMO_PRIORITIES, { sourceKind: 'demo', isDemo: true });
    const offers = Array.from({ length: 50 }, (_, index) => ({ ...template, id: `offer-${index}`, name: `Offer ${index}` }));
    const background = { ...template, id: 'background-offer', name: 'Background offer' };
    const next = appendOfferToWorkspace({ version: 1, offers, activeOfferId: 'offer-0', priorities: DEMO_PRIORITIES }, background, false);
    expect(next.offers).toHaveLength(50);
    expect(next.activeOfferId).toBe('offer-1');
    expect(next.offers.some((offer) => offer.id === next.activeOfferId)).toBe(true);
    expect(next.offers.at(-1)?.id).toBe('background-offer');
  });

  it('persists a created ledger and resets all local data on explicit confirmation', () => {
    const first = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Try the synthetic demo' }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('Northstar Studio');
    first.unmount();

    render(<App />);
    expect(screen.getByRole('heading', { name: 'A decision you can explain.' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Data & export' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset entire workspace' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, reset everything' }));
    expect(screen.getByRole('button', { name: 'Try the synthetic demo' })).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
