#!/usr/bin/env bash

SRC="$PWD/noto/svg"
DEST="$PWD/noto/svg-baked"

bake_svg () {
  FILE=$1
  ENTRY=$2
  inkscape $ENTRY --export-text-to-path --export-plain-svg=$DEST/$FILE
}

mkdir -p $DEST

for ENTRY in $SRC/*
do
  FILE="$(basename $ENTRY)"
  if [ $FILE != 'LICENSE' ]
  then
    bake_svg $FILE $ENTRY
  fi
done
