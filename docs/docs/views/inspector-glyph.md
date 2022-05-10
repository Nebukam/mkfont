---
layout: page
parent: General interface
grand_parent: Documentation
title: Glyph inspector
subtitle: Edit individual & multiples glyphs here.
#summary: This is where most of the work happens -- clikety click!
splash: icons/icon_text-unicode-char.svg
preview_img: previews/glyph-inspector.png
toc_img: views/glyph-inspector-single.png
tagged: editor
nav_order: 6
---

{% include header_card.html %}

> For the various foldouts in full details, see
> - [Transformations](/docs/views/foldout-transforms)
{: .infos}

{% include img_toc.html %}

---

## Glyph preview

The glyph preview is non-interactive, and shows the all the metrics & guides that currently define the typographic space.

![Empty Glyph Inspector](/assets/images/views/glyph-inspector-previews.png)

>*The blue boundary box shows the glyph boundaries as currently seen by the transformation algorithm, according to the active transformation settings. If this is not what you were expecting, either play around with the [selected boundary options](/docs/views/foldout-transforms#boundaries), or check your source file.*
{: .comment }

---

# Empty slot inspection

>An empty slot is a that "does not exists". It's neither empty nor has a path, it's simply not part of the font.  
>Unless you started your doc by importing a `.ttf`, this is likely the first thing you'll interact with.
{: .comment }

![Empty Slot Inspector](/assets/images/views/glyph-inspector-null.png)

## Header actions

Actions are limited to the following when editing an empty slot :

| Action       | Effect          |
|:-------------|:------------------|
|: **Glyph identity** :||
| {% include shortcut.html keys="U+0000" %} | Copy the unicode address of the glyph to the clipboard. Ligatures will show as '_'-joint Unicode hex values. |
|: **Glyph actions** :||
| {% include btn.html ico="document-download" %} | Create new glyph by importing an SVG from an external file. *File will become bound for the session according to the app settings* |
| {% include btn.html ico="clipboard-read" %} | Create new glyph by importing clipboard content. Same as using {% include shortcut.html keys="Ctrl V" %}. |
| {% include btn.html ico="reset" %} | Create a new empty glyph. It becomes an customizable void. |
| {% include shortcut.html keys="Shift" %} + {% include btn.html ico="reset" %}  | Create a new glyph along with components matching the glyph composition, if any. |

---

# Single glyph inspection

![Single Slot Inspector](/assets/images/views/glyph-inspector-preview.png)

## Header actions

Action available in the inspector's header are the following

| Action       | Effect          |
|:-------------|:------------------|
|: **Glyph identity** :||
| {% include shortcut.html keys="U+0000" %} | Copy the unicode address of the glyph to the clipboard. Ligatures will show as '_'-joint Unicode hex values. |
|: **Glyph actions** :||
| {% include btn.html ico="document-download" %} | Import an SVG from an external file. *File will become bound for the session according to the app settings* |
| {% include btn.html ico="clipboard-read" %} | Import clipboard content. Same as using {% include shortcut.html keys="Ctrl V" %}. |
| {% include btn.html ico="reset" %} | Resets the glyph's contents to `empty`, but does not delete the glyph. It becomes an customizable void. |
| {% include shortcut.html keys="Shift" %} + {% include btn.html ico="reset" %}  | Resets the glyph contents & create components matching the glyph composition, if any. |
| {% include shortcut.html keys="Alt" %} + {% include btn.html ico="reset" %}  | Resets the glyph contents but keeps existing components. |
| {% include btn.html ico="document-edit" %} | Edit in place : create a temp SVG file with the glyph's contents, and open the default SVG editor on your system. Saving the SVG from said editor will update the asset within MkFont. *Note that if the glyph is currently bound to a file, this option is disabled. In order to make it available again, simply unlink the glyph from its file resource.* |
| {% include btn.html ico="clipboard-write" %} | Export glyph to clipboard. Same as using {% include shortcut.html keys="Ctrl C" %}. |
| {% include btn.html ico="remove" %} | Delete the glyph and its content. It won't be part of the font anymore. |

---

## Inspector blocks
Each foldout has its own dedicated page.

{% include card_any.html tagged="foldout" %}

---

## Settings

### Export

| Property       | Effect          |
|:-------------|:------------------|
| Export | Whether or not to include the glyph in the exported font. |

### Resource binding

![Empty Glyph Inspector](/assets/images/views/glyph-binding.png)

If the glyph is currently bound to a file, the binding and the ability to break it ( {% include btn.html ico="remove" %} ) will show under the preview. Bindings are created during external file imports, either individually using {% include btn.html ico="document-edit" %}, or during batch import.

>A glyph bound to a resource will re-import itself whenever the file is updated.
>- Empty path will be ignored *(i.e, if the file previously had content but not anymore)* and won't 'reset' the glyph. 
>- Deleted resources will be automatically unbound without affecting the glyph.  
> i.e, it's generally safe to bind resources, and it should never have *destructive* consequences *(unless you mess with your own art)*
{: .infos }

---

# Multiple glyph inspection

>Note that multi-glyph editing **only affect the glyph that exists**.  
>If you have empty slot within your selection, they will be ignored.
{: .warning }

![Multi Glyph Inspector](/assets/images/views/glyph-inspector-multiple.png)

When multiple glyphs are selected, changing parameters will apply to all the selected glyphs.  
You can click on any selected glyph within the viewport in order to "bump" it so it shows first within the first four previews.

## Header actions

Actions are limited to the following when editing groups :

| Action       | Effect          |
|:-------------|:------------------|
|: **Glyph identity** :||
| {% include shortcut.html keys="U+0000, U+0001" %} | Copy the unicode address of all the selected glyph to the clipboard, separated by `, `.<br>i.e : `U+006B, U+006C, U+006D` |
|: **Glyph actions** :||
| {% include btn.html ico="reset" %} | Resets the glyphs' contents to `empty`, but does not delete them. |
| {% include shortcut.html keys="Shift" %} + {% include btn.html ico="reset" %}  | Resets the all the glyphs in the selection & create components matching the glyph composition, if any. |
| {% include shortcut.html keys="Alt" %} + {% include btn.html ico="reset" %}  | Resets all the glyphs in the selection but keeps their existing components. |
| {% include btn.html ico="remove" %} | Delete the glyphs and their content. |


> If any glyph within the selection is bound to a file, a button will show at the very bottom of the inspector. When clicked, every bound item within the active selection will be disconnected from its resource on disk.

---

# Empty glyph inspection

>An empty glyph is a glyph that exists and takes space within a sentence. The actual space it will take is represented by an orange placeholder box.
{: .comment }

![Empty Glyph Inspector](/assets/images/views/glyph-inspector-empty.png)

*Not much to see here.*  
Empty glyph width can be changed by either tweaking the glyph' **Width**, **Shift** or **Push**
