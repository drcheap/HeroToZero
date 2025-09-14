#!/bin/bash

VERSION=$( grep '"version"' ../manifest.json | cut -d '"' -f 4)

ZIP="/c/Program Files/7-Zip/7z"
FILE="releases/HeroToZero-${VERSION}.zip"

pushd .. || { echo "Cannot change directory to .." ; exit 2; }
[ -f "$FILE" ] && rm "$FILE"
"$ZIP" a -tzip -mx9 -mm=Deflate -mfb=258 -mpass=15 -r -xr!.git* -xr!releases -xr!screenshots -xr!README.md -xr!icons/*.sh -xr!icons/logo*.svg  "$FILE" -- *
popd || { echo "Cannot return to previous directory" ; exit 2; }
