# DESIGN.md - Claude Design System

**Template:** Claude (Anthropic's AI Assistant)  
**Vibe:** Warm, professional, modern, accessible  
**Color:** Terracotta accent, clean editorial layout  
**For:** 4 templates (Web + Mobile)

---

## 1. Visual Theme & Atmosphere

**Tone:** Approachable yet premium. Warm minimalism with editorial clarity.

**Density:** Generous whitespace. Content-first, not cluttered.

**Mood:** Trustworthy, intelligent, human-centered. Not cold or corporate.

**Inspiration:** Anthropic's Claude brand - warm terracotta, clean typography, accessible design.

---

## 2. Color Palette & Roles

### Primary Colors
```css
--color-primary: #d97706;              /* Terracotta - Main accent */
--color-primary-light: #f59e0b;        /* Lighter terracotta */
--color-primary-dark: #b45309;         /* Darker terracotta */
```

### Neutral Colors
```css
--color-text: #111827;                 /* Near-black text */
--color-text-secondary: #6b7280;       /* Gray text */
--color-text-tertiary: #9ca3af;        /* Light gray text */
--color-background: #ffffff;           /* White background */
--color-surface: #f9fafb;              /* Light gray surface */
--color-border: #e5e7eb;               /* Light border */
```

### Semantic Colors
```css
--color-success: #10b981;              /* Green */
--color-warning: #f59e0b;              /* Amber */
--color-error: #ef4444;                /* Red */
--color-info: #3b82f6;                 /* Blue */
```

### Usage
- **Primary:** Buttons, links, highlights, CTAs
- **Text:** Body copy, headings
- **Surface:** Cards, panels, containers
- **Border:** Dividers, input borders
- **Semantic:** Status indicators, alerts

---

## 3. Typography Rules

### Font Stack
```css
--font-family-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-family-mono: "Menlo", "Monaco", "Courier New", monospace;
```

### Type Scale
```css
--type-scale-xs: 0.75rem;              /* 12px - Small labels */
--type-scale-sm: 0.875rem;             /* 14px - Captions */
--type-scale-base: 1rem;               /* 16px - Body text */
--type-scale-lg: 1.125rem;             /* 18px - Subheadings */
--type-scale-xl: 1.25rem;              /* 20px - Section titles */
--type-scale-2xl: 1.5rem;              /* 24px - Page titles */
--type-scale-3xl: 1.875rem;            /* 30px - Hero titles */
--type-scale-4xl: 2.25rem;             /* 36px - Main headlines */
```

### Line Heights
```css
--line-height-tight: 1.2;              /* Headings */
--line-height-normal: 1.5;             /* Body text */
--line-height-relaxed: 1.75;           /* Long-form content */
```

### Font Weights
```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Usage
- **Headings:** Bold (700), tight line-height (1.2)
- **Body:** Normal (400), normal line-height (1.5)
- **Labels:** Medium (500), small scale
- **Mono:** Code snippets, technical content

---

## 4. Component Stylings

### Button
- **Primary:** Terracotta background, white text, rounded corners
- **Secondary:** Gray background, dark text
- **Outline:** Transparent, terracotta border
- **Ghost:** No background, terracotta text
- **States:** Hover (darker), active (pressed), disabled (gray)
- **Sizes:** sm (12px), md (16px), lg (18px)

### Card
- **Default:** White background, light border, subtle shadow
- **Elevated:** White background, medium shadow
- **Outlined:** Transparent, terracotta border
- **Padding:** md (16px) default
- **Radius:** 8px

### Input
- **Text/Email/Password:** Light gray background, dark border on focus
- **Textarea:** Same as text, resizable
- **States:** Focus (terracotta border), error (red border), disabled (gray)
- **Placeholder:** Light gray text

### Modal
- **Overlay:** Semi-transparent dark background
- **Content:** White background, rounded corners, shadow
- **Header:** Bold title, close button
- **Footer:** Action buttons (primary + secondary)

### Navigation
- **Navbar:** White background, light border bottom
- **Sidebar:** Light gray background, dark text
- **Active:** Terracotta accent, bold text
- **Hover:** Light gray background

### Badge
- **Default:** Light gray background, dark text
- **Primary:** Terracotta background, white text
- **Success/Warning/Error:** Semantic colors

---

## 5. Layout Principles

### Spacing Scale
```css
--spacing-xs: 0.25rem;                 /* 4px */
--spacing-sm: 0.5rem;                  /* 8px */
--spacing-md: 1rem;                    /* 16px */
--spacing-lg: 1.5rem;                  /* 24px */
--spacing-xl: 2rem;                    /* 32px */
--spacing-2xl: 3rem;                   /* 48px */
--spacing-3xl: 4rem;                   /* 64px */
```

### Grid
- **Desktop:** 12-column grid, 1rem gutter
- **Tablet:** 8-column grid, 1rem gutter
- **Mobile:** 4-column grid, 0.5rem gutter

### Whitespace
- **Generous:** 2-3x spacing between sections
- **Breathing room:** Content never touches edges
- **Hierarchy:** More space = more important

### Max Width
- **Content:** 1200px
- **Narrow:** 800px (for reading)
- **Full:** 100% (for hero sections)

---

## 6. Depth & Elevation

### Shadow Tokens
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### Elevation Levels
- **Level 0:** No shadow (flat)
- **Level 1:** sm shadow (cards, inputs)
- **Level 2:** md shadow (elevated cards, dropdowns)
- **Level 3:** lg shadow (modals, popovers)
- **Level 4:** xl shadow (floating action buttons)

---

## 7. Do's and Don'ts

### Do's ✅
- Use CSS variables for all colors, spacing, typography
- Maintain generous whitespace
- Use semantic colors for status
- Keep text readable (contrast ratio ≥ 4.5:1)
- Use rounded corners (8px default)
- Provide clear focus states
- Test on mobile first

### Don'ts ❌
- Don't use hardcoded colors (use CSS variables)
- Don't use arbitrary spacing (use spacing scale)
- Don't mix font sizes (use type scale)
- Don't use shadows for emphasis (use color)
- Don't forget accessibility (WCAG AA minimum)
- Don't use more than 2 accent colors
- Don't make text smaller than 14px

---

## 8. Responsive Behavior

### Breakpoints
```css
--breakpoint-sm: 640px;                /* Mobile */
--breakpoint-md: 768px;                /* Tablet */
--breakpoint-lg: 1024px;               /* Desktop */
--breakpoint-xl: 1280px;               /* Large desktop */
```

### Mobile-First Approach
- Start with mobile layout
- Add complexity at larger breakpoints
- Touch targets: minimum 44x44px
- Spacing: Reduce by 25% on mobile

### Responsive Components
- **Navigation:** Hamburger menu on mobile, full nav on desktop
- **Grid:** 1 column on mobile, 2-3 on tablet, 3-4 on desktop
- **Typography:** Smaller on mobile, larger on desktop
- **Modals:** Full-screen on mobile, centered on desktop

---

## 9. Agent Prompt Guide

### For Coding Agents

**When building UI:**
```
Use the Claude Design System:
- Colors: CSS variables (--color-primary, --color-text, etc.)
- Spacing: Spacing scale (--spacing-md, --spacing-lg, etc.)
- Typography: Type scale (--type-scale-base, --type-scale-lg, etc.)
- Components: Button, Card, Input, Modal, Navigation, Badge
- Shadows: Shadow tokens (--shadow-sm, --shadow-md, etc.)

Maintain:
- Generous whitespace
- Accessibility (WCAG AA)
- Responsive design (mobile-first)
- Consistent styling across components
```

**When adding new components:**
```
1. Use CSS variables for all colors, spacing, typography
2. Follow component styling guidelines
3. Provide hover/active/disabled states
4. Test accessibility (keyboard navigation, screen readers)
5. Test responsive design (mobile, tablet, desktop)
6. Document component in COMPONENTS.md
```

**When styling pages:**
```
1. Use spacing scale for margins/padding
2. Use type scale for font sizes
3. Use color palette for backgrounds/text
4. Maintain max-width (1200px for content)
5. Use grid system for layout
6. Test on mobile first
```

---

## 📝 Implementation Notes

- **CSS Variables:** Define in `src/styles/design-tokens.css`
- **Components:** Create in `src/components/` (React/React Native)
- **Utilities:** Create in `src/styles/utilities.css`
- **Documentation:** Update `docs/COMPONENTS.md` for each new component
- **Testing:** Test accessibility + responsiveness before shipping

---

**Last updated:** 2026-05-14  
**Template:** Claude (Anthropic)  
**Status:** Ready for implementation
