# Peta Otomasi — ChatGPT (web) di RN7 via Fennec

**Device**: Redmi Note 7 (`lavender`), crDroid 14, layar **1080 × 2340**
**Akses**: `docker exec tool-appium-appium-1 adb -s 10.66.66.6:5555 ...`
**Target**: `chatgpt.com` di browser **Fennec** (`org.mozilla.fennec_fdroid`)
**Akun**: `clawapp810@gmail.com` (nama tampil "Claw", plan **Free**)
**Tanggal pemetaan**: 2026-09-05

> ⚠️ **Ini BUKAN app ChatGPT.** APK `com.openai.chatgpt` sudah dihapus dari RN7 karena login-nya
> mustahil (di-gate Google Play Integrity — `BIND_EXPRESS_INTEGRITY_SERVICE` butuh `com.android.vending`
> yang absen di crDroid tanpa GApps). Satu-satunya jalur berakun di RN7 = versi web ini.

---

## 0. Prasyarat & cara masuk

```bash
ADB="docker exec tool-appium-appium-1 adb -s 10.66.66.6:5555"

$ADB shell input keyevent 224          # wake
$ADB shell wm dismiss-keyguard         # lolos keyguard
$ADB shell dumpsys power | grep -E "Display Power|mWakefulness"   # pastikan ON + Awake
```

**Buka lewat shortcut home** (paling andal, langsung ke `chatgpt.com` dalam keadaan login):
- Shortcut "ChatGPT" ada di **halaman home ke-2** (geser kiri dari home utama), bounds `[23,108][230,480]` → tap **(126, 294)**
- Alternatif via intent: `$ADB shell am start -a android.intent.action.VIEW -d "https://chatgpt.com/" -n org.mozilla.fennec_fdroid/org.mozilla.fenix.IntentReceiverActivity`

---

## 1. Kontrol browser Fennec (tetap di semua layar)

| Elemen | Koordinat tap | Catatan |
|---|---|---|
| Address bar | **(363, 164)** | tap → keyboard muncul, ketik URL lalu `keyevent 66` |
| Tab baru `+` | **(766, 164)** | |
| Tab switcher | **(890, 164)** | angka di ikon = jumlah tab |
| Menu `⋮` | **(1016, 164)** | |
| Info situs (gembok) | **(84, 164)** | |

**Di dalam tab switcher**: tombol tutup tab ada di pojok kanan-atas tiap kartu.
Contoh 2 tab: kartu-1 close **(468, 323)**, kartu-2 close **(987, 323)**.
Judul tab membedakan status login: **"ChatGPT"** = login, **"ChatGPT: Chat, Work, Create & Code with AI"** = logout.

**Menu ⋮ → item penting** (bottom sheet, perlu tap "Lebih banyak" dulu di **(296, 1631)**):
| Item | Koordinat |
|---|---|
| Segarkan (reload) | **(941, 490)** |
| Tambahkan ke Beranda | **(394, 1871)** |

---

## 2. Layar utama ChatGPT (login, tanpa keyboard)

| Elemen | Koordinat tap | Fungsi |
|---|---|---|
| Hamburger (sidebar) | **(76, 324)** | buka daftar chat |
| Selector model `ChatGPT ⌄` | **(277, 324)** | dropdown model |
| Upgrade | **(840, 324)** | upsell Plus (abaikan) |
| Obrolan baru (ikon kanan-atas) | **(1002, 324)** | reset ke chat kosong |
| **Kolom input** | **(538, 2016)** | tap → fokus + keyboard |
| Lampiran `+` | **(109, 2113)** | menu unggah file/gambar |
| Mic (dikte) | **(855, 2113)** | |
| Mode suara (bulat biru) | **(969, 2113)** | |

**Chip saran** (hanya di chat kosong):
| Chip | Tap | Tombol tutup ✕ |
|---|---|---|
| Buat gambar atau stiker | (400, 791) | (980, 791) |
| Tulis atau edit | (400, 927) | (980, 927) |
| Cari di web | (400, 1062) | (980, 1062) |

---

## 3. Layar input aktif (keyboard terbuka)

Layout naik: kolom input pindah ke **(538, 1212)**, baris tombol ke **y ≈ 1310**
(`+` (109,1310) · mic (855,1310) · suara (969,1310)).

**Tombol kirim** menggantikan tombol suara begitu ada teks → tap **(969, 1310)**.

---

## 4. Sidebar (hamburger)

| Elemen | Koordinat |
|---|---|
| Tutup sidebar ✕ | **(608, 321)** |
| Cari 🔍 | **(505, 321)** |
| **Obrolan baru** | **(300, 466)** |
| Gambar | (300, 570) |
| Pustaka | (300, 674) |
| Terjadwal | (300, 778) |
| Plugin | (300, 882) |
| Proyek (+ di (615,986)) | (300, 986) |
| Codex (↗ di (612,1090)) | (300, 1090) |
| Lebih banyak | (300, 1195) |
| Header "Terkini" (edit (542,1321) · ⋯ (615,1321)) | — |
| Item chat ke-1 | (300, 1415) · menu ⋯ (615, 1415) |
| Item chat ke-2 | (300, 1519) · menu ⋯ (615, 1519) |
| Akun (nama + plan) | (300, 2126) |
| Upgrade (bawah) | (538, 2152) |

Jarak antar item chat ≈ **104 px**; item ke-N ≈ `y = 1415 + (N-1) × 104`.

---

## 5. Dropdown model

| Opsi | Koordinat | Status |
|---|---|---|
| ChatGPT Plus (+ tombol Upgrade (814,491)) | (351, 442) | upsell, tak bisa dipakai |
| **ChatGPT** (✓ aktif di (881,647)) | **(311, 620)** | satu-satunya model di plan Free |

---

## 6. Layar percakapan

Posisi **Y bergantung panjang percakapan** — X tetap.

**Baris aksi di bawah pesan USER**: copy (786) · bagikan (892) · edit ✏️ (996)
**Baris aksi di bawah jawaban ASSISTANT**: copy (67) · 👎 (172) · bagikan (276) · regenerate (380) · ⋯ (486)

**Deteksi status generate selesai**: dump UI lalu cek `content-desc="Good response"` / `"Bad response"` —
muncul hanya setelah jawaban rampung (sama pola dgn app ChatGPT di RN5).

---

## 7. Jebakan penting (mahal ditemukan, jangan diulang)

1. **`keyevent 66` (Enter) TIDAK mengirim pesan** — ini `<textarea>` web, Enter = baris baru.
   **Wajib tap tombol kirim** di (969, 1310).
2. **Pohon aksesibilitas WebView TIDAK stabil terekspos** ke `uiautomator dump` di Fennec —
   sering hanya muncul 1 node `android.webkit.WebView` (≈38 node total, tanpa isi halaman).
   Kadang isi web muncul (mis. saat alur login Google), tapi **jangan diandalkan**.
   → **Otomasi di sini berbasis KOORDINAT screenshot**, bukan selector. Verifikasi hasil lewat
   `screencap` + baca gambar, bukan lewat dump.
3. **Shortcut bisa memakai ulang tab lama** — kalau ada tab `chatgpt.com` berstatus logout,
   shortcut menampilkannya (tampak "belum login" padahal sesi aman).
   → Tutup tab basi; bedakan lewat judul tab (lihat §1).
4. **Sesi login persisten** di profil Fennec (bertahan lintas reload & tutup-tab), **bukan** per-tab.
5. **`input tap` polos kadang tak ngefek** (pola lama RN7) → pakai
   `input swipe X Y X Y 100` sebagai pengganti tap.
6. **Layout bergeser saat keyboard muncul** (~800 px) — selalu ambil koordinat dari state
   yang benar (§2 tanpa keyboard vs §3 dengan keyboard), jangan campur.
7. **`keyevent 4` (back) di halaman paling atas = KELUAR Fennec ke launcher**.
   Untuk sekadar menutup keyboard, `keyevent 111` (ESC) lebih aman.
8. **Buat shortcut HARUS dari URL root `chatgpt.com`** — kalau dibuat saat membuka
   `chatgpt.com/c/<id>`, shortcut mengarah ke satu percakapan & namanya jadi judul chat.

---

## 8-A. ⭐ RESEP UTAMA — kirim prompt & ambil jawaban via RDP (TERUJI, tanpa koordinat)

**Pakai cara ini.** §8-B (koordinat) hanya cadangan kalau RDP mati.

Prasyarat: `adb -s 10.66.66.6:5555 forward tcp:6001 localabstract:org.mozilla.fennec_fdroid/firefox-debugger-socket`
(dari HOST akses-vps; lihat `fennec-rn7-map.md` §7. Forward hilang tiap adb server restart → pasang ulang).

### Selector kunci (stabil, hasil verifikasi live 2026-09-05)
| Elemen | Selector | Catatan |
|---|---|---|
| Kolom input | `#prompt-textarea` | **DIV `contenteditable`, class `ProseMirror`** — bukan textarea! |
| Tombol kirim | `[data-testid="send-button"]` | baru MUNCUL setelah ada teks; `aria-label="Kirim perintah"` |
| Pesan (user & assistant) | `[data-message-author-role]` | nilai atribut: `user` / `assistant` |
| Sidebar | `[data-testid="open-sidebar-button"]` | |
| Pemilih model | `[data-testid="model-switcher-dropdown-button"]` | |
| Tambah file | `[data-testid="composer-plus-btn"]` | |

### Mengetik ke ProseMirror
`el.innerText = "..."` **TIDAK BEKERJA** (React/ProseMirror mengabaikannya).
Yang berhasil: fokus → seleksi seluruh isi → `execCommand('insertText')`.

```js
(() => {
  const el = document.querySelector('#prompt-textarea');
  el.focus();
  const sel = window.getSelection(), r = document.createRange();
  r.selectNodeContents(el); sel.removeAllRanges(); sel.addRange(r);
  document.execCommand('insertText', false, "TEKS PROMPT DI SINI");
  return JSON.stringify({isi: el.innerText});
})()
```

### Kirim
```js
document.querySelector('[data-testid="send-button"]').click()
```

### Baca seluruh percakapan (1 panggilan, ganti ~25 scroll+dump)
```js
(() => {
  const msgs = [...document.querySelectorAll('[data-message-author-role]')];
  return JSON.stringify(msgs.map(m => ({
    peran: m.getAttribute('data-message-author-role'),
    teks: (m.innerText || '').trim()
  })));
})()
```

### Deteksi jawaban selesai
⚠️ **`[data-testid="stop-button"]` TIDAK ANDAL** — pada uji 2026-09-05 tetap `true`
sampai 50 detik walau jawaban sudah rampung. **Cara yang dipakai: polling panjang teks
pesan assistant terakhir sampai berhenti bertambah** (mis. sama 2× cek berturut-turut, jeda 3-5 dtk),
atau cukup tunggu 15–25 detik untuk jawaban pendek.

### Hasil uji live (2026-09-05)
Prompt "Sebutkan 3 ide judul konten pendek tentang tips baterai HP" → terkirim, URL berubah ke
`/c/<id>` (percakapan baru tersimpan), jawaban terbaca utuh. **Nol tap koordinat, nol screenshot.**

---

## 8-B. Resep cadangan — via koordinat (kalau RDP tidak tersedia)

```bash
ADB="docker exec tool-appium-appium-1 adb -s 10.66.66.6:5555"

# 1) bangunkan + buka shortcut
$ADB shell input keyevent 224; $ADB shell wm dismiss-keyguard
$ADB shell input keyevent 3          # ke home
$ADB shell input swipe 900 1200 200 1200 300   # ke halaman home ke-2
$ADB shell input tap 126 294         # shortcut ChatGPT
sleep 20

# 2) fokus kolom input (pakai swipe-tap, lebih andal)
$ADB shell input swipe 538 2016 538 2016 120
sleep 3

# 3) ketik prompt — WAJIB %s utk spasi, kutip TUNGGAL, pecah per klausa
$ADB shell input text 'Buatkan%side%skonten%stutorial'
sleep 2
$ADB shell input text '%stentang%steknologi%ssehari-hari.'
sleep 2

# 4) kirim (JANGAN Enter)
$ADB shell input swipe 969 1310 969 1310 100

# 5) tunggu selesai lalu screenshot utk dibaca
sleep 25
$ADB shell screencap -p /sdcard/out.png
$ADB pull /sdcard/out.png /home/appium/.android/out.png
```

**Aturan ketik teks panjang** (sama seperti RN5, lihat memori `project_redmi_vn_node`):
- spasi → `%s`
- hindari `( ) , ' "` dan `!` di dalam kutip ganda (shell Android mem-parse ulang)
- pecah jadi potongan ±5 kata dengan `sleep 1-2` antar potongan
- setelah loop `keyevent 67` (backspace) banyak, **beri jeda 2-3 detik** sebelum mengetik lagi
  (kalau tidak, karakter acak akan hilang)

---

## 9. Audit live 2026-09-05 (sesi lanjutan) — temuan & koreksi

**Metode audit:** murni via RDP (`adb forward tcp:6001 ...`), tanpa satu pun tap koordinat/screenshot.

### 9.1 Fakta akun (terverifikasi authed, bukan tebakan UI)
| Item | Nilai |
|---|---|
| Email | `clawapp810@gmail.com` |
| Nama | "Claw" (backend `/me`) / "claw app2" (display `/api/auth/session`) |
| **MFA/2FA** | **AKTIF** (`mfa_flag_enabled=true`) — catat untuk pemulihan akun |
| Plan | **Free** (tak ada fitur `paid/plus/pro/team`) |
| Token sesi | valid, `expires 2026-12-04` |
| Percakapan | 3 total: "Ide Judul Tips Baterai" (5/9), "Sapa RN7" (5/9), **"Asisten Hitung Belanja" (2026-08-13)** |

> ⚠️ **"Asisten Hitung Belanja" dari 13-08-2026 MENDAHULUI setup terdokumentasi 5/9** → mengonfirmasi
> anomali `firstInstallTime=2026-09-01` di memori: akun ini SUDAH dipakai di RN7 jauh sebelumnya.
> Bukan akun perawan.

### 9.2 ⭐ Dua jebakan RDP yang mahal (WAJIB baca sebelum pakai fetch API)
1. **`evaluateJSAsync` TIDAK meng-await Promise** di build Fennec ini. Ekspresi `async`/`fetch(...)`
   mengembalikan **grip Promise `pending`**, bukan hasilnya. → **Pola wajib:** jalankan fetch,
   simpan hasil ke variabel global (`window.__x = JSON.stringify(...)`), lalu **polling sinkron**
   `typeof window.__x==='string' ? window.__x : '__P__'` tiap ~0.6 dtk sampai terisi.
2. **`/backend-api/*` butuh Bearer token, bukan cukup cookie.** Fetch cookie-only ke
   `/backend-api/me` & `/backend-api/conversations` balik jalur **anonim** (email kosong,
   `total:0`) walau jelas sedang login. → Ambil dulu `accessToken` dari **`/api/auth/session`**,
   lalu kirim header `Authorization: 'Bearer '+token` pada semua panggilan backend-api.
   (`/api/auth/session` sendiri cukup cookie & langsung memberi email+nama+token.)

### 9.3 Round-trip TERUJI ULANG (recipe §8-A masih valid)
Kirim `#prompt-textarea` (execCommand insertText) → klik `send-button` → chat baru `/c/...` dibuat →
jawaban terbaca via `[data-message-author-role="assistant"]`. **Nol koordinat.**
⚠️ **Deteksi selesai:** selector DOM `good-response...` TIDAK ditemukan (abaikan tebakan itu);
tetap andalkan **polling panjang teks assistant sampai stabil ≥3 cek** (jawaban pendek bisa
menipu polling 2-cek — naikkan ke 3). `stop-button` tetap tak andal (§8-A).
