### Requirement: Shared Application Header
The application SHALL render a consistent header bar across all pages using a shared AppHeader component.

#### Scenario: Header displays title
- **WHEN** any page is rendered
- **THEN** the header displays the title "Pokemon Card Collection Tracker"
- **AND** the title is styled as bold, large text

#### Scenario: Header displays page subtitle
- **WHEN** a page renders AppHeader with a subtitle prop
- **THEN** the subtitle text is displayed below the title
- **AND** the subtitle is styled as smaller, muted text

#### Scenario: Header is sticky
- **WHEN** the user scrolls down on any page
- **THEN** the header remains fixed at the top of the viewport
- **AND** the header has a z-index of 50

### Requirement: Consistent Navigation
The application header SHALL display navigation links to all main pages in a consistent order.

#### Scenario: All nav links are present
- **WHEN** the header is rendered on any page
- **THEN** four navigation links are displayed: Sets, Explore, Wishlist, Scan
- **AND** the links appear in that order
- **AND** the links navigate to `/`, `/explore`, `/needed-cards`, `/scan` respectively

#### Scenario: Active page is highlighted
- **WHEN** the header is rendered with an activePage prop
- **THEN** the corresponding nav link is styled with blue text
- **AND** all other nav links are styled with gray text
- **AND** non-active links show hover effects

### Requirement: Logout Button
The application header SHALL always display a logout button.

#### Scenario: Logout button is present
- **WHEN** the header is rendered
- **THEN** a "Logout" button is displayed on the right side
- **AND** clicking it signs the user out and redirects to `/auth/signin`

### Requirement: Page-Specific Controls
The application header SHALL support rendering page-specific controls via a children prop.

#### Scenario: Controls are rendered
- **WHEN** AppHeader receives children
- **THEN** the children are rendered in the right side of the header
- **AND** the children appear before the logout button

#### Scenario: No controls provided
- **WHEN** AppHeader receives no children
- **THEN** only the logout button appears on the right side
