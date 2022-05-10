---
layout: page
parent: General interface
grand_parent: Documentation
title: Content explorer
subtitle: Unicode. All of it.
#summary: summary_goes_here
splash: icons/icon_text-style.svg
preview_img: previews/content-explorer
toc_img: views/content-explorer.png
tagged: explorer
nav_order: 3
---

{% include header_card %}

>This is an overview of the Content Explorer. Selecting items in here will change the contents of the [Font Viewport](viewport-unicode).  
>It allows you to quickly find your way through the ton of existing Unicode slots & code points, and easily select which you want to include in your font.
>*Any active selection will be reset*
{: .comment}

{% include img_toc %}

The Content explorer is split in three main folders :
1. Quick access
2. Categories
3. Unicode ranges

>[Control characters](https://en.wikipedia.org/wiki/Control_character) are purposefully omitted and won't show anywhere.
{: .error}

## Quick Access

| Range       | Content          |
|:-------------|:------------------|
| {% include btn ico="text-style" label="My Glyphs" %} | Shows all the glyphs that currently exists within your font, no matter their state. |
| {% include btn ico="text-liga" label="Ligatures" %} | Shows all the ligatures that currently exists within your font, no matter their state. |
| {% include btn ico="text" label="All Unicodes" %} | Shows all 'known' Unicode points.<br>'Known' meaning 'explicitely documented' : they have an identity, name, etc.<br>*Note that some documented ranges have undocumented slots* |

## Categories
Categories is where glyphs are ordered by **semantic**.  
There are many categories, some very broad, some very narrow. Certain glyphs can exists in multiple categories, and not all known glyphs have an associated category.  
*Think of them as system tags.*

>Depending on how you plan on using/distributing your font, it is best practice to stay as close as possible to these semantics.  
>Hence, if planning on doing icon font, I recommend using either ligatures or the `Private use areas` blocks.
{: .comment }

They have color associated, which can also be seen in the [Font Viewport](viewport-unicode) individual slots. (Yes, that's what the small colored dot is!)

## Unicode blocks
Unicode blocks contains all the unicode blocks document in the Unicode Standards. (there's 400+ of them)  
These are inlined ranges of characters with no overlap : the first range starts at 0, and the last one ends at,... A very high number.  
There is **no duplicates** in blocks : a single glyph only belong to a single block.

