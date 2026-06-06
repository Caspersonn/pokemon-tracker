# Change: Add Nix Package and NixOS Module

## Why
The project currently only has a development shell in `flake.nix`. To enable production deployment on NixOS systems and make the application available as a declarative service, we need a proper Nix package and NixOS module.

## What Changes
- Create `nix/package.nix` that builds the Next.js application as a standalone server
- Create `nix/module.nix` that provides a NixOS service with systemd integration
- Integrate both into `flake.nix` as outputs (`packages.default` and `nixosModules.default`)
- Module includes PostgreSQL database setup and management
- Module runs Prisma migrations automatically on service start
- Module exposes configuration options for:
  - Environment variables (DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, ALLOWED_EMAILS)
  - Port and listen address
  - Database name and user

## Impact
- Affected specs: None (new capability)
- New spec: `nix-deployment` - Covers Nix packaging and NixOS module deployment
- Affected code:
  - New files: `nix/package.nix`, `nix/module.nix`
  - Modified: `flake.nix` (add package and module outputs)
