// Outline editor: the floating window that edits a glyph's imported shape in place.
import type en from '../en/outline'
import type { Catalog } from '../catalog'

export default {
  // Window title, with the glyph's character or code.
  title: 'Contour : {{glyph}}',
  titleNone: 'Éditeur de contour',
  // Shown when the window fails; it closes.
  failed: 'L’éditeur de contour a rencontré un problème et a été fermé',
  window: {
    close: 'Fermer',
    // Keyboard handles of the window: arrow keys move it / resize it.
    move: 'Déplacer la fenêtre (flèches)',
    resize: 'Redimensionner la fenêtre (flèches)'
  },
  lock: {
    on: 'Rester sur ce glyphe',
    off: 'Suivre à nouveau la sélection',
    // Spoken after the title while the window stays on its glyph.
    locked: 'verrouillé'
  },
  tools: {
    select: 'Sélectionner et déplacer des points',
    transform: 'Redimensionner et faire pivoter les points sélectionnés (T)',
    smooth: 'Point d’angle ou lisse (Entrée)',
    deletePoints: 'Supprimer les points sélectionnés (Suppr)',
    selectContour: 'Sélectionner tout le tracé (C)',
    reverseContour: 'Inverser le sens du tracé (R)',
    deleteContour: 'Supprimer le tracé',
    snapMetrics: 'Aimanter aux métriques de la police',
    snapPoints: 'Aimanter aux autres points',
    zoomIn: 'Zoom avant',
    zoomOut: 'Zoom arrière',
    fit: 'Ajuster le glyphe à la vue (F)',
    // Names of the toolbar's groups, for screen readers.
    groupMode: 'Outil',
    groupPoints: 'Points',
    groupContours: 'Tracés',
    groupSnap: 'Aimantation',
    groupView: 'Vue'
  },
  position: {
    x: 'X',
    y: 'Y',
    xTip: 'Position horizontale des points sélectionnés, depuis l’origine du glyphe',
    yTip: 'Hauteur des points sélectionnés au-dessus de la ligne de base'
  },
  // The drawing area's name, for screen readers.
  canvas: 'Contour de {{glyph}}',
  // Bottom line of the window.
  status: {
    points: '{{selected, number}} points sélectionnés sur {{total, number}}',
    hint: 'Double-cliquez sur le contour pour ajouter un point, sur un point pour le rendre lisse ou anguleux',
    // The glyph's bounds setting places it by its outline's extent.
    refit: 'Ce glyphe est placé d’après son contour : déplacer un point extrême décale la forme au relâchement'
  },
  states: {
    none: 'Sélectionnez un glyphe pour modifier son contour.',
    missing: '{{glyph}} n’est pas encore dans la police.',
    empty: 'Ce glyphe n’a pas de contour. Importez un SVG, puis ajustez-le ici.',
    components: 'Ce glyphe n’est dessiné que par ses composants. Modifiez les glyphes qu’il utilise.',
    unfit: 'Ce contour est réduit à rien. Vérifiez l’échelle du glyphe.'
  },
  // Under the `components` state: a tile for each glyph the glyph is drawn with.
  components: {
    // The tiles' name as a group, for screen readers.
    list: 'Glyphes qu’il utilise',
    // A tile: pressing it shows that glyph in the editor.
    edit: 'Modifier {{glyph}}',
    missing: 'Modifier {{glyph}} (pas encore dans la police)'
  },
  // History entries.
  history: {
    move: 'Déplacer des points de {{glyph}}',
    handle: 'Modifier une courbe de {{glyph}}',
    insert: 'Ajouter un point à {{glyph}}',
    delete: 'Supprimer des points de {{glyph}}',
    convert: 'Convertir des points de {{glyph}}',
    transform: 'Transformer des points de {{glyph}}',
    reverse: 'Inverser un tracé de {{glyph}}',
    deleteContour: 'Supprimer un tracé de {{glyph}}'
  },
  // Toast after the first edit of a glyph linked to an SVG file.
  unlinked: '{{glyph}} délié de {{fileName}}',
  unlinkedDetail: 'Son contour a été modifié ici : le fichier ne le remplace plus.'
} satisfies Catalog<typeof en>
