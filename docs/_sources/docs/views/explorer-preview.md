---
layout: page
parent: General interface
grand_parent: Documentation
title: Preview explorer
subtitle: An handy interactive preview.
#summary: summary_goes_here
splash: icons/icon_text.svg
preview_img: placeholder.jpg
toc_img: views/preview-explorer.png
preview_img: previews/preview-explorer.png
tagged: explorer
nav_order: 4
---

{% include header_card %}

>The preview explorer is a small space where you can preview your font.  
>It also pair as another way to select your glyphs, which is very handy when you want to do some contextual tweaks.
{: .infos }

{% include img_toc %}

## Preview box
This is not where you edit the text -- **it is however, where you can select glyphs to edit by simply highlighting them as you would in any text editor :)**

{% include img a='views/preview-explorer-select.png' %}

>At the time of writing, this won't select ligatures, but instead the individual glyphs they encapsulate.
{: .comment }

## Ligature express
If you selected text within the preview box, a {% include btn ico="text-liga-new" %} button will toggle on, with its label showing the selected text.

| Action       | Comment          |
|:-------------|:------------------|
| {% include btn ico="text-liga-new" label="*text*" %} | Create & select a ligature based on the selected text. (displayed as label) |
| {% include shortcut keys="Shift" %} + {% include btn ico="text-liga-new" label="*text*" %} | Same as above, but will also bootstrap the ligature by adding all of the individual glyphs it contains, chained together. |

---

## Controls

There a few basic controls & modifier you can apply to the previewed blurb :

### Text direction

| Option       | Comment          |
|:-------------|:------------------|
| {% include btn ico="text-direction-ltr" %} | Text direction is set to LTR (left-to-right) |
| {% include btn ico="text-direction-rtl" %} | Text direction is set to RTL (right-to-left) |

### Text align

| Option       | Comment          |
|:-------------|:------------------|
| {% include btn ico="text-align-left" %} | Align text to the left |
| {% include btn ico="text-align-center" %} | Center text align |
| {% include btn ico="text-align-right" %} | Align text to the right |
| {% include btn ico="text-align-justify" %} | Justifies text |

### Text transformation (case)

(note that this setting only change the display and does not affect the text you entered).

| Option       | Comment          |
|:-------------|:------------------|
| {% include btn ico="case-sentence" %} | No transformation is applied : text is shown as it is in the textarea below. `Like that`. |
| {% include btn ico="case-uppercase" %} | All text is transformed to uppercase. `LIKE THAT`. |
| {% include btn ico="case-lowercase" %} | All text is transformed to lowercase. `like that`. |
| {% include btn ico="case-capitalize" %} | Capitalize the first letter of every word. `Why Would You Want That?` |

### Metrics

| Option       | Comment          |
|:-------------|:------------------|
| Font size (px) | Font size expressed in pixels. |
| Line height (em) | Line height expressed in em.<br>**1em = 100% of the font size.** |

### Preview text
This is where you type whatever text you want to preview.

### Actions

| Option       | Comment          |
|:-------------|:------------------|
| {% include btn ico="refresh" label="Reload" %} | Force re-rendering of the ttf and reload the preview. |
| {% include btn ico="reset" %} | Reset the preview text to the lorem ipsum. |
| {% include btn ico="plus" %} | Appends the active viewport selection to the text preview. |
| {% include btn ico="text" %} | Replace the current text preview with the active viewport selection. |

>If your font has more glyph than the threshold set in the {% include lk id='App settings' %}, you will need to click that button in order to recompute the preview.
{: .warning}

Or simply if you doubt the preview has updated automatically.

This is because in order to be previewed, the font needs to be exported in full in memory; it is not possible to simply append a single character.  
That also mean that the preview is a real one : what you see in here is an exact copy in memory of the font that will be exported as `.ttf`.

>For now, the preview doesn't support selection of ligatures. Instead, it will select the glyphs that makes up the ligature.  
>i.e, if you have a `test` ligature, selecting it in the preview will effectively select `t`, `e` and `s`.
{: .error }
