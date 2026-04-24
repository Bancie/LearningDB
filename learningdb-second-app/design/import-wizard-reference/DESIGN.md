# Design System Specification

## 1. Overview & Creative North Star
### The Digital Curator
The objective of this design system is to transform a complex database utility into a high-end, editorial management experience. We move beyond the "template" look of traditional enterprise software by treating data as curated content. 

The **Creative North Star**—*The Digital Curator*—dictates a layout that feels intentional and architectural. By utilizing high-contrast typography scales and generous "white space" that acts as a structural element rather than a void, we create an environment of absolute clarity. The interface relies on sophisticated tonal shifts rather than heavy borders, ensuring the focus remains on the information architecture and the user's workflow.

---

## 2. Colors & Surface Logic

This system utilizes a refined palette where the primary blue functions as an authoritative anchor, while neutral tones define the spatial environment.

### The Palette
*   **Primary Anchor:** `primary` (#005dac) for core branding and `primary_container` (#1976d2) for high-visibility headers.
*   **The Content Canvas:** `surface` (#f9f9f9) and `surface_container_lowest` (#ffffff).
*   **Structural Neutrals:** `surface_container` (#eeeeee) for sidebars and `outline_variant` (#c1c6d4) for subtle accents.

### The "No-Line" Rule
To achieve a premium editorial feel, **1px solid borders are prohibited for sectioning.** Hierarchy must be established through background color shifts. For example, a navigation sidebar should use `surface_container` to sit adjacent to a `surface` content area. The transition between these planes provides all the structural definition required without the visual "noise" of lines.

### Surface Hierarchy & Nesting
Think of the UI as layers of fine paper. 
1.  **Base Layer:** `background` (#f9f9f9)
2.  **Structural Zones:** Sidebars or secondary panels use `surface_container_low` (#f3f3f3).
3.  **Active Workspace:** Main content areas use `surface_container_lowest` (#ffffff) to "pop" forward.

### The Glass & Gradient Rule
For floating elements like dropdown menus or modals, use `surface_container_lowest` with a 90% opacity and a `20px` backdrop-blur. To give buttons and headers "soul," apply a subtle linear gradient from `primary` (#005dac) to `primary_container` (#1976d2) at a 135-degree angle.

---

## 3. Typography: The Editorial Voice

We use **Inter** to provide a functional yet modern aesthetic. The hierarchy is designed to guide the eye through complex data sets with ease.

*   **Display (Large/Medium):** Reserved for dashboard hero stats or empty state introductions. High-impact, low weight (300-400).
*   **Headline (Small):** `headline-sm` (1.5rem). Used for page titles like "Import Data." It should feel authoritative.
*   **Title (Medium/Small):** `title-md` (1.125rem). Used for card headers and section groupings.
*   **Body (Medium):** `body-md` (0.875rem). The workhorse for all data entries and primary text. 
*   **Label (Medium):** `label-md` (0.75rem). Used for button text and form labels, always in Medium (500) weight for legibility.

The juxtaposition of a `display-sm` value next to `body-md` content creates the "Editorial" feel—emphasizing the difference between *where you are* and *what you are doing*.

---

## 4. Elevation & Depth

### Tonal Layering
Depth is achieved through the "stacking" of surface tokens. A card (Surface Container Lowest) placed on a background (Surface) creates an organic lift.

### Ambient Shadows
Avoid standard CSS shadows. When an element must float (like a modal), use an ambient shadow:
*   **Shadow:** `0px 8px 24px rgba(26, 28, 28, 0.06)`
The shadow color is derived from `on_surface` at a very low opacity to mimic natural light diffraction.

### The "Ghost Border" Fallback
In rare cases where contrast is insufficient (e.g., a white input on a white card), use a **Ghost Border**: `outline_variant` (#c1c6d4) at 15% opacity. It should feel like a suggestion of a boundary, not a hard stop.

---

## 5. Components

### Navigation Items
*   **Style:** Sidebar items use `label-md` with generous vertical padding (12px).
*   **Active State:** Use `secondary_container` (#bad3fd) with a `lg` (0.5rem) corner radius. Do not use a vertical line to indicate selection; use the background pill.

### Buttons
*   **Primary:** Gradient of `primary` to `primary_container`. Text: `on_primary` (#ffffff). Radius: `md` (0.375rem).
*   **Secondary:** Ghost style. No background, `outline_variant` at 20% opacity for the border, text in `primary`.

### Form Elements (Inputs & Dropdowns)
*   **Container:** `surface_container_low` (#f3f3f3) with a `Ghost Border`.
*   **Label:** `label-md` floating within the border line (Material-style) or positioned 8px above the field.
*   **Active State:** Border transitions to `primary` (#005dac) at 100% opacity, 2px thickness.

### Cards & Data Tables
*   **Forbid Dividers:** Do not use lines to separate rows. Use a 4px vertical gap or alternate row colors between `surface` and `surface_container_lowest`.
*   **Nesting:** Place table headers in `surface_container_high` (#e8e8e8) to anchor the data.

---

## 6. Do's and Don'ts

### Do:
*   **DO** use whitespace as a separator. If you think you need a line, try adding 16px of padding instead.
*   **DO** use the `full` (9999px) radius for chips and status tags to contrast against the `md` radius of structural cards.
*   **DO** ensure text contrast ratios meet WCAG AA standards, especially when using `secondary` and `tertiary` tones.

### Don't:
*   **DON'T** use 100% black (#000000) for text. Always use `on_surface` (#1a1c1c) for a softer, premium feel.
*   **DON'T** use shadows on every card. Reserve shadows for elements that physically move or float over the layout.
*   **DON'T** mix corner radii. Stick to the scale: `md` for inputs/buttons, `lg` for cards, and `none` for top-level headers.