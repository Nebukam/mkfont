// Shortcuts and About dialogs; display names of keys.
export default {
  // Key names in shortcuts ("Ctrl+Shift+S"), as shown; arrows show as symbols. On macOS
  // the modifiers show as symbols (⌘⇧S) and these names serve the other keys.
  keys: {
    Ctrl: 'Ctrl',
    Shift: 'Shift',
    Alt: 'Alt',
    Delete: 'Delete',
    Backspace: 'Backspace',
    Escape: 'Escape',
    Tab: 'Tab',
    Enter: 'Enter',
    // Short form, in context menus.
    Del: 'Del'
  },
  close: 'Close',
  shortcuts: {
    title: 'Keyboard shortcuts',
    // Groups after the command shortcuts: keys (right column) and what they do (left).
    extra: {
      grid: {
        title: 'Grid',
        click: { keys: 'Click / Ctrl+click / Shift+click', does: 'Select, toggle, select range' },
        drag: { keys: 'Drag on empty space (+Ctrl)', does: 'Select a rectangle (add to selection)' },
        arrows: { keys: 'Arrow keys (+Shift)', does: 'Move (extend) the selection' },
        cursor: { keys: 'Ctrl+arrow keys, then Space', does: 'Move without selecting, add or remove a glyph' },
        menu: { keys: 'Menu key / Shift+F10', does: 'Open the glyph menu' },
        create: { keys: 'Double-click an empty slot', does: 'Create the glyph' },
        zoom: { keys: 'Ctrl+wheel', does: 'Resize glyph cells' },
        drop: { keys: 'Drop SVG on a slot', does: 'Import it into that glyph' }
      },
      slots: {
        title: 'Selection slots',
        store: { keys: 'Ctrl+0…9', does: 'Store the selection in a slot' },
        restore: { keys: '0…9', does: 'Restore a slot' },
        append: { keys: 'Shift+0…9', does: 'Add a slot to the selection' }
      },
      fields: {
        title: 'Number fields',
        scrub: { keys: 'Drag the field or its label', does: 'Scrub the value (Shift ×10, Alt ×0.1)' },
        step: { keys: '↑ / ↓, wheel while focused', does: 'Step the value' },
        expression: { keys: 'Type an expression', does: 'e.g. 120*1.5 or 800-25' }
      },
      mouse: {
        title: 'Mouse',
        sideButtons: { keys: 'Back / forward side buttons', does: 'Back / Forward' }
      },
      outline: {
        title: 'Outline editor',
        open: { keys: 'Double-click a glyph / Enter', does: 'Edit its outline' },
        select: { keys: 'Click / Shift+click / drag', does: 'Select points, add to the selection, select a rectangle' },
        move: { keys: 'Drag / arrow keys (+Shift)', does: 'Move the selected points (one axis / by 10)' },
        handle: { keys: 'Drag a handle (+Alt)', does: 'Reshape the curve (break a smooth point)' },
        insert: { keys: 'Double-click the outline', does: 'Add a point' },
        convert: { keys: 'Double-click a point / Enter', does: 'Corner or smooth point' },
        remove: { keys: 'Delete', does: 'Delete the selected points' },
        contour: { keys: 'C / R', does: 'Select the contour / reverse its direction' },
        transform: { keys: 'T', does: 'Scale and rotate the selection' },
        snap: { keys: 'Ctrl while dragging', does: 'No snapping' },
        view: { keys: 'Wheel / Space+drag / F', does: 'Zoom / pan / fit the glyph' }
      }
    }
  },
  about: {
    title: 'About MkFont',
    name: 'MkFont {{version}}',
    tagline: 'Modular font editor by Nebukam',
    description:
      'Build fonts from SVG files and reusable components, then export TrueType or OpenType fonts. Files are compatible with MkFont 1.',
    // "Unicode data 16.0.0. Shortcuts: F1."
    data: 'Unicode data {{version}}. Shortcuts: {{shortcut}}.',
    credits: 'Common kerning pairs: kerning-pairs by André Fuchs (MIT license).'
  }
} as const
