---
layout: page
parent: Guides
title: Tips and tricks
subtitle: Squeeze the most out of MkFont
summary: A few tips and tricks to optimize the place of MkFont within your workflow.
splash: icons/icon_new.svg
preview_img: placeholder.jpg
nav_order: 20
---

{% include header_card %}

## Using separate .mkfont files as re-usable libraries

There is currently no way to import an MkFont file into another, by design : you can copy/paste-in-place glyphs from an open document to another.  
What I tend to do is keep sets of glyphs in separate .mkfont files that I use as kind-of 'external libraries', pasting what I need from them to another .mkfont file using the {% include shortcut keys="Ctrl Shift C" %} / {% include shortcut keys="Ctrl Shift V" %} manipulation.  

> This is especially useful if, for example, you have a set of recurring characters that you end up including in different fonts; i.e controller icons and the like.
{: .infos}

---

## Using non-exported ligatures as re-usable named components

Since components work by importing existing glyphs, it comes in handy to create ligatures with human-readable names *(like you would with layers in a tidy photoshop document)*, set them to not be exported along with the font, and voila, you got yourself a component library!

> This is especially useful when working with complex icon sets, or when naming artboards as Unicode value isn't an option. The {% include lk id='Composite icon font' %} guide is a good demonstration of that.
{: .infos}

---

>## WORK IN PROGRESS.
>Come back later (～￣▽￣)～ 
{: .error}