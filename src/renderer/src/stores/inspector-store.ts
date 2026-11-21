import { create } from 'zustand'
import type { LayerEdit } from '../core/layer-frame'

/** A component of a glyph: the glyph's key and the component's place in its list. */
export interface LayerRef {
  key: string
  index: number
}

/** Inspector-local UI state (focused and selected component, a drag in the glyph view). */
export const useInspectorStore = create<{
  /** The component under the pointer or holding keyboard focus: highlighted in the glyph view. */
  layerFocus: LayerRef | null
  setLayerFocus: (f: LayerRef | null) => void
  /** The component selected in the glyph view: it shows its frame there. */
  layerSelection: LayerRef | null
  selectLayer: (f: LayerRef | null) => void
  /** Values a drag of the selected component's frame would set: shown, not yet in the document. */
  layerDraft: (LayerRef & { values: LayerEdit }) | null
  setLayerDraft: (d: (LayerRef & { values: LayerEdit }) | null) => void
  /** A pair whose value field takes focus once the inspector shows it (a pair just added). */
  pairFocus: string | null
  focusPair: (key: string | null) => void
}>()((set) => ({
  layerFocus: null,
  setLayerFocus: (layerFocus) => set({ layerFocus }),
  layerSelection: null,
  selectLayer: (layerSelection) => set({ layerSelection, layerDraft: null }),
  layerDraft: null,
  setLayerDraft: (layerDraft) => set({ layerDraft }),
  pairFocus: null,
  focusPair: (pairFocus) => set({ pairFocus })
}))
