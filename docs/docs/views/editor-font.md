---
layout: page
parent: General interface
grand_parent: Documentation
title: Font editor
subtitle: Where you spend 100% of your time within MkFont.
#summary: summary_goes_here
splash: icons/icon_view-grid.svg
preview_img: previews/editor-font.png
toc_img: views/editor-a.png
tagged: editor
nav_order: 1
---

{% include header_card.html %}

>This is an overview of the Font Editor.
{: .comment}

{% include img_toc.html %}

## Breakdown

![Font Editor](/assets/images/views/editor-breakdown.png)

The Font Editor is broken down into three main areas, covered in length in their own sections :

### Editor explorers
<br>
{% include card_any.html tagged="explorer" %}

### Viewport & glyph editor
<br>
<div class="card-ctnr" markdown="1">
{% include card_single.html reference="Font viewport" %}
{% include card_single.html reference="Glyph inspector" %}
</div>

#### Explorers
{: .no_toc }
Allows you to naviguate between different explorers, each of which has its dedicated page :

| Explorer       | Purpose          |
|:-------------|:------------------|
| {% include btn.html ico="text-style" %} [Content Explorer](explorer-content) | Browse through your font glyphs, Unicode blocks and categories. |
| {% include btn.html ico="text" %} [Preview Explorer](explorer-preview) | A minimalistic preview tool to preview your font. |
| {% include btn.html ico="refresh" %} [History Explorer](explorer-history) | Everything you did since you opened the editor. It's a memory-hungry time machine. Flush it out from time to time. |

## Header actions

![Font Editor](/assets/images/views/editor-header.png)

| Button       | Action          |
|:-------------|:------------------|
|: **Navigation** :||
| {% include btn.html ico="right" %} | Navigate to the previous editor state |
| {% include btn.html ico="left" %} | Navigate to the next editor state |
|: **Writing files** :||
| {% include btn.html ico="save-small" label="Save" %} | Save the current file. If it does not exist on disk already, will prompt for a location & filename. Can be activated using {% include shortcut.html keys="Ctrl S" %}. |
| {% include btn.html ico="upload" label="Export" %} | Export the current font as a .ttf file. You will be prompted for a location & filename each time. |
|: **Family settings** :||
| {% include btn.html ico="font" label="Infos" %} | Brings up the [Family Infos](/docs/dialogs/family-infos) inspector. |
| {% include btn.html ico="layout" label="Metrics" %} | Brings up the [Family Metrics](../dialogs/family-metrics) inspector. |
|: **Importing content** :||
| {% include btn.html ico="text-liga" label="Ligatures" %} | Brings up the [Ligature Finder](/docs/dialogs/ligatures-finder) dialog. |
| {% include btn.html ico="directory-download-small" label="SVGs" %} | Brings up the [List Import](/docs/dialogs/list-import) dialog. |
| {% include btn.html ico="directory-download-small" label="TTF" %} | You will be prompted to select a .ttf file, and its glyphs will be imported (and resampled to match the current Family Metrics) |

## Shortcuts

| Shortcut       | Action          |
|:-------------|:------------------|
|: **Actions** :||
| {% include shortcut.html keys="Ctrl S" %}           | Saves the currently edited mkfont file. Prompts a dialog if the file has never been saved before. |
| {% include shortcut.html keys="Ctrl Z" %}           | Undo last action |
| {% include shortcut.html keys="Ctrl Y" %}           | Redo last action |
|: **Navigation** :||
| {% include shortcut.html keys="Mouse3" %}           | Previous nav state *(should be the same as in a regular browser)* |
| {% include shortcut.html keys="Mouse4" %}           | Next nav state *(should be the same as in a regular browser)* |
|: **Selection** :||
| {% include shortcut.html keys="Ctrl A" %}           | Selects all glyphs currently displayed in the viewport. |
| {% include shortcut.html keys="ESC" %}           | Clears the current selection |
| {% include shortcut.html keys="Ctrl 0··9" %}           | Store the current selection as a shortcut. |
| {% include shortcut.html keys="0··9" %}           | Restore the selection previously stored |
| {% include shortcut.html keys="Shift 0··9" %}           | Appends the selection previously stored to the current selection |