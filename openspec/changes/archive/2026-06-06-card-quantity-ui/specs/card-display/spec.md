## MODIFIED Requirements

### Requirement: Card Proportions in Explore Grid
Pokemon cards SHALL display with a unified layout via a shared CardItem component used by both the Explore page and Sets detail page.

#### Scenario: Card image display
- **WHEN** a Pokemon card is displayed in any card grid
- **THEN** the card image displays at full opacity regardless of collection state
- **AND** the card image is never grayscale
- **AND** a green ring border appears when amount >= 1
- **AND** no ring appears when amount is 0

#### Scenario: Card information section
- **WHEN** viewing the card information section
- **THEN** the card number (`#localId`) is displayed
- **AND** the card name is displayed
- **AND** the set name is displayed
- **AND** card rarity is NOT displayed
- **AND** card types are NOT displayed

#### Scenario: Shared component usage
- **WHEN** a card is rendered on the Explore page
- **THEN** it uses the same CardItem component as the Sets detail page
- **AND** both pages render identical card layout and behavior

### Requirement: Button Functionality Preservation
All card action buttons SHALL be rendered identically on both the Explore page and Sets detail page.

#### Scenario: Quantity stepper on all pages
- **WHEN** a card is displayed on any page
- **THEN** the quantity stepper (`-` / amount / `+`) is shown
- **AND** the Need button (bookmark icon) is shown
- **AND** the Want button (heart icon) is shown

#### Scenario: Need and Want buttons on Sets detail page
- **WHEN** a card is displayed on the Sets detail page
- **THEN** Need and Want buttons are available (previously only on Explore page)
- **AND** they function identically to the Explore page
