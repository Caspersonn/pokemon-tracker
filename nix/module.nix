{ config, lib, pkgs, ... }:
with lib;
let
  cfg = config.services.pokemon-tracker;
  pkg = pkgs.callPackage ./package.nix { };
in {
  options.services.pokemon-tracker = {
    enable = mkEnableOption "Pokemon Tracker service";

    package = mkOption {
      type = types.package;
      default = pkg;
      description = "The pokemon-tracker package to use";
    };

    port = mkOption {
      type = types.port;
      default = 3000;
      description = "Port to listen on";
    };

    host = mkOption {
      type = types.str;
      default = "127.0.0.1";
      description = "Host address to bind to";
    };

    database = {
      name = mkOption {
        type = types.str;
        default = "pokemon_tracker";
        description = "PostgreSQL database name";
      };

      user = mkOption {
        type = types.str;
        default = "pokemon_tracker";
        description = "PostgreSQL user name";
      };

      createLocally = mkOption {
        type = types.bool;
        default = true;
        description = "Whether to create the database and user locally";
      };
    };

    nextauth = {
      secretFile = mkOption {
        type = types.path;
        description = ''
          Path to a file containing the NEXTAUTH_SECRET.
          This file should contain a random string (at least 32 characters).
          Generate with: openssl rand -base64 32 > /var/secrets/nextauth-secret
        '';
      };

      url = mkOption {
        type = types.nullOr types.str;
        default = null;
        description = ''
          NEXTAUTH_URL value. If null, defaults to http://''${host}:''${port}
        '';
      };
    };

    allowedEmails = mkOption {
      type = types.listOf types.str;
      default = [ ];
      description = "List of allowed email addresses for registration/login";
      example = [ "user@example.com" "admin@example.com" ];
    };

    environmentFiles = mkOption {
      type = types.listOf types.path;
      default = [ ];
      description = "Additional environment files to load";
    };
  };

  config = mkIf cfg.enable {
    # Enable and configure PostgreSQL
    services.postgresql = mkIf cfg.database.createLocally {
      enable = true;
      ensureDatabases = [ cfg.database.name ];
      ensureUsers = [{
        name = cfg.database.user;
        ensureDBOwnership = true;
      }];
      initialScript = pkgs.writeText "backend-initScript" ''
        alter user ${cfg.database.user} with password '${cfg.database.user}';
      '';
    };

    # Create systemd service
    systemd.services.pokemon-tracker = let
      nextauthUrl = if cfg.nextauth.url != null then
        cfg.nextauth.url
      else
        "http://${cfg.host}:${toString cfg.port}";
      databaseUrl = if cfg.database.createLocally then
        "postgresql://${cfg.database.user}:${cfg.database.user}@localhost:5432/${cfg.database.name}?host=/run/postgresql"
      else
        throw
        "External database configuration not yet implemented. Set database.createLocally = false and provide DATABASE_URL via environmentFiles.";
    in {
      description = "Pokemon Tracker - Pokemon card collection tracker";
      wantedBy = [ "multi-user.target" ];
      after = [ "network.target" ]
        ++ optional cfg.database.createLocally "postgresql.service";
      requires = optional cfg.database.createLocally "postgresql.service";

      environment = {
        NODE_ENV = "production";
        PORT = toString cfg.port;
        HOSTNAME = cfg.host;
        DATABASE_URL = databaseUrl;
        NEXTAUTH_URL = nextauthUrl;
        ALLOWED_EMAILS = concatStringsSep "," cfg.allowedEmails;
      };

      serviceConfig = {
        Type = "simple";
        DynamicUser = true;
        StateDirectory = "pokemon-tracker";
        WorkingDirectory = "${cfg.package}/lib";
        ExecStart = "${cfg.package}/bin/pokemon-tracker";

        # Load secrets from file
        EnvironmentFile = [ cfg.nextauth.secretFile ] ++ cfg.environmentFiles;

        # Security hardening
        NoNewPrivileges = true;
        PrivateTmp = true;
        PrivateDevices = true;
        ProtectSystem = "strict";
        ProtectHome = true;
        ProtectKernelTunables = true;
        ProtectKernelModules = true;
        ProtectControlGroups = true;
        RestrictAddressFamilies = [ "AF_UNIX" "AF_INET" "AF_INET6" ];
        RestrictNamespaces = true;
        LockPersonality = true;
        RestrictRealtime = true;
        RestrictSUIDSGID = true;
        RemoveIPC = true;
        PrivateMounts = true;

        # Restart on failure
        Restart = "on-failure";
        RestartSec = "5s";
      };

      # Run Prisma migrations before starting the service
      preStart = ''
        # Set up Prisma environment
        export DATABASE_URL="${databaseUrl}"
        export PRISMA_SCHEMA_PATH="${cfg.package}/lib/prisma/schema.prisma"

        # Set Prisma engine paths
        export PRISMA_QUERY_ENGINE_LIBRARY="${pkgs.prisma-engines}/lib/libquery_engine.node"
        export PRISMA_QUERY_ENGINE_BINARY="${pkgs.prisma-engines}/bin/query-engine"
        export PRISMA_SCHEMA_ENGINE_BINARY="${pkgs.prisma-engines}/bin/schema-engine"
        export PRISMA_FMT_BINARY="${pkgs.prisma-engines}/bin/prisma-fmt"

        # Run migrations using system Prisma CLI
        echo "Running database migrations..."
        cd ${cfg.package}/lib
        ${pkgs.prisma}/bin/prisma migrate deploy --schema=prisma/schema.prisma
      '';
    };

    # Open firewall if needed (optional - users can override)
    # networking.firewall.allowedTCPPorts = [ cfg.port ];
  };
}
