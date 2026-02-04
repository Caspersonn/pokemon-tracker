# card-tracking Specification

## Purpose
TBD - created by archiving change add-need-want-buttons. Update Purpose after archive.
## Requirements
### Requirement: Need Card Tracking
Users SHALL be able to mark individual cards as "needed" to indicate cards they want to acquire for set completion or other purposes.

#### Scenario: User marks card as needed
- **WHEN** user clicks the Need button (bookmark icon) on a card in the Explore page
- **THEN** the card is marked as needed in the database
- **AND** the Need button displays with a blue background
- **AND** the bookmark icon remains visible

#### Scenario: User unmarks card as needed
- **WHEN** user clicks the Need button on a card that is already marked as needed
- **THEN** the card is removed from the needed cards in the database
- **AND** the Need button returns to default gray background

#### Scenario: Need status is independent of collection status
- **WHEN** a card is marked as both collected and needed
- **THEN** both statuses are maintained independently
- **AND** the card shows green ring/styling for collected
- **AND** the Need button shows blue background

### Requirement: Want Card Tracking
Users SHALL be able to mark individual cards as "wanted" to indicate cards they like or desire.

#### Scenario: User marks card as wanted
- **WHEN** user clicks the Want button (heart icon) on a card in the Explore page
- **THEN** the card is marked as wanted in the database
- **AND** the Want button displays with a red background
- **AND** the heart icon remains visible

#### Scenario: User unmarks card as wanted
- **WHEN** user clicks the Want button on a card that is already marked as wanted
- **THEN** the card is removed from the wanted cards in the database
- **AND** the Want button returns to default gray background

#### Scenario: Want status is independent of collection and need status
- **WHEN** a card is marked as collected, needed, and wanted simultaneously
- **THEN** all three statuses are maintained independently
- **AND** the collected status affects card visual styling
- **AND** the Need button shows blue background
- **AND** the Want button shows red background

### Requirement: Button Layout on Explore Page
The card action buttons on the Explore page SHALL be displayed in a horizontal layout with adjusted widths to accommodate Need and Want buttons.

#### Scenario: Button layout with three buttons
- **WHEN** a card is displayed on the Explore page
- **THEN** the Uncollected/Collected button occupies 50% of the button row width
- **AND** the Need button occupies 25% of the button row width
- **AND** the Want button occupies 25% of the button row width
- **AND** all three buttons are displayed in a single horizontal row
- **AND** there is a larger gap between Uncollected and Need buttons
- **AND** there is a smaller gap between Need and Want buttons (close spacing)

#### Scenario: Need button visual appearance
- **WHEN** the Need button is displayed
- **THEN** it shows ONLY a bookmark icon with no text
- **AND** it has a blue background when the card is marked as needed
- **AND** it has a gray background when the card is not marked as needed
- **AND** the icon remains visible in both states
- **AND** it has internal padding of py-2 px-3 (or equivalent)

#### Scenario: Want button visual appearance
- **WHEN** the Want button is displayed
- **THEN** it shows ONLY a heart icon with no text
- **AND** it has a red background when the card is marked as wanted
- **AND** it has a gray background when the card is not marked as wanted
- **AND** the icon remains visible in both states
- **AND** it has internal padding of py-2 px-3 (or equivalent)

### Requirement: Need and Want Data Persistence
User's needed and wanted card selections SHALL persist across sessions in the database.

#### Scenario: Data persists after page reload
- **WHEN** user marks cards as needed or wanted
- **AND** the page is reloaded
- **THEN** all previously marked needed cards display with blue Need buttons
- **AND** all previously marked wanted cards display with red Want buttons
- **AND** the data is retrieved from the database on page load

#### Scenario: Need and want data structure
- **WHEN** a card is marked as needed or wanted
- **THEN** the database stores userId, setId, and cardId
- **AND** a timestamp is recorded for when the status was created
- **AND** each user's needed/wanted cards are isolated by userId

### Requirement: Need and Want API Endpoints
The system SHALL provide API endpoints for managing needed and wanted card statuses.

#### Scenario: Toggle need status via API
- **WHEN** an authenticated user sends POST request to `/api/need/toggle` with setId and cardId
- **THEN** the card's need status is toggled (added if not present, removed if present)
- **AND** the API returns the new status (true if now needed, false if not needed)
- **AND** the change is persisted to the database

#### Scenario: Toggle want status via API
- **WHEN** an authenticated user sends POST request to `/api/want/toggle` with setId and cardId
- **THEN** the card's want status is toggled (added if not present, removed if present)
- **AND** the API returns the new status (true if now wanted, false if not wanted)
- **AND** the change is persisted to the database

#### Scenario: Fetch all needed cards
- **WHEN** an authenticated user sends GET request to `/api/need`
- **THEN** the API returns all cards marked as needed by that user
- **AND** the data is organized by setId and cardId

#### Scenario: Fetch all wanted cards
- **WHEN** an authenticated user sends GET request to `/api/want`
- **THEN** the API returns all cards marked as wanted by that user
- **AND** the data is organized by setId and cardId

#### Scenario: Unauthenticated access is denied
- **WHEN** an unauthenticated user attempts to access need or want endpoints
- **THEN** the API returns 401 Unauthorized error
- **AND** no data is returned or modified

