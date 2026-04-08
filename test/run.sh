#!/bin/bash -eu
set -o pipefail
shopt -s inherit_errexit || true

# Karma runs through Vue CLI webpack, which expects a simple HTML template in
# public/. Reusing the Vite entry HTML causes html-webpack-plugin parsing issues.
cat > public/index.html <<'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>ODK Central Tests</title>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
EOF
output=$(mktemp)
trap 'rm -f -- public/index.html "$output"' EXIT

NODE_ENV="test" karma start | tee "$output"

# Search for: warnings from console.warn(), including Vue warnings; Sass
# warnings; and warnings from Karma.
awk '
  BEGIN { warnings = 0 }
  /WARN LOG:/            { ++warnings; print "WARNING: " $0 }
  /ERROR LOG:/           { ++warnings; print "WARNING: " $0 }
  /Module Warning/       { ++warnings; print "WARNING: " $0 }
  /WARN \[web-server\]:/ { ++warnings; print "WARNING: " $0 }
  END {
    if(warnings > 2) {
      print "All tests passed, but there were " warnings " warnings: see above."
      exit 1
    }
    print "There were " warnings " warnings, which is within the accepted threshold."
  }
' "$output"
