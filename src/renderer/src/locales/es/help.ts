// Shortcuts and About dialogs; display names of keys.
import type en from '../en/help'
import type { Catalog } from '../catalog'

export default {
  // Key names in shortcuts ("Ctrl+Shift+S"), as shown; arrows show as symbols. On macOS
  // the modifiers show as symbols (⌘⇧S) and these names serve the other keys.
  keys: {
    Ctrl: 'Ctrl',
    Shift: 'Mayús',
    Alt: 'Alt',
    Delete: 'Supr',
    Backspace: 'Retroceso',
    Escape: 'Esc',
    Tab: 'Tab',
    Enter: 'Intro',
    // Short form, in context menus.
    Del: 'Supr'
  },
  close: 'Cerrar',
  shortcuts: {
    title: 'Atajos de teclado',
    // Groups after the command shortcuts: keys (right column) and what they do (left).
    extra: {
      grid: {
        title: 'Cuadrícula',
        click: { keys: 'Clic / Ctrl+clic / Mayús+clic', does: 'Seleccionar, alternar, seleccionar intervalo' },
        drag: { keys: 'Arrastrar en un espacio vacío (+Ctrl)', does: 'Seleccionar un rectángulo (añadir a la selección)' },
        arrows: { keys: 'Flechas (+Mayús)', does: 'Mover (ampliar) la selección' },
        cursor: { keys: 'Ctrl+flechas, luego Espacio', does: 'Moverse sin seleccionar, añadir o quitar un glifo' },
        menu: { keys: 'Tecla de menú / Mayús+F10', does: 'Abrir el menú del glifo' },
        create: { keys: 'Doble clic en una casilla vacía', does: 'Crear el glifo' },
        zoom: { keys: 'Ctrl+rueda', does: 'Cambiar el tamaño de las celdas de glifo' },
        drop: { keys: 'Soltar un SVG en una casilla', does: 'Importarlo en ese glifo' }
      },
      slots: {
        title: 'Memorias de selección',
        store: { keys: 'Ctrl+0…9', does: 'Guardar la selección en una memoria' },
        restore: { keys: '0…9', does: 'Restaurar una memoria' },
        append: { keys: 'Mayús+0…9', does: 'Añadir una memoria a la selección' }
      },
      fields: {
        title: 'Campos numéricos',
        scrub: { keys: 'Arrastrar el campo o su etiqueta', does: 'Ajustar el valor arrastrando (Mayús ×10, Alt ×0,1)' },
        step: { keys: '↑ / ↓, rueda con el foco', does: 'Aumentar o reducir el valor' },
        expression: { keys: 'Escribir una expresión', does: 'p. ej. 120*1.5 o 800-25' }
      },
      mouse: {
        title: 'Ratón',
        sideButtons: { keys: 'Botones laterales atrás / adelante', does: 'Atrás / Adelante' }
      },
      outline: {
        title: 'Editor de contorno',
        open: { keys: 'Doble clic en un glifo / Intro', does: 'Editar su contorno' },
        select: { keys: 'Clic / Mayús+clic / arrastrar', does: 'Seleccionar puntos, añadir a la selección, seleccionar un rectángulo' },
        move: { keys: 'Arrastrar / flechas (+Mayús)', does: 'Mover los puntos seleccionados (un eje / de 10 en 10)' },
        handle: { keys: 'Arrastrar un tirador (+Alt)', does: 'Modificar la curva (romper un punto suave)' },
        insert: { keys: 'Doble clic en el contorno', does: 'Añadir un punto' },
        convert: { keys: 'Doble clic en un punto / Intro', does: 'Punto de esquina o suave' },
        remove: { keys: 'Supr', does: 'Eliminar los puntos seleccionados' },
        contour: { keys: 'C / R', does: 'Seleccionar el trazado / invertir su dirección' },
        transform: { keys: 'T', does: 'Escalar y girar la selección' },
        snap: { keys: 'Ctrl al arrastrar', does: 'Sin ajuste' },
        view: { keys: 'Rueda / Espacio+arrastrar / F', does: 'Zoom / desplazar / encajar el glifo' }
      }
    }
  },
  about: {
    title: 'Acerca de MkFont',
    name: 'MkFont {{version}}',
    tagline: 'Editor de fuentes modular de Nebukam',
    description:
      'Crea fuentes a partir de archivos SVG y componentes reutilizables, y expórtalas como fuentes TrueType u OpenType. Los archivos son compatibles con MkFont 1.',
    // "Unicode data 16.0.0. Shortcuts: F1."
    data: 'Datos Unicode {{version}}. Atajos: {{shortcut}}.',
    credits: 'Pares de kerning comunes: kerning-pairs de André Fuchs (licencia MIT).'
  }
} satisfies Catalog<typeof en>
