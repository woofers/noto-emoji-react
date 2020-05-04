#!/usr/bin/env bash

SRC="$PWD/noto/svg"
DEST="$PWD/noto/svg-baked"

bake_svg () {
  FILE=$1
  ENTRY=$2
  inkscape $ENTRY --export-text-to-path --export-plain-svg=$DEST/$FILE
}

cp -r $SRC/. $DEST

for ENTRY in $SRC/emoji_u1f947.svg $SRC/emoji_u1f948.svg $SRC/emoji_u1f949.svg
do
  FILE="$(basename $ENTRY)"
  bake_svg $FILE $ENTRY
done
