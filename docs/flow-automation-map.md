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

## Remaining to map (TODO — next sessions)
- ~~Export / Apply-to-VN flow~~ ✅ mapped (see §4).
- Individual **tool panels**: ~~Teks~~ ✅ (§5, Input/Fonts/Color/Format; Type via §6.2; FontSize/Spacing still pending), ~~Gaya~~ ✅ (§6, text presets; non-text TODO). ~~Foto~~ ✅ (§9), ~~Shapes~~ ✅ (§10). Still: Latar belakang, Layer, Mosaik, Frames picker.
- Element transform: ~~Posisi/Ukuran/memutar/Mengatur~~ ✅ (§8, full set). Still: Posisi "Dorongan" nudge detail, Color style sub-tabs.
- ~~Editor exit dialog~~ ✅ (§7, standalone variant; from-VN variant TODO).
- **Element selection context menu** (tap an element on canvas → what actions appear).
- CreationActivity **AI Kits** / **AI Market** tabs.
- Template **open** flow (from FirstTime collections / "Baru" cards) → does it go straight to editor?
- `ivSetting` editor settings; `ivClose` exit dialog ("Back to VN / Stay").
- Custom size (`tvCustomSize`) input screen.

## Quick reference
- Package: `com.frontrow.flow` · Activities: `.ui.firsttime.FirstTimeActivity`, `.ui.creation.CreationActivity`, `.ui.editor.FlowEditorActivity`.
- All screens mapped so far are **NATIVE_APP with resource-ids** → selector-based automation is reliable (contrast with VN's Lynx screens that need `waitForIdleTimeout:100` + coordinates).
- Multi-page designs live in `vpDraftPage` (swipe between pages).
