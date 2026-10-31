#!/bin/bash
# Збирає index.html з частин у src/
cd "$(dirname "$0")"
{ echo '<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  echo '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>'
  sed '0,/<\/style>/s//<\/style><\/head><body>/' src/00_head.html
  echo '<script>'; cat src/0[1-9]_*.js src/1[0-9]_*.js; echo '</script></body></html>'; } > index.html
