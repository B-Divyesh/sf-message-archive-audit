# Archive Audit visual thesis

## Direction — handwritten lab notebook

Archive Audit should feel like a careful, durable field record: a warm recycled-paper desk surface, ink annotations, ruled margins, graphite marks and a practical evidence tag. This makes the work of checking a fragile message export feel calm and legible, not technical or cloud-dependent. The page uses intentional unevenness only in illustration and small labels; data itself stays precise and tabular.

## Tokens

| Role | Light | Dark |
| --- | --- | --- |
| paper / background | `#f6f0e2` | `#20231e` |
| surface | `#fffaf0` | `#2a2e27` |
| ink / text | `#20261f` | `#f4efe2` |
| muted ink | `#5e6659` | `#bcc4b7` |
| notebook green / accent | `#23624c` | `#87c8a0` |
| ochre / warning | `#8a5314` | `#ffc477` |
| vermilion / danger | `#a33b2b` | `#ff9a87` |
| checked / success | `#176547` | `#79d7a6` |

The ink-on-paper contrast is at least 4.5:1. Both modes preserve the same note-book materiality rather than using a generic inverted palette.

## Type and spacing

System serif (`Georgia`) handles editorial labels and the title; `ui-monospace` is used for hashes, counts and filenames, reinforcing auditability without a font download. Base copy is 17px/1.55. The scale is 12, 14, 17, 21, 28, 42px. Layout uses a 4px rhythm, broad 24–40px page padding and 16–24px group gaps. Tables use tabular figures.

## Interaction and motion

Controls are stamped-paper buttons with clear focused ink outlines. A dropped file creates a short 180ms settle animation and results appear like a new page placed onto the desk; reduced-motion users get an instant opacity state. No continuous movement. Missing or uncertain material is always written out, never color-only.

## Asset plan and provenance

One original hero illustration accompanies the empty state: a top-down field notebook containing a sealed envelope, paperclip, tiny attachment thumbnails and a green verification stamp. It is supporting context, not an app mockup. Generated 2026-08-28 with the factory Azure image generator, then reviewed and optimised to WebP. Prompt sheet:

> Use case: illustration-story. Asset type: product empty-state illustration. Primary request: a top-down hand-painted editorial illustration of a well-used archival field notebook beside a sealed envelope, a paperclip, small attachment photographs, and a simple green verification tick. Scene/backdrop: warm recycled cream paper desk. Style/medium: tactile gouache and graphite pencil, subtle paper fibers, contemporary editorial. Composition: square, objects centered with generous quiet edges. Lighting/mood: soft window light, calm and trustworthy. Color palette: parchment cream, forest green, graphite, restrained ochre. Constraints: no text, no letters, no logos, no watermark, no brands, no people, no interface screenshots.

The asset is original generated artwork; its source prompt is also retained beside the source image in `assets/src/hero-notebook.png.json`. Footer copy discloses this.

The 1200×630 social card is a local crop-and-frame composition of that same original artwork. It adds parchment space and notebook-green edge bands without introducing another visual source.
