---
layout: page
parent: Documentation
title: Shortcuts
subtitle: MkFont shortcuts, what do they do, do they do things, let's find out!
#summary: Summary it is!
splash: icons/icon_action.svg
preview_img: previews/shortcuts.png
nav_order: 1
#nav_exclude: true
color: red
---

{% include header_card %}

{% include input_reminder.html %}

>**Rule of thumb** : most actions have an alternative behavior whether you're holding {% include shortcut keys="Shift" %} or {% include shortcut keys="Alt" %} while activating them.  
>Usually, {% include shortcut keys="Shift" %} has the most "dangerous" effect, and *reaches further* than the original behavior.  
>On the contrary, {% include shortcut keys="Alt" %} has a lesser effect, and often means the action will only execute a subset of its normal instructions.
{: .warning }

## In the {% include lk id='Font editor' %}

| Shortcut       | Action          |
|:-------------|:------------------|
|: **Actions** :||
| {% include shortcut keys="Ctrl S" %}           | Saves the currently edited mkfont file. Prompts a dialog if the file has never been saved before. |
| {% include shortcut keys="Ctrl Z" %}           | Undo last action |
| {% include shortcut keys="Ctrl Y" %}           | Redo last action |
|: **Navigation** :||
| {% include shortcut keys="Mouse3" %}           | Previous nav state *(should be the same as in a regular browser)* |
| {% include shortcut keys="Mouse4" %}           | Next nav state *(should be the same as in a regular browser)* |
|: **Selection** :||
| {% include shortcut keys="Ctrl A" %}           | Selects all glyphs currently displayed in the viewport. |
| {% include shortcut keys="ESC" %}           | Clears the current selection |
| {% include shortcut keys="Ctrl 0··9" %}           | Store the current selection as a shortcut. |
| {% include shortcut keys="0··9" %}           | Restore the selection previously stored |
| {% include shortcut keys="Shift 0··9" %}           | Appends the selection previously stored to the current selection |

> Keep in mind that glyphs are copied and pasted *in the order in which they have been selected*.
{: .warning }

> Pasting a group selection on top of another group selection will 'wrap' the content available in the clipboard.  
> For example, if you copied `1`,`2`, and paste it over a selection that has more than 2 glyphs, the result will be `1`,`2`,`1`,`2`,`1`,...

---

## In the {% include lk id='Font viewport' %}

| Shortcut       | Action          |
|:-------------|:------------------|
| {% include shortcut keys="Ctrl C" %}           | Copy a single glyph to the app clipboard |
| {% include shortcut keys="Ctrl V" %}           | Paste the content of the clipboard in the selected glyph slot.<br>Supports pasting directly from Adobe© Illustrator! |
| {% include shortcut keys="Ctrl Shift V" %}           | Paste the glyphs copied using {% include shortcut keys="Ctrl Shift C" %} to their matching unicode slots. This is especially *(if not only)* useful to paste glyphs from an .mkfont to another in batch, while retaining their unicode positions. |
| {% include shortcut keys="Ctrl Alt V" %}           | Applies the transform of the glyph stored in memory using {% include shortcut keys="Ctrl C" %} to all glyphs in the active selection. Does **not** affect the path. |
| {% include shortcut keys="DEL" %}           | Deletes the selected glyphs |

>Note on copy/pasting glyphs : glyphs are copied into SVG format, with transform information embedded as SVG attributes. This means that you can safely use the clipboard's content in any SVG-friendly app, and that casually pasting within MkFont will retain transform settings.
{: .comment }

### Action modifiers

Modifiers are applied when a key is pressed along with a specific button.  
**TL;DR** : When clicking on an action while {% include shortcut keys="Shift" %} is pressed will execute the action for all glyphs within the range, not just limited to your active selection.

| Modifier       | Action          |
|:-------------|:------------------|
| {% include shortcut keys="Shift" %} + {% include btn ico="new" %}  | Create empty glyphs in Unicode slots that have no glyph yet. Does **not** overwrite existing ones. |
| {% include shortcut keys="Shift" %} + {% include btn ico="text-unicode-char" %} | Copy the unicode characters to the clipboard, with each value separated by a newline character : `\n`. *(see [note](#note-on-unicode-lists))* |
| {% include shortcut keys="Shift" %} + {% include btn ico="text-unicode" %} | Copy the unicode hex values to the clipboard, with each value separated by a newline character : `\n`. *(see [note](#note-on-unicode-lists))* |
| {% include shortcut keys="Shift" %} + {% include btn ico="app-illustrator" %} | Create & execute a JSX script that will prompt Adobe© Illustrator to create a new document with artboard set-up for each glyph within the range (up to 1000), properly named in order to be exported easily. *(see {% include lk id='Third parties' %} )*  |
| {% include shortcut keys="Shift" %} + {% include btn ico="remove" %} | Delete all glyphs within the range. |

---

## In the {% include lk id='Glyph inspector' %}

### Header actions

| Modifier       | Action          |
|:-------------|:------------------|
|: **When multiple glyph are selected, action is applied to every one of them** :||
| {% include shortcut keys="Shift" %} + {% include btn ico="reset" %} | Resets the glyph contents & create components matching the glyph composition, if any, as well as associated glyphs if they are missing. |
| {% include shortcut keys="Alt" %} + {% include btn ico="reset" %} | Resets the glyph contents but keeps existing components. |
| {% include shortcut keys="Alt Shift" %} + {% include btn ico="reset" %} | Resets the glyph contents, and recursively creates missing glyphs along with their decomposition.  |

### Components

| Modifier       | Action          |
|:-------------|:------------------|
|: **Copy/paste** :||
| {% include shortcut keys="Shift" %} + {% include btn ico="clipboard-read" %} | Add components from the clipboard, instead of replacing the existing ones |
| {% include shortcut keys="Alt" %} + {% include btn ico="clipboard-read" %} | Only paste transform settings from matching components within the clipboard |
|: **Decomposition** :||
| {% include shortcut keys="Shift" %} + {% include btn ico="link" %} | Create components recursively. |
| {% include shortcut keys="Alt" %} + {% include btn ico="link" %} | Does not create missing components' glyphs. |
| {% include shortcut keys="Alt Shift" %} + {% include btn ico="link" %} | Create components & missing glyphs recursively. |