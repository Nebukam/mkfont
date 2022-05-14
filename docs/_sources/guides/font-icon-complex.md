---
layout: page
parent: Guides
title: Composite icon font
subtitle: How to make an icon font
summary: A font with complex component interactions.
splash: icons/icon_component.svg
preview_img: placeholder.jpg
color: white
nav_order: 3
---

{% include header_card %}

> **While not required**, this guide assume that you have made yourself familiar with the {% include lk id='Asset preparation' %}.
{: .comment}

This guide is about creating a simple yet highly customizable icon font; by making heavy use of MkFont compositing capabilities. It only assumes that you have some assets to work with, and that you are using Adobe© Illustrator, because that's what you'll see in the screenshots -- but any SVG editor will work.  
{: .fs-6 .fw-300 }
We will be making roughly the same font icon as the one made through the {% include lk id='Simple icon font' %} guide.

#### Credits
{: .no_toc}
This example is using [Kenney's Game Icons](https://www.kenney.nl/assets/game-icons), which you will find packaged along with this guide' files, downloadable [here](https://nebukam.github.io/mkfont/assets/guides/simple-icon-font.zip).

## Final output
{: .no_toc}

We want a font with the following characters in it :

{% include img a='guides/cfont/comp-ref.png' %}  

#### Process
{: .no_toc }
- TOC
{:toc} 

---

## Breaking the design into components  
So, this one is a bit of a cheat because we know from the start what we want to icons to look like, which makes the process of breaking things into components much easier.  
First, let's roughly identify re-usable bits; loosely grouped by colors :  

{% include img a='guides/cfont/comp-identify.png' %}  

Each color group represent a single asset that can be re-used to create multiple glyphs -- thus speeding up the iterative process if updates need to be applied, or style tweaked.

>For the purpose of this guide, we will only focus on the composite icons, and ignore the 'hardcoded' ones.
{: .warning}

### Naming components

First thing first, we'll need names for these icons & components.  
Let's go with a simple naming convention : components will be prefixed with a c-, and icons with an i-.  
Here's the names I'm using for the components (and thus artboards).

<details markdown="1">
<summary>Show breakdown & name associations</summary>

| Component       | name          |
|:-------------|:------------------|
| {% include img a='guides/cfont/svgs/icons_c-arrow-big.svg' %} | c-arrow-big |
| {% include img a='guides/cfont/svgs/icons_c-arrow-short.svg' %} | c-arrow-short |
| {% include img a='guides/cfont/svgs/icons_c-arrow-small.svg' %} | c-arrow-small |
| {% include img a='guides/cfont/svgs/icons_c-arrow-sqr.svg' %} | c-arrow-sqr |
| {% include img a='guides/cfont/svgs/icons_c-bar-fat.svg' %} | c-bar-fat |
| {% include img a='guides/cfont/svgs/icons_c-bar-long.svg' %} | c-bar-long |
| {% include img a='guides/cfont/svgs/icons_c-bar-medium.svg' %} | c-bar-medium |
| {% include img a='guides/cfont/svgs/icons_c-bar-small.svg' %} | c-bar-small |
| {% include img a='guides/cfont/svgs/icons_c-bracket.svg' %} | c-bracket |
| {% include img a='guides/cfont/svgs/icons_c-btn-bg-circle.svg' %} | c-btn-bg-circle |
| {% include img a='guides/cfont/svgs/icons_c-btn-bg-rect.svg' %} | c-btn-bg-rect |
| {% include img a='guides/cfont/svgs/icons_c-gamepad.svg' %} | c-gamepad |
| {% include img a='guides/cfont/svgs/icons_c-lock-body.svg' %} | c-lock-body |
| {% include img a='guides/cfont/svgs/icons_c-lock-handle.svg' %} | c-lock-handle |
| {% include img a='guides/cfont/svgs/icons_c-speaker.svg' %} | c-speaker |
| {% include img a='guides/cfont/svgs/icons_c-sqr-small.svg' %} | c-sqr-small |

</details>

---

## Loose artboard setup

We're looking to have one svg file per component; so let's do a basic artboard set-up.  
Note that we don't care about alignment here, but **we do care about having a consistent scale to make our lives easier**.  
  
{% include img a='guides/cfont/comp-artboards.png' %}  

Another way to do it would have to copy and paste vector graphics directly into the app, but that's a bit tedious.
<details markdown="1">
<summary>I don't care about the artboards, I want to copy-paste</summary>

First, you will need to create ligatures for each of your components (unless you want to use existing unicode slots), *as this would normally be automated through batch import*.  
In order to do so, use the {% include lk id='Ligatures finder' a='#one-ligature-per-line' %}'s `one ligature per line` feature, with the following input :  

    c-arrow-big
    c-arrow-short
    c-arrow-small
    c-arrow-sqr
    c-bar-fat
    c-bar-long
    c-bar-medium
    c-bar-small
    c-bracket
    c-btn-bg-circle
    c-btn-bg-rect
    c-gamepad
    c-lock-body
    c-lock-handle
    c-speaker
    c-sqr-small

Then, in the {% include lk id='Content explorer' %}, naviguate to either {% include btn ico="text-style" label="My Glyphs" %} or {% include btn ico="text-liga" label="Ligatures" %}. From there, you can select glyphs and copy-paste your assets from Illustrator to MkFont; or import individual SVG files using {% include btn ico="document-download-small" %} at the top of the {% include lk id='Glyph inspector' %}. Handy!

</details>

---

## Naming icons

We'll need some names for our icons, as well. We could skip that bit for the sake of going faster and adding icons to any existing characters BUT; having them as ligatures will allow for more flexibility down the line : this will allow us to choose where to put our icons.  
>The "data structure" will look like : components (custom ligature) -> icon (custom ligature) -> unicode slot (know unicode slot).
>Again, this is not mandatory, but makes things more re-usable and flexible.

<details markdown="1">
<summary>List of icons names</summary>

Per color group, ignoring some of them, as well as the white ones :


    i-arr-big-e
    i-arr-big-w
    i-arr-big-n
    i-arr-big-s
    i-arr-big-nw
    i-arr-big-ne
    i-arr-big-se
    i-arr-big-sw
    i-arr-e
    i-arr-w
    i-arr-n
    i-arr-s
    i-arr-ns
    i-arr-ew
    i-grid-9
    i-list-a
    i-list-3-h
    i-list-3-v
    i-pause
    i-reduce
    i-expand
    i-minus
    i-plus
    i-mag-minus
    i-mag-plus
    i-mag-equal
    i-mag
    i-locked
    i-unlocked
    i-bin
    i-!
    i-warn
    i-dl
    i-ul
    i-spkr
    i-ffw
    i-fbw
    i-next
    i-prev
    i-sig-low
    i-sig-med
    i-sig-full
    i-gp
    i-plyr-1
    i-plyr-2
    i-plyr-3
    i-plyr-4
    i-btn-A
    i-btn-B
    i-btn-X
    i-btn-Y
    i-btn-1
    i-btn-2
    i-btn-3
    i-btn-L
    i-btn-R
    i-btn-L1
    i-btn-R1
    i-btn-L2
    i-btn-R2
    i-medal
    i-medal-2

</details>

---

## Creating a new MkFont document
Launch the app, create a new .mkfont, and give your font a name.  
That's the name that will be embedded into the exported `.ttf`.

{% include webm a='guides/cfont/create-new-mkfont.webm' %} 

---

## Importing the components
We're going to batch-import our components, it's pretty straightforward :

{% include webm a='guides/cfont/import-components.webm' %} 

#### What's going on here :
{: .no_toc}
- First, use {% include btn ico="directory-download-small" label="SVGs" %} to choose which files to import.
- If you have a strict naming convention, MkFont will be smart enough to isolate all common characters within the list of filenames, and strip them down. We just edit the automatically found prefix to make sure it doesn't strip down our `c-`, which will come in handy for the search.
> In our case, SVGs have been batch-exported from Illustrator, and are all named as icons_`artboard_name`.svg. Since we're not importing anything else, the `c-` is flagged as common to all imported filenames.
- Since we're importing icons and not tight characters, We changed the boundary mode to `imported` as opposed the default, `mixed` *(more suitable for characters)*.
- These are square artboards, we will tweak a few additional settings in order to have them best-fitted within the font :
    - Scaling is set to {% include btn ico="spread-ver" %} so that they match the Family height metric
    - Tweak the alignment & anchoring of the glyph so it is centered within our family metrics with ({% include btn ico="center-ver" %} & {% include btn ico="center-hor" %}) as opposed to the default {% include btn ico="font-baseline" %} that make the imported bounds sit on the baseline.
- We then select the {% include btn ico="text-liga" label="Ligatures" %}, and here they are, correctly named and imported.

>Reminder that **any transformation tweaks made during import can be changed afterward** -- it is available at import time for convenience only! In-depth infos : {% include lk id='Glyph transformations' %} & {% include lk id='Batch import' %}
{: .infos}

>Colors are ignored and stripped down on import.
{: .warning}

---

## Creating ligatures for the composite icons
Now that we have our components imported, we're going to need to create ligatures : **they will host & transform components**.  
A sensible list of icon is available in the details of the [Naming icons](#naming-icons) bit above -- we'll be using the {% include lk id='Ligatures finder' a='#one-ligature-per-line' %}'s `one ligature per line` feature, and {% include btn ico="new" label="Create all" %} of them.  

{% include webm a='guides/cfont/create-icon-ligatures.webm' %} 

#### What's going on here :
{: .no_toc}
- We paste a list of names separated by a new line into the {% include lk id='Ligatures finder' a='#one-ligature-per-line' %}.
- By enabling `one ligature per line`, each line is treated as a single ligature to be imported
- Since we want them all, no point in selecting them one by one *(this is only useful while doing text analysis)*, so we use the {% include btn ico="new" label="Create all" %} action.

---

## Compositing icons
Ok! Let's get to the meat of it.  
What we want to do now is rebuild our initial icons using the re-usable pieces we imported originally.  

### Start with the easy ones

{% include img a='guides/cfont/comp-hl-arr-1.png' %} 

We're going to start with the obvious, easy ones : arrows with basic transformations.

{% include webm a='guides/cfont/add-c-arrow-big.webm' %} 

#### What's going on here :
{: .no_toc}
- First, we'll turn the search ON, and look for ligatures with `arr-big` in their names. *These will be the 8 arrows icon pointing at cardinal directions.*
- We then select the 8 glyphs in the viewport.
- With the group selection active *(which, since everything is empty, doesn't look like much)*, we move to the {% include lk id='Glyph components' %} and open the glyph picker ({% include btn ico="component-new" %}).
- From there, we select which glyphs we want to create components from : there's just one in our case.
- Confirm the component creation with {% include btn ico="new" label="Add selected" %}.
- Change the boundary mode of the component so it fits the component itself -- this way it's perfectly centered
- Up the scale a bit, since the initial arrow felt a bit too small. We can change it later anyway.

Then, we will individually edit each component to give it the right orientation.

{% include img a='guides/cfont/comp-arrow-orient.png' %} 

We do so by selecting each ligature individually, and edit the `Rotation` value in the {% include lk id='Glyph components' a='#advanced-properties' %}'s Advanced properties. And that's it, we're all set with the first batch of big arrows.  

**Rince & repeat for the other arrows -- although with a twist.**  
The first four as easy ones, like the previous arrows above

{% include img a='guides/cfont/comp-arrow-orient-basic.png' %} 

The remaining two will combine two components :

{% include webm a='guides/cfont/add-c-arrow-reut.webm' %} 

#### What's going on here :
{: .no_toc}
- First, select the `i-arr-ew` *(or whatever name you used)*
- We will, again, use {% include btn ico="component-new" %} to add components to the glyph. Only this time, we'll add both `i-arr-e` & `i-arr-w`. 
- The components have their default transform, which is not what we're looking for. We will change the `anchoring` & `boundaries`, and add an `horizontal offset` so they are still aligned toward the center, but fit more snugly toward each other.

We'll repeat the same process for the vertical versions.


---

>## WORK IN PROGRESS.
>Come back later (～￣▽￣)～ 
{: .error}

---

## Removing the components from the font
Now that we have what we want, we'll remove our components from the exported font. Since they're assets, there's really no point in exporting them.