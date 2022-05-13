---
layout: page
parent: General interface
grand_parent: Documentation
title: Glyph components
subtitle: Make more with less!
color: red
#summary: summary_goes_here
splash: icons/icon_component.svg
preview_img: previews/glyph-components.png
toc_img: views/comp-full.png
tagged: foldout
nav_order: 8
---

{% include header_card %}

>Components allow you to add any glyph from your .mkfont into other glyphs, enabling a very modular & atomic workflow.

{% include img_toc %}

## What is a component?

>Generally speaking, components are kindda like layers, or Adobe© Illustrator Symbols, or Prefab in Unity : they can turn any existing glyph into a re-usable asset that self-updates  whenever modified.  
>  
>They can be used for many many things : easily make and maintained composite letters with modifiers such as `é`, `à` etc; but the logic also applies to creating flexible icon libraries. Check out the {% include lk id='Composite icon font' %} guide to get a grasp on the possibilities.
{: .infos}

Using component is rather straightforward, yet there is a few not-so-obvious subtleties that make them really flexible.  
The first thing to setup in a component is choosing which glyph it will 'import'. A component may be empty, in which case it's useless, or can reference a glyph that doesn't exist just yet -- in which case it acts as a placeholder that will behave as expected once the glyph it references is added to the font.  
*Note that the imported glyph can be **any** glyph, even a ligature -- if you can see it in the viewport, it can be used as a component.*

---

## Header actions

| Action       | Effect          |
|:-------------|:------------------|
|: **Create** :||
| {% include btn ico="new" %} | Creates a new empty component on top of the existing ones |
| {% include btn ico="component-new" %} | Open the glyph picker and let you pick one or more components and add them as components |
|: **Manipulate** :||
| {% include btn ico="minus" %} | Collapse all open component foldouts |
| {% include btn ico="visible" %} | Toggle all layers to visible |
| {% include btn ico="hidden" %} | Toggle all layers to hidden |
|: **Composite** :||
| {% include btn ico="link" %} | Create component for each glyph part of the known decomposition of the host. *(See {% include lk id='Glyph details' %})* |

### Flatten comps
Whether or not to flatten the components.  
This is a bit tricky to use, and (mostly) only useful when working with lots of components imported inside an empty glyph.  
What it does is first compute component transformations as usual, them flatten them as if they were a single entity, and *then re-apply the global glyph transformations onto them*.  

>This, among other things, effectively allows the glyph width to be controlled by its components.  


---

## Layer controls

| Action       | Effect          |
|:-------------|:------------------|
| {% include btn ico="up-short" %} | Move the component up in the list |
| {% include btn ico="down-short" %} | Move the component down in the list |
| {% include btn ico="shortcut" %} | Select the glyph currently imported by the component |
| {% include btn ico="visible" %} / {% include btn ico="hidden" %} | Toggle layers visibility |
| {% include btn ico="remove" %} | Delete the layer |

## Basic properties

The first thing to setup, as mentionned above, will be which glyph the component will be using. Not unlike a regular glyph, a component has then alignment & anchoring options, scale, and translation.  
>The main difference with a regular glyph is that the typographic space of a component is not the family. **Instead, it is constrained by the glyph it is appended to.**
{: .warning}

### Import glyph

>The {% include btn ico="search-small" %} button open the Glyph picker and easily pick an existing glyph from your font.  
>It's generally faster than the raw method below.
{: .infos}

This is where you choose which glyph to import as a component. Accepted values are :
- A character, such as `a`, `b`, `0`
- A ligature, expressed as `ab`, `bc`, `0g1`, `verbose-ligature-name` *(or what-have-you)*
- An `U+0000` formatted character, such as `U+0041`, `U+01f9`, ...
- A ligature, expressed as `U+0041U+01f9`
- A ligature, expressed as a combination of the above, with hex values terminated with a `-`, such as `abU+0041`, `abU+0041-i`, `abU+0041-iU+01f9`.

Using the {% include btn ico="shortcut" %} button will inspect the glyph imported in the layer. You can quickly move back and forth between components and their glyphs using {% include shortcut keys="Mouse3" %} and {% include shortcut keys="Mouse4" %}.


---

## Alignment & anchoring

There are two distinct alignment & anchoring : one for the `Context` (the component' host), another for the component itself, `Layer`.  
They are functioning in the same way as the {% include lk id='Glyph transformations' %}.

### Anchoring

Taking a `g` as an example, here are the different possibilities for anchoring based on the selected boundaries :  

{% include img a='views/context-bounds-anchors.png' %}

As you can see, this full bounds have nothing to do with the imported SVG, but instead **uses the actual glyph boundaries as they will be exported**.  
The component glyph's bounds (as set in `Layer`) are processed the same way, and all transformations will be relatives to the settings you selected.  

### Boundaries

| Selection       | Effect          |
|:-------------|:------------------|
| {% include btn ico="bounds-outside" %} | Use the glyph exported bounds (as seen in the inspector) |
| {% include btn ico="bounds-mixed" %} | Uses vertical mixed bounds : height from the exported bounds, width from the glyph. |
| {% include btn ico="bounds-mixed-hor" %} | Uses horizontal mixed bounds : width from the imported bounds, height from the glyph. |
| {% include btn ico="bounds-inside" %} | Ignore exported bounds & uses the glyph tight bounding box. |

<details markdown="1">
<summary>Show visual examples</summary>

Assuming square boundaries, host in blue, component in yellow.

Context : {% include btn ico="placement-right" %}, Layer : {% include btn ico="placement-left" %}   
{% include img a='views/comp-anchor-a.png' %}


Context : {% include btn ico="placement-top-right" %}, Layer : {% include btn ico="placement-top-right" %}  
{% include img a='views/comp-anchor-b.png' %}


Context : {% include btn ico="placement-top" %}, Layer : {% include btn ico="placement-center" %}  
{% include img a='views/comp-anchor-c.png' %} 


Context : {% include btn ico="placement-bottom-left" %}, Layer : {% include btn ico="placement-top" %}  
{% include img a='views/comp-anchor-d.png' %}

...And so on.

</details>

---

## Scale & Translation

Scale & translation are applied *after* the component has been anchored

{% include img a='views/context-bounds-translate.png' %}

| Property       | Effect          |
|:-------------|:------------------|
| Scale | Amount by which the component is scaled.|
|: **Translation** :||
| Horizontal Offset | Translates the component along the horizontal axis. |
| Vertical Offset | Translates the component along the vertical axis. |


---

## Advanced properties

Those three options don't look like much, but they drastically affect how a component behave, and even how every other components will be transformed.

{% include img a='views/comp-advanced.png' %}

### Path reversing

Path reversing is the poor's man boolean operation.  
This option allows you to effectively reverse the order in which the point are drawn in the vector path. It's interesting because when two path overlap, if they don't have the same orientation, *they create holes within other.*  
  
**Usually this is something you want to avoid, but given control over it, it makes it easy to create icon variations that appear to have a background.** *And other things... probably.*  

{% include img a='views/inverted-path.png' %}

*(the effect is much less appealing if a shape isn't encapsulated by the other)*

### Inherit previous component
<br>
When enabled, this option override the host bound so that the component uses a previous one as host.  
>At the time of writing, the effect is fairly limited since you can't choose *which* previous layer, it's automatically the first visible one.  

{% include img a='views/inherit-comp.gif' %}  

*In the gif above, the square inherit the triangle as host, while the main host is the circle glyph. All three are individual glyphs.*

This doesn't look like much as-is, but allows to create complex & reactive encapsulation of components.

### Control layer
<br>
When enabled, this option override the host bound for every layers, and instead replaces it with its own original (untransformed) bounds.
>This is especially useful when working with composite glyphs, for exemple the glyph `é` imports both `e` and `'` but doesn't have a path of its own.
>In such specific case, it's desirable than the `é` inherits the bounds from `e` to stay consistant with the font, all the while staying reactive to metrics updates.
{: .infos }

### Component states
<br>
{% include img a='views/comp-states.png' %}  

| Color       | Meaning          |
|:-------------|:------------------|
| Normal | A very normal component. Boring. |
| Blue | Indicates the component is currently flagged as 'control layer'. |
| Red | Indicates the current reference within the component creates a circular reference *(i.e, import a glyph within itself, or any chain or relationship that would result in a glyph importing itself)*, and cannot be displayed until the circular reference is fixed. |

---

## Transforms

Transform options are exactly the same one you can find in the {% include lk id='Glyph transformations' %}.

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

## Working with group selection

By default, only the components shared by every glyph in the active selection are shown. If you want to see all layer with at least 2 'users', you can enable the `Show partial matches` toggle.  

{% include img a='views/comp-multi.png' %}


> The {% include btn ico="up-short" %} & {% include btn ico="down-short" %} actions won't have noticeable effect, but are still applied. **The displayed order is NOT the order in which components are laid out in the glyphs.** Instead, they are sorted by the number of glyphs that are using them.
> Re-ordering layers while a group selection will indeed move them up or down *in their own context*, so this can have unwanted consequences.
{: .error}

> Be mindful when creating new components on a group of glyph. Components are merged for edit based on their imported glyph, hence if you click twice, each glyph will have effectively two empty component, but they will show as one with twice as many users.
{: .warning}
