---
layout: page
parent: Guides
title: Asset preparation
subtitle: How to prepare assets
summary: Covers some basics yet crucial things regarding asset preparation
splash: icons/icon_edit.svg
preview_img: placeholder.jpg
nav_order: 1
color: red
---

{% include header_card.html %}

#### Checklist
{: .no_toc }
- TOC
{:toc}

>MkFont is design to work with (at least somewhat) prepared assets. Some assumptions are made, some limitation exists within the system -- **this page exists in order to explicit what these are, and help you prepare assets in a way that will make unexpected behaviors less annoying, and hopefully, easily solvable.**  

>If you're more the experimenting type, just ignore all this (or just check out the bit about [Vector data](#vector-data)) and have fun!
{: .infos-hl }

---

# Glyph Boundaries

One of the pillar of MkFont when it comes to [Glyph Transformations](/docs/views/foldout-transforms) is its reliance on user-defined glyph boundaries prior to their use inside MkFont.  
Basically you operate transformations based on something that doesn't have to be the glyph shape.  
There are only two ways I can know about the relation of your path to the typographic space :
1. The SVG `viewBox`
2. A custom path that will be used as a reference

Now you don't need to bother too much about the technicalities : the viewBox is usually automatically set by your editing software on import. i.e, in the case of Adobe Illustrator, artboards are the `viewBox`.  
The one case where there isn't a `viewBox` is when you {% include shortcut.html keys="Ctrl C" %} in illustrator, and {% include shortcut.html keys="Ctrl V" %} in MkFont : the vector information is added to the clipboard without any `viewBox` : instead, it fits tight with your selection within Illustrator. While not a deal breaker, this will limit your ability to really take advantage of MkFont.

>**the bottom edge of the SVG viewBox (if it exists) represents the baseline of the (font) glyph, while the top edge is the height of the character within the font.**.  
>This doesn't have to be true, but most of the scale & fit options rely on some consistent logic in the way you author your SVGs.
{: .warning }

## ViewBox?

An image is worth a thousand words; here are the difference :  
**TL;DR : you loose flexibility without the viewBox!**

![Artboard](/assets/images/dialogs/bound-illustrator.png)  
*(A path bleeding outside an artboard. This is what will be imported.)*

| Boundary mode       | With viewBox          | Without viewBox |
|:-------------|:------------------|:-----------|
| {% include btn.html ico="bounds-outside" %} `imported bounds`| ![Viewport Header](/assets/images/dialogs/bound-imported.png) | ![Viewport Header](/assets/images/dialogs/pasted-glyph.png) |
| {% include btn.html ico="bounds-mixed" %} `mixed bounds` |  ![Viewport Header](/assets/images/dialogs/bound-mixed.png) | ![Viewport Header](/assets/images/dialogs/pasted-mixed.png) |
| {% include btn.html ico="bounds-inside" %} `glyph bound` |  ![Viewport Header](/assets/images/dialogs/bound-glyph.png) | ![Viewport Header](/assets/images/dialogs/pasted-tight.png) |

>You can technically achieve the same results with a combination of `Shift`, `Push`, `Vertical Offset` & `Scale` -- but it becomes super clunky.
{: .comment}

## Custom path?

When pasting content directly from your editing software, it won't have the `viewBox` information.  
In order to work around that (*knowing it is **not** mandatory, it's more of a QoL thing.*), any path and/or vector information that has a magenta color will be considered as being the `viewBox`.  
Magenta is `rgb(255,0,255)`, `#FF00FF`, or `#F0F`.  

>If both info exist within a file (i.e it has both a magenta path AND a `viewBox`), **the magenta path takes over** at is is considered more intentional by design.
{: .warning}

this :  
![Artboard](/assets/images/dialogs/bound-illustrator-no-artboard.png)

will be interpreted exactly the same way as this :  
![Artboard](/assets/images/dialogs/bound-illustrator.png) 

---

# Vector data

>Unless intentional, make sure to expand your strokes when exporting to SVGs.  
>Some 'expanding' happens automatically depending on your editing software, some might not.  
>Here are a few situational examples :
{: .warning}

| Illustrator viewport       | Wireframe view          | MkFont |
|:-------------|:------------------|:-----------|
| ![A](/assets/images/dialogs/ill-closedpath.png)| ![B](/assets/images/dialogs/ill-closedpath-wire.png) | ![C](/assets/images/dialogs/final-closedpath.png) |
| ![A](/assets/images/dialogs/ill-closedpath-kept.png)| ![B](/assets/images/dialogs/ill-closedpath-wire.png) | ![C](/assets/images/dialogs/final-closedpath.png) |
| ![A](/assets/images/dialogs/ill-openpath-kept.png)| ![B](/assets/images/dialogs/ill-openpath-kept-wire.png) | ![C](/assets/images/dialogs/final-openpath-kept.png) |
| ![A](/assets/images/dialogs/ill-openpath-kept.png)| ![B](/assets/images/dialogs/ill-openpath-expanded-wire.png) | ![C](/assets/images/dialogs/final-openpath-expanded.png) |

Bottom line :
- Closed path work fine
- Stroke are not retained
- Open path will end up as filled shape.

>It is important to note that even if open path will *look* they are closed, the actual path information within the font file *is* kept.  
>This means if you intend to use your font as a tool to work with 3D text within, for example, blender, or Houdini, you will see an open path as opposed to a closed polygonal shape.
{: .infos}


# Naming conventions

If you intend to make good use of the [Batch import](/docs/dialogs/list-import) feature, do check out how the [automation using filename](/docs/dialogs/list-import#from-filename) works.  
And if you don't want to bother too much with that and don't have everything setup for your assets, you can take great advantage of the [Illustrator Artboard creation](/docs/views/viewport-unicode#actions) action.