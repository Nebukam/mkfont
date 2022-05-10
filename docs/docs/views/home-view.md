---
layout: page
parent: General interface
grand_parent: Documentation
title: Home
subtitle: The landing screen.
#summary: summary_goes_here
splash: icons/icon_gear.svg
preview_img: views/home.png
toc_img : views/home.png
nav_order: 50
---

{% include header_card.html %}

{% include img_toc.html %}

| Primary actions       | Action          |
|:-------------|:------------------|
|: **MkFont** :||
| {% include btn.html ico="new" label="New .mkfont" %} | Creates a new .mkfont in memory. You will need to save it on disk for the autosave to work.<br>*If you don't, you will be assaulted by a modal when the timer runs out.* |
| {% include btn.html ico="document-download-small" label="Load .mkfont" %} | Loads an existing .mkfont file. |
|: **Import** :||
| {% include btn.html ico="document-upload-small" label="Load TTF" %} | Creates a new .mkfont from an existing TTF file. |


| Secondary actions       | Action          |
|:-------------|:------------------|
| About | Open the very same documentation you're reading right now, but on the [About](/about) page. |
| Help | Open the very same documentation you're reading right now. |
| {% include btn.html ico="gear" label="App Settings" %} | Open the [App Settings](/docs/dialogs/app-settings) panel. |