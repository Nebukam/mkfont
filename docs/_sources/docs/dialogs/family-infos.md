---
layout: page
parent: Dialogs
grand_parent: Documentation
title: Family Infos
subtitle: Metadata, etcetera.
#summary: summary_goes_here
splash: icons/icon_font.svg
preview_img: previews/family-infos.png
toc_img: dialogs/family-infos.png
#nav_order: 4
---

{% include header_card %}

![List import modes](/assets/images/dialogs/family-infos.png)

There's not much to expand on here -- Family infos are metadata that will be embedded into the exported `.ttf` file.

>The final family name is a concatenation of the `Family Name` and the `Sub Family`.  
>It is shown at all times on the top right corner of the [Font Editor]({{ '/docs/views/editor-font' | relative_url }}).
{: .infos }

| State       | Meaning          |
|:-------------|:------------------|
| Family Name | The name of your font. |
| Sub Family | The sub family. |
| Weight class | The weight class of your font, as per CSS specs. This is not used right now, but will be once export for web is implemented :) |
| Copyright | Your copyright notice |
| Description | A description of your font. Keep it short ( < 255 characters ), as some export format may limit the allowed character count. |
| URL | The url of your website, font family, showcase page... |
| Version | The version of the font. Only accepts values formatted as `x.x`. |
