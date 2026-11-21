// Outline editor: the floating window that edits a glyph's imported shape in place.
import type en from '../en/outline'
import type { Catalog } from '../catalog'

export default {
  // Window title, with the glyph's character or code.
  title: 'Contorno: {{glyph}}',
  titleNone: 'Editor de contorno',
  // Shown when the window fails; it closes.
  failed: 'El editor de contorno tuvo un problema y se cerró',
  window: {
    close: 'Cerrar',
    // Keyboard handles of the window: arrow keys move it / resize it.
    move: 'Mover la ventana (flechas)',
    resize: 'Cambiar el tamaño de la ventana (flechas)'
  },
  lock: {
    on: 'Quedarse en este glifo',
    off: 'Volver a seguir la selección',
    // Spoken after the title while the window stays on its glyph.
    locked: 'bloqueado'
  },
  tools: {
    select: 'Seleccionar y mover puntos',
    transform: 'Escalar y girar los puntos seleccionados (T)',
    smooth: 'Punto de esquina o suave (Intro)',
    deletePoints: 'Eliminar los puntos seleccionados (Supr)',
    selectContour: 'Seleccionar todo el trazado (C)',
    reverseContour: 'Invertir la dirección del trazado (R)',
    deleteContour: 'Eliminar el trazado',
    snapMetrics: 'Ajustar a las métricas de la fuente',
    snapPoints: 'Ajustar a otros puntos',
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    fit: 'Encajar el glifo en la vista (F)',
    // Names of the toolbar's groups, for screen readers.
    groupMode: 'Herramienta',
    groupPoints: 'Puntos',
    groupContours: 'Trazados',
    groupSnap: 'Ajuste',
    groupView: 'Vista'
  },
  position: {
    x: 'X',
    y: 'Y',
    xTip: 'Posición horizontal de los puntos seleccionados, desde el origen del glifo',
    yTip: 'Altura de los puntos seleccionados sobre la línea de base'
  },
  // The drawing area's name, for screen readers.
  canvas: 'Contorno de {{glyph}}',
  // Bottom line of the window.
  status: {
    points: '{{selected, number}} de {{total, number}} puntos seleccionados',
    hint: 'Doble clic en el contorno para añadir un punto, en un punto para hacerlo suave o de esquina',
    // The glyph's bounds setting places it by its outline's extent.
    refit: 'Este glifo se coloca según su contorno: mover un punto extremo desplaza la forma al soltar'
  },
  states: {
    none: 'Selecciona un glifo para editar su contorno.',
    missing: '{{glyph}} aún no está en la fuente.',
    empty: 'Este glifo no tiene contorno. Importa un SVG y ajústalo aquí.',
    components: 'Este glifo solo se dibuja con sus componentes. Edita los glifos que usa.',
    unfit: 'Este contorno está escalado a nada. Revisa la escala del glifo.'
  },
  // Under the `components` state: a tile for each glyph the glyph is drawn with.
  components: {
    // The tiles' name as a group, for screen readers.
    list: 'Glifos que usa',
    // A tile: pressing it shows that glyph in the editor.
    edit: 'Editar {{glyph}}',
    missing: 'Editar {{glyph}} (aún no está en la fuente)'
  },
  // History entries.
  history: {
    move: 'Mover puntos de {{glyph}}',
    handle: 'Modificar una curva de {{glyph}}',
    insert: 'Añadir un punto a {{glyph}}',
    delete: 'Eliminar puntos de {{glyph}}',
    convert: 'Convertir puntos de {{glyph}}',
    transform: 'Transformar puntos de {{glyph}}',
    reverse: 'Invertir un trazado de {{glyph}}',
    deleteContour: 'Eliminar un trazado de {{glyph}}'
  },
  // Toast after the first edit of a glyph linked to an SVG file.
  unlinked: '{{glyph}} desvinculado de {{fileName}}',
  unlinkedDetail: 'Su contorno se editó aquí: el archivo ya no lo reemplaza.'
} satisfies Catalog<typeof en>
