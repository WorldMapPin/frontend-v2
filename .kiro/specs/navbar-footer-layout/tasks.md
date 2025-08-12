# Implementation Plan

- [x] 1. Create components directory structure

  - Create `components` directory in the project root
  - Set up proper TypeScript configuration for components
  - _Requirements: 3.1, 3.2_

- [x] 2. Implement Navbar component

  - Create `components/Navbar.tsx` with TypeScript interface
  - Implement logo display using Next.js Image component with the provided logo_light.png
  - Add responsive design with Tailwind CSS classes
  - Implement fixed positioning for persistent visibility
  - Add proper accessibility attributes and ARIA labels
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Implement Footer component

  - Create `components/Footer.tsx` with TypeScript interface
  - Add copyright text with dynamic year calculation
  - Implement social media links for Discord, Telegram, and Instagram
  - Add responsive layout with Tailwind CSS grid/flexbox
  - Include proper external link security attributes
  - Add accessibility features and ARIA labels
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Create social media icons

  - Implement or import social media icon components
  - Create reusable icon components for Discord, Telegram, Instagram
  - Ensure icons are properly sized and styled
  - Add hover states and accessibility features
  - _Requirements: 2.2, 4.3_

- [x] 5. Integrate layout components into app/layout.tsx

  - Import Navbar and Footer components into the main layout
  - Modify the layout structure to include navbar at top and footer at bottom
  - Add proper spacing classes to accommodate fixed navbar (pt-16)
  - Ensure main content area uses min-h-screen for proper footer positioning
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 6. Implement responsive design and styling

  - Add responsive breakpoints for mobile, tablet, and desktop views
  - Ensure navbar logo scales appropriately on different screen sizes
  - Implement responsive footer layout that stacks on mobile
  - Verify Tailwind CSS classes work correctly
  - _Requirements: 1.4, 2.4, 4.1, 4.2, 4.3, 4.4_

- [ ] 7. Add error handling and fallbacks

  - Implement error handling for logo image loading
  - Add fallback content if images fail to load
  - Ensure graceful degradation on slower connections
  - _Requirements: 1.2, 4.1_

- [x] 9. Implement error and 404 pages

  - Implement an error page
  - Implement a 404 page (with a catch-all rule for the router to always render this page if there are no other suitable matches)

- [x] 10. Create new empty pages and add corresponding navigation links in the navbar

  - Create a new "Map" page. This page will be used to embed a google maps covering the whole page
  - Create a new "Explore" page. This page will be empty for now.
  - Add the corresponding links in the Navbar component
