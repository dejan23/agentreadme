# agentreadme design system

The source of truth for how this product looks. Every page follows it.

## The memorable thing

**"It's my repo, not the model."** A visitor should leave believing that agent
failures are a property of their repository. Every design decision serves that
one claim. A design memorable for everything is memorable for nothing.

## Aesthetic

Confident, high-contrast, evidence-forward. The page argues a position and shows
the data that backs it, in that order. Reference point is bun.sh: white ground,
one very loud accent, display type large enough to be a poster, and a chart that
proves the claim before the reader scrolls.

Not a document, not a dashboard, not a SaaS landing page.

## Color

Restrained to three values plus neutrals. Color is never decorative.

```
--bg      #FFFFFF   pure white, the only ground
--ink     #0A0A0A   all primary text
--ink-2   #525252   secondary prose
--ink-3   #8A8A8A   captions, quiet metadata
--rule    #E5E5E5   1px hairlines
--track   #F6F6F6   empty portion of any bar
--acc     #FF3D00   accent, fills and marks
--acc-t   #D62E00   accent for text, meets contrast on white
```

**The accent is rationed.** One word per headline. The failing rows of a chart.
The number in a statistic worth arguing about. It marks what the reader should
be alarmed by, never what is fine. A page with accent on everything has none.

No green. No amber. No traffic-light scale. Every audit tool on earth uses one,
and refusing it is part of the identity.

Dark is used as a full-bleed band, not a theme: `--ink` background, white text,
`#A3A3A3` for captions. Two per page at most, as structural punctuation.

## Typography

```
display + body    Archivo        400 500 600 700 800
code + data       JetBrains Mono 400 700
```

Never Inter, Roboto, Space Grotesk, or system-ui as a display or body face.
system-ui in particular reads as giving up on typography.

```
h1   66px / 0.93 / -0.022em / 800     clamp down to 40px on mobile
h2   44px / 0.98 / -0.025em / 800
h3   15px / 1.4  / normal   / 700
lede 19px / 1.5  / --ink-2  / max 44ch
body 16px / 1.5
mono 13.5px, tabular figures for anything in a column
```

Display type is tight: negative tracking, sub-1.0 leading. That density is what
separates a poster from a paragraph.

## Layout

1120px maximum, 32px gutters. Sharp corners everywhere, `border-radius: 0`.
Borders are 1px `--rule`, or 2px `--ink` when an element is interactive.

The hero is asymmetric: argument on the left, evidence panel on the right. That
pairing is the core layout idea and it repeats.

Rhythm down the page: hero, dark band, two-column explainer, dark band or code,
closing call to action at display size. Sections divide with a 1px rule, never
with a shadow or a card.

No cards nested in cards. No three-column icon grids. No centered body text,
with one exception: the closing call to action on each page is centred, and so
is the footer. Those are the two moments where the page stops arguing and asks
for something, and centring marks the change of mode.

A text section is a full-width heading over a measured column, or a two-up text
grid. Never a 50/50 split with a short heading on one side, which leaves half
the page empty.

## Spacing

4px base. Sections 56px vertical. Related elements 9 to 14px apart. Dense enough
to feel like an instrument, open enough to read.

## Motion

Motion is reserved for one idea: **the instrument taking a reading.** Bars grow
from zero and figures count up to their value when they first come into view.
That is the product's central act made visible, so it earns its place. Everything
else stays still.

```
bars     scaleX 0 to 1, 750ms, cubic-bezier(.22,.8,.24,1), 55ms stagger
figures  count to value, 900ms, ease-out cubic
hover    colour only, never position or scale
```

Each element animates **once**, on first view, never on a loop. No scroll
choreography, no parallax, no entrance animation on text or layout.

`prefers-reduced-motion: reduce` disables all of it, and every figure is present
in the served HTML at its final value, so the page is correct with JavaScript
off and for crawlers.

## Components

**Search field.** 2px `--ink` border, monospace input, solid `--ink` button that
goes `--acc` on hover. It is the primary action on every page.

**Bar row.** 78px label, `--track` bar 26px tall, monospace value right-aligned.
Fill is `--ink` normally and `--acc` when the row is the point being made.

**Stat band.** Full-bleed `--ink`. Numbers at 72px/800. One number in `--acc`.

**Report block.** `--ink` background, JetBrains Mono, accent on failures only.

## Anti-patterns

Gradients of any kind. Rounded corners. Drop shadows. Glassmorphism. Purple or
violet. Icon tiles above headings. Three-column feature grids. Stock imagery.
Emoji as interface. "Built for" and "Designed for" copy. Testimonials we do not
have. A pricing table for a free tool.

## Voice

Plain, direct, specific. Claims carry numbers. No hedging, no hype, no em dashes.
Say what the reader loses by ignoring us, then show the evidence.
