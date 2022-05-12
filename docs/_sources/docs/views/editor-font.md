---
layout: page
parent: General interface
grand_parent: Documentation
title: Font editor
subtitle: Where you spend 100% of your time within MkFont.
#summary: summary_goes_here
splash: icons/icon_view-grid.svg
preview_img: previews/font-editor.png
toc_img: views/editor-a.png
tagged: editor
nav_order: 1
---

{% include header_card %}

>This is an overview of the Font Editor.
{: .comment}

{% include img_toc %}

## Breakdown

{% include img a='views/editor-breakdown.png' %}

The Font Editor is broken down into three main areas, covered in length in their own sections :

### Editor explorers
<br>
{% include card_any tagged="explorer" %}

### Viewport & glyph editor
<br>
<div class="card-ctnr" markdown="1">
{% include card_single reference="Font viewport" %}
{% include card_single reference="Glyph inspector" %}
</div>

---

## Header actions

{% include img a='views/editor-header.png' %}

| Button       | Action          |
|:-------------|:------------------|
|: **Navigation** :||
| {% include btn ico="right" %} | Navigate to the previous editor state |
| {% include btn ico="left" %} | Navigate to the next editor state |
|: **Writing files** :||
| {% include btn ico="save-small" label="Save" %} | Save the current file. If it does not exist on disk already, will prompt for a location & filename. Can be activated using {% include shortcut keys="Ctrl S" %}. |
| {% include btn ico="upload" label="Export" %} | Export the current font as a .ttf file. You will be prompted for a location & filename each time. |
|: **Family settings** :||
| {% include btn ico="font" label="Infos" %} | Brings up the {% include lk id='Family infos' %} inspector. |
| {% include btn ico="layout" label="Metrics" %} | Brings up the {% include lk id='Family metrics' %} inspector. |
|: **Importing content** :||
| {% include btn ico="text-liga" label="Ligatures" %} | Brings up the {% include lk id='Ligatures finder' %} dialog. |
| {% include btn ico="directory-download-small" label="SVGs" %} | Brings up the {% include lk id='List import' %} dialog. |
| {% include btn ico="directory-download-small" label="TTF" %} | You will be prompted to select a .ttf file, and its glyphs will be imported (and resampled to match the current Family metrics) |

---

## Shortcuts

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