---
layout: page
parent: Guides
title: Complex icon font
subtitle: How to make an icon font
summary: A font with complex component interactions.
splash: icons/icon_checkbox-radio.svg
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
This example is using [Kenney's Game Icons](https://www.kenney.nl/assets/game-icons), which you will find packaged along with this guide' files, downloadable [here](https://nebukam.github.io/mkfont/assets/guides/simple-icon-font.zip).

## Final output

## Breaking the design into components  
So, this one is a bit of a cheat because we know from the start what we want to icons to look like, which makes the process of breaking things into components much easier.  
First, let's identify the most re-used bits