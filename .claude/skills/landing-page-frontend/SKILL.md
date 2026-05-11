---
name: landing-page-frontend
description: >-
  Builds and refines marketing landing pages and small static sites with clear
  hierarchy, performance, accessibility, responsive layout, and SEO/social
  metadata. Use when creating or editing landing pages, marketing heroes,
  brochure sites, lead-capture pages, or static frontends with minimal runtime
  JavaScript.
disable-model-invocation: true
---

# Landing page and marketing frontend

Assume the agent already knows generic framework APIs; this skill adds **product and quality bar** expectations for **conversion-focused, mostly static** pages.

## Goals (in order)

1. **Clarity:** one primary message; one primary CTA; scannable sections.
2. **Trust:** honest copy, readable legal/contact paths, no dark patterns.
3. **Quality:** fast load, accessible by default, reasonable SEO/social previews.

## Information architecture

- **Above the fold:** value proposition, supporting line, primary CTA, optional secondary low-friction action.
- **Body:** social proof, features/benefits (benefit-led copy), FAQ/objections, final CTA.
- **Footer:** sitemap links, contact, privacy/terms when applicable.

## HTML and layout

- Use **semantic landmarks:** `header`, `main`, `nav`, `footer`, heading hierarchy **one `h1` per page**.
- Prefer **flex/grid** and **fluid type** (`clamp()`) over fixed pixel typography for common breakpoints.
- **Responsive images:** `width`/`height` or aspect-ratio to reduce CLS; `loading="lazy"` below the fold; appropriate formats (SVG, AVIF/WebP with fallbacks as needed).
- **Motion:** respect `prefers-reduced-motion`; avoid auto-playing video with sound.

## Performance (Core Web Vitals mindset)

- Default to **minimal JS** on marketing pages; defer non-critical scripts.
- Keep **LCP** image discoverable and not delayed by late JS; avoid huge hero assets.
- Minimize layout shifts (**CLS**): reserved space for media, fonts, embeds.
- Keep main-thread work small for **INP** if the page is interactive.

## Accessibility (baseline)

- Keyboard: all interactive elements focusable and operable; visible **focus** styles.
- Color: text/graphics meet contrast expectations; do not rely on color alone for meaning.
- Forms: **labels** (visible or sr-only) tied to inputs; clear error text and `aria-live` for async errors when relevant.
- **Alt text** that conveys purpose; decorative images: empty `alt` or CSS background.

## SEO and sharing

- Unique **`title`** and **meta description**; canonical URL when duplicates exist.
- Open Graph / Twitter card tags where the site is shared publicly.
- `lang` on `<html>`; clean slugs and heading structure for skim-reading.

## Content security and privacy

- Never embed untrusted HTML; sanitize rich text if user-supplied.
- Third-party widgets (analytics, chat): load intentionally; document cookie/consent expectations if the client requires it.

## In Dark Factory repos

When work lives under `clients/**/web/`, also follow **dark-factory-product-web** (`npm run build` → **`dist/`**).

## Optional deep references

Split long checklists into page-specific notes in the ticket or PR rather than bloating this file.
