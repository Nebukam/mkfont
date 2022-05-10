---
layout: page
parent: General interface
grand_parent: Documentation
title: History explorer
subtitle: Your friendly time machine.
#summary: summary_goes_here
splash: icons/icon_refresh.svg
toc_img: views/action-stack-full.png
preview_img: previews/explorer-history.png
tagged: explorer
nav_order: 5
---

{% include header_card %}

>The history explorer is where you can see all the commands that have been executed within the editor since the beginning of the session.  
{: .infos }

## Fast back'n forth

You can click any action to go back to that point in time.  
You can also use {% include shortcut keys="Ctrl Z" %} / {% include shortcut keys="Ctrl Y" %} to Undo/Redo actions in order.  

![Preview Explorer Select](/assets/images/views/action-stack-rewind.png)


## Flush.

>The history needs to be manually flushed out to free up memory.
{: .warning }

**There is currently no limit to the number of actions that are stored in the history.  **
This is primarily because some actions cannot be "merged" into one (like some are : if you repeatedly change the same value, it only creates a single action.) and this creates a lot of spam in there, ultimately making iteration something that could kill your ability to go back to previous modifications.  

*With great power comes great responsibility and all that.*
