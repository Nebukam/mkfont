---
layout: page
title: About
nav_order: 10
permalink: /about/
---
<div class="product-header" style="--img:url('{{ baseurl }}/assets/images/placeholder.jpg');"><div class="infos" markdown="1">
# I'm Tim!
I made this.
{: .fs-6 .fw-300 } 
<a class="github-button" href="https://github.com/Nebukam" data-color-scheme="no-preference: dark_dimmed; light: dark_dimmed; dark: dark_dimmed;" data-size="large" aria-label="Follow @Nebukam on GitHub">Follow @Nebukam</a>
</div></div>
---

I made **MkFont** as a way to easily export font out of SVG files.  
There are tons of tools out there that do similar things, even fully fledged glyph editors; but nothing in between.  
{: .fs-6 .fw-300 }
**MkFont attempts to fill the gap.**
{: .fs-6 .fw-300 }

I love my current workflow & tools when it comes to vector graphics, and don't want to have to deal with tools I don't feel comfortable with. Yet, font export tools out there are often very limited in their feature set when it comes to font metrics, don't have GUIs, or simply introduce lot of friction if you're into fast iterations : I can't be the only one!  
**MkFont** hopefully make this super easy : export, batch import, edit in place, tweak metrics, all at a blazing-fast speed.  

### Not a glyph editor
MkFont is *not* a glyph editor, and never will be. That's the opposite of the point made above.  
Since it's not an editor, it may come out as a really terrible piece of software to academic typographer & typography lovers.  
*And it's ok!* This is not what MkFont has been designed for :)  
If you're curious, here's a [small thread](https://twitter.com/nebukam/status/1493683647274229765) full of gifs and screenshots the MkFont development process.

### Source code
**MkFont** is licensed under MIT : if you want to look at the code, or if you're worried it could hurt your machine, the code is available in full on [github](https://github.com/Nebukam/mkfont)! You can even compile it yourself.

### Bugs!
If you encounter a bug, please fill an issue [here](https://github.com/Nebukam/mkfont/issues).  
Since MkFont run in electron, you can also run the app with the `-dev` launch parameter, which will provide you access to the console, and thus more details on any error that might be coming up.  
If you submit a bug, depending on its nature I may ask for the faulty .mkfont file : if you're working on secret stuff, it would be great if you're capable of reproducing the bug with assets you're in a position to share publicly.


### Built with NKMjs
**MkFont** is built using my own multi-platform framework, [**NKMjs**](https://github.com/Nebukam/nkmjs).  
It runs with [**Electron**](https://www.electronjs.org/).