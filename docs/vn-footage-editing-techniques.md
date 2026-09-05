# Teknik & Gaya Editing Footage — VN Video Editor (RN7)

**Device uji**: Redmi Note 7 (`lavender`), crDroid 14, 1080×2340, VN **2.17.0** (vc 6989)
**Sumber pengetahuan**: ChatGPT (akun `clawapp810`, plan Free) — digali via Firefox RDP di RN7
(lihat `chatgpt-web-rn7-map.md`).
**Validasi**: tiap klaim ChatGPT DIsilang-cek terhadap VN app nyata (peta `vn-automation-map.md`
§8/§21g) + **1 uji nyata live** (Speed 2x → durasi terverifikasi).
**Tanggal**: 2026-09-05

> ⚠️ Status: pengetahuan ini **sudah divalidasi**, bukan mentah dari ChatGPT. ChatGPT ~85% akurat
> untuk VN; koreksi penting ada di §Matriks Validasi. Aturan produksi tetap: **VN op-tunggal + verifikasi
> durasi** (lihat `feedback_vn_lynx_no_multiop` & `vn-automation-map.md` §23f — rangkaian multi-op di
> panel Lynx rapuh/gagal senyap).

---

## A. 10 Teknik Editing Footage (divalidasi ke VN 2.17.0)

| # | Teknik | Fitur di VN | Langkah singkat | Kapan dipakai | Status validasi |
|---|---|---|---|---|---|
| 1 | Cutting berirama | **Split** (`editor_toolbar_split`) | playhead → Split → hapus bagian → susun ulang | Buang jeda, pacing cepat, ganti-shot ikut musik | ✅ ADA |
| 2 | Transisi | **Transition** (ikon antar-klip) | tap ikon antar-2-klip → pilih gaya → atur durasi | Haluskan pergantian shot / aksen beat. Jangan di tiap cut kalau mau clean | ✅ ADA (§8 peta) |
| 3 | Speed ramp | **Speed** (`editor_toolbar_speed`) → tab **Curve** | pilih klip → Speed → Curve → preset/atur titik | normal→cepat→slow-mo pada gerakan/reveal | ✅ ADA — **feature-flag**, lihat §Caveat |
| 4 | Kecepatan tetap | **Speed** → tab **Regular** | Speed → Regular → geser ruler 0.1x–3x | percepat bagian kosong, slow-mo sederhana | ✅ ADA — **DIUJI NYATA** (§C) |
| 5 | Animasi | **Keyframe** (deret aksi cepat klip, §8a) | pilih klip/teks → playhead → Keyframe → ubah posisi/skala/rotasi → titik berikut | zoom-in/out, push-in, objek/teks bergerak tanpa footage tambahan | ✅ ADA |
| 6 | Color grading | **Filter / Adjust** (`editor_toolbar_filter`) | Filter atau Adjust → exposure/contrast/saturation/temp → Intensity 0–100 | samakan warna antar-shot, bangun mood. Koreksi dasar dulu baru look | ✅ ADA (kategori Aesthetic/Vivid/Essential…) |
| 7 | Impor LUT | Filter panel → **+ Add** | tab Filter → **+ Add** (kiri) → impor file LUT → atur Intensity | pakai LUT sinematik custom | ✅ ADA (klaim "kalau tersedia" ChatGPT → nyatanya ADA) |
| 8 | Teks & caption | **Text/Caption** (`editor_track_subtitle_add`) + animasi/keyframe | Text → isi → font/style → durasi → animasi masuk/keluar atau Keyframe | subtitle, hook, keyword, teks ikut objek. Impor SRT: §23a peta | ✅ ADA |
| 9 | Beat-sync | **AutoCut / BeatsClips / Music Beats** | tambah musik → Beat marker → taruh cut/transisi/zoom di marker | edit yang "nempel" ke ritme | ✅ ADA (peta §13 AutoCut, §20 BeatsClips, §22) |
| 10 | Overlay / PiP | **PiP** (`editor_toolbar_toPiP`, §8c) | tambah media sbg layer → resize/posisikan → Keyframe/Mask bila perlu | reaction, B-roll kecil, logo, screen-rec di atas footage utama | ✅ ADA (multi-track) |
| — | Rasio aspek | **Ratio** (BUKAN "Canvas") | atur di AWAL → 9:16 utk Reels/TikTok → posisikan/scale | sumber footage campuran landscape+portrait | ✅ ADA — *koreksi: VN pakai "Ratio", ChatGPT bilang "Canvas" (salah istilah)* |
| — | Stabilisasi | **TIDAK ADA sbg tool diskrit** di VN 2.17.0 | — | — | ❌ ABSEN — ChatGPT meng-hedge ("jangan dipaksakan") = tepat |

**Urutan workflow praktis (dari ChatGPT, masuk akal untuk VN):**
`Ratio 9:16 → Split → susun beat → Speed → Transition → Color → Text → Overlay/PiP → Keyframe → preview → export`

---

## B. 6 Gaya (Style) Editing Footage — untuk brand makanan/lifestyle

| Gaya | Ciri visual & pacing | Teknik VN | Footage cocok | Resep singkat di VN |
|---|---|---|---|---|
| **1. Fast-Paced Punchy** | Energik, cut 0,3–1,5 dtk, banyak visual "hit" | Split, zoom-Keyframe, transisi singkat, Speed, teks pop-up, beat | close-up makanan, pouring, plating, ekspresi | footage masuk → potong ikut beat → zoom-keyframe di momen kunci → transisi 0,1–0,3 dtk → teks pendek di beat |
| **2. Cinematic** | Elegan, dramatis, tempo lambat, warna dominan | Speed (slow), Keyframe, Filter/Adjust, Fade/Dissolve, teks minimal | hero shot produk, slow-mo, tekstur makanan | susun wide→medium→close → perlambat footage kunci → Adjust warna konsisten → dissolve halus → musik sinematik + teks kecil |
| **3. Vlog Santai** | Natural, spontan, pacing sedang | jump cut, Speed, caption/voice-over, transisi sederhana | orang makan, BTS, walking, ngobrol, suasana | buang jeda (Split) → sisakan reaksi natural → percepat bagian kosong → voice-over/caption → transisi minim |
| **4. B-Roll Storytelling** | Alur cerita: hook→proses→detail→payoff | Split, Keyframe, speed-ramp ringan, Fade, story-caption, audio layering | persiapan/proses masak, tangan bekerja, hasil | hero shot = hook → footage proses berurutan → sisip close-up detail → keyframe push-in → akhiri final product + CTA |
| **5. Beat-Sync / Velocity** | Sangat ritmis, shot & speed ikut musik | Beat marker, Speed **Curve** (velocity), cut-on-beat, zoom-Keyframe, flash | pouring, toss, buka kemasan, walking/dance | musik → tandai beat → potong tepat di beat → Speed Curve slow→fast→slow → zoom/keyframe di beat utama |
| **6. Aesthetic Minimal** | Bersih, tenang, premium, sedikit efek | Filter/Adjust, Crop, Keyframe halus, Fade, teks sederhana | produk di meja, café, flat lay, interior | pilih 5–8 shot bersih → samakan exposure/warna → banyak "napas" antar-shot → keyframe gerakan sangat halus → teks kecil + musik ambient |

**Formula cepat pilih gaya:** viral/enerjik→Fast-Paced · premium→Cinematic · dekat/personal→Vlog ·
jual cerita→B-Roll · ikut musik agresif→Beat-Sync · clean modern→Aesthetic Minimal.

---

## C. ⭐ UJI NYATA (live, 2026-09-05) — Teknik #4 Kecepatan Regular 2x

Dijalankan penuh via ADB di RN7 untuk membuktikan teknik benar-benar bekerja, bukan sekadar klaim.

**Alur terverifikasi (proyek baru, 1 klip, TIDAK disimpan — bersih):**
1. Home → FAB "+" @927,2044 → CreationActivity
2. **New Video** (`createKit_create_newProject` @540,673) — *pakai `input swipe x y x y 120` sbg tap; `input tap` polos sering tak ngefek di RN7*
3. Dialog Mode → **Berbasis Video** (`clVideoBase` @540,1523) → **Save** (`tvSave` @540,2069)
4. Media picker → filter **Video** @511,412 → pilih klip (`check_view` @179,532) → verifikasi `tvSelectedCount`="1" → **Next** @962,1906
5. Editor: klip **durasi asli = 20.13s** (`total_textView`/`tvTimelineItemDuration`)
6. Toolbar utama → **Speed** (`editor_toolbar_spe` "Speed" @881,2182)
7. Panel Speed terbuka → tab **Regular** @676,1767 → seret ruler 2x→tengah (`input swipe 800 2003 540 2003 500`) → `tvSpeed`="**2.0x**"
8. **Done** (`ivDone` @914,2198)

**HASIL:** `total_textView` & `tvTimelineItemDuration` = **10.07s**
→ 20.13 ÷ 2 = 10.065 ≈ **10.07** ✅ **cocok persis.** Teknik Speed nyata & akurat.

**Verifikasi panel Speed tab Curve** (validasi klaim "Speed Curve" ChatGPT) — preset live yang muncul:
`Original · Custom · Montage · Hero Time · Bullet Time · Jump Cut · Fast In` (+scroll) — **cocok** dgn
peta §21g & deskripsi ChatGPT.

**Cleanup:** keluar via `editor_topbar_back` (@63,159 — BUKAN @142 spt catatan lama) → dialog →
**"Exit directly"** (`tvExit` @540,2006). Proyek TIDAK tersimpan; daftar tetap 3 proyek, nol perubahan.

---

## D. Matriks Validasi — Klaim ChatGPT vs VN 2.17.0 nyata

| Klaim ChatGPT | Realita VN | Putusan |
|---|---|---|
| Speed / Speed Curve dgn preset | `editor_toolbar_speed`, tab Curve+Regular, preset Montage/Hero/Bullet/Jump Cut | ✅ BENAR (diuji) |
| Filter/Adjust + LUT | Filter panel, tab Adjust, **+ Add** = impor LUT, Intensity 0–100 | ✅ BENAR |
| Keyframe, Transisi, PiP, Text, Beat-sync | Semua ada (peta §8a/§8/§8c/§8d/§13/§20/§22) | ✅ BENAR |
| "Ratio / **Canvas**" | VN menyebutnya **Ratio** saja; "Canvas" = 0 hit | ⚠️ SALAH ISTILAH |
| Stabilisasi "jika tersedia" | Tak ada tool stabilize diskrit di 2.17.0 | ❌ ABSEN (hedge ChatGPT tepat) |
| (tak klaim) Freeze frame | Memang absen (§8e) | ✅ ChatGPT benar tak mengklaim |

**Artefak halusinasi kecil ChatGPT:** jawaban menyisipkan sitasi palsu "VN Video Editor +1" antar-poin —
diabaikan, tak memengaruhi isi teknis.

---

## E. Caveat produksi (WAJIB dibaca sebelum otomasi)

1. **Speed itu feature-flag sisi server/akun.** Peta §8e dulu mencatat "Kecepatan TIDAK ADA", §21g
   mengoreksi jadi ADA — app-version sama, beda status akun. **Verifikasi ulang tool ada sebelum
   otomasi**, jangan asumsi dari catatan lama.
2. **Panel Speed/Filter/Transisi = permukaan "Lynx" mirip-WebView tanpa view-id stabil** → koordinat
   mentah, tap meleset SENYAP. **Op-tunggal saja**; rangkaian multi-op gagal senyap (§23f).
3. **Verifikasi hasil pakai DURASI**, bukan asumsi tap sukses (metode di §C). Ekspor plafon **1080p**
   walau Pro (§21h).
4. **`input tap` sering tak ngefek di RN7** → pakai `input swipe X Y X Y 120`.
5. **Dump `uiautomator` bisa basi (race)** — hapus `/sdcard/u.xml` + jeda ~0.6s sebelum `cat`; kalau
   ragu, **screenshot** (hampir salah-hapus proyek gara-gara dump basi saat sesi ini).
