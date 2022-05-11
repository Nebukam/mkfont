---
layout: page
parent: Guides
title: Asset preparation
subtitle: How to prepare assets
summary: Covers some basics yet important things regarding asset preparation
splash: icons/icon_edit.svg
preview_img: placeholder.jpg
nav_order: 1
color: red
---

{% include header_card %}

#### Checklist
{: .no_toc }
- TOC
{:toc}

>MkFont is design to work with (at least somewhat) prepared assets. Some assumptions are made, some limitation exists within the system -- **this page exists in order to explicit what these are, and help you prepare assets in a way that will make unexpected behaviors less annoying, and hopefully, easily solvable.**  

>If you're more the experimenting type, just ignore all this (or just check out the bit about [Vector data](#vector-data)) and have fun!
{: .infos-hl }

---

# Glyph Boundaries

One of the pillar of MkFont when it comes to {% include lk id='Glyph transformations' %} is its reliance on user-defined glyph boundaries prior to their use inside MkFont.  
Basically you operate transformations based on something that doesn't have to be the glyph shape.  
There are only two ways I can know about the relation of your path to the typographic space :
1. The SVG `viewBox`
2. A custom path that will be used as a reference

Now you don't need to bother too much about the technicalities : the viewBox is usually automatically set by your editing software on import. i.e, in the case of Adobe Illustrator, artboards are the `viewBox`.  
The one case where there isn't a `viewBox` is when you {% include shortcut keys="Ctrl C" %} in illustrator, and {% include shortcut keys="Ctrl V" %} in MkFont : the vector information is added to the clipboard without any `viewBox` : instead, it fits tight with your selection within Illustrator. While not a deal breaker, this will limit your ability to really take advantage of MkFont.

>**the bottom edge of the SVG viewBox (if it exists) represents the baseline of the (font) glyph, while the top edge is the height of the character within the font.**.  
>This doesn't have to be true, but most of the scale & fit options rely on some consistent logic in the way you author your SVGs.
{: .warning }

## viewBox?
 
**TL;DR : you loose flexibility without the viewBox!**
An image is worth a thousand words; here are the differences : 

{% include img a='dialogs/bound-illustrator.png' %} 

*(A path bleeding outside an artboard. This is what will be imported.)*

| Boundary mode       | With viewBox          | Without viewBox |
|:-------------|:------------------|:-----------|
| {% include btn ico="bounds-outside" %} `imported bounds`| {% include img a='dialogs/bound-imported.png' %} | {% include img a='dialogs/pasted-glyph.png' %} |
| {% include btn ico="bounds-mixed" %} `mixed bounds` |  {% include img a='dialogs/bound-mixed.png' %} | {% include img a='dialogs/pasted-mixed.png' %} |
| {% include btn ico="bounds-inside" %} `glyph bound` |  {% include img a='dialogs/bound-glyph.png' %} | {% include img a='dialogs/pasted-tight.png' %} |

>You can technically achieve the same results with a combination of `Shift`, `Push`, `Vertical Offset` & `Scale` -- but it becomes super clunky.
{: .comment}

## Custom path as viewBox?

When pasting content directly from your editing software, it won't have the `viewBox` information.  
In order to work around that (*knowing it is **not** mandatory, it's more of a QoL thing.*), any path and/or vector information that has a magenta color will be considered as being the `viewBox`.  **This color can be customized in the {% include lk id='App settings' %}!**
Magenta is `rgb(255,0,255)`, `#FF00FF`, or `#F0F`.  

>If both info exist within a file (i.e it has both a magenta path AND a `viewBox`), **the magenta path takes over** at is is considered more intentional by design.
{: .warning}

this :  
{% include img a='dialogs/bound-illustrator-no-artboard.png' %}

will be interpreted exactly the same way as this :  
{% include img a='dialogs/bound-illustrator.png' %}

---

# Vector data

>Unless intentional, make sure to expand your strokes when exporting to SVGs.  
>Some 'expanding' happens automatically depending on your editing software, some might not.  
>Here are a few situational examples :
{: .warning}



| Illustrator viewport       | Wireframe view          | MkFont |
|:-------------|:------------------|:-----------|
| {% include img a='dialogs/ill-closedpath.png' %} | {% include img a='dialogs/ill-closedpath-wire.png' %} | {% include img a='dialogs/final-closedpath.png' %} |
| {% include img a='dialogs/ill-closedpath-kept.png' %} | {% include img a='dialogs/ill-closedpath-wire.png' %} | {% include img a='dialogs/final-closedpath.png' %} |
| {% include img a='dialogs/ill-openpath-kept.png' %} | {% include img a='dialogs/ill-openpath-kept-wire.png' %} | {% include img a='dialogs/final-openpath-kept.png' %} |
| {% include img a='dialogs/ill-openpath-kept.png' %} | {% include img a='dialogs/ill-openpath-expanded-wire.png' %} | {% include img a='dialogs/final-openpath-expanded.png' %} |

Bottom line :
- Closed path work fine
- Stroke are not retained
- Open path will end up as filled shape.

>It is important to note that even if open path will *look* they are closed, the actual path information within the font file *is* kept.  
>This means if you intend to use your font as a tool to work with 3D text within, for example, blender, or Houdini, you will see an open path as opposed to a closed polygonal shape.
{: .infos}


# Naming conventions

If you intend to make good use of the {% include lk id='Batch import' %} feature, do check out how the [automation using filename]({{ '/docs/dialogs/list-import#from-filename' | relative_url }}) works.  
And if you don't want to bother too much with that and don't have everything setup for your assets, you can take great advantage of the {% include lk id='Font viewport' t='Illustrator Artboard creation' a='#actions' %} action.

