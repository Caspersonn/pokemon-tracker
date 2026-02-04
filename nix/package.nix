{ lib, buildNpmPackage, nodejs, prisma-engines, makeWrapper, openssl, }:
buildNpmPackage {
  pname = "pokemon-tracker";
  version = "0.1.0";

  src = lib.cleanSourceWith {
    src = ../.;
    filter = path: type:
      let
        baseName = baseNameOf path;
        # Exclude result symlink and build artifacts
      in baseName != "result" && baseName != ".git"
      && lib.cleanSourceFilter path type;
  };

  npmDepsHash = "sha256-8SAXHMI7t/Dji5r0WWa74sOSAh8uFV8OwnSsew2P7AA=";

  makeCacheWritable = true;

  nativeBuildInputs = [ makeWrapper ];

  buildInputs = [ openssl prisma-engines ];

  # Set environment for Prisma during build
  preBuild = ''
    export HOME=$TMPDIR
    export PKG_CONFIG_PATH="${openssl.dev}/lib/pkgconfig"
    export PRISMA_QUERY_ENGINE_LIBRARY="${prisma-engines}/lib/libquery_engine.node"
    export PRISMA_QUERY_ENGINE_BINARY="${prisma-engines}/bin/query-engine"
    export PRISMA_SCHEMA_ENGINE_BINARY="${prisma-engines}/bin/schema-engine"
    export PRISMA_FMT_BINARY="${prisma-engines}/bin/prisma-fmt"

    # Allow next/font to cache fonts
    mkdir -p .next/cache
    export XDG_CACHE_HOME=$TMPDIR/cache

    # Generate Prisma Client
    npm run prisma:generate || npx prisma generate
  '';

  # Build Next.js in standalone mode
  buildPhase = ''
    runHook preBuild

    export NODE_ENV=production
    export NEXT_TELEMETRY_DISABLED=1

    npm run build

    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out/{bin,lib}

    # Copy standalone server
    cp -r .next/standalone/* $out/lib/

    # The standalone build needs the full .next directory structure
    # Copy the entire .next build output to the standalone location
    if [ -d .next ]; then
      cp -r .next $out/lib/.next
    fi

    # Copy public directory if it exists (may already be in standalone)
    if [ -d public ] && [ ! -d $out/lib/public ]; then
      cp -r public $out/lib/public
    fi

    # Copy Prisma schema and generated client
    mkdir -p $out/lib/prisma
    cp prisma/schema.prisma $out/lib/prisma/
    mkdir -p $out/lib/node_modules
    cp -rL node_modules/.prisma $out/lib/node_modules/.prisma
    cp -rL node_modules/@prisma $out/lib/node_modules/@prisma

    # Copy Prisma CLI and its dependencies for migrations
    cp -rL node_modules/prisma $out/lib/node_modules/prisma

    # Copy additional Prisma dependencies
    if [ -d node_modules/@prisma/engines ]; then
      mkdir -p $out/lib/node_modules/@prisma
      cp -rL node_modules/@prisma/engines $out/lib/node_modules/@prisma/engines
    fi

    chmod -R +w $out/lib/node_modules

    # Create wrapper script
    makeWrapper ${nodejs}/bin/node $out/bin/pokemon-tracker \
      --add-flags "$out/lib/server.js" \
      --set NODE_ENV production \
      --set PRISMA_QUERY_ENGINE_LIBRARY "${prisma-engines}/lib/libquery_engine.node" \
      --set PRISMA_QUERY_ENGINE_BINARY "${prisma-engines}/bin/query-engine" \
      --set PRISMA_SCHEMA_ENGINE_BINARY "${prisma-engines}/bin/schema-engine" \
      --set PRISMA_FMT_BINARY "${prisma-engines}/bin/prisma-fmt" \
      --prefix PATH : ${lib.makeBinPath [ prisma-engines ]}

    runHook postInstall
  '';

  meta = with lib; {
    description = "Pokemon card collection tracker";
    homepage = "https://github.com/yourusername/pokemon-tracker";
    license = licenses.mit;
    maintainers = [ ];
    platforms = platforms.linux;
  };
}
