// Shortcuts and About dialogs; display names of keys.
import type en from '../en/help'
import type { Catalog } from '../catalog'

export default {
  // Key names in shortcuts ("Ctrl+Shift+S"), as shown; arrows show as symbols. On macOS
  // the modifiers show as symbols (⌘⇧S) and these names serve the other keys.
  keys: {
    Ctrl: 'Ctrl',
    Shift: 'Maj',
    Alt: 'Alt',
    Delete: 'Suppr',
    Backspace: 'Retour arrière',
    Escape: 'Échap',
    Tab: 'Tab',
    Enter: 'Entrée',
    // Short form, in context menus.
    Del: 'Suppr'
  },
  close: 'Fermer',
  shortcuts: {
    title: 'Raccourcis clavier',
    // Groups after the command shortcuts: keys (right column) and what they do (left).
    extra: {
      grid: {
        title: 'Grille',
        click: { keys: 'Clic / Ctrl+clic / Maj+clic', does: 'Sélectionner, basculer, sélectionner une plage' },
        drag: { keys: 'Glisser sur un espace vide (+Ctrl)', does: 'Sélectionner un rectangle (ajouter à la sélection)' },
        arrows: { keys: 'Flèches (+Maj)', does: 'Déplacer (étendre) la sélection' },
        cursor: { keys: 'Ctrl+flèches, puis Espace', does: 'Se déplacer sans sélectionner, ajouter ou retirer un glyphe' },
        menu: { keys: 'Touche Menu / Maj+F10', does: 'Ouvrir le menu du glyphe' },
        create: { keys: 'Double-clic sur une case vide', does: 'Créer le glyphe' },
        zoom: { keys: 'Ctrl+molette', does: 'Redimensionner les cases de glyphe' },
        drop: { keys: 'Déposer un SVG sur une case', does: 'L’importer dans ce glyphe' }
      },
      slots: {
        title: 'Mémoires de sélection',
        store: { keys: 'Ctrl+0…9', does: 'Enregistrer la sélection dans une mémoire' },
        restore: { keys: '0…9', does: 'Restaurer une mémoire' },
        append: { keys: 'Maj+0…9', does: 'Ajouter une mémoire à la sélection' }
      },
      fields: {
        title: 'Champs numériques',
        scrub: { keys: 'Glisser le champ ou son étiquette', does: 'Faire varier la valeur (Maj ×10, Alt ×0,1)' },
        step: { keys: '↑ / ↓, molette avec le focus', does: 'Augmenter ou diminuer la valeur' },
        expression: { keys: 'Taper une expression', does: 'p. ex. 120*1.5 ou 800-25' }
      },
      mouse: {
        title: 'Souris',
        sideButtons: { keys: 'Boutons latéraux précédent / suivant', does: 'Précédent / Suivant' }
      },
      outline: {
        title: 'Éditeur de contour',
        open: { keys: 'Double-clic sur un glyphe / Entrée', does: 'Modifier son contour' },
        select: { keys: 'Clic / Maj+clic / glisser', does: 'Sélectionner des points, ajouter à la sélection, sélectionner un rectangle' },
        move: { keys: 'Glisser / flèches (+Maj)', does: 'Déplacer les points sélectionnés (un axe / par 10)' },
        handle: { keys: 'Glisser une poignée (+Alt)', does: 'Modifier la courbe (casser un point lisse)' },
        insert: { keys: 'Double-clic sur le contour', does: 'Ajouter un point' },
        convert: { keys: 'Double-clic sur un point / Entrée', does: 'Point d’angle ou lisse' },
        remove: { keys: 'Suppr', does: 'Supprimer les points sélectionnés' },
        contour: { keys: 'C / R', does: 'Sélectionner le tracé / inverser son sens' },
        transform: { keys: 'T', does: 'Redimensionner et faire pivoter la sélection' },
        snap: { keys: 'Ctrl pendant le glissement', does: 'Sans aimantation' },
        view: { keys: 'Molette / Espace+glisser / F', does: 'Zoomer / déplacer la vue / ajuster le glyphe' }
      }
    }
  },
  about: {
    title: 'À propos de MkFont',
    name: 'MkFont {{version}}',
    tagline: 'Éditeur de polices modulaire par Nebukam',
    description:
      'Créez des polices à partir de fichiers SVG et de composants réutilisables, puis exportez-les en TrueType ou OpenType. Les fichiers sont compatibles avec MkFont 1.',
    // "Unicode data 16.0.0. Shortcuts: F1."
    data: 'Données Unicode {{version}}. Raccourcis : {{shortcut}}.',
    credits: 'Paires de crénage courantes : kerning-pairs par André Fuchs (licence MIT).'
  }
} satisfies Catalog<typeof en>
