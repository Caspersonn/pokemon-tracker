## ADDED Requirements

### Requirement: Card Proportions in Explore Grid
Pokemon cards in the Explore page grid SHALL display with proper proportions where the card image dominates and information remains readable.

#### Scenario: Card aspect ratio
- **WHEN** a Pokemon card is displayed in the Explore page grid
- **THEN** the card image section occupies approximately 75% of the card height
- **AND** the information section (text + buttons) occupies approximately 25% of the card height
- **AND** the card maintains a compact, readable size

#### Scenario: Information section readability
- **WHEN** viewing the card information section
- **THEN** the card number is readable at text-xs size
- **AND** the card name is readable at text-sm size
- **AND** the set name is readable at text-xs size
- **AND** all button text and icons are clearly visible

### Requirement: Compact Grid Layout
The Explore page card grid SHALL display cards in a compact format that scales appropriately across screen sizes.

#### Scenario: Desktop grid layout (xl breakpoint)
- **WHEN** viewing the Explore page on extra-large screens (1280px+)
- **THEN** the grid displays 6 columns of cards
- **AND** cards are sized compactly to fit the available space

#### Scenario: Large desktop grid layout (lg breakpoint)
- **WHEN** viewing the Explore page on large screens (1024px - 1279px)
- **THEN** the grid displays 5 columns of cards
- **AND** cards maintain readable proportions

#### Scenario: Medium screen grid layout (md breakpoint)
- **WHEN** viewing the Explore page on medium screens (768px - 1023px)
- **THEN** the grid displays 4 columns of cards
- **AND** cards remain compact and readable

#### Scenario: Small screen grid layout (sm breakpoint)
- **WHEN** viewing the Explore page on small screens (640px - 767px)
- **THEN** the grid displays 3 columns of cards
- **AND** information remains readable

#### Scenario: Mobile grid layout
- **WHEN** viewing the Explore page on mobile devices (below 640px)
- **THEN** the grid displays 2 columns of cards
- **AND** all card elements remain visible and functional

### Requirement: Button Functionality Preservation
All existing button functionality SHALL remain intact after card sizing changes.

#### Scenario: Collection toggle button
- **WHEN** a card is resized to the new compact format
- **THEN** the Uncollected/Collected button remains clickable
- **AND** the button text remains readable
- **AND** the button responds to clicks correctly

#### Scenario: Need and Want buttons
- **WHEN** a card is resized to the new compact format
- **THEN** the Need button (bookmark icon) remains visible and clickable
- **AND** the Want button (heart icon) remains visible and clickable
- **AND** both buttons maintain their spacing and visual states
- **AND** icons remain clearly identifiable at the smaller size
