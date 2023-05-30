#!/usr/bin/env bash

function prepend() { while read line; do echo "${1}${line}"; done; }

numspacing=$((80*PMIX_RANK))
spacing=`python3 -c 'print(" "*'$numspacing')'`
"$@" | prepend "$spacing"
