#!/usr/bin/env bash
#
function prepend() { while read line; do echo "${1}${line}"; done; }

"$@" | prepend "$PMIX_RANK         "
