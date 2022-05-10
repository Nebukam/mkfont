---
layout: page
parent: General interface
grand_parent: Documentation
title: Font viewport
subtitle: Navigate & search through Unicode slots.
#summary: summary_goes_here
splash: icons/icon_view-grid.svg
preview_img: previews/viewport-unicode.png
toc_img: views/viewport-full.png
tagged: editor
nav_order: 2
---

{% include header_card %}

>## Bound the the [Content explorer](explorer-content)
>{: .no_toc :}
>The contents of the viewport is determined by the items selected within the [Content explorer](explorer-content).  
>Actions & search are applied within the limits of the selected range. Note that some ranges represent all glyphs within your font, or even all known Unicode points, so be careful!
{: .infos}

{% include img_toc %}


## Header

The header is rather straightfoward : the name displayed is the one of the range currently displayed; as well as it's type and number of glyphs it covers.  
If the type is a named Unicode range, the first tag will show the start & end address of the block in hexadecimal form. *For example, Basic Latin goes from U+0020 to U+007F. (control characters are omitted)*
The second tag shows how many glyphs are contained within the active range. *(This is important because [modified actions](#action-modifiers) affect ALL the glyphs within the range, no matter the active selection)*

### Actions

![Viewport Header](/assets/images/views/viewport-header.png)

The Font Viewport has a few available actions, displayed on the bottom right of the header.  
**By default, these actions are applied to the active selection of glyph within the viewport.**

| Modifier       | Action          |
|:-------------|:------------------|
|: **Create glyphs** :||
| {% include btn ico="new" %} | Create empty glyphs in Unicode slots that have no glyph yet. Does **not** overwrite existing ones. |
| {% include shortcut keys="Shift" %} + {% include btn ico="new" %} | Same as above, applied to the entire viewport content. |
|: **Text references** :||
| {% include btn ico="text-unicode-char" %} | Copy the unicode characters to the clipboard, with each value separated by a newline character : `\n`. *(see [note](#note-on-unicode-lists))* |
| {% include shortcut keys="Shift" %} + {% include btn ico="text-unicode-char" %} | Same as above, applied to the entire viewport content. |
| {% include btn ico="text-unicode" %} | Copy the unicode hex values to the clipboard, with each value separated by a newline character : `\n`. *(see [note](#note-on-unicode-lists))* |
| {% include shortcut keys="Shift" %} + {% include btn ico="text-unicode" %} | Same as above, applied to the entire viewport content. |
|: **Third parties** :||
| {% include btn ico="app-illustrator" %} | Create & execute a JSX script that will prompt Adobe© Illustrator to create a new document with artboard set-up for each selected glyph, properly named in order to be exported easily. *(see [third party](/features/third-party))* |
| {% include shortcut keys="Shift" %} + {% include btn ico="app-illustrator" %}| Same as above, applied to the entire viewport content.  |
|: **Deletion** :||
| {% include btn ico="remove" %} | Delete selected glyphs. |
| {% include shortcut keys="Shift" %} + {% include btn ico="remove" %}| Same as above, applied to the entire viewport content. |

## Search

![Viewport Search](/assets/images/views/viewport-search-abc.png)

The search feature is rather simple in its form, yet quite powerful.
**It's important to note that the search results are constrained by the currently selected range.** Hence, if you want your search to be as broad as it can possibly be, select the {% include btn ico="text" label="All Unicode" %} range.  
The search needs to be enabled to produce results.

> Search is **inclusive**, not *exclusive*. That means that the more terms you search for, the more results you'll get -- not the other way around.
{: .warning}

> If you want to search through **all known & referenced Unicode**, select the {% include btn ico="text" label="All Unicodes" %} range within the [Content Explorer](explorer-content).
{: .infos}

### Search terms

| Search       | Result          |
|:-------------|:------------------|
| unique character : `a`, `0` | Will find any glyph that match in either its character representation, or isolated in its name.<br>*In the case of ligatures, each linked character is looked at individually.* |
| space-separated individual characters : `a b c`, `0 a N` | Same as unique search, but will combine the results |
| Chain of characters : `circle`, `letter`, `lowercase` | These are compared against a glyph *identity*, as shown at the very top of the [Glyph Inspector](inspector-glyph). |
| Any combination | Will work. |

### Search modifier

| Modifier       | Result          |
|:-------------|:------------------|
| **Relatives** | Search will include all related glyphs to the initial result of your search.<br>*Relatives search looks outside the current viewport range.*<br>![Viewport Search](/assets/images/views/viewport-search-relatives.png) |
| **Exists** | Limit the results to glyphs that actually exists within your font.<br>*If the search terms are empty but this is enabled, the search will show all existing glyphs within the current viewport range.*<br>![Viewport Search](/assets/images/views/viewport-search-exists.png) |

## Selection

Selecting slots within the viewport is done using the mouse.  
Expected selection behaviors apply :
- Holding {% include shortcut keys="Ctrl" %} toggle a slot selection state. i.e, if it's selected it will be unselected, and vice-versa.
- Holding {% include shortcut keys="Shift" %} while selecting another slot will select all the slot between the last selected slot and the new one.
- {% include shortcut keys="Ctrl A" %} will select everything available within the range.
- See [Shortcuts](../shortcuts#in-the-viewport-unicode) for more infos.

> *Note that selection isn't lost if you click on an already selected item : this is by design. Instead, it will "bump" that item so it becomes the first item in the active selection. This is especially useful when editing large selection, as it allow you to change which glyphs are previewed in the [Glyph Inspector](inspector-glyph).*
{: .comment}

## Slots

### States

| State       | Meaning          |
|:-------------|:------------------|
| ![Slot Null](/assets/images/views/slot-null.png) | Glyph does not exists; default character preview is shown. |
| ![Slot Empty](/assets/images/views/slot-empty.png) | Glyph exists and is empty. |
| ![Slot Exists](/assets/images/views/slot-idle.png) | Glyph exists and has a path. |
| ![Slot Not Exported](/assets/images/views/slot-no-export.png) | Glyph exists and has a path, but is flagged to be ignored during export. |
| ![Slot Out of Bounds](/assets/images/views/slot-oob.png) | Glyph exists and has a path, but it is out-of-bounds.<br>As such, it won't be exported. |

> An out-of-bound glyph highlights a path that is so big in size it can't fit : **glyph path must be kept within `-16,000` & `16,000` after transformation**. Some reasons your glyph is OoB :
> - Your EM value in the font metrics is too large
> - There's an artifact somewhere in the path, maybe a single point lost somewhere, far away.
> - You're using manual scale that makes things go boom.
> - You're using "no scaling" with an asset that is gigantic *(who makes 64k pt SVGs ?!)*.
{: .error}

### Quick menu
When a slot is selected, a quick menu shows up on hover, with the following options (depending on whether the glyph exists or not) :

| Icon       | Action          |
|:-------------|:------------------|
| {% include btn ico="new" %} | Creates an empty glyph. |
| {% include btn ico="remove" %} | Removes the glyph. |
| {% include btn ico="text-unicode" %} | Copy that glyph unicode hex value to the clipboard, in the form `U+0000`. *This is mostly useful to quickly find a glyph hex ID for automation & artboards*|

---

## Notes

### Display options

Display options are located at the bottom of the viewport.  
For now there is only one preview option : preview size. Yes, that small lonely slider!

### Note on unicode lists

Copying glyph characters is especially useful when you need to generate narrowed down atlases for your font, or simply need a quick wait to generate a parse-able list of glyphs.  

The {% include btn ico="text-unicode-char" %} action will generate this kind of results :

    A
    B
    C
    D

The {% include btn ico="text-unicode" %} action will generate this kind of results :

    U+0041
    U+0042
    U+0043
    U+0044

## Shortcuts

| Shortcut       | Action          |
|:-------------|:------------------|
| {% include shortcut keys="Ctrl C" %}           | Copy a single glyph to the clipboard* |
| {% include shortcut keys="Ctrl V" %}           | Paste the content of the clipboard in the selected glyph slot.<br>Supports pasting directly from Adobe Illustrator! |
| {% include shortcut keys="Ctrl Shift C" %}           | Copy the selected glyphs & their unicode position in memory* |
| {% include shortcut keys="Ctrl Shift V" %}           | Paste the glyphs copied using {% include shortcut keys="Ctrl Shift C" %} to their matching unicode slots. This is especially *(if not only)* useful to paste glyphs from an .mkfont to another in batch, while retaining their unicode positions. |
| {% include shortcut keys="Ctrl Alt V" %}           | Applies the transform of the glyph stored in memory using {% include shortcut keys="Ctrl C" %} to all glyphs in the active selection. Does **not** affect the path. |
| {% include shortcut keys="DEL" %}           | Deletes the selected glyphs |

>Note on copy/pasting glyphs : glyphs are copied into SVG format, with transform information embedded as SVG attributes. This means that you can safely use the clipboard's content in any SVG-friendly app, and that casually pasting within MkFont will retain transform settings.
{: .comment }

