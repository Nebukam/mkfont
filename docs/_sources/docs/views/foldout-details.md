---
layout: page
parent: General interface
grand_parent: Documentation
title: Glyph details
subtitle: Decomposition, relatives, etc.
color: red
#summary: summary_goes_here
splash: icons/icon_placement-center.svg
preview_img: previews/glyph-details.png
toc_img: views/foldout-details-small.png
tagged: foldout
nav_order: 9
---

{% include header_card %}

>Details shows you useful navigational information to quickly browse between connected components & glyphs.

{% include img_toc %}

Content within the details are only shown if they exist; here is what you can expect to see in there :

{% include img a='views/foldout-details.png' f='<' %} 

---

## Usage as a component

Shows how many glyphs are currently using the selected one as a component, and allow you to batch select them using the {% include btn ico="shortcut" label="Select all" %} button.

---

## Decomposition

The glyph decomposition is documented for a subset of glyphs within Unicode. If they exist for the selected character, you will be able to browse through them from here.  
> Note that you can use the {% include btn ico="link" %} of the {% include lk id='Glyph components' %} to quickly create a composite glyph from its known decomposition.  
> Alternatively, use {% include shortcut keys="Shift" %} + {% include btn ico="reset" %} to create a new glyph along with all of its dependencies, and bootstrap components structure in one swift click.
{: .infos }

---

## Relatives

Relatives shows a list of the direct relatives (as per Unicode, single depth only) of the currently selected glyph, allowing for great discovery and making it easy to spot & find associated glyphs you might want to support.