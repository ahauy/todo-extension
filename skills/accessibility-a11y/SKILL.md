---
name: accessibility-a11y
description: "Accessibility best practices including WCAG 2.1 guidelines, semantic HTML, ARIA attributes, keyboard navigation, and screen reader testing."
origin: codex-project-template
---

# Accessibility (a11y) Skill

Comprehensive guide for building accessible web applications following WCAG 2.1 standards.

## When to Use

Invoke this skill:
- When building public-facing websites
- When developing enterprise applications
- When designing forms and interactive components
- When working with images and media
- When implementing keyboard navigation
- When testing with screen readers
- Before production deployment

## WCAG 2.1 Levels

| Level | Requirement | Audience |
|-------|-------------|----------|
| **A** | Basic accessibility | Minimum standard |
| **AA** | Enhanced accessibility | Recommended (most sites) |
| **AAA** | Advanced accessibility | Specialized content |

**Target: AA level** for most projects

## Semantic HTML

### Pattern 1: Proper Heading Hierarchy

```typescript
// ❌ BAD - Wrong hierarchy
<h1>Welcome</h1>
<h3>Section Title</h3>
<h2>Subsection</h2>

// ✅ GOOD - Correct hierarchy
<h1>Page Title</h1>
<h2>Section Title</h2>
<h3>Subsection</h3>
<h3>Another Subsection</h3>
<h2>Another Section</h2>
```

### Pattern 2: Semantic Landmarks

```typescript
// ❌ BAD - All divs
<div className="header">
  <div className="nav">Navigation</div>
</div>
<div className="main">Content</div>
<div className="footer">Footer</div>

// ✅ GOOD - Semantic landmarks
<header>
  <nav>Navigation</nav>
</header>
<main>Content</main>
<footer>Footer</footer>
```

### Pattern 3: List Semantics

```typescript
// ❌ BAD - Not semantic
<div>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

// ✅ GOOD - Semantic list
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

### Pattern 4: Button vs Link

```typescript
// ❌ BAD - Wrong element
<div onClick={handleClick} role="button">
  Click me
</div>

// ✅ GOOD - Correct element
<button onClick={handleClick}>Click me</button>

// Link for navigation
<a href="/page">Go to page</a>
```

## ARIA Attributes

### Pattern 1: ARIA Labels

```typescript
// ❌ BAD - No label
<input type="text" />

// ✅ GOOD - Visible label
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ✅ GOOD - Hidden label (when visual label not possible)
<input
  type="text"
  aria-label="Search products"
  placeholder="Search..."
/>
```

### Pattern 2: ARIA Descriptions

```typescript
// ❌ BAD - No description
<input type="password" />

// ✅ GOOD - Description
<label htmlFor="password">Password</label>
<input
  id="password"
  type="password"
  aria-describedby="pwd-hint"
/>
<small id="pwd-hint">
  Must be at least 8 characters with uppercase and numbers
</small>
```

### Pattern 3: ARIA Live Regions

```typescript
// ❌ BAD - Screen reader doesn't announce updates
function SearchResults({ results }) {
  return <div>{results.length} results found</div>
}

// ✅ GOOD - Screen reader announces updates
function SearchResults({ results }) {
  return (
    <div aria-live="polite" aria-atomic="true">
      {results.length} results found
    </div>
  )
}
```

### Pattern 4: ARIA Roles

```typescript
// ❌ BAD - Div with click handler
<div onClick={handleExpand}>Menu</div>

// ✅ GOOD - Proper role
<button
  aria-expanded={isExpanded}
  aria-controls="menu"
  onClick={handleExpand}
>
  Menu
</button>
<div id="menu" hidden={!isExpanded}>
  Menu items
</div>
```

### Pattern 5: ARIA Hidden

```typescript
// ❌ BAD - Decorative icon announced
<span className="icon-star">★</span> Favorite

// ✅ GOOD - Decorative icon hidden
<span className="icon-star" aria-hidden="true">★</span> Favorite

// Or use CSS
<span className="icon-star" style={{ display: 'none' }}>★</span> Favorite
```

## Keyboard Navigation

### Pattern 1: Focus Management

```typescript
// ❌ BAD - No focus visible
button {
  outline: none;
}

// ✅ GOOD - Focus visible
button:focus {
  outline: 2px solid #4A90E2;
  outline-offset: 2px;
}

// Or use focus-visible for keyboard only
button:focus-visible {
  outline: 2px solid #4A90E2;
}
```

### Pattern 2: Tab Order

```typescript
// ❌ BAD - Wrong tab order
<input tabIndex={10} />
<input tabIndex={5} />
<input tabIndex={1} />

// ✅ GOOD - Natural tab order (don't use tabIndex)
<input />
<input />
<input />

// If needed, use tabIndex={0} for custom order
<div tabIndex={0}>Custom focusable element</div>
```

### Pattern 3: Keyboard Shortcuts

```typescript
// ✅ GOOD - Keyboard shortcuts with help
function App() {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if (e.key === '?') {
        showHelpDialog()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div>
      <button onClick={handleSave}>Save (Ctrl+S)</button>
      <button onClick={showHelpDialog}>Help (?)</button>
    </div>
  )
}
```

### Pattern 4: Escape Key

```typescript
// ✅ GOOD - Close modal with Escape
function Modal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return isOpen ? <div role="dialog">Modal content</div> : null
}
```

## Form Accessibility

### Pattern 1: Form Labels

```typescript
// ❌ BAD - No label
<input type="email" placeholder="Email" />

// ✅ GOOD - Proper label
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

### Pattern 2: Error Messages

```typescript
// ❌ BAD - Only color indicates error
<input style={{ borderColor: 'red' }} />

// ✅ GOOD - Error message with aria-describedby
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  aria-describedby="email-error"
  aria-invalid={hasError}
/>
{hasError && (
  <span id="email-error" role="alert">
    Please enter a valid email address
  </span>
)}
```

### Pattern 3: Required Fields

```typescript
// ❌ BAD - Only visual indicator
<label>Email *</label>
<input type="email" />

// ✅ GOOD - Semantic required
<label htmlFor="email">
  Email <span aria-label="required">*</span>
</label>
<input id="email" type="email" required aria-required="true" />
```

### Pattern 4: Form Groups

```typescript
// ✅ GOOD - Grouped radio buttons
<fieldset>
  <legend>Choose your preference</legend>
  <div>
    <input id="option1" type="radio" name="preference" value="1" />
    <label htmlFor="option1">Option 1</label>
  </div>
  <div>
    <input id="option2" type="radio" name="preference" value="2" />
    <label htmlFor="option2">Option 2</label>
  </div>
</fieldset>
```

## Images & Media

### Pattern 1: Alt Text

```typescript
// ❌ BAD - No alt text
<img src="photo.jpg" />

// ❌ BAD - Redundant alt text
<img src="photo.jpg" alt="photo" />

// ✅ GOOD - Descriptive alt text
<img src="user-profile.jpg" alt="Sarah Johnson, Product Manager" />

// ✅ GOOD - Decorative image
<img src="divider.png" alt="" aria-hidden="true" />
```

### Pattern 2: Icons

```typescript
// ❌ BAD - Icon not labeled
<button>
  <IconStar />
</button>

// ✅ GOOD - Icon with label
<button aria-label="Add to favorites">
  <IconStar aria-hidden="true" />
</button>

// ✅ GOOD - Icon with text
<button>
  <IconStar aria-hidden="true" /> Favorite
</button>
```

### Pattern 3: Video

```typescript
// ✅ GOOD - Video with captions
<video controls>
  <source src="video.mp4" type="video/mp4" />
  <track kind="captions" src="captions.vtt" />
  Your browser doesn't support HTML5 video
</video>
```

## Color & Contrast

### Pattern 1: Color Contrast

```typescript
// ❌ BAD - Low contrast (fails WCAG AA)
<div style={{ color: '#999', backgroundColor: '#f5f5f5' }}>
  Low contrast text
</div>

// ✅ GOOD - High contrast (passes WCAG AA)
<div style={{ color: '#333', backgroundColor: '#f5f5f5' }}>
  High contrast text
</div>

// Check contrast ratio: https://webaim.org/resources/contrastchecker/
```

### Pattern 2: Don't Rely on Color Alone

```typescript
// ❌ BAD - Only color indicates status
<div style={{ color: 'red' }}>Error</div>

// ✅ GOOD - Color + icon + text
<div style={{ color: 'red' }}>
  <IconError aria-hidden="true" /> Error
</div>
```

## Testing for Accessibility

### Pattern 1: Automated Testing

```bash
# Install axe DevTools
npm install -D @axe-core/react

# Use in tests
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('should not have accessibility violations', async () => {
  const { container } = render(<YourComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### Pattern 2: Manual Testing

**Keyboard Navigation:**
- Tab through all interactive elements
- Verify focus is visible
- Verify logical tab order

**Screen Reader Testing:**
- Use NVDA (Windows), JAWS, or VoiceOver (Mac)
- Test with Chrome, Firefox, Safari
- Verify all content is announced

**Color Contrast:**
- Use WebAIM Contrast Checker
- Test with color blindness simulator

### Pattern 3: Lighthouse Audit

```bash
# Run Lighthouse in Chrome DevTools
# Accessibility score should be 90+
```

## Common Mistakes

### ❌ Mistake 1: Using divs for buttons
```typescript
// BAD
<div onClick={handleClick}>Click me</div>

// GOOD
<button onClick={handleClick}>Click me</button>
```

### ❌ Mistake 2: Missing alt text
```typescript
// BAD
<img src="photo.jpg" />

// GOOD
<img src="photo.jpg" alt="User profile photo" />
```

### ❌ Mistake 3: Removing focus outline
```typescript
// BAD
button { outline: none; }

// GOOD
button:focus-visible { outline: 2px solid blue; }
```

### ❌ Mistake 4: Wrong heading hierarchy
```typescript
// BAD
<h1>Title</h1>
<h3>Subtitle</h3>

// GOOD
<h1>Title</h1>
<h2>Subtitle</h2>
```

### ❌ Mistake 5: Not labeling form inputs
```typescript
// BAD
<input type="email" placeholder="Email" />

// GOOD
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

## Checklist

- [ ] Semantic HTML used (header, nav, main, footer, etc.)
- [ ] Heading hierarchy is correct (h1 → h2 → h3)
- [ ] All form inputs have labels
- [ ] All images have alt text
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus indicators are visible
- [ ] ARIA attributes used correctly
- [ ] No focus traps
- [ ] Screen reader tested
- [ ] Lighthouse accessibility score ≥ 90
- [ ] No automated violations (axe, Lighthouse)

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
- [Axe DevTools](https://www.deque.com/axe/devtools/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
