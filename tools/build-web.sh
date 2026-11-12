#!/bin/sh
# Builds dist/ with only the files the web app needs, for Netlify.
# Bump VERSION in sw.js for hand deploys; Netlify builds add the commit to it automatically.
set -e
cd "$(dirname "$0")/.."
rm -rf dist && mkdir dist
cp index.html manifest.webmanifest dist/
cp -R css js icons dist/
find dist -name .DS_Store -delete
VERSION=$(sed -n "s/^var VERSION = '\(.*\)';/\1/p" sw.js)
[ -n "$VERSION" ] || { echo "VERSION not found in sw.js"; exit 1; }
# On Netlify each build gets the commit added to its version, so every push reaches iPads
# without bumping VERSION by hand.
if [ -n "$COMMIT_REF" ]; then
  VERSION="$VERSION-$(printf '%s' "$COMMIT_REF" | cut -c1-7)"
fi
sed "s/^var VERSION = '.*';/var VERSION = '$VERSION';/" sw.js > dist/sw.js
printf '{"version":"%s"}\n' "$VERSION" > dist/version.json
printf '/sw.js\n  Cache-Control: no-cache\n/version.json\n  Cache-Control: no-store\n/*\n  X-Robots-Tag: noindex\n' > dist/_headers
printf 'User-agent: *\nDisallow: /\n' > dist/robots.txt
echo "dist/ ready ($VERSION): $(find dist -type f | wc -l | tr -d ' ') files"
