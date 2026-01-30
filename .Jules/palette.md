## 2024-05-22 - Editor.js Theming Constraints
**Learning:** Editor.js injects its own styles with high specificity or inline styles, requiring `!important` overrides in global CSS for custom themes (especially dark mode).
**Action:** When styling Editor.js components (popovers, toolbars), always check for existing styles and be prepared to use `!important` to enforce the design system's theme.

## 2024-05-22 - Editor.js Class Naming (Verified)
**Learning:** Editor.js class names are inconsistent.
- Popover items use `.ce-popover-item` (hyphen).
- Popover container uses `.ce-popover` and `.ce-popover__items` (underscore).
- Block settings handle uses `.cdx-settings-button` (cdx- prefix).
- Inline toolbar uses `.ce-inline-toolbar` and `.ce-inline-tool`.
- Conversion toolbar icons use `.ce-conversion-tool__icon`.
**Action:** Always verify class names via `grep` in `node_modules` or DOM inspection before writing CSS overrides. Do not assume BEM consistency.
