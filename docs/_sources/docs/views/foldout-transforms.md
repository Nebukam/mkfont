---
layout: page
parent: General interface
grand_parent: Documentation
title: Glyph transformations
subtitle: An inventory of the transformation options.
color: red
#summary: summary_goes_here
splash: icons/icon_font-bounds.svg
preview_img: previews/glyph-transforms.png
toc_img: views/glyph-transforms.png
tagged: foldout
nav_order: 7
---

{% include header_card %}

>This inspector can be seen in a multiple places across the app, and always behave the same way.
{: .comment}

{% include img_toc %}

Generally speaking, transformation are applied in the same order they are displayed : selected options will affect any other setting below it.  


### Boundaries

Which boundaries to use to compute glyph transformations & anchoring.

{% include img a='dialogs/bounds-example.png' %}

| Selection       | Effect          |
|:-------------|:------------------|
| {% include btn ico="bounds-outside" %} | Use the imported bounds (either svg viewBox, or marked path) |
| {% include btn ico="bounds-mixed" %} | Uses vertical mixed bounds : height from the imported bounds, width from the glyph. |
| {% include btn ico="bounds-mixed-hor" %} | Uses horizontal mixed bounds : width from the imported bounds, height from the glyph. |
| {% include btn ico="bounds-inside" %} | Ignore imported bounds & uses the glyph tight bounding box. |

>Check out {% include lk id='Asset preparation' a='#glyph-boundaries' %} to get a better understanding of what is considered 'boundaries'.
{: .comment}

### Scaling

Scaling determines how the glyph is fitted within the typographic space.

{% include img a='dialogs/bounds-fitting.png' %}

| Selection       | Effect          |
|:-------------|:------------------|
|: **Driven by the {% include lk id='Family metrics' %}** :||
| {% include btn ico="font-ascender" %} | Use distance between baseline and ascender. |
| {% include btn ico="font-bounds-h" %} | Use distance between ascender and descender. |
| {% include btn ico="font-x-height" %} | Use the X height |
| {% include btn ico="font-cap-height" %} | Use the Cap height |
| {% include btn ico="spread-ver" %} | Use the family's **Height** value |
| {% include btn ico="text-em" %} | Use the family's **EM** value |
|: **Custom scaling** :||
| {% include btn ico="edit" %} | User-defined scale factor |
| {% include btn ico="scale" %} | Normalize the glyph's scale. The normalization space is determined by the glyph width & height, either custom or driven by Family metrics. |
| {% include btn ico="close-small" %} | No scaling will be applied. *(rarely useful)* |

---

## Anchoring & Alignement

### Anchoring

Anchoring defines the origin point of the imported graphics within the chosen boudaries.

{% include btn ico="placement-top-left" %} {% include btn ico="placement-top" %} {% include btn ico="placement-top-right" %} {% include btn ico="placement-left" %} {% include btn ico="placement-center" %} {% include btn ico="placement-right" %} {% include btn ico="placement-bottom-left" %} {% include btn ico="placement-bottom" %} {% include btn ico="placement-bottom-right" %}

{% include img a='dialogs/bounds-anchors.png' %}


### Alignments

Vertical alignment is based on the main axes of the typographic space.  
Horizontal one is based on either input values or {% include lk id='Family metrics' %}.

{% include img a='dialogs/bounds-align.png' %}

| Selection       | Effect          |
|:-------------|:------------------|
|: **Vertical**   :||
| {% include btn ico="font-ascender" %} | Align with top (*ascender*) |
| {% include btn ico="font-baseline" %} | Align with baseline |
| {% include btn ico="font-descender" %} | Align with descender |
| {% include btn ico="center-ver" %} | Align with center of the vertical spread (*EM*) |
| {% include btn ico="text-em" %} | Align with bottom (*EM*) |
|: **Horizontal**   :||
| {% include btn ico="font-bounds-xmin" %} | Zero. The origin of the typographic space. |
| {% include btn ico="font-bounds-xmax" %} | Align with the width of the glyph as defined by the user or Family metrics. |
| {% include btn ico="center-hor" %} | Align with the center of the glyph width. |

>Note that depending on which alignment you choose, you may need to turn off the auto-width property & manully set the glyph's width to have better control over the horizontal alignment.
{: .warning}

---

**Most of the properties are preceeded with an {% include btn ico="link" %} button.**  
**This button clears the 'local' value (the one stored within the glyph), and it instead becomes bound to the value set in the {% include lk id='Family metrics' %}** for that specific property.The field becomes greyed out *(but not disabled)* and displays the value currently in use.  
Simply set a custom value to break the link.

## Translation

Translations are numerical value that affect the final glyph in many ways.

>Using {% include lk id='Family metrics' %} to control glyph is super powerful, but can sometimes lead to unexpected results : updating family metrics will update all glyphs that are using them.
{: .warning}

{% include img a='dialogs/bounds-offsets.png' %}

### Offsets

Offsets offer control over the width of the glyph and its vertical positioning within the typographic space.

| Property       | Effect          |
|:-------------|:------------------|
| Shift | Adds empty space on the left of the glyph (a.k.a *Kerning*) |
| Push | Adds empty space on the right of the glyph |
| Automatic width | When enabled, automatically calculate the glyph width to be : `horizontal boundary width` + `Shift` + `Push`. *(This value cannot be smaller than 0.)*.<br>When disabled, the value used is either the one set in the metrics below (if any is set), or the Family default. |
| Vertical Offset | Offsets the glyph vertically, after all other transforms are applied. |

---

## Advanced

Advanced transforms are applied before any other transform and will affect the glyph local boundaries. *Unless you're using the boundaries imported with the file ({% include btn ico="bounds-outside" %}), expect to do a bit of back'n forth between parameters.*

{% include img a='dialogs/glyph-tr-advanced.png' %}

### Mirror

| Property       | Effect          |
|:-------------|:------------------|
| {% include btn ico="mirror-hor" %} | Flips the glyph horizontally |
| {% include btn ico="mirror-ver" %}  | Flips the glyph vertically |
| {% include btn ico="mirror-both" %}  | Flips the glyph both horizontally & vertically. *Same as doing a 180deg rotation* |
| {% include btn ico="close-small" %} | No scaling will be applied. *(rarely useful)* |

### Rotation & Skew

{% include img a='dialogs/bounds-rotate.png' %}

First, you can choose between the order in which these transformations are applied. Rotation happening after skewing is applied won't yield the same visual results as if the rotation is applied before.  
Shorthand in the drop-down menu are :
- R = Rotation
- X = Skew on X axis
- Y = Skew on Y axis

You may also control which anchor point within the glyph will be used to apply the rotation. Effects might not be much visible depending on which parameters are set before -- specifically when using the glyph drawing bounds ({% include btn ico="bounds-inside" %}), which anchor is selected makes no visual difference.

---

## Others

Last but not least, raw font metrics.

### Metrics

| Property       | Effect          |
|:-------------|:------------------|
| Width | Manually sets the width of the glyph. *Width represent how much the glyph advances the renderer horizontally.*<br>Note that most of the time you will want to leave this value alone and use Automatic Width. If working with `monospace` fonts, there is a toggle that override everything at the output level within the {% include lk id='Family metrics' %}. |
| Height | Manually sets the height of the glyph -- *it's very likely you won't care about this one, since the actual height within the font is controlled by the EM value. It becomes useful when the glyph is used solely as a component.* |

### Export

| Property       | Effect          |
|:-------------|:------------------|
| Export | Whether or not to include the glyph in the exported font. |