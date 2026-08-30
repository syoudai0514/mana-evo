# Phase 2C-D FINAL — F066

Base integration commit: `e38fade5bd8b79e9d7fd90ca8a5a5bdf302eea11`

| Species | Final decision | Pixel evidence | Applied operation |
| --- | --- | --- | --- |
| m193 | REPAIRED | 512×512 RGBA; all 262,144 source pixels opaque; four corners and the full border were #FEFEFE / alpha 255 | Removed 170,471 border-connected near-white background pixels; 91,673 retained pixels kept their decoded RGB exactly |
| m194 | REPAIRED | 512×512 RGBA; all 262,144 source pixels opaque; four corners and the full border were #FEFEFE / alpha 255 | Removed 174,693 border-connected near-white background pixels; 87,451 retained pixels kept their decoded RGB exactly |
| m195 | REPAIRED | 512×512 RGBA; all 262,144 source pixels opaque; four corners and the full border were #FEFEFE / alpha 255 | Removed 186,648 border-connected near-white background pixels; 75,496 retained pixels kept their decoded RGB exactly |

Method: starting from all four canvas edges, flood only pixels within RGB distance 18 of the measured uniform background #FEFEFE. Set that connected plate transparent. Preserve every other decoded RGB value and the original 512×512 geometry. No crop, painting, reconstruction, generation, or FORMAL promotion.

Post-write validation: every retained output pixel has identical RGB to its archived original; all three output borders have zero nontransparent pixels; output alpha values are only 0 or 255.
