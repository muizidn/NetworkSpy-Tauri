import { atom } from 'jotai';
import { atomFamily } from 'jotai-family';
import { Viewer, ViewerBlock, ViewerMatcher } from "@src/context/ViewerContext";

// Current Active Viewer being edited
export const activeViewerBuilderAtom = atom<Viewer | null>(null);

// Viewer Builder State (Per Viewer ID)
export const viewerBuilderBlocksAtom = atomFamily((viewerId: string) => atom<ViewerBlock[] | null>(null));
export const viewerBuilderMatchersAtom = atomFamily((viewerId: string) => atom<ViewerMatcher[] | null>(null));
export const viewerBuilderNameAtom = atomFamily((viewerId: string) => atom<string | null>(null));
export const viewerBuilderTestSourceAtom = atomFamily((viewerId: string) => atom<'live' | 'session' | null>(null));
export const viewerBuilderSelectedSessionIdAtom = atomFamily((viewerId: string) => atom<string | null>(null));
export const viewerBuilderSelectedTrafficIdAtom = atomFamily((viewerId: string) => atom<string | null>(null));
export const viewerBuilderFilterAtom = atomFamily((viewerId: string) => atom<string | null>(null));
export const viewerBuilderViewModeAtom = atomFamily((viewerId: string) => atom<'preview' | 'source' | 'json' | null>(null));
export const viewerBuilderAiAssistantVisibleAtom = atomFamily((viewerId: string) => atom<boolean | null>(null));
export const viewerBuilderToolboxVisibleAtom = atomFamily((viewerId: string) => atom<boolean | null>(null));
export const viewerBuilderMaximizedBlockIdAtom = atomFamily((viewerId: string) => atom<string | null>(null));
