## 2024-05-22 - Editor.js Theming Constraints
**Learning:** Editor.js injects its own styles with high specificity or inline styles, requiring `!important` overrides in global CSS for custom themes (especially dark mode).
**Action:** When styling Editor.js components (popovers, toolbars), always check for existing styles and be prepared to use `!important` to enforce the design system's theme.

## 2024-05-22 - Editor.js Class Naming
**Learning:** Editor.js uses `ce-popover-item` (hyphen) for items, but `ce-popover__items` (double underscore) for the container. Mixing up BEM and other conventions can lead to styles not applying. Always verify exact class names from `node_modules` or DOM inspection.
**Action:** Use `grep` on `node_modules/@editorjs/editorjs/dist/editorjs.umd.js` to find the exact class names if documentation is unclear.
