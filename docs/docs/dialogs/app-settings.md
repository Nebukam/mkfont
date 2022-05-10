---
layout: page
parent: Dialogs
grand_parent: Documentation
title: App settings
subtitle: Application-level settings, affects all the things.
#summary: summary_goes_here
splash: icons/icon_gear.svg
preview_img: previews/app-settings.png
toc_img: dialogs/app-settings.png
#nav_order: 4
---

{% include header_card %}

> App settings can be accessed via the [Home]({{ '/docs/views/home-view' | relative_url }}) view, using the {% include btn ico="gear" label="App Settings" %} button.

{% include img_toc %}

## Basic settings

| Setting       | Comment          |
|:-------------|:------------------|
|: **Autosave**   :||
| Autosave | When enabled, MkFont will automatically save open documents if they have any unsaved modifications. |
| Autosave interval | Interval time in minutes at which the autosave function will trigger. Can range from 1min to 60min. |
|: **Display**   :||
| Pangram max glyphs | Number of glyph above which the preview will stop auto-updating.<br>Recomputing the font for the preview can be noticeably long with large number of glyphs, or complex ones; in which case updating the preview manually gives better editing performance. |
|: **Resources**   :||
| Bind imported files | Whether or not to bind imported resources whenever a file is imported using the {% include btn ico="document-download" %} button. Note that the binding only remain for the duration of a work session, and **no reference to the file is saved**. |
| Mark color | The color used to "mark" custom boundaries when pasting SVG data from external applications. If you're puzzled by this comment, check out the [Asset preparation]({{ '/guides/assets-prep' | relative_url }}) guide.<br>Note that this setting is highly specific to certain workflows. |
|: **Third parties**   :||
| SVG Editor Executable | Path to your default SVG editor. This is empty by default, but should you trigger an action that requires it, you will be prompted to pick it.<br>The default SVG editor is primarily used by the {% include btn ico="document-edit" %} action. |
| Adobe© Illustrator Executable | Path to your Adobe© Illustrator executable, if you're using Adobe© Illustrator. This is empty by default, but should you trigger an action that requires it, you will be prompted to pick it.<br>Adobe© Illustrator is only used by the {% include btn ico="app-illustrator" %} action. |

## Family defaults
The following settings are the defaults/boilerplate values for every new .mkfont document you're creating. They can all be edited individually using the [Family Infos]({{ '/docs/dialogs/family-infos' | relative_url }}) inspector.  
This data is added to the font when exported to `.ttf`.

| Setting       | Comment          |
|:-------------|:------------------|
|: **Family defaults**   :||
| Family name | Default family name. |
| Copyright | Default copyright notice. |
| Description | Default description. |
| URL | Default URL. |
| Preview size | Default glyph preview size in the [Font Viewport]({{ '/docs/views/viewport-unicode' | relative_url }}). |