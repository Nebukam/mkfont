---
layout: page
parent: Dialogs
grand_parent: Documentation
title: Ligatures finder
subtitle: Where ligatures happen.
#summary: summary_goes_here
splash: icons/icon_text-liga.svg
preview_img: previews/ligatures.png
toc_img: dialogs/ligatures-text.png
#nav_order: 4
---

{% include header_card %}

>The ligature finder has two main input modes : text analysis, and manual input. You can switch between the two simply by toggling the `Each line is a ligature` `on` or `off`.

{% include img_toc %}

## Text analysis
Ok, analysis is a big word, there's no real analysis going on here, just brute force statistical extraction.  
Simply paste a blurb of text in the input field, hit enter, and the ligatures options will start showing!

>Note that only the first 500 results (*after* thresholds are applied) will show up.
{: .warning }

### Thresholds

The results can be narrowed down & limited by a few parameters :

| Property       | Effect          |
|:-------------|:------------------|
| Min length | Minimum ligature length to look for. For obvious reasons, cannot be lower than 2. |
| Max length | Maximum ligature length to look for. The higher the value, the more low-quality results/occurences you're going to get.  |
| Min occurrences | The minimum number of times a ligature must be present in order to show up in the results. |

---

## One ligature per line

{% include img a='dialogs/ligatures-line-break.png' %}

In this mode, simply input the target ligature on each line to manually produce results.  
Other parameters will be ignored.  

*Use {% include shortcut keys="Shift Enter" %} to do a line break*