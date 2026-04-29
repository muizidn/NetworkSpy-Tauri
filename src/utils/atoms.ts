import { atom } from 'jotai';
import { atomFamily } from 'jotai-family';
import { FilterNode } from "@src/models/Filter";

// Current Active Tab
export const activeTabIdAtom = atom<string>("");

// Main Traffic List Filters (Per Tab)
export const mainTrafficListFiltersAtom = atomFamily((tabId: string) => atom<FilterNode[]>([]));

// Traffic List Selections (Per Tab)
export type TrafficListSelection = {
  firstSelected: any | null;
  others: any[] | null;
};
export const mainTrafficListSelectionsAtom = atomFamily((tabId: string) => atom<TrafficListSelection>({
    firstSelected: null,
    others: null,
}));

// Main Traffic List Search (Per Tab)
export const mainTrafficListSearchAtom = atomFamily((tabId: string) => atom<string>(""));
