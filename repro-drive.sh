#!/usr/bin/env bash
# repro-drive.sh — orchestrator reproduksi VN per-segmen (zoom/lighting berpandu-data).
# Menjalankan tests/repro-segments.js SEKALI PER SEGMEN (run wdio terpisah) supaya:
#   - hindari batas mocha-timeout 180s (1 segmen ~47s),
#   - ISOLASI kegagalan: segmen gagal tak merusak segmen lain (§23f).
# Selection state hilang antar sesi wdio (§23d) -> tiap run re-seek+re-select sendiri.
# Terbukti lebih robust dari single-session panjang (yang rapuh utk 3+ segmen).
#
# Pakai:  ./repro-drive.sh <plan.json> [splits]
#   plan.json = [{"t":detik,"zoom":"in"|"out"|null,"adj":{"type":"BRIGHTNESS"|"CONTRAST"|
#                 "EXPOSURE"|"SATURATION","dir":"up"|"down"}|null}, ...]
#   splits    = "20,40" (opsional; titik split -> N+1 segmen). Kosong = anggap sudah dipotong.
# Env: ANDROID_UDID (default 10.66.66.2:45671).
#
# ⚠️ VN build MOD ini UI BAHASA INGGRIS -> jenis Adjust pakai label Inggris.
set -uo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
UDID="${ANDROID_UDID:-10.66.66.2:45671}"
PLAN_FILE="${1:?usage: repro-drive.sh <plan.json> [splits]}"
SPLITS_ARG="${2:-}"
cd "$DIR"

run() { # $1=SPLITS  $2=PLAN(json)
  timeout 170 docker compose exec -T -e ANDROID_UDID="$UDID" -e APP_PACKAGE=com.frontrow.vlog \
    -e FORCE_APP_LAUNCH=false -e SPLITS="$1" -e PLAN="$2" \
    appium npx wdio run ./wdio.conf.js --spec tests/repro-segments.js 2>&1
}

if [ -n "$SPLITS_ARG" ]; then
  echo ">> SPLIT @${SPLITS_ARG}"
  run "$SPLITS_ARG" "[]" | grep -E "\[repro\]" || true
fi

N=$(python3 -c "import json;print(len(json.load(open('$PLAN_FILE'))))")
OK=0
for i in $(seq 0 $((N - 1))); do
  SEG=$(python3 -c "import json;print(json.dumps([json.load(open('$PLAN_FILE'))[$i]]))")
  echo ">> SEGMEN $i/$((N - 1)): $SEG"
  OUT=$(run "" "$SEG"); echo "$OUT" | grep -E "\[repro\]" || true
  if echo "$OUT" | grep -q "SELESAI: 1/1"; then OK=$((OK + 1)); else echo "   !! segmen $i GAGAL"; fi
done
echo "=== DRIVER SELESAI: ${OK}/${N} segmen sukses ==="
[ "$OK" -eq "$N" ]
