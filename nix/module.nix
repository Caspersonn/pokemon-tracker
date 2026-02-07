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
    };

    nextauth = {
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

    users.users.pokemon_tracker = {
      isSystemUser = true;
      group = "pokemon_tracker";
    };

    users.groups.pokemon_tracker = {};

    systemd.services.pokemon-tracker = let
      nextauthUrl = if cfg.nextauth.url != null then cfg.nextauth.url else "http://${cfg.host}:${toString cfg.port}";
    in {
      description = "Pokemon Tracker - Pokemon card collection tracker";
      wantedBy = [ "multi-user.target" ];
      after = [ "network.target" ];

      environment = {
        NODE_ENV = "production";
        PORT = toString cfg.port;
        HOSTNAME = cfg.host;
        NEXTAUTH_URL = nextauthUrl;
        ALLOWED_EMAILS = concatStringsSep "," cfg.allowedEmails;
      };

      serviceConfig = {
        Type = "simple";
        #DynamicUser = true;
        User = "pokemon_tracker";
        Group = "pokemon_tracker";
        StateDirectory = "pokemon-tracker";
        WorkingDirectory = "${cfg.package}/lib";
        ExecStart = "${cfg.package}/bin/pokemon-tracker";

        EnvironmentFile = cfg.environmentFiles;

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
        PrivateMounts = false;

        # Restart on failure
        Restart = "on-failure";
        RestartSec = "5s";
      };
        preStart = "${pkgs.prisma}/bin/prisma migrate deploy";
    };
  };
}
