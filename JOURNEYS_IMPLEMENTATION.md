# Journeys Flow Implementation Plan

| Phase | Feature Name | Feature/Implementation Description |
| :--- | :--- | :--- |
| **Phase 1** | **Sidebar Structure & Recent Posts List** | Refactor the current `SimpleJourneyEditor` from a bottom drawer to a full-height fixed left sidebar (matching the "New Journey" design). Implement the Search input and populate the "Recent Posts" list with dummy API data or user posts. Add checkbox selection UI for picking posts. |
| **Phase 2** | **Interactive Map Syncing & Polylines** | Connect the checkbox selections in the sidebar directly to the map. Selected posts should render as prominent markers (orange/white pins) on the map. Draw a dashed orange polyline connecting the selected points in chronological order. Update the map viewport to fit all selected pins dynamically. |
| **Phase 3** | **Journey State Management** | Update `journeyStorage` to remove support for 'Draft' states - all journeys are saved directly to the chain. Implement the "Journey Name" input field at the bottom left. Wire up the "Publish" (primary orange button) action to securely save the stitched post sequence and metadata directly to chain. |
| **Phase 4** | **Published Details View & Highlights** | Build the new published journey route (e.g., `/journey/[id]`). Implement the top header with the Journey title, author, dates, and stats component (KM Traveled, HBD Earned). Build the left-hand column containing the static mini-map and the vertical "Route Highlights" timeline. |
| **Phase 5** | **Journey Log Cards & Aesthetic Polish (SKIPPED)** | *Skipped for now.* (Develop the "Journey Log" component. Map over the sequence of posts to render rich cards featuring the cover image, author info, date, post title, abstract, tags, and engagement metrics. Apply all final styling and spacing.) |

*Note: Right-click map menu feature changes: Removed "Start Journey Here", replaced with "Write New Post Here" which opens PeakD with current coordinates copied to clipboard.*
