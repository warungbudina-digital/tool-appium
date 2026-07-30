# Flow Studio — UI Automation Map (`com.frontrow.flow` v1.8.1)

Companion graphic-design app to VN (same developer, Ubiquiti Labs LLC). Role:
create graphics/overlays in Flow Studio, then **"Apply to VN"** (see VN map,
tool `editor_toolbar_flowStudio`). Category: Seni & Desain (~128 MB).

**Good news for automation:** unlike VN's newer Lynx screens, Flow's screens map
so far are **`NATIVE_APP` with proper resource-ids** — selectors are stable and
reliable (no coordinate-only guessing needed for most elements).

## How this was mapped

Mapped from the VPS via the `tool-appium` container + `tests/ui-map.js` against
the Infinix (WireGuard `10.66.66.2`). Per-exec ANDROID_UDID override is required
(the container bakes `.env` ANDROID_UDID at start; the wireless-debug port
changes each toggle):

```sh
cd ~/tool-appium
docker compose exec -T -e ANDROID_UDID=10.66.66.2:<port> -e APP_PACKAGE=com.frontrow.flow \
  -e FORCE_APP_LAUNCH=false -e MAP_NAME=<label> appium npx wdio run ./wdio.conf.js --spec tests/ui-map.js
# result JSON: /tmp/uimap-<label>.json  (keys: pkg, activity, contexts, count, nodes[]; each node: id,label,class,clickable,scrollable,x/y/w/h,tapX,tapY)
```

Launch fresh: `adb shell am force-stop com.frontrow.flow; adb shell monkey -p com.frontrow.flow -c android.intent.category.LAUNCHER 1`.

---

## §1 FirstTimeActivity — `com.frontrow.flow/.ui.firsttime.FirstTimeActivity`

Home / launcher screen. NATIVE_APP.

| Element | id | Action |
|---------|----|--------|
| Close | `ivClose` @90,150 | exit Flow |
| **Create Design** | `flCreateNewProject` @540,465 (label "Create Design") | → **CreationActivity** |
| Template collections | `rvList` (scroll) → cards `tvCollection`: "Happy Birthday" @221,1091, "Filter" @590,1091, "Travel" @941,1091 | open a template collection |
| Recently used | section `tvTitle` "Baru-baru ini Gunakan" + `tvCount`, card `clRoot` @261,1451 | reopen recent design |
| New templates | section "Baru" `tvCount` "(100)", `tvSeeAll` "Lihat Selengkapnya" @847,1694; cards `clRoot`/`ivCover` @…,2001 | open a template |

## §2 CreationActivity — `com.frontrow.flow/.ui.creation.CreationActivity`

New-design canvas/size chooser. NATIVE_APP. Three top tabs via `viewPager`:

- Tabs (`title_container`): **"Create"** @125,276 · **"AI Kits"** @323,276 · **"AI Market"** @547,276.
- Close: `ivClose` @90,168.

**Create tab:**
- `rvCreationPackage` (GridView) — preset packages, e.g. `flCover`/`ivCover`/`tvTitle` "Brand Kit" @130.
- **`tvCustomSize` "Ukuran Khusus:"** @540,798 — custom size entry.
- Size-preset list `rvList` (scroll) — rows `ivLogo`+`tvTitle`+`tvSize`, e.g.:
  - "Instagram Story" `1080 x 1920 px` @…,1078
  - "Photobook (Portrait)" `7 x 9 in`, "Photobook" `8 x 8 in`, "Photobook (Landscape)" `8 x 6 in` …
  - section headers `tvTitle` "Baru-baru ini digunakan", "Disarankan" (`ivIcon` @984,1339)
- `clMoreWays` "More ways to create" — `rvAlbum` photo cards `cardView`/`ivImage` @…,2101 + `tvViewAllPhoto` "Lihat semua" @903,1916 (create from a photo).

Tapping a size preset (e.g. Instagram Story @540,1078) → **FlowEditorActivity** with a blank canvas of that size.

> TODO: map **AI Kits** and **AI Market** tabs (new in v1.8.1, not previously documented).

## §3 FlowEditorActivity — `com.frontrow.flow/.ui.editor.FlowEditorActivity`

The core design editor. NATIVE_APP. Three regions:

### §3.1 Top bar (`clTopViews`, y≈183)
| id | @tap | Function |
|----|------|----------|
| `ivClose` | 62,183 | exit editor (may show "Back to VN / Stay at Flow Studio" dialog — TODO verify) |
| `ivHelp` | 177,183 | help |
| `ivUndo` | 285,183 | undo |
| `ivRedo` | 393,183 | redo |
| `ivSetting` | 603,183 | editor settings (TODO map) |
| `ivFullScreen` | 711,183 | fullscreen preview |
| `ivSave` | 843,183 | save draft |
| **`tvExport`** | 981,183 | **Export / Apply to VN** (TODO map flow) |

### §3.2 Canvas
- `vpDraftPage` (ViewPager, **scrollable = multi-page design**) → `editorPanel` → `clPlayerGroup` → `editorVideoView`/`glVideoView` (GL render surface). Elements are placed/selected on this surface (no per-element resource-ids; selection is by coordinate tap on the canvas).

### §3.3 Bottom tool menu (`vgMenu`, y≈2156)
- **`ivMenuAdd`** @96,2156 — opens the **asset-picker bottom sheet** (see §3.4).
- **`hsvRootMenu`** (horizontal-scroll RecyclerView) — tool buttons `ivIcon`+`tvName`. Full ordered list (scroll left to reveal):

  1. **Foto** (Photo) @272,2204
  2. **Teks** (Text) @446,2204
  3. **Tempel** (Paste/stickers) @620,2204
  4. **Shapes** @794,2204
  5. **Frames** @968,2204
  6. **Grids** @246,2204
  7. **Latar belakang** (Background) @420,2221
  8. **Gaya** (Style) @594,2204
  9. **Layer** @816,2204
  10. **Mosaik** (Mosaic) @990,2204
  11. **Pembesar** (Magnifier) @293,2204
  12. **Hapus** (Delete) @467,2204
  13. **Duplikat** (Duplicate) @641,2204
  14. **Kunci** (Lock) @815,2204
  15. **Sembunyikan** (Hide) @989,2221

  (Tap points after 5 assume the toolbar has been scrolled so the tool is on-screen;
  `tvName` selector is reliable — prefer `//*[@resource-id="…tvName"][@text="Teks"]`.)
  Note: Hapus/Duplikat/Kunci/Sembunyikan/Pembesar are element-context actions (apply
  to the currently selected element).

### §4 Export / Apply-to-VN flow (from `tvExport` @981,183)

Tapping **`tvExport`** opens the **Export bottom sheet** (`design_bottom_sheet`,
stays in FlowEditorActivity, NATIVE_APP). Three actions:

| Element | id | @tap | Action |
|---------|----|------|--------|
| **Buat Video dengan VN** | `tvExportVideoToVn` | 541,1751 | **Apply to VN** — render design → hand off to VN |
| Ekspor | `tvExport` | 540,1888 | export image/file to device |
| Membuat | `flCreateTemplate` (label "Membuat") | 540,2050 | create a Flow template from this design |
| (help) | `tvWhatAreTemplate` "Apa itu template?" | 541,2210 | what-are-templates help |
| close | `ivClose` | 90,198 | dismiss sheet |
| (header) | `ivVNLogo` @540,375, `tvVN` "Editor Video Cepat dan Pro" @540,550 | VN promo |

**Apply-to-VN path (verified end-to-end 2026-07-29):**

1. `tvExport` (top bar) → Export sheet.
2. **`tvExportVideoToVn` "Buat Video dengan VN"** @541,1751 → **"Pengaturan Durasi
   Video"** sheet (video duration settings — each Flow page becomes a video segment):
   - `tvTitle` "Pengaturan Durasi Video" @541,1498
   - "Durasi" + **`etDuration`** "3.0s" @933,1645 (editable per-page default duration)
   - `rvDuration` (duration picker wheel)
   - `tvTip` "Atur durasi video default setiap halaman…"
   - **`btSave` "Simpan"** @540,2176 → renders and hands off.
3. `btSave` → Flow renders the design to video and **launches VN**, landing in
   **`com.frontrow.vlog/com.frontrow.videoeditor.editor.EditorActivity`** (VN's
   standard editor, see vn-automation-map.md) with the Flow graphic imported as a
   video clip. This is the Flow↔VN integration endpoint.

> **Automation note:** the full chain is selector-driven and reliable —
> `tvExport` → `tvExportVideoToVn` → (optionally set `etDuration`) → `btSave`.
> After `btSave` the automation context switches to the **VN** app (different
> package); continue with the VN map from EditorActivity.
> **Side effect:** this creates a VN draft/project (VN autosaves). Reliable
> cleanup: `adb shell pm clear com.frontrow.vlog` (per vn-automation-map notes).
> This standalone run (Flow launched via launcher, not from within VN) still
> reached VN fine — "Buat Video dengan VN" launches VN itself.

### §3.4 Asset-picker bottom sheet (`design_bottom_sheet`)
Opens over the editor (e.g. on `ivMenuAdd`, or when adding first element). NATIVE_APP.
- Dismiss: `KEYCODE_BACK` once (closes sheet, stays in editor — verified; does NOT exit editor).
- Search: `etSearch` "Mencari" @594,291.
- Tabs (`tabLayout`, `ivTabName`): **Graphics** @144 · **Frames** @417 · **Layouts** @682 · **Grids** @926.
- Content `recyclerView` (GridView, scroll): collections with `tvTitle`+`tvCount`+`tvSeeAll` "Lihat Selengkapnya", e.g. "Baru-baru ini digunakan (2)", **"Shapes (36)"** @833,1008, **"Components (174)"** @833,1435; item cards `rootView`/`ivCover`.

---

## §5 Text tool ("Teks") — editor bottom toolbar

Open: editor bottom toolbar → **Teks** `tvName` @446,2204 (toolbar at start
position; scroll right to reset). Tapping it **adds a text box** to the canvas
(placeholder "Masukkan Judul") and opens the text-edit panel. Stays in
FlowEditorActivity, NATIVE_APP.

**The text panel reuses VN's subtitle component** (ids are `subtitle*` /
`llTextFormat` etc.) — same component as VN's caption editor.

### §5.1 Panel structure
- Text input: **`etTextInput1`** "Masukkan Judul" @132,1325 — the editable text content.
- Sub-tool tabs — two synced representations:
  - icon row `subtitleIndicator` (ids below), and
  - labeled bar `hsvSubtitleMenu` (`tvName` labels), scrollable.

| Tab id | Label | @tap* | Opens |
|--------|-------|-------|-------|
| `llInput` | Memasukkan (Input) | 62,1280 | keyboard/text entry |
| `llFonts` | Huruf (Fonts) | 186,1280 | §5.2 font list |
| `llFontSize` | Ukuran huruf (Font size) | 310,1280 | size slider (TODO detail) |
| `llColor` | Warna (Color) | 434,1280 | §5.3 colors |
| `llTextFormat` | Format | 558,1280 | §5.4 format |
| `llTextSpacing` | (Spacing) | 683,1280 | line/letter spacing (TODO) |
| `llSubtitleType` | (Type) | 808,1280 | text style presets (TODO) |
| `flSubtitleConfirm` | ✓ confirm | 975,1280 | apply/close |

\*tap Y shifts with panel height (≈1280–1410 depending on sub-panel); prefer the
resource-id selector over coordinates. Active sub-panel renders in `vfSubtitle`.

### §5.2 Fonts ("Huruf")
- `etSearch` "Cari font" @543 — search fonts.
- `tvAdd` "Tambahkan Font" @719 — add a font.
- Font list `recyclerView` (scroll), sections "Font dokumen" (current e.g.
  **"Inter"** `tvFonts`, `ivSelected` marks active) and "Brand Kit"; items
  `flRoot`/`flFontState`/`tvFonts`.

### §5.3 Color ("Warna")
- `rvTextColorTheme` (scroll) swatches: `ivAdd` @123 (custom color), `ivMute`
  @273 (none/transparent), `textColorThemeView` swatch cells @423,573,723,873,1020.
- `textStyleIndicator` — style sub-tabs (fill/outline/background/shadow — TODO detail).

### §5.4 Format
- **Daftar Gaya** (list style): `rlListStyleDefault` @108, `rlListPoint` (bullet) @234, `rlListNumber` @360.
- **Gaya Teks**: `rlBold` @650, `rlItalics` @776.
- **Posisi** (3×3 canvas anchor grid): `vPositionTopLeft`@118,1738 · `…TopCenter`@270 · `…TopRight`@421 · `…CenterLeft/Center/Right`@…,1822 · `…BottomLeft/Center/Right`@…,1906.
- **Penyelarasan** (align): `rlAlignNormal` @650 · `rlAlignCenter` @776 · `rlAlignOpposite` @902.
- **Kasus** (case): `tvTextCase` @653,1901.

> TODO Teks: FontSize slider, TextSpacing, SubtitleType presets, Color style sub-tabs.

## §6 Style tool ("Gaya") + context-sensitive toolbar

### §6.1 The bottom toolbar is context-sensitive
- **No selection** → *add* tools (§3.3): Foto, Teks, Tempel, Shapes, Frames,
  Grids, Latar belakang, Gaya, Layer, Mosaik, Pembesar, Hapus, Duplikat, Kunci, Sembunyikan.
- **Element selected** (e.g. tap a text box on canvas) → the toolbar switches to
  **element-transform** tools:
  - **Gaya** (Style) @240,2204 · **Posisi** (Position) @462 · **Ukuran** (Size) @636 · **memutar** (Rotate) @810 · **Mengatur** (Arrange/order) @984 (+ scroll for Hapus/Duplikat/Kunci/Sembunyikan).
  - Selector: `//*[@resource-id="…tvName"][@text="Gaya"]` — the whole toolbar is `hsvRootMenu`/`hsvSubtitleMenu` (scrollable), `ivIcon`+`tvName` items.

### §6.2 Gaya (Style) — for a TEXT element = style presets
Tapping **Gaya** with a text element selected opens the **text style-presets**
panel (`rvSubtitleTypesPage`, same as the Teks sub-tab `llSubtitleType`; the
`subtitleIndicator` row is present with `llSubtitleType` active). NATIVE_APP.
- Preset category tabs (`tabLayout`, HorizontalScrollView, by text):
  **Title** @108,1415 · **Funky** @324 · **Watermark** @567 · **Note** @809 ·
  **Introduction** @928 · `ivMore` @999 (more categories).
- `viewPager` @540,1865 — grid of preset-style thumbnails for the selected
  category (image thumbnails, no ids → tap by position).
- Confirm with `flSubtitleConfirm` @975.

> For non-text elements (shape/image/frame), "Gaya" is expected to show
> different style options (fill/stroke/effects) — TODO map with a shape selected.

## §7 Editor exit dialog
From the base editor, `KEYCODE_BACK` (or `ivClose`) opens an exit bottom sheet
(`design_bottom_sheet`) — **when Flow was launched standalone** (not from VN):
- `tvOperation1` "Simpan Proyek dan Keluar" @540,1799 (save project + exit)
- `tvOperation2` "Keluar secara langsung" @540,1945 (exit without saving)
- `tvOperationCancel` "Batal" @540,2119 (cancel → stay)

> When Flow is entered **from VN**, the exit dialog is instead "Back to VN / Stay
> at Flow Studio" (per earlier note) — TODO verify that variant.
> **Tip:** to close a tool sub-panel without triggering exit, use its confirm
> button (`flSubtitleConfirm` etc.), not double-BACK (2× BACK from a sub-panel
> reaches this exit dialog).

## §8 Element transform tools (Posisi / Ukuran / memutar)

Appear in the **element-selected** context toolbar (§6.1): Gaya · **Posisi** @462
· **Ukuran** @636 · **memutar** @810 · Mengatur @984. Each opens a small overlay
panel with a top-right `ivClose`. All NATIVE_APP, resource-id addressable.

> **Gotcha:** if a text-edit/style modal (Gaya) is open, tapping a transform tool
> in the bottom menu does **not** switch the panel — close the modal first
> (`flSubtitleConfirm` @975), keeping the element selected, then tap the tool.

### §8.1 Posisi (Position) — `ivClose` @981,1571
Two tabs (`tabLayout`, `ivTabName`): **"Meluruskan"** (Align) @330 · **"Dorongan"** (Nudge) @750.
- Align (`viewPager`): `llAlignLeft` "Kiri" @171,1766 · `llAlignCenter` "Tengah" @540,1766 · `llAlignRight` "Benar" @893,1766 · `llAlignTop` "Atas" @180,1976 · `llAlignMiddle` "Tengah" @540,1976 · `llAlignBottom` "Bawah" @900,1976.
- Dorongan = nudge (arrow) controls — TODO detail.

### §8.2 Ukuran (Size) — `tvTitle` "Ukuran", `ivClose` @981,1547
- Width: "W" + **`etWidth`** @254,1744 (e.g. "702") · **`ivLockRatio`** @413,1744 (lock aspect) · Height: "H" + **`etHeight`** @626,1744 (e.g. "492").
- **Skala** (uniform scale): `ivZoomOut` @146,1979 · `ivZoomIn` @304,1979.
- **Directional scale**: Horisontal `ivHorizontalScaleOut` @530 / `ivHorizontalScaleIn` @674 · Vertikal `ivVerticalScaleOut` @860 / `ivVerticalScaleIn` @1004.

### §8.3 memutar (Rotate) — `tvTitle` "memutar", `ivClose` @993,1535
- **Rotasi** + **`etRotate`** @945,1703 (angle, e.g. "0°").
- `rotateRuleView` @540,1922 — draggable rotation ruler/dial.
- `flRotationLeft` @200,2095 · `flRotationRight` @540,2095 (rotate ±90°) · `flReset` @880,2095 (reset to 0°).

### §8.4 Mengatur (Arrange / z-order) — `tvTitle` "Mengatur", `ivClose` @981,1742
Four layering actions:
- **`tvFront`** "Bawa ke depan" @169,1965 (bring to front)
- **`tvBack`** "Kirim ke Belakang" @416,1965 (send to back)
- **`tvForward`** "Memajukan" @664,1964 (bring forward one step)
- **`tvBackward`** "Kirim Mundur" @911,1965 (send backward one step)

> Element-transform tool set (Gaya/Posisi/Ukuran/memutar/Mengatur) now fully mapped.

## §9 Photo tool ("Foto") — ADD toolbar

Open: with **no element selected** (deselect by tapping empty canvas → ADD
toolbar returns), tap **Foto** `tvName` @272,2204. Opens a **media-picker bottom
sheet** (`design_bottom_sheet`, NATIVE_APP; Flow already holds media permission —
no prompt). Tapping a thumbnail adds that image/video to the canvas.

- `viewDragTop` @540,1161 — drag handle (drag down / BACK to dismiss).
- **`ivAlbum`** "Semua" @540,1318 — album selector (dropdown of device albums).
- Filter bar (`filterBar`, CheckBoxes): **`button_all`** "Semua" @282,1453 ·
  **`button_photo`** "Foto" @554,1453 · **`button_video`** "Video" @811,1453.
- Media grid `recyclerview` (GridView, scroll):
  - first tile = **`hint` "Kamera"** @179,1800 (`media_thumbnail` @540,1761) — opens the camera to shoot a new photo.
  - device media tiles `media_thumbnail` (@…,1761 / @…,2153 rows) — each has `ivPreview` (long-press/preview) and, for videos, `video_duration` (e.g. "00:03").
  - real photos start after the Kamera tile.

> Automation: filter with `button_photo`, then tap the target `media_thumbnail`
> by grid position (thumbnails have no per-item id/text). Selecting inserts the
> media as a new element and returns to the editor (element then selected → §6/§8
> transform tools apply).

## §10 Shapes tool — ADD toolbar

Open: ADD toolbar (no selection) → **Shapes** `tvName` @794,2204. Opens a
**shapes bottom sheet** (`design_bottom_sheet`, NATIVE_APP) — a flat grid (no
tabs/search, unlike the §3.4 asset picker).

- `viewDragTop` @540,1161 (drag handle) · `ivClose` @90,1318 · `tvTitle` "Shapes" @540,1318.
- `rvList` (RecyclerView, scroll) — **3-column grid** of shape thumbnails
  (`rootView` cells @188 / 540 / 892 per row; rows @1566, 1918, 2203, …).
- Shape cells have **no per-item id/text** → tap by grid position.
- Tap a shape → inserts it as a new element on the canvas (element then selected → §6/§8 tools).

## §11 Frames tool — ADD toolbar

Open: ADD toolbar (no selection) → **Frames** `tvName` @968,2204. Opens a
**searchable asset-picker bottom sheet** (`design_bottom_sheet`, NATIVE_APP).
Unlike the §3.4 asset picker (which has Graphics/Frames/Layouts/Grids tabs),
this view has **no top category tabs** — just search + collections.

- `viewDragTop` @540,1161 (drag handle).
- Search: `ivSearch` + **`etSearch`** "Mencari" @594,1318.
- Collections grid `recyclerView` (GridView, scroll), each a `tvTitle` + `tvCount`
  + `tvSeeAll` "Lihat Selengkapnya" header over a row of `rootView` item cells:
  - "Baru - baru ini digunakan (3)" — recently used, cells @185/483/781,1686.
  - "Shapes (36)" — `tvSeeAll` @833,1900, cells @185/483/781/1017,2113.
  - (more collections on scroll.)
- Item cells (`rootView`) have **no per-item id** → tap by grid position;
  `tvSeeAll` opens the full collection.
- Tap a frame/item → inserts to canvas (element then selected → §6/§8 tools).

## §12 Background tool ("Latar belakang") — ADD toolbar

Open: ADD toolbar (scroll right ~1×) → **Latar belakang** `tvName` @497,2221.
Canvas-level tool (sets the **page background**, not an element). Opens a
searchable picker bottom sheet (`design_bottom_sheet`, NATIVE_APP).

- `viewDragTop` @540,1161 · search `etSearch` "Mencari" @594,1318.
- `recyclerView` (GridView, scroll) with three sections:
  - **"Warna"** (solid colors) — swatch cells `cardView`/`viewUnselected` @468/636/804/972/1074,1630.
  - **"Gradien"** (Gradient) `tvCount` "(28)", `tvSeeAll` @833,1803 — `gradientColorView` cells @185/483/781/1017,2016.
  - **"Texture"** `tvCount` "(87)", `tvSeeAll` @833,2228 — texture thumbnails (scroll for more).
- Tap a swatch / gradient / texture → applies it as the page background. `tvSeeAll`
  opens the full category. Cells have no per-item id → tap by position.

> **ADD-toolbar tool order** (fuller, incl. previously-missed **Layouts**):
> Foto · Teks · Tempel · Shapes · Frames · **Layouts** · Grids · Latar belakang ·
> Gaya · Layer · Mosaik · (element-action) Pembesar · Hapus · Duplikat · Kunci · Sembunyikan.
> Use the `tvName` text selector; scroll `hsvRootMenu` to bring a tool on-screen.

## §13 MainActivity — `com.frontrow.flow/.ui.main.MainActivity`

Home / project browser. Shown on launch **when saved projects exist** (a true
first run instead opens FirstTimeActivity §1). NATIVE_APP.

- Top: `tvListTitle` "Proyek di Ponsel Ini" @275,207 · `ivScanQRCode` @852,207 · `ivMore` @1005,207.
- Content tabs `title_container`: **"Proyek N"** @143,483 · **"Aset AI N"** @369,483.
- Search: `llSearch` @540,345 (label "Mencari").
- **Folder** section (`tvTitle` "Folder" + `tvProjectCount`): `rvList` cells
  `ivFolder`/`tvFolder`/`tvFolderSize` — "Bawaan" @235,968, "Impor" @555,968.
- **Proyek** section (`tvTitle` + `tvProjectCount`, layout toggle `ivLayout`/`ivLayoutSelected` @927/990,1169):
  grouped by date (`tvTitle` "HARI INI"). Project card `clRoot` @540,1494:
  `ivCover` + `llTitle`/`tvTitle` (e.g. "Jul 29, 2026") + `llMore`/`ivMore` @951,1494 (per-project menu).
- **`ivCreate`** @942,1979 — FAB → **CreationActivity** (§2).
- Bottom nav `bottomNavigationView`: `flItemHome` @108 · `flItemDesigns` @324 ·
  `flItemTitorials` @540 · `flItemPro` @756 · `flItemMine` @972 (all @y2191).

## §14 CreationActivity tabs — Create / AI Kits / AI Market

`CreationActivity` (§2) has three top tabs (`title_container`): **Create**
@125,276 · **AI Kits** @323,276 · **AI Market** @547,276. Close `ivClose` @90,168.

- **Create** tab: `tvCustomSize` "Ukuran Khusus:" @540,798 (→ §15 CustomSizeActivity);
  `rvCreationPackage` package covers (`flCover`/`ivCover`/`tvTitle` e.g. "Brand Kit");
  `rvList` preset sizes (`ivLogo`/`tvTitle`/`tvSize`, sections "Baru - baru ini
  digunakan" & "Disarankan" — e.g. "Instagram Story"/"1080 x 1920 px");
  `clMoreWays`/`tvMoreWays` "More ways to create" → `rvAlbum` device photo `cardView`s
  @180/444/708/966,2101 + `tvViewAllPhoto` "Lihat semua" @903,1916 (start from a photo).
- **AI Kits** tab: 3-col grid (cols @202/540/878) of AI photo tools, grouped by
  section headers. Cells are label-only (`View`+`TextView`, **no id** → tap by grid pos):
  - *Enhance Photo*: Enhance Portrait, Upscale Image.
  - *Image Generation*: Text to Image, AI Inpaint, Image Editing.
  - (more): Era Look, Figurine Maker, Expression Sticker, Artistic Styles,
    Anime Style, AI Portrait Duo, Halloween, Lighting Style, … (scroll).
- **AI Market** tab: `rvList` of **vendor cards** (`root`), each: `ivVendor` icon +
  `tvVendorName` ("OpenAI"/"Stability AI"/"Fal AI"/…) + **`tvInstallStatus`** "Pasang"
  @879 (clickable, install vendor) + nested `rvList` of that vendor's apps
  (`cvCover`/`ivCover`/`tvAIVendorApp` e.g. "Text to Image", "AI Inpainting").

## §15 CustomSizeActivity — `com.frontrow.flow/.ui.size.customsize.CustomSizeActivity`

From CreationActivity Create tab → `tvCustomSize`. NATIVE_APP.

- `ivBack` @93,183 · `tvTitle` "Ukuran Khusus:".
- **`etWidth`** "Lebar" @185,474 · **`etHeight`** "Tinggi" @506,474 ·
  unit `clSize`/`tvSizeHint` "px" @840/716,473 · `cbLock` "Rasio ukuran kunci" @273,603.
- **`etResolution`** "144.0" @345,849 · unit `clResolution`/`tvResolutionHint` "px / in" @840/757,848 · `tvResolutionTip` hint.
- **`btCreate`** "Buat desain baru" @540,1243 → **FlowEditorActivity** (blank canvas).
  Requires non-empty width/height (tapping Buat with empty fields is a no-op).

## §16 Blank-canvas "Elemen" bottom sheet (auto-opens on new blank design)

Creating a blank design auto-opens a large content bottom sheet (`design_bottom_sheet`,
NATIVE_APP). This is the full **ADD picker** — the collapsed `tvName` toolbar (§3.3)
is its minimized form. `viewDragTop` @540 drag-handle; close = BACK once (2× BACK →
exit dialog §18).

- **Bottom tab bar** (`ivTabIcon`/`ivTabName`, @y2213): **Elemen** @98 · **Teks** @294 ·
  **Foto** @490 · **Latar belakang** @686 · **Gaya** @882 · **Impor** @1060 (scroll for more).
- **Elemen tab** has top sub-tabs (`ivTabName` @y433): **Graphics** @144 · **Frames** @417 ·
  **Layouts** @682 · **Grids** @926; plus search `ivSearch`/`etSearch` "Mencari" @594,291.
  - *Graphics*: collections "Shapes (36)", "Components (174)", "Square (24)"… each a
    `tvTitle`+`tvCount`+`tvSeeAll` "Lihat Selengkapnya" over a 4-col `rootView`/`ivCover`
    grid (@185/483/781/1017). `ivComponent` badge marks component items.
  - **Layouts** sub-tab: photo-layout collections by frame count — "Cover (12)",
    "1 Frame (13)", "2 Frames (29)"… 3-col grid (@225/603/948) + `tvSeeAll`.
    Tap → inserts a multi-frame photo layout.
  - **Grids** sub-tab: single "Grids" section, 3-col grid (@204/540/876) of grid thumbs.

## §17 ADD-toolbar tools — Tempel, Layer, Mosaik

Collapsed `tvName` toolbar (`hsvRootMenu`, scroll to reveal). Full ADD order (no
selection): Foto · Teks · **Tempel** · Shapes · Frames · Layouts · Grids · Latar
belakang · Gaya · **Layer** · **Mosaik** · (element-action tail: Pembesar · Hapus ·
Duplikat · Kunci · Sembunyikan). The toolbar is **context-sensitive** — an element
being selected swaps in transform tools (Edit/Posisi/Ukuran/memutar/Mengatur/Layer/
Kegelapan/…, §8) and thins the ADD tools.

- **Tempel** @~620,2204 = **paste from clipboard**. Pastes clipboard content onto the
  canvas as a new element; text clipboard → creates a **text element** and enters the
  text-edit panel (§5). No panel of its own.
- **Layer** @~207,2204 (element-selected strip) → **"Lapisan"** bottom sheet:
  `tvSelect` "Pilih" @263,1397 · `tvTitle` "Lapisan" · `ivClose` @981,1397 ·
  `cbShowOverlapLayer` "Tampilkan semua layer yang tumpang tindih" @90,1529 ·
  `rvList` layer rows (`clContent`: `ivSliceType` type-icon + `cvDisplay`/`tvDisplay`
  name/preview + `ivSort` @930 drag-reorder handle).
- **Pembesar / Mosaik** — two distinct tools that share the `layout_border_menu`
  bottom-sheet container (same `rvType`/`ivCancel`@189,2174/`ivDone`@891,2174 skeleton)
  but different content. See **§19** for both panels (they sit adjacent in the
  no-selection toolbar: … Layer · **Mosaik** · **Pembesar** · Hapus …).

## §18 Full editor top bar + element context menu + exit dialog

- **Full top bar** (`clTopViews`, @y183): `ivClose` @62 · `ivHelp` @177 · `ivUndo` @285 ·
  `ivRedo` @393 · **`ivSetting`** @603 · `ivFullScreen` @711 · `ivSave` @843 · **`tvExport`** @981.
- **Element context menu** (appears above a selected element, @y747): `llReplace`
  "Menggantikan" @252 · `llDuplicate` "Duplikat" @444 · `llCopy` "Salin" @636 · `llDelete` "Hapus" @828.
  `ivMenuAdd` @96,2156 opens the ADD sheet (§16).
- **Exit dialog** (`ivClose` @62,183, standalone variant): `design_bottom_sheet` with
  `tvOperation1` **"Simpan Proyek dan Keluar"** @540,1799 · `tvOperation2` **"Keluar
  secara langsung"** @540,1945 · `tvOperationCancel` "Batal" @540,2119. (The from-VN
  variant shows "Back to VN / Stay at Flow Studio" instead — still to confirm live.)
- **Text-edit panel icons** (from §5, now resolved): the icon strip is
  `llInput` @62 · `llFonts` @186 · **`llFontSize`** @310 · `llColor` @434 ·
  `llTextFormat` @558 · **`llTextSpacing`** @683 · `llSubtitleType` @808 ·
  `flSubtitleConfirm`/`ivSubtitleConfirm` @975 (all @y1410); text field `etTextInput1`.

## §19 Pembesar & Mosaik panels + non-text Gaya (page/brand style)

**Toolbar context recap.** The bottom toolbar is context-sensitive:
- **No selection** (`ivMenuAdd` @96,2156 visible): ADD/insert tools — Foto · Teks ·
  Tempel · Shapes · Frames · Layouts · Grids · Latar belakang · **Gaya** @721 ·
  Layer · **Mosaik** · **Pembesar** · Hapus · Duplikat · Kunci · Sembunyikan
  (the Hapus…Sembunyikan tail acts on the current/last element).
- **Text element selected**: Edit · Posisi · Ukuran · memutar · Mengatur · Layer · Kegelapan · …
- **Shape/graphic element selected**: Menggantikan · Potong · Posisi · Ukuran · Cocok ·
  memutar · Mengatur · Layer · **Bayangan** (shadow) · Kegelapan · **AI Kits** · **Cermin**
  (mirror) · **Balik** (flip) · Kunci. (No Gaya/Pembesar/Mosaik in the *element* strip —
  those live in the no-selection strip above.)

Positions drift after each scroll → **detect the `tvName` coordinate from a fresh
map and tap that**, don't hardcode. Insert a non-text element for these: open the
Elemen sheet (§16) → Graphics/Shapes → tap a shape cell (e.g. @185,1221).

### Pembesar (Magnifier) — `layout_border_menu`
Magnifier lens over the canvas region beneath it. (**Correction:** an earlier draft
of §17 mislabeled this panel as "Mosaik" — the **"Zoom" slider is the tell; this is
Pembesar**.)
- `rvType` lens shapes (`flType`/`ivType`/`ivSelected`+`tvName`, @y1513): **Bulat** @156 ·
  **Persegi 1** @348 · **Persegi 2** @540 · **Gaya 1** @732 · **Gaya 2** @924.
- `ccvColorPanel` border-color row (`cVColor`/`ivItemColor`; first cell `ivItemType` =
  custom picker) @114…1029,1661.
- `tvZoomLabel` **"Zoom"** + **`sbZoom`** @540,1806 + `tvZoomValue` · `tvBorderLabel`
  **"Berbatasan"** + **`sbBorder`** @540,1927 + `tvBorderValue`.
- `ivCancel` @189,2174 · `ivDone` @891,2174.

### Mosaik (pixelate/blur) — `layout_border_menu`
Pixelate/obscure a region. (Matches VN's Mosaik.)
- `rvType` patterns (`tvName` @y1513): **Mosaik** @252 · **Segitiga** @444 ·
  **Segi enam** @636 · **Blur** @828.
- `rvMask` mask-shape row (`rootView`/`ivType` @324/468/612/756,1661).
- `tvSizeLabel` **"Ukuran"** + **`sbSize`** @540,1806 + `tvSizeValue` (single size slider —
  **no** Zoom/Border, unlike Pembesar).
- `ivCancel` @189,2174 · `ivDone` @891,2174.

### Non-text Gaya (page / brand style kit) — no-selection toolbar **Gaya** @721,2204
Applies a **font-pairing + color palette** to the whole design (this is the
"non-text" Gaya; the §6 Gaya was text presets with a text element selected).
`design_bottom_sheet`, `viewDragTop` @540,1161.
- Sub-tabs `ivTabName` @y1316: **Semua** @292 · **warna** @541 · **font** @790.
- Categories `tvCategoryTitle`: "Brand Styles" (+`tvAdd` "Menambahkan" @918,1547) · "Bawaan".
- Style cards `rvList` 2-col grid (@279/801): `tvHeading` (heading font, e.g.
  "StarlightBold"/"Creepster-Regular"/"Monoton-Regular") + `tvSubheading` (body font,
  e.g. "GlacialIndifference-Regular"/"Inter-Bold") + `llColors`/`viewColor1..6`
  (6-swatch palette) + `ivPro` badge (Pro-only styles).

## §20 Shape/graphic element tools — Potong, Cocok, Bayangan, Cermin, Balik

With a **shape/graphic element selected**, the element strip (§19) offers these.
Insert a shape: Elemen sheet (§16) → Graphics/Shapes → tap a cell @185,1221.

- **Potong** (Crop) → dedicated activity **`com.frontrow.editorwidget.crop.CropActivity`**
  (same crop widget as VN). `cropView`/`image_view_crop`/`view_overlay` canvas;
  `recyclerView_ratio_choose` ratios (`layoutFrameType`/`ivFrameTYpeIcon`/`tvFrameTypeName`):
  **Asli** @120 · **Bebas** @330 · **9:16** @509 · **1:1** @688 · **16:9** @913 · (more @1064,
  scroll); a `clProgress`/`sbProgress` (tvCurrentTimeMs "0:00"/tvTotalTimeMs) appears for
  animated shapes. Bottom: `imageView_crop_cancel` @177,2159 · `imageView_crop_reset`
  @540,2159 · `imageView_crop_done` @903,2159.
- **Cocok** (Fit) = **instant toggle, no panel** — the `tvName` label flips to
  **"Mengisi"** (Fill) after tapping, and back. Switches element scale mode fit↔fill
  (same behavior as VN's Mengisi/Cocok).
- **Bayangan** (Shadow) → `design_bottom_sheet`: `tvTitle` "Bayangan" @541,1263 ·
  `ivClose` @981,1262. `flNone` @150,1471 (no shadow) + `rvList`/`flShadowType`/
  `ivShadowsType` preset types @423/603/783/947,1471. `tvShadowsColor` "Warna" +
  `ccvStrokeColorPanel` color row (`cVColor`/`ivItemColor`; first `ivItemType` custom)
  @114…1029,1790. `clShadowTransparency` "Transparansi" + `etShadowTransparency` "100"
  @945,2006 + `sbShadowTransparency` @533,2114.
- **Cermin** (Mirror) = **instant action, no panel** — mirrors the element horizontally.
- **Balik** (Flip) = **instant action, no panel** — flips the element vertically.

## §21 AI Kits (per-element) & ivSetting project-settings panel

### AI Kits (per-element) — shape/graphic element strip → **AI Kits**
Opens a `design_bottom_sheet` whose content is a **`composeView`** (Jetpack Compose —
**no resource-ids**; tap by grid position). `viewDragTop` @540,134. Same catalog as the
CreationActivity AI Kits tab (§14), 3-col grid (@202/540/878), grouped by header:
- *Enhance Photo*: **Enhance Portrait** @202,487 · **Upscale Image** @540,487.
- *Image Generation*: **AI Inpaint** @202,1020 · **Image Editing** @540,1020 · **Era Look** @878,1020.
- (more, scroll): Figurine Maker · Expression Sticker · Artistic Styles · Anime Style ·
  AI Portrait Duo · Halloween · Lighting Style · …
- Picking a kit → generation/run flow (credits + login gate) — **not exercised** (mirrors
  VN's AI kits; still TODO to map the run screen).

### ivSetting gear → project/canvas settings panel
Top bar `ivSetting` @603,183 → `design_bottom_sheet` (**tap with nothing selected** — with an
element selected the tap instead toggles the top bar / context menu, see §18):
- `etTitle` "Jul 30, 2026" @540,836 (editable project title) · `tvSize` "1080 x 1080px" @189,932.
- `llRename` "Ganti nama" @540,1118 · `llResize` "Ubah ukuran" @540,1256.
- View mode toggles: `clScrollingView` "Tampilan bergulir" (+`ivScrollingViewCheck` @978,1394) ·
  `clThumbnailView` "Tampilan gambar kecil" @540,1532 · `llGridView` "Tampilan bergaris" @540,1670.
- `clShowMargin` "Tampilkan margin" (toggle `ivShowMargins`) @540,1871 ·
  `clShowPrintBleed` "Tampilkan pendarahan cetak" @540,2009 · `clShare` "Membagikan" @540,2147.

## §22 Template-open flow & Posisi sub-tabs (Meluruskan / Dorongan)

### Template-open flow (does **not** go straight to the editor)
`MainActivity` **Designs** tab (`flItemDesigns` @324,2191) is the **template gallery**
(same content as FirstTimeActivity §1): `llSearch` "Cari Template" @540,318 ·
`tvCollection` cards "Happy Birthday" @221 / "Filter" @590 / "Travel" @941,1275 ·
"Baru-baru ini Gunakan" recents · "Baru (100)" + `tvSeeAll` · template cards
`clRoot`/`ivCover` (@187/494/801/1031,2024). Tapping a template card:

1. → **`com.frontrow.template.ui.preview.TemplatePreviewActivity`** — swipeable preview
   (`viewPager`/`cvThumbnail`/`ivThumbnail`), `tvClipCount` "16" @163,1916,
   `ivShare`/`tvShare` "Membagikan" @120, `ivStar`/`tvStar` "Favorit" @308,
   **`progressButton`** @755,2158 (Use), `ivBack` @90,181, `ivAvatar` @968,181.
2. `progressButton` → **`com.frontrow.template.ui.filledit.TemplateFillEditActivity`** —
   a guided **placeholder-fill** screen (distinct from `FlowEditorActivity`):
   top bar `ivClose` @84,192 · `ivImageFullScreen` @711 · `ivSave` @843 · `ivExport` @981;
   `editorVideoView` preview; **`rvSlice`** filmstrip of slots (`clRoot`/`rlThumbnailContent`/
   `ivThumbnail`/`ivSelectState`/`tvIndex` 1,2,3…; selected slot shows `ivEdit`+`tvDuration`
   "edit" to replace its media). Fill slots → `ivExport`.

   > Exit quirk: `ivClose` on TemplateFillEditActivity did **not** cleanly leave in one tap
   > (stayed on-activity, likely a confirm dialog not captured). `am force-stop` +
   > relaunch is the reliable reset.

### Posisi transform — two sub-tabs (`ivTabName`)
Element selected → **Posisi** → `design_bottom_sheet` with tabs **Meluruskan** (Align)
@330,1569 · **Dorongan** (Nudge) @750,1569 · `ivClose` @981,1571.
- **Meluruskan** (Align): 3×2 button grid — `llAlignLeft` "Kiri" @171,1766 · `llAlignCenter`
  "Tengah" @540,1766 · `llAlignRight` "Benar" @893,1766 · `llAlignTop` "Atas" @180,1976 ·
  `llAlignMiddle` "Tengah" @540,1976 · `llAlignBottom` "Bawah" @900,1976.
- **Dorongan** (Nudge): precise position — `etXCoordinate` @292,1790 (label "X") +
  `etYCoordinate` @292,1958 (label "Y"); directional D-pad `ivNudgeTop` @811,1752 ·
  `ivNudgeLeft` @688,1874 · `ivNudgeRight` @934,1874 · `ivNudgeBottom` @811,1997
  (`ivCircle1`/`ivCircle2` center @811,1874).

## §23 Color panel sub-tabs & from-VN exit dialog

### Color panel sub-tabs (text color example)
Text element → text-edit strip → **Warna** (`llColor` @434). The color panel
(`vfSubtitle`/`textStyleFrameLayout`) has:
- Color-style **sub-tabs** (`title_container`, which text part to color): **Teks** @162,1610 ·
  **Stroke** @331,1610 · **Bayangan** @545,1610 · **Latar Belakang** @832,1610.
- Theme row `rvTextColorTheme`: `ivAdd` @123,1460 (add) · `ivMute` @273 (none/transparent) ·
  `textColorThemeView` preset-theme swatches @423/573/723/873/1020,1460.
- Swatch row `ccvTextColorPanel` (`cVColor`/`ivItemColor`; **first cell `ivItemType` @114 =
  custom picker**) @114…1029,1745.
- Opacity: `tvTextOpacityLabel` "Kegelapan" + `etTextOpacity` "100%" @945,1877 + `sbTextOpacity` @528,1964.
- (The text-edit icon strip localizes as `tvName`: Memasukkan/Huruf/Ukuran huruf/**Warna**/Format.)

**Custom color picker** (tap `ivItemType` @114,1745) → `design_bottom_sheet`
`frameLayout_color_picker`: `colorPickerView` @540,1529 (2D SV field) · `sbHue` @540,1909 ·
hex `etRGB` "000000" @264,2006 · RGB `etR` @512 / `etG` @733 / `etB` @952 ·
`ivCancel` @189,2174 · `ivDone` @891,2174. (Same custom-picker widget backs the
`ivItemType` cell in every color row — Mosaik/Pembesar/Bayangan/Stroke/etc.)

### From-VN exit dialog (the "launched from VN" variant)
When Flow is opened from **VN**'s editor tool `editor_toolbar_flowStudio` (label "Flow",
@710,2156 in VN's `EditorActivity`), Flow runs in a **new task**; its exit is a standard
**AlertDialog** (not the standalone bottom-sheet of §18):
- `alertTitle` **"Tips"** · `message` "The project does not save the draft after…".
- `button1` **"Back to VN"** @829,1193 · `button2` **"Stay at Flow Studio"** @754,1337 ·
  `button3` **"Batal"** @873,1481.

> Reaching it: VN → FirstTime `createKit_create_newProject` @540,420 → "Mode Edit Proyek"
> sheet (tap `clVideoBase` then **`tvSave`** @540,2032) → grant storage (`pm grant
> com.frontrow.vlog android.permission.READ_EXTERNAL_STORAGE`) → `VideoEditorMatisseActivity`
> media picker (`check_view` to select, `material_next` "Lanjut" @945) → `EditorActivity` →
> tap Flow tool → `FlowEditorActivity` (new task). BACK / `ivClose` → this dialog.
> Cleanup after: `pm clear com.frontrow.vlog` (restores VN's clean baseline).

## §24 AI-Kit generate run-flow (credit gate) & template Export end-flow

### Account / credit state
Mine tab (`flItemMine`): `tvLoginOrRegister` "Silahkan login/daftar" → **guest, not logged
in**; `clCreditCenter` "Pusat Kredit" `tvCreditCenterCount` **"0.0"** → **0 credits** (unlike
VN's guest which carries 100). So guests can browse AI kits but cannot generate.

### AI-Kit generate run-flow (Enhance Portrait example)
CreationActivity **AI Kits** tab → tap a kit (Compose, tap by position) → intro
`design_bottom_sheet` (`tvBefore`/`tvAfter`, `tvTitle` "Perbaiki Potret", `tvContinue`
**"Coba Sekarang"** @540,2003, `ivClose` @90,479) → photo picker
**`com.frontrow.mediaselector.ui.MatisseActivity`** (`ivAlbum` "Semua"; first tile
"Kamera", real photos from col-2; needs `pm grant com.frontrow.flow
android.permission.READ_EXTERNAL_STORAGE`) → pick a photo →
**`com.frontrow.ai.ui.enhance.EnhancePhotoActivity`** — **the same shared AI activity as VN's
AI kits** (`tvTitle` "Enhance Portrait", `tvModelName` "VN / Flow · GFPGAN", `ivHistory`,
`flSelectPhoto` @129,2135, `tvGenerate` **"Mulai"** @771,2135; `tvBalance` "Generasi ini
akan menggunakan **2,00** kredit. (Saldo 0,00)").

Tapping **Mulai** with 0 balance → **"Kredit Tidak Cukup"** dialog (`tvAIApp`), showing
`tvCreditCost` "Biaya Kredit" 2,00 / `tvBalance`, `tvTip` "Kredit tidak mencukupi…", and two
CTAs: `tvSubscribePro` **"Berlangganan Flow Pro"** @540,1973 · `tvTopUpCredits` **"Isi Ulang"**
@540,2135. **No login gate — the gate is credits, not sign-in.**
- **Isi Ulang** → **`com.frontrow.credit.ui.topup.TopUpActivity`** (Compose): "Credit Balance"
  breakdown (Flow Pro / Top-up and promo); packages **100 = Rp 16.000 · 300 = Rp 47.000 ·
  500 = Rp 79.000 · 1000 = Rp 159.000**; terms checkbox; "Isi Ulang" purchase button @541,2148;
  top bar "Aturan" @971,193. **Purchase not completed** (real Play billing).

### Template Export end-flow (image template)
`TemplateFillEditActivity` (§22) → **`ivExport`** @981,192 → action-sheet
`design_bottom_sheet`: `tvOperation1` **"Selesai"** @540,1799 · `tvOperation2` "Edit" @540,1945
(→ opens full editor) · `tvOperationCancel` "Batal". "Selesai" →
**`com.frontrow.template.ui.export.ImageTextTemplateExportActivity`**:
- `ivClose` @90,258; `rvMultiPagePreview`/`ivThumbnail` + `tvCount` "1 of 1".
- `tvFileTypeTitle` "Jenis berkas" + `clType`/`tvType` **"PNG"** @540,1166 (file-type select).
- `tvSizeTitle` "Ukuran x" + `clSize`/`tvSizeLabel` "1080 x 1920 px" + `etSize` "1.0" +
  `seekBarSize` (scale multiplier).
- Toggles: `tvTransparentBackground` "Latar belakang transparan" · `tvCompressFile`
  "Kompres file (kualitas lebih rendah)" · `tvSplitImage` "Bagi gambar".
- **`tvExport` "Selesai"** @540,2165 → renders. **No login / watermark gate** — writes a PNG to
  **`/sdcard/DCIM/FLOW/<yyyymmdd_hhmmss>.png`** then shows the success view: `tvDone` "Selesai"
  @941,259, `ivCover` preview, share `ivIns` Instagram / `ivFacebook` / `ivOther` "Lainnya",
  and **`tvExportVideoToVn` "Buat Video dengan VN"** @541,1309 (hand-off to VN, cf §4).

> `ivClose` on `TemplateFillEditActivity` → standard exit bottom-sheet (same as §18):
> "Simpan Proyek dan Keluar" / "Keluar secara langsung" / "Batal" (this was the earlier
> "didn't exit in one tap" quirk — just the confirm sheet).
> **Cleanup after an export test:** `rm /sdcard/DCIM/FLOW/<file>.png` + media rescan.

## Remaining to map (TODO — next sessions)
- ~~Export / Apply-to-VN flow~~ ✅ (§4). ~~MainActivity project browser~~ ✅ (§13).
- Tool panels: ~~Teks~~ ✅ (§5; FontSize/Spacing icons resolved §18), ~~Gaya~~ ✅ (§6 text presets; **non-text/brand-style Gaya** §19), ~~Foto~~ ✅ (§9), ~~Shapes~~ ✅ (§10), ~~Frames~~ ✅ (§11), ~~Latar belakang~~ ✅ (§12), ~~Layouts~~ ✅ (§16), ~~Grids~~ ✅ (§16), ~~Tempel~~ ✅ (§17), ~~Layer~~ ✅ (§17), ~~Mosaik~~ ✅ (§19), ~~Pembesar~~ ✅ (§19).
- Element transform: ~~Posisi/Ukuran/memutar/Mengatur~~ ✅ (§8); ~~Posisi Meluruskan/Dorongan sub-tabs~~ ✅ (§22).
- ~~Color style sub-tabs~~ ✅ (§23, Teks/Stroke/Bayangan/Latar Belakang + custom HSV/hex/RGB picker).
- ~~Template-open flow~~ ✅ (§22, Preview → FillEdit; not straight to editor).
- ~~Editor exit dialog~~ ✅ (§18 standalone bottom-sheet; §23 from-VN AlertDialog "Back to VN / Stay").
- ~~Element selection context menu~~ ✅ (§18: Menggantikan/Duplikat/Salin/Hapus).
- ~~CreationActivity AI Kits / AI Market tabs~~ ✅ (§14). ~~Custom size~~ ✅ (§15).
- ~~Shape/graphic element tools: Potong, Cocok, Bayangan, Cermin, Balik~~ ✅ (§20).
  ~~AI Kits (per-element)~~ ✅ (§21, panel; run/generate flow still TODO).
- ~~`ivSetting` gear panel~~ ✅ (§21, project settings — needs nothing selected).
- ~~AI Kit generate run-flow~~ ✅ (§24, credit gate → TopUp; shared `EnhancePhotoActivity` with VN; no login gate).
- ~~Template fill → Export end-flow + `ivClose` confirm~~ ✅ (§24, `ImageTextTemplateExportActivity` → PNG + share/VN handoff).
- AI **Market** vendor install flow (`tvInstallStatus` "Pasang", §14) — not yet exercised.
- Credit **TopUp purchase** completion & **Flow Pro** subscription screen — intentionally not completed (real billing).

## Quick reference
- Package: `com.frontrow.flow` · Activities: `.ui.firsttime.FirstTimeActivity`, `.ui.creation.CreationActivity`, `.ui.editor.FlowEditorActivity`.
- All screens mapped so far are **NATIVE_APP with resource-ids** → selector-based automation is reliable (contrast with VN's Lynx screens that need `waitForIdleTimeout:100` + coordinates).
- Multi-page designs live in `vpDraftPage` (swipe between pages).
