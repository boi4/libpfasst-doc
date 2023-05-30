#!/usr/bin/env bash

filter="\
*pset_op*\
+*psetop*\
+*dyn_finalize_psetop*\
+*dyn_v2a_psetop*\
+*dyn_v2a_psetop_nb*\
+*dyn_v2a_query_psetop*\
+*dyn_v2a_query_psetop_nb*\
+*get_pset_data*\
+*get_pset_data_nb*\
+*set_pset_data*\
"

ltrace -e "${filter}" "$@" 2>&1 >/dev/null
