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

{% include header_card %}

{% include img_toc %}

| Primary actions       | Action          |
|:-------------|:------------------|
|: **MkFont** :||
| {% include btn ico="new" label="New .mkfont" %} | Creates a new .mkfont in memory. You will need to save it on disk for the autosave to work.<br>*If you don't, you will be assaulted by a modal when the timer runs out.* |
| {% include btn ico="document-download-small" label="Load .mkfont" %} | Loads an existing .mkfont file. |
|: **Import** :||
| {% include btn ico="document-upload-small" label="Load TTF" %} | Creates a new .mkfont from an existing TTF file. |


| Secondary actions       | Action          |
|:-------------|:------------------|
| About | Open the very same documentation you're reading right now, but on the {% include lk id='About' %} page. |
| Help | Open the very same documentation you're reading right now. |
| {% include btn ico="gear" label="App Settings" %} | Open the {% include lk id='App settings' %} panel. |