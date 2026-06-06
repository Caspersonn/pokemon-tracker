## ADDED Requirements

### Requirement: Nix Package Build
The system SHALL provide a Nix package that builds the Next.js application as a standalone server.

#### Scenario: Build produces standalone server
- **WHEN** the package is built with `nix build`
- **THEN** the output contains a complete Next.js standalone server
- **AND** the output includes all required dependencies
- **AND** the output includes Prisma client binaries compatible with NixOS

#### Scenario: Package includes static assets
- **WHEN** the package is built
- **THEN** the output contains the `public/` directory
- **AND** the output contains the `.next/static` directory
- **AND** all assets are accessible at runtime

#### Scenario: Prisma binaries are NixOS-compatible
- **WHEN** the application starts
- **THEN** Prisma can connect to the database using NixOS-compatible binaries
- **AND** the PRISMA_QUERY_ENGINE_LIBRARY points to the correct location

### Requirement: NixOS Module Service
The system SHALL provide a NixOS module that manages the application as a systemd service.

#### Scenario: Service can be enabled
- **WHEN** the module is imported in NixOS configuration
- **AND** `services.pokemon-tracker.enable = true` is set
- **THEN** a systemd service named `pokemon-tracker` is created
- **AND** the service is configured to start after network and postgresql

#### Scenario: Service runs with DynamicUser
- **WHEN** the service is started
- **THEN** it runs under a dynamic user for security isolation
- **AND** it has access to its StateDirectory for persistent data
- **AND** systemd security hardening is applied (PrivateTmp, NoNewPrivileges, etc.)

#### Scenario: Service listens on configured port
- **WHEN** the service starts
- **THEN** it listens on the configured port (default: 3000)
- **AND** it binds to the configured host address (default: 127.0.0.1)
- **AND** the service is accessible via HTTP

### Requirement: Database Integration
The system SHALL automatically configure and manage a PostgreSQL database for the application.

#### Scenario: PostgreSQL is configured automatically
- **WHEN** the module is enabled
- **THEN** PostgreSQL service is enabled and started
- **AND** a database is created with the configured name (default: "pokemon_tracker")
- **AND** a database user is created with appropriate permissions
- **AND** the DATABASE_URL environment variable is set correctly

#### Scenario: Database connection uses Unix socket
- **WHEN** the service connects to the database
- **THEN** it uses a Unix socket connection for better security and performance
- **AND** no TCP port is required for database access

### Requirement: Automatic Database Migrations
The system SHALL run Prisma migrations automatically when the service starts or is upgraded.

#### Scenario: Migrations run before service starts
- **WHEN** the systemd service is started or restarted
- **THEN** `prisma migrate deploy` is executed in the pre-start script
- **AND** the service only starts if migrations succeed
- **AND** migration failures are logged to the systemd journal

#### Scenario: Migrations are idempotent
- **WHEN** the service is restarted without schema changes
- **THEN** migrations complete successfully without errors
- **AND** no database modifications occur

### Requirement: Configuration Options
The system SHALL expose module options for configuring the application.

#### Scenario: Port and host are configurable
- **WHEN** `services.pokemon-tracker.port` is set
- **THEN** the application listens on that port
- **WHEN** `services.pokemon-tracker.host` is set
- **THEN** the application binds to that address

#### Scenario: Database name is configurable
- **WHEN** `services.pokemon-tracker.database.name` is set
- **THEN** PostgreSQL creates a database with that name
- **AND** the DATABASE_URL reflects the configured database name

#### Scenario: NextAuth secret is provided via file
- **WHEN** `services.pokemon-tracker.nextauth.secretFile` points to a file
- **THEN** the NEXTAUTH_SECRET environment variable is loaded from that file
- **AND** the secret is not exposed in the Nix store

#### Scenario: NextAuth URL is derived from configuration
- **WHEN** host and port are configured
- **THEN** NEXTAUTH_URL is automatically set to `http://{host}:{port}`
- **OR** NEXTAUTH_URL can be explicitly set via `services.pokemon-tracker.nextauth.url`

#### Scenario: Allowed emails are configurable
- **WHEN** `services.pokemon-tracker.allowedEmails` is set to a list of emails
- **THEN** the ALLOWED_EMAILS environment variable is set to a comma-separated list
- **AND** only those emails can register/login

#### Scenario: Additional environment files can be provided
- **WHEN** `services.pokemon-tracker.environmentFiles` contains file paths
- **THEN** those files are loaded as environment files by systemd
- **AND** variables from those files are available to the application

### Requirement: Flake Integration
The system SHALL expose the package and module through the flake outputs.

#### Scenario: Package is available as default output
- **WHEN** the flake is used
- **THEN** `packages.x86_64-linux.default` provides the pokemon-tracker package
- **AND** the package can be built with `nix build`
- **AND** the package can be installed with `nix profile install`

#### Scenario: Module is available as default module
- **WHEN** the flake is imported in NixOS configuration
- **THEN** `nixosModules.default` provides the pokemon-tracker service module
- **AND** the module can be enabled in configuration.nix

#### Scenario: Multiple architectures are supported
- **WHEN** the flake is evaluated
- **THEN** packages are available for `x86_64-linux`
- **AND** packages are available for `aarch64-linux`
- **AND** both architectures use the same module definition
