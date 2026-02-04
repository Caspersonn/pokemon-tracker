## 1. Create Nix Package
- [x] 1.1 Create `nix/package.nix` that builds Next.js standalone server
- [x] 1.2 Configure package to include Prisma binaries for NixOS
- [x] 1.3 Add npm dependencies build phase
- [x] 1.4 Ensure static assets and public files are included
- [x] 1.5 Test package builds successfully with `nix build`

## 2. Create NixOS Module
- [x] 2.1 Create `nix/module.nix` with systemd service definition
- [x] 2.2 Add configuration options for port, host, and environment variables
- [x] 2.3 Configure PostgreSQL service integration
- [x] 2.4 Add database initialization (create user and database)
- [x] 2.5 Implement Prisma migration runner in pre-start script
- [x] 2.6 Set up proper systemd security hardening (DynamicUser, PrivateTmp, etc.)
- [x] 2.7 Configure service dependencies (after network, after postgresql)

## 3. Update Flake
- [x] 3.1 Import `nix/package.nix` in flake outputs
- [x] 3.2 Export package as `packages.x86_64-linux.default`
- [x] 3.3 Import `nix/module.nix` in flake outputs
- [x] 3.4 Export module as `nixosModules.default`
- [x] 3.5 Add support for additional architectures (aarch64-linux)

## 4. Documentation and Validation
- [x] 4.1 Add usage examples to module documentation
- [x] 4.2 Document environment variable configuration
- [x] 4.3 Test package installation with `nix build`
- [ ] 4.4 Test module in a NixOS VM or container
- [ ] 4.5 Verify migrations run automatically on service start
- [ ] 4.6 Validate service starts correctly and serves requests

