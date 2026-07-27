# =====================================================================
# Appium + WebdriverIO untuk otomasi Android via tunnel WireGuard.
#
# Stage builder dipakai HANYA untuk mengambil platform-tools: curl, unzip,
# dan arsip zip-nya tidak ikut ke image akhir. Keuntungannya kecil (~15MB)
# karena Appium/WebdriverIO itu JavaScript murni - tidak ada tahap
# kompilasi yang artefaknya bisa dibuang, dan seluruh paketnya ada di
# devDependencies sehingga `npm ci --omit=dev` tidak memangkas apa pun.
# Yang benar-benar menjaga stabilitas VPS adalah mem_limit di compose,
# bukan pemisahan stage ini.
# =====================================================================

FROM debian:12-slim AS android-tools

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl unzip \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /build
RUN curl -fsSL -o platform-tools.zip \
      https://dl.google.com/android/repository/platform-tools-latest-linux.zip \
 && unzip -q platform-tools.zip \
 && rm platform-tools.zip

# ---------------------------------------------------------------------

FROM node:22-slim

# aapt2/apksigner sengaja TIDAK dipasang (butuh JDK, ~300MB). Appium cuma
# memakainya untuk membaca badging APK; tanpa itu dia mencatat warning
# "Could not find aapt2" lalu lanjut normal - sudah diverifikasi jalan.
COPY --from=android-tools /build/platform-tools/adb /opt/android-sdk/platform-tools/adb

ENV ANDROID_HOME=/opt/android-sdk \
    PATH=/opt/android-sdk/platform-tools:$PATH \
    HOME=/home/appium \
    NPM_CONFIG_CACHE=/tmp/npm-cache

# uid 1001 disamakan dengan user `warungbudina` di host supaya bind-mount
# ~/.android (berisi adbkey yang SUDAH terotorisasi di HP Infinix) bisa
# dibaca-tulis. Kalau uid tidak cocok, adb membuat keypair baru dan HP
# akan meminta konfirmasi "Allow USB debugging?" yang harus ditekan manual.
RUN groupadd -g 1001 appium \
 && useradd -u 1001 -g 1001 -m -d /home/appium -s /usr/sbin/nologin appium \
 && mkdir -p /app \
 && chown 1001:1001 /app

WORKDIR /app

# Pindah ke user target SEBELUM npm ci supaya node_modules langsung lahir
# dengan uid yang benar. Versi awal memakai `chown -R` setelahnya, dan itu
# menyentuh puluhan ribu file sehingga Docker menduplikasi seluruh layer -
# 414MB terbuang percuma dan build molor beberapa menit.
USER 1001:1001

COPY --chown=1001:1001 package.json package-lock.json ./

# Cache npm diarahkan ke /tmp lalu dihapus di RUN yang sama; kalau tidak,
# ~150MB arsip tarball ikut membeku ke dalam layer padahal tidak pernah
# dipakai saat runtime.
RUN npm ci --no-audit --no-fund && rm -rf /tmp/npm-cache

COPY --chown=1001:1001 . .

# Diikat ke loopback saja: dengan network_mode host, 0.0.0.0 berarti Appium
# terekspos ke seluruh jaringan termasuk peer WireGuard lain. Test dijalankan
# dari dalam container (`docker compose exec`), jadi loopback sudah cukup.
EXPOSE 4723
CMD ["npx", "appium", "--address", "127.0.0.1", "--port", "4723"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4723/status').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
