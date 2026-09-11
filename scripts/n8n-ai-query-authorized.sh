#!/bin/bash
# Forced-command entrypoint utk kunci SSH `n8n-ai-query-deploy` (dipasang via
# `command=` di authorized_keys, restrict `from=<IP CHROME-VPS>`).
#
# TUJUAN: n8n (di CHROME-VPS) manggil skrip ai_wiki_query.py --raw lewat SSH
# TANPA bisa jalankan command sembarang di akses-vps - kunci ini HANYA bisa
# memicu 1 hal: query 1 AI (chatgpt|claude|gemini) dengan 1 prompt teks.
#
# Protokol (yg dikirim n8n via field "command" SSH node):
#   <site> <prompt bebas, boleh multi-kata/multi-baris>
# Contoh: "chatgpt Halo, apa kabar?"
#
# Tak pakai `read`/eval - murni bash string-slicing, aman dari shell-injection
# krn isi prompt TAK PERNAH dieval sbg kode, cuma diteruskan sbg 1 argumen
# string ke python (via "$prompt", selalu dikutip).
set -euo pipefail

cmd="${SSH_ORIGINAL_COMMAND:-}"
site="${cmd%% *}"
prompt="${cmd#* }"

case "$site" in
  chatgpt|claude|gemini) ;;
  *)
    echo '{"ok":false,"error":"site tak dikenal/hilang - format: <chatgpt|claude|gemini> <prompt>"}' >&2
    exit 1
    ;;
esac

if [[ -z "$prompt" || "$prompt" == "$cmd" ]]; then
  echo '{"ok":false,"error":"prompt kosong"}' >&2
  exit 1
fi

exec python3 /home/warungbudina/tool-appium/scripts/ai_wiki_query.py --raw "$site" --prompt "$prompt"
