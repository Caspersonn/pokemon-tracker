## Context
The project needs to be deployable on NixOS as a system service. The current `flake.nix` only provides a development shell. Production deployments require:
- A Nix package that builds the Next.js application
- A NixOS module that manages the service lifecycle
- Database management integration
- Automatic migration handling

## Goals / Non-Goals

**Goals:**
- Build Next.js app as standalone server (not static export)
- Provide declarative NixOS service configuration
- Integrate PostgreSQL database management
- Run Prisma migrations automatically on service start/upgrade
- Expose configuration through module options
- Support systemd security features (DynamicUser)

**Non-Goals:**
- Docker/container support (separate concern)
- Multi-instance deployment patterns
- Load balancing or reverse proxy configuration
- Static site generation
- Development environment changes

## Decisions

### Decision 1: Standalone Next.js Build
**What:** Use Next.js standalone output mode
**Why:** 
- Self-contained server with minimal dependencies
- Optimized for production deployment
- Includes only necessary files (~10x smaller than full node_modules)
- Natively supported by Next.js

**Alternatives considered:**
- Static export: Doesn't support API routes or server-side features
- Full build with node_modules: Wasteful, includes dev dependencies

### Decision 2: Integrated PostgreSQL
**What:** Module creates and manages PostgreSQL service
**Why:**
- Most users deploying on NixOS want declarative DB setup
- Simplifies initial deployment
- Module can configure proper database permissions
- Migrations can run safely in pre-start script

**Alternatives considered:**
- External DB only: More flexible but requires manual setup
- Choice: Provide integrated by default, allow override with custom DATABASE_URL

### Decision 3: Auto-migrate on Start
**What:** Run `prisma migrate deploy` in systemd pre-start script
**Why:**
- Ensures DB schema matches app version
- Standard practice for Prisma deployments
- Safe for upgrades (deploy = production-only migrations)
- Fails fast if migration issues exist

**Alternatives considered:**
- Manual migrations: Error-prone, easy to forget
- Separate migration service: Over-engineered for this use case

### Decision 4: DynamicUser
**What:** Use systemd DynamicUser instead of static user
**Why:**
- Better security isolation
- No need for user/group management
- Works well with StateDirectory for persistent data
- Modern best practice

**Alternatives considered:**
- Static user: More traditional but requires user management

### Decision 5: Module Option Structure
**What:** Expose options for:
- `services.pokemon-tracker.enable`
- `services.pokemon-tracker.port` (default: 3000)
- `services.pokemon-tracker.host` (default: "127.0.0.1")
- `services.pokemon-tracker.database.name` (default: "pokemon_tracker")
- `services.pokemon-tracker.nextauth.secretFile` (required, path to secret)
- `services.pokemon-tracker.nextauth.url` (derived from host:port)
- `services.pokemon-tracker.allowedEmails` (list of strings)
- `services.pokemon-tracker.environmentFiles` (optional additional env files)

**Why:**
- NixOS users expect declarative config
- Secrets via files (not store) is best practice
- Port/host common enough to warrant explicit options
- Environment variables handled through systemd

## Technical Details

### Package Structure
```nix
# nix/package.nix
{ pkgs, nodejs, stdenv }:
stdenv.mkDerivation {
  # Build Next.js standalone
  # Include Prisma binaries
  # Copy public assets
}
```

### Module Structure
```nix
# nix/module.nix
{ config, lib, pkgs, ... }:
{
  options.services.pokemon-tracker = { ... };
  config = mkIf cfg.enable {
    # PostgreSQL setup
    # systemd service
    # Pre-start migration script
  };
}
```

### Database Setup Flow
1. Enable PostgreSQL service
2. Create database and user via `ensureDatabases` and `ensureUsers`
3. Generate DATABASE_URL with local socket connection
4. Pre-start script: run `prisma migrate deploy`
5. Start main service

### Prisma Binary Handling
- Package must include `@prisma/client` and `prisma` packages
- Set PRISMA_QUERY_ENGINE_LIBRARY to NixOS-compatible binary
- Use prisma-engines from nixpkgs

## Risks / Trade-offs

**Risk:** Migrations fail on startup → Service won't start
- **Mitigation:** Pre-start script will fail early with clear error
- **Mitigation:** Systemd restart policy can be configured by user

**Risk:** Port conflict if default 3000 is used
- **Mitigation:** Make port configurable with clear default

**Risk:** Secret management complexity
- **Mitigation:** Use secretFile pattern (common in NixOS modules)
- **Mitigation:** Document secret generation in module docs

**Trade-off:** Tight coupling to PostgreSQL
- **Pro:** Simplifies typical deployment
- **Con:** Users with external DB need to disable and configure manually
- **Decision:** Worth it for 90% use case

**Trade-off:** x86_64-linux only initially
- **Pro:** Simplifies initial implementation
- **Con:** No ARM support initially
- **Decision:** Add aarch64-linux support in tasks (low effort)

## Migration Plan

This is a new capability, no migration needed. Existing development workflow unchanged.

Users wanting to deploy will:
1. Import the flake in their NixOS configuration
2. Enable the module
3. Configure options
4. Rebuild system

## Open Questions

None - all questions clarified with user:
- ✅ Standalone server build
- ✅ Integrated PostgreSQL
- ✅ Auto-migrate on start
- ✅ DynamicUser
- ✅ Port and host options
