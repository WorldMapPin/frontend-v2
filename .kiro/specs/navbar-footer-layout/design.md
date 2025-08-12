# Design Document

## Overview

This design outlines the implementation of a persistent navbar and footer layout system for the Next.js application. The solution will create reusable React components integrated into the main layout, ensuring consistent branding and navigation across all pages.

## Architecture

The layout system follows a hierarchical component structure:

```
app/layout.tsx (Root Layout)
├── Navbar Component
├── main (Router Content Area)
└── Footer Component
```

### Component Hierarchy

- **Root Layout**: Modified app/layout.tsx that wraps all pages
- **Navbar Component**: Standalone component for top navigation
- **Footer Component**: Standalone component for bottom content
- **Main Content Area**: Dynamic content area for page routing

## Components and Interfaces

### Navbar Component (`components/Navbar.tsx`)

**Purpose**: Provides consistent top navigation with branding

**Props Interface**:

```typescript
interface NavbarProps {
  className?: string
}
```

**Key Features**:

- Logo display using Next.js Image component
- Responsive design with mobile considerations
- Fixed positioning for persistent visibility
- Tailwind CSS styling for consistency

**Structure**:

```jsx
<nav className="fixed top-0 w-full bg-white shadow-sm z-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16">
      <div className="flex-shrink-0">
        <Image src="/images/logo_light.png" alt="Logo" />
      </div>
      {/* Future navigation items can be added here */}
    </div>
  </div>
</nav>
```

### Footer Component (`components/Footer.tsx`)

**Purpose**: Provides consistent bottom content with social links and copyright

**Props Interface**:

```typescript
interface FooterProps {
  className?: string
}
```

**Key Features**:

- Copyright text with dynamic year
- Social media links (Discord, Telegram, Instagram)
- Responsive grid layout
- Proper link accessibility

**Structure**:

```jsx
<footer className="bg-gray-50 border-t">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="flex flex-col md:flex-row justify-between items-center">
      <div className="text-gray-600">© {new Date().getFullYear()} WorldMappin. All rights reserved.</div>
      <div className="flex space-x-6 mt-4 md:mt-0">{/* Social links */}</div>
    </div>
  </div>
</footer>
```

### Layout Integration (`app/layout.tsx`)

**Modifications**:

- Import Navbar and Footer components
- Wrap children with layout structure
- Add proper spacing for fixed navbar
- Ensure footer positioning

**Structure**:

```jsx
<html>
  <body>
    <Navbar />
    <main className="pt-16 min-h-screen">{children}</main>
    <Footer />
  </body>
</html>
```

## Data Models

### Social Link Model

```typescript
interface SocialLink {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  ariaLabel: string
}
```

### Logo Configuration

```typescript
interface LogoConfig {
  src: string
  alt: string
  width: number
  height: number
}
```

## Error Handling

### Image Loading

- Implement fallback for logo loading failures
- Use Next.js Image component with proper error handling
- Provide alt text for accessibility

### Responsive Breakpoints

- Handle layout adjustments for mobile devices
- Ensure social links remain accessible on small screens
- Maintain proper spacing and alignment

### Link Validation

- Validate social media URLs
- Handle external link security (rel="noopener noreferrer")
- Provide proper ARIA labels for accessibility

## Testing Strategy

### Unit Tests

- Test Navbar component rendering
- Test Footer component rendering
- Test responsive behavior
- Test image loading and fallbacks

### Integration Tests

- Test layout integration with Next.js routing
- Test persistent navbar/footer across page navigation
- Test responsive layout on different screen sizes

### Accessibility Tests

- Test keyboard navigation
- Test screen reader compatibility
- Test color contrast ratios
- Test ARIA labels and roles

### Visual Regression Tests

- Test layout consistency across browsers
- Test responsive design breakpoints
- Test component styling with Tailwind CSS

## Implementation Notes

### Styling Approach

- Use Tailwind CSS utility classes for consistent styling
- Implement responsive design with Tailwind breakpoints
- Follow existing project styling patterns

### Performance Considerations

- Optimize logo image with Next.js Image component
- Use appropriate image formats and sizes
- Minimize layout shift with proper dimensions

### Accessibility

- Implement proper semantic HTML structure
- Add ARIA labels for interactive elements
- Ensure keyboard navigation support
- Maintain proper color contrast ratios
