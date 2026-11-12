#!/bin/sh
# Builds dist/ with only the files the web app needs, for Netlify.
# Bump VERSION in sw.js first so iPads pick up the new version.
set -e
cd "$(dirname "$0")/.."
rm -rf dist && mkdir dist
cp index.html sw.js manifest.webmanifest dist/
cp -R css js icons dist/
find dist -name .DS_Store -delete
printf '/sw.js\n  Cache-Control: no-cache\n/*\n  X-Robots-Tag: noindex\n' > dist/_headers
printf 'User-agent: *\nDisallow: /\n' > dist/robots.txt
echo "dist/ ready: $(find dist -type f | wc -l | tr -d ' ') files"
