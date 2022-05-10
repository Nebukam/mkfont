---
layout: page
parent: Dialogs
grand_parent: Documentation
title: Family Metrics
subtitle: Primary & reference properties for your font and its glyphs.
#summary: summary_goes_here
splash: icons/icon_layout.svg
preview_img: previews/family-metrics.png
toc_img: dialogs/family-metrics.png
#nav_order: 4
---

{% include header_card %}

>This is a key dialog in the app, it controls critical values that affect **every single glyph** within the font, and act as fallback values for glyphs transformations values that are left empty.
{: .warning }

{% include img_toc %}

## Resolution

| Property       | Comment          |
|:-------------|:------------------|
| EM Size |![EM Size <](/assets/images/dialogs/metrics-em.png) EM Size is super-duper important. Usually you set it once and forget about it, or simply leave it to the default `1000` value. *(That value may differ if you work from imported `.ttf`)*.<br>*Think DPI resolution, but for your font* |
| EM Resample | This toggle affects what happens when you are changing the EM Size. It is toggled `on` by default.<br>When active, changing the EM Size will resample all the other values of your font according to the new EM Size. This include other Family Metrics, *but any numeric value of each individual glyphs as well*.<br>On the contrary, if turned off, your font will look like it's either scaled up or down in the typographic space. |

>When copy/pasted from a document to another within MkFont, glyphs metrics are resampled to maintain their appearance as much as possible; *although you might run into some unexpected behaviors depending on the glyph transform settings*.

### Role of EM Size

![EM Size](/assets/images/dialogs/em-cycle.gif)

EM Size is ultimately responsible for how much precision you can squeeze out of your input paths. The lower, the less precision and the more "snapping" will occur.  
>The base value is **1000**. Lower tend to yield bad results, unless intentional.  
>Higher is better, however a glyph must ultimately fit within `-16,000` & `16,000; *meaning you get proportionally less horizontal space to work within that limit.*


<details markdown="1">
<summary>Show visual examples</summary>

| EM Value       | Degradation   |
|:-------------|:------------------|
|1000 | ![EM Size](/assets/images/dialogs/em-1000.png) |
|500 | ![EM Size](/assets/images/dialogs/em-200.png) |
|100 | ![EM Size](/assets/images/dialogs/em-100.png) |
|50 | ![EM Size](/assets/images/dialogs/em-50.png) |
|20 | ![EM Size](/assets/images/dialogs/em20.png) |

...And so on.

</details>

>Note that the viewport won't show the distortion, only the exported font will, as well as the [Preview Explorer]({{ '/docs/views/explorer-preview' | relative_url }}).
{: .warning }


## Metrics

The **Metrics**, as well as **Control Metrics** are the values that drive every single [Glyphs Transformations]({{ '/docs/views/foldout-transforms' | relative_url }}).  
They also act as fallback values for matching glyph parameters, such as `Height`, `Width`, `Shift`, `Push`, & `Vertical Offset`.

| Property       | Comment          |
|:-------------|:------------------|
| Baseline |![EM Size <](/assets/images/dialogs/metrics-bsl.png) The baseline is an horizontal axis, offset from the top of the typographic space. |
| Ascender |![EM Size <](/assets/images/dialogs/metrics-asc.png) The ascender is an horizontal axis, offset upward from the baseline. |
| Scale X+Cap | Similar to EM Resample, this toggle controls whether the `X height` & `CAP height` values should be rescaled according to updates made to the ascender.<br>X & Cap height are commonly encapsulated by the Ascender value. |
| Descender |![EM Size <](/assets/images/dialogs/metrics-dsc.png) The ascender is an horizontal axis, offset downward from the baseline. |

## Control Metrics

| Property       | Comment          |
|:-------------|:------------------|
| X height |![EM Size <](/assets/images/dialogs/metrics-x.png) The X height is an abstract horizontal axis, offset upward from the baseline.<br>It controls the size of the glyphs which scaling mode is set to `x-height` |
| CAP height |![EM Size <](/assets/images/dialogs/metrics-cap.png) The CAP height is an abstract horizontal axis, offset upward from the baseline.<br>It controls the size of the glyphs which scaling mode is set to `cap-height` |
| Height | Default glyph height. This is only useful for specific [scaling modes]({{ '/docs/views/foldout-transforms#scaling' | relative_url }}), and does not represent the height of your font. That would be the EM Size. |
| Width | Default glyph width. This is used by various [Glyphs Transformations]({{ '/docs/views/foldout-transforms' | relative_url }}), acts as a default value when a glyph's `width` is empty. |
| Monospace | When set to true, the width of *every single glyph* within your font will have the width set in the Control Metrics. |

## Default Transformations
>These define the base & default values used by any glyph that doesn't have a value set for these properties.  
>For more details, check out the [**Glyph transformation**]({{ '/docs/views/foldout-transforms#advanced' | relative_url }}) doc.
{: .error}