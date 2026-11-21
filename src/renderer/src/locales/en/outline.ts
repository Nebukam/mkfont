// Outline editor: the floating window that edits a glyph's imported shape in place.
export default {
  // Window title, with the glyph's character or code.
  title: 'Outline: {{glyph}}',
  titleNone: 'Outline editor',
  // Shown when the window fails; it closes.
  failed: 'The outline editor ran into a problem and was closed',
  window: {
    close: 'Close',
    // Keyboard handles of the window: arrow keys move it / resize it.
    move: 'Move the window (arrow keys)',
    resize: 'Resize the window (arrow keys)'
  },
  lock: {
    on: 'Stay on this glyph',
    off: 'Follow the selection again',
    // Spoken after the title while the window stays on its glyph.
    locked: 'locked'
  },
  tools: {
    select: 'Select and move points',
    transform: 'Scale and rotate the selected points (T)',
    smooth: 'Corner or smooth point (Enter)',
    deletePoints: 'Delete the selected points (Delete)',
    selectContour: 'Select the whole contour (C)',
    reverseContour: 'Reverse the contour direction (R)',
    deleteContour: 'Delete the contour',
    snapMetrics: 'Snap to the font metrics',
    snapPoints: 'Snap to other points',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    fit: 'Fit the glyph in the view (F)',
    // Names of the toolbar's groups, for screen readers.
    groupMode: 'Tool',
    groupPoints: 'Points',
    groupContours: 'Contours',
    groupSnap: 'Snapping',
    groupView: 'View'
  },
  position: {
    x: 'X',
    y: 'Y',
    xTip: 'Horizontal position of the selected points, from the glyph origin',
    yTip: 'Height of the selected points above the baseline'
  },
  // The drawing area's name, for screen readers.
  canvas: 'Outline of {{glyph}}',
  // Bottom line of the window.
  status: {
    points: '{{selected, number}} of {{total, number}} points selected',
    hint: 'Double-click the outline to add a point, a point to make it smooth or a corner',
    // The glyph's bounds setting places it by its outline's extent.
    refit: 'This glyph is placed by its outline: moving an outer point shifts the shape when released'
  },
  states: {
    none: 'Select a glyph to edit its outline.',
    missing: '{{glyph}} is not in the font yet.',
    empty: 'This glyph has no outline. Import an SVG, then adjust it here.',
    components: 'This glyph is drawn by its components only. Edit the glyphs it uses.',
    unfit: 'This outline is scaled to nothing. Check the glyph’s scale.'
  },
  // Under the `components` state: a tile for each glyph the glyph is drawn with.
  components: {
    // The tiles' name as a group, for screen readers.
    list: 'Glyphs it uses',
    // A tile: pressing it shows that glyph in the editor.
    edit: 'Edit {{glyph}}',
    missing: 'Edit {{glyph}} (not in the font yet)'
  },
  // History entries.
  history: {
    move: 'Move points of {{glyph}}',
    handle: 'Reshape a curve of {{glyph}}',
    insert: 'Add a point to {{glyph}}',
    delete: 'Delete points of {{glyph}}',
    convert: 'Convert points of {{glyph}}',
    transform: 'Transform points of {{glyph}}',
    reverse: 'Reverse a contour of {{glyph}}',
    deleteContour: 'Delete a contour of {{glyph}}'
  },
  // Toast after the first edit of a glyph linked to an SVG file.
  unlinked: 'Unlinked {{glyph}} from {{fileName}}',
  unlinkedDetail: 'Its outline was edited here: the file no longer replaces it.'
} as const
