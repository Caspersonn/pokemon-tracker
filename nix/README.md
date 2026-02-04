# Nix Deployment for Pokemon Tracker

This directory contains Nix packaging and NixOS module configuration for the Pokemon Tracker application.

## Files

- `package.nix` - Nix package that builds the Next.js application as a standalone server
- `module.nix` - NixOS module for declarative service configuration

## Quick Start

### Building the Package

```bash
# Build the package
nix build

# Run the package (requires DATABASE_URL and other env vars)
./result/bin/pokemon-tracker
```

### Using the NixOS Module

Add to your NixOS configuration:

```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    pokemon-tracker.url = "github:yourusername/pokemon-tracker";
  };

  outputs = { nixpkgs, pokemon-tracker, ... }: {
    nixosConfigurations.your-hostname = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        pokemon-tracker.nixosModules.default
        {
          services.pokemon-tracker = {
            enable = true;
            port = 3000;
            host = "0.0.0.0";  # Listen on all interfaces
            
            nextauth.secretFile = "/var/secrets/nextauth-secret";
            
            allowedEmails = [
              "user@example.com"
              "admin@example.com"
            ];
          };
          
          # Optionally open the firewall
          networking.firewall.allowedTCPPorts = [ 3000 ];
        }
      ];
    };
  };
}
```

### Generating Secrets

The module requires a `NEXTAUTH_SECRET` for authentication. Generate it with:

```bash
# Generate secret
openssl rand -base64 32 > /var/secrets/nextauth-secret

# Secure the file
chmod 600 /var/secrets/nextauth-secret
chown root:root /var/secrets/nextauth-secret
```

## Configuration Options

### `services.pokemon-tracker.enable`
- Type: `boolean`
- Default: `false`
- Description: Enable the Pokemon Tracker service

### `services.pokemon-tracker.port`
- Type: `port (integer)`
- Default: `3000`
- Description: Port to listen on

### `services.pokemon-tracker.host`
- Type: `string`
- Default: `"127.0.0.1"`
- Description: Host address to bind to
  - Use `"127.0.0.1"` for local-only access
  - Use `"0.0.0.0"` to listen on all interfaces

### `services.pokemon-tracker.database.name`
- Type: `string`
- Default: `"pokemon_tracker"`
- Description: PostgreSQL database name

### `services.pokemon-tracker.database.user`
- Type: `string`
- Default: `"pokemon_tracker"`
- Description: PostgreSQL user name

### `services.pokemon-tracker.database.createLocally`
- Type: `boolean`
- Default: `true`
- Description: Whether to create and manage the database locally

### `services.pokemon-tracker.nextauth.secretFile`
- Type: `path`
- Required: Yes
- Description: Path to file containing NEXTAUTH_SECRET (minimum 32 characters)

### `services.pokemon-tracker.nextauth.url`
- Type: `string or null`
- Default: `null` (auto-generated from host:port)
- Description: NEXTAUTH_URL for authentication callbacks

### `services.pokemon-tracker.allowedEmails`
- Type: `list of strings`
- Default: `[]`
- Description: List of email addresses allowed to register/login
- Example: `["user@example.com" "admin@example.com"]`

### `services.pokemon-tracker.environmentFiles`
- Type: `list of paths`
- Default: `[]`
- Description: Additional environment files to load (for extra configuration)

## Environment Variables

The module automatically configures these environment variables:

| Variable | Source | Description |
|----------|--------|-------------|
| `NODE_ENV` | Set to `"production"` | Node environment |
| `PORT` | `services.pokemon-tracker.port` | Server port |
| `HOSTNAME` | `services.pokemon-tracker.host` | Server host |
| `DATABASE_URL` | Auto-generated | PostgreSQL connection string |
| `NEXTAUTH_URL` | `services.pokemon-tracker.nextauth.url` or auto | Authentication URL |
| `NEXTAUTH_SECRET` | `services.pokemon-tracker.nextauth.secretFile` | Authentication secret |
| `ALLOWED_EMAILS` | `services.pokemon-tracker.allowedEmails` | Comma-separated email list |

## Database Management

### Local PostgreSQL

By default (`database.createLocally = true`), the module:
1. Enables and configures PostgreSQL service
2. Creates the specified database
3. Creates a database user with ownership
4. Connects via Unix socket (no TCP required)
5. Runs Prisma migrations automatically on service start

### Automatic Migrations

The service runs `prisma migrate deploy` in a pre-start script before starting the application. This ensures:
- Database schema is always up-to-date
- Safe production-only migrations
- Service fails fast if migrations fail

## Security

The systemd service is hardened with:
- `DynamicUser=true` - Runs as ephemeral user
- `PrivateTmp=true` - Private /tmp directory
- `ProtectSystem=strict` - Read-only filesystem except StateDirectory
- `ProtectHome=true` - No access to home directories
- `NoNewPrivileges=true` - Cannot gain privileges
- Additional namespace and capability restrictions

Secrets are loaded from files (not stored in Nix store).

## Service Management

```bash
# Start the service
sudo systemctl start pokemon-tracker

# Check status
sudo systemctl status pokemon-tracker

# View logs
sudo journalctl -u pokemon-tracker -f

# Restart service
sudo systemctl restart pokemon-tracker

# Stop service
sudo systemctl stop pokemon-tracker
```

## Advanced Configuration

### Using Behind Reverse Proxy

```nix
services.pokemon-tracker = {
  enable = true;
  host = "127.0.0.1";  # Only listen locally
  port = 3000;
  nextauth.url = "https://pokemon.example.com";  # Public URL
  # ... other options
};

services.nginx = {
  enable = true;
  virtualHosts."pokemon.example.com" = {
    locations."/" = {
      proxyPass = "http://127.0.0.1:3000";
      proxyWebsockets = true;
    };
  };
};
```

### Custom Environment Variables

```nix
services.pokemon-tracker = {
  enable = true;
  environmentFiles = [
    "/var/secrets/pokemon-tracker-env"
  ];
  # ... other options
};
```

## Troubleshooting

### Service won't start
Check logs: `sudo journalctl -u pokemon-tracker -n 50`

Common issues:
- Missing `nextauth.secretFile`
- Invalid secret file permissions
- Migration failures
- Port already in use

### Database connection errors
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check database exists: `sudo -u postgres psql -l`
- Verify database user: `sudo -u postgres psql -c '\du'`

### Migration failures
- Check Prisma schema is valid
- Review migration files in `prisma/migrations/`
- Manually inspect database: `sudo -u postgres psql pokemon_tracker`
