## ADDED Requirements

### Requirement: Increment Card Quantity
The system SHALL provide a frontend helper to increment the quantity of a collected card.

#### Scenario: Increment card from zero
- **WHEN** `incrementCard(setId, cardId)` is called
- **AND** the card has no CollectedCard row
- **THEN** the API is called with `{ setId, cardId, action: "increment" }`
- **AND** the response returns `{ collected: true, amount: 1 }`

#### Scenario: Increment card with existing quantity
- **WHEN** `incrementCard(setId, cardId)` is called
- **AND** the card has amount N >= 1
- **THEN** the API is called with `{ setId, cardId, action: "increment" }`
- **AND** the response returns `{ collected: true, amount: N+1 }`

### Requirement: Decrement Card Quantity
The system SHALL provide a frontend helper to decrement the quantity of a collected card.

#### Scenario: Decrement card with amount greater than one
- **WHEN** `decrementCard(setId, cardId)` is called
- **AND** the card has amount N > 1
- **THEN** the API is called with `{ setId, cardId, action: "decrement" }`
- **AND** the response returns `{ collected: true, amount: N-1 }`

#### Scenario: Decrement card with amount one
- **WHEN** `decrementCard(setId, cardId)` is called
- **AND** the card has amount 1
- **THEN** the API is called with `{ setId, cardId, action: "decrement" }`
- **AND** the response returns `{ collected: false, amount: 0 }`

#### Scenario: Decrement card with amount zero
- **WHEN** `decrementCard(setId, cardId)` is called
- **AND** the card has no CollectedCard row
- **THEN** the API is called with `{ setId, cardId, action: "decrement" }`
- **AND** the response returns `{ collected: false, amount: 0 }`
- **AND** no database change occurs

## MODIFIED Requirements

### Requirement: Button Layout on Explore Page
The card action buttons on the Explore page SHALL be displayed in a horizontal layout with a quantity stepper and Need/Want buttons.

#### Scenario: Button layout with quantity stepper and status buttons
- **WHEN** a card is displayed on the Explore page or Sets detail page
- **THEN** the quantity stepper (decrement button, amount display, increment button) occupies approximately 50% of the button row width
- **AND** the Need button occupies approximately 25% of the button row width
- **AND** the Want button occupies approximately 25% of the button row width
- **AND** all elements are displayed in a single horizontal row

#### Scenario: Quantity stepper appearance when collected
- **WHEN** the card has amount >= 1
- **THEN** the quantity stepper group displays with a green background
- **AND** the amount number is displayed between the `-` and `+` buttons
- **AND** the `-` button is functional

#### Scenario: Quantity stepper appearance when uncollected
- **WHEN** the card has amount 0
- **THEN** the quantity stepper group displays with a gray background
- **AND** the amount displays as "0"
- **AND** the `-` button is disabled (no-op)
- **AND** the `+` button is functional

#### Scenario: Increment button behavior
- **WHEN** user clicks the `+` button
- **THEN** `incrementCard` is called for that card
- **AND** the displayed amount updates to reflect the new value
- **AND** the stepper transitions to green if amount was previously 0

#### Scenario: Decrement button behavior
- **WHEN** user clicks the `-` button
- **AND** the card has amount >= 1
- **THEN** `decrementCard` is called for that card
- **AND** the displayed amount updates to reflect the new value
- **AND** the stepper transitions to gray if amount reaches 0

#### Scenario: Need button visual appearance
- **WHEN** the Need button is displayed
- **THEN** it shows ONLY a bookmark icon with no text
- **AND** it has a blue background when the card is marked as needed
- **AND** it has a gray background when the card is not marked as needed

#### Scenario: Want button visual appearance
- **WHEN** the Want button is displayed
- **THEN** it shows ONLY a heart icon with no text
- **AND** it has a red background when the card is marked as wanted
- **AND** it has a gray background when the card is not marked as wanted
