## ADDED Requirements

### Requirement: Set Selection Before Scanning
Users MUST select a set before scanning begins. The scanner SHALL only match cards from the selected set.

#### Scenario: User selects a set to scan
- **WHEN** user navigates to the `/scan` page
- **THEN** a set selector is displayed
- **AND** scanning controls are disabled until a set is selected

#### Scenario: Hash database is built on set selection
- **WHEN** user selects a set
- **THEN** the system fetches card data via `fetchSetCards(setId)`
- **AND** downloads card images using `formatImageUrl()`
- **AND** computes perceptual hashes for all cards in the set
- **AND** displays a progress indicator during hash computation
- **AND** enables scanning controls when hash database is ready

#### Scenario: Hash database is cached
- **WHEN** a hash database has been built for a set previously
- **THEN** the cached hashes are loaded from localStorage
- **AND** scanning is ready immediately without re-downloading images

#### Scenario: User changes set during scanning
- **WHEN** user selects a different set while scanning
- **THEN** the current scanning session is preserved
- **AND** a new hash database is built for the newly selected set
- **AND** scanning continues with the new set's hashes

### Requirement: Camera Access and Display
The scanner SHALL access the device camera and display a live video feed with a card alignment overlay.

#### Scenario: Camera stream starts
- **WHEN** scanning is activated after set selection
- **THEN** the browser requests camera access via `getUserMedia`
- **AND** a live video feed is displayed on screen
- **AND** the rear-facing camera is preferred on mobile devices

#### Scenario: Card alignment overlay
- **WHEN** the camera feed is displayed
- **THEN** a card-shaped rectangle overlay is shown on the feed
- **AND** the overlay indicates where to position the card/holder
- **AND** the system crops frames to this overlay region for matching

#### Scenario: Camera permission denied
- **WHEN** the user denies camera access
- **THEN** the scanner displays an error message explaining camera access is required
- **AND** no video feed is shown

### Requirement: New Card Detection
The scanner SHALL automatically detect when a new card enters the camera frame.

#### Scenario: New card appears
- **WHEN** the current frame's hash differs significantly from the last confirmed card
- **AND** the difference is stable for at least 3 consecutive frames
- **THEN** the system triggers a card matching attempt

#### Scenario: Card is transitioning (sliding)
- **WHEN** the frame hash is changing rapidly (card being slid into position)
- **THEN** the system waits until the frame stabilizes before matching
- **AND** no match attempt is triggered during transition

#### Scenario: Same card remains in frame
- **WHEN** the current frame's hash is similar to the last confirmed card
- **THEN** no new match attempt is triggered
- **AND** the existing confirmation overlay remains visible

#### Scenario: No card in frame
- **WHEN** the frame hash differs from the last card but does not match any card in the set
- **AND** the frame appears to be the background (no card present)
- **THEN** the system enters idle state waiting for the next card

### Requirement: Card Matching via Perceptual Hash
The scanner SHALL identify cards by comparing the captured frame's perceptual hash against the pre-computed hash database for the selected set.

#### Scenario: High confidence match
- **WHEN** a new card is detected
- **AND** the best matching card has a Hamming distance below the confident threshold
- **THEN** the card is automatically added to the collection via `action: "increment"`
- **AND** the matched card name and image are shown in a confirmation overlay on the camera feed
- **AND** the card is added to the scan session running list

#### Scenario: Low confidence match
- **WHEN** a new card is detected
- **AND** no match has a Hamming distance below the confident threshold
- **THEN** a popup is displayed showing the top 3 closest matches
- **AND** a manual card picker option is available to select the correct card
- **AND** the popup remains visible until the card in the frame changes

#### Scenario: User confirms low confidence match
- **WHEN** a low confidence popup is shown
- **AND** user selects a card from the top matches or manual picker
- **THEN** the selected card is added to the collection via `action: "increment"`
- **AND** the card is added to the scan session running list

#### Scenario: User dismisses low confidence match
- **WHEN** a low confidence popup is shown
- **AND** the card in the frame changes (user moves to next card)
- **THEN** the popup is dismissed without adding any card
- **AND** the system begins matching the new card

#### Scenario: Foil card scanning
- **WHEN** a foil or holographic card is scanned
- **THEN** the system matches it against the non-holographic variant
- **AND** no distinction is made between foil and non-foil versions

### Requirement: Confirmation Overlay Behavior
The confirmation overlay SHALL remain visible until the card in the frame changes.

#### Scenario: Overlay persists while card is present
- **WHEN** a card is matched and the confirmation overlay is shown
- **AND** the same card remains in the camera frame
- **THEN** the overlay continues to be displayed
- **AND** no timeout dismisses the overlay

#### Scenario: Overlay dismissed on card change
- **WHEN** a confirmation overlay is displayed
- **AND** the card in the frame changes or is removed
- **THEN** the overlay is dismissed
- **AND** the system begins detecting the next card

### Requirement: Scan Session Management
The scanner SHALL maintain a session showing all scanned cards with the ability to undo individual entries.

#### Scenario: Running list of scanned cards
- **WHEN** cards are being scanned
- **THEN** a running list is displayed showing each scanned card (name, image, set)
- **AND** new cards are added to the top of the list
- **AND** a total scanned count is displayed

#### Scenario: Undo a scanned card
- **WHEN** user taps the undo button on a card in the running list
- **THEN** the card's collection amount is decremented via `action: "decrement"`
- **AND** the card is removed from the running list
- **AND** the scanned count is decremented

#### Scenario: Session persists during set change
- **WHEN** user changes the selected set during a scanning session
- **THEN** previously scanned cards from other sets remain in the running list
- **AND** the session continues with the new set

### Requirement: Frame Capture Performance
The scanner SHALL capture and process frames at a rate suitable for continuous scanning without blocking the UI.

#### Scenario: Frame capture rate
- **WHEN** scanning is active
- **THEN** frames are captured at approximately 5fps (200ms intervals)
- **AND** the video feed remains smooth and responsive
- **AND** frame processing does not block UI interactions
