---
layout: page
title: Features
subtitle: MkFont got you covered
nav_order: 4
has_children: true
nav_exclude: true
---

{% include header_card %}

### Disclaimer
MkFont is under **active development**, as such you may encounter issues. In the unlikely event that you would, please [report an issue](https://github.com/Nebukam/mkfont/issues) on github!  
Same place if you would like to suggest enhancements & features that would make MkFont even more useful for you :)

---

{% include card_childs %}

## And more!

A bunch of discreet QoL features.
{: .fs-5 .fw-300 }

Lots of small options & features to make it easy to work with your glyphs with third parties such as Unity' TextMeshPro.

>## Current limitation
>{: .no_toc}
>**MkFont does not support kerning pairs yet.** And it may not ever.  
>Something that will be implemented in the future to circumvent that limitation is creating special ligatures that combine existing glyphs within the font, *but it does come with other caveats such as issues arising when tweaking the letter spacing in the final rendering context.* （＞人＜；）
{: .error }

---

### Planned features
Here are some of the features currently under development or planned to be, at some point, soon, maybe.  
*In no particular order.*

| Working title       | Use          |
|:-------------|:------------------|
| Showcase Generator | Quickly generate a nice looking visual with your glyphs to showcase it, exports as a .png file. |
| Glyph as components | Ability to combine existing glyph into another. This would be especially useful in order to re-user marks & modifier along with unmodified glyphs and not duplicate the work/amount of assets required to have a fully functional font |
| Glyph layers | Similar to Glyph as components, working the ability to use existing glyphs as additional "layers" inside another Glyph. Glyph would either be used as-is, or with its path reversed in order to create "holes" -- hence making icon font much more flexible. |
| Add existing glyph to illustrator automation | Currently the Illustrator automation only creates blank templates. Wouldn't it be nice if it could also import existing glyphs within the font? |
