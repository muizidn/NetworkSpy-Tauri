import { atom } from 'jotai';
import { FilterNode } from "@src/models/Filter";

// Main Traffic List State
export const mainTrafficListFiltersAtom = atom<FilterNode[]>([]);
