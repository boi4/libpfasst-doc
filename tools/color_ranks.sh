#!/usr/bin/env bash

COLORS=("\033[0;31m" "\033[0;32m" "\033[0;33m" "\033[0;34m" "\033[0;35m" "\033[0;36m" "\033[0;91m" "\033[0;92m" "\033[0;93m" "\033[0;94m")

# Get the number of colors and the current color index based on PMIX_RANK
COLOR_COUNT=${#COLORS[@]}
COLOR_INDEX=$(($PMIX_RANK % $COLOR_COUNT))

# Get the color for this rank
COLOR=${COLORS[$COLOR_INDEX]}

# Execute command and wrap each line with color
"$@" | while read LINE; do
  echo -e "${COLOR}${LINE}\033[0m"
done
