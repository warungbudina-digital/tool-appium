#!/usr/bin/env python3
"""
ai_wiki_query.py — Injeksikan 1 prompt ke ChatGPT + Gemini + Claude sekaligus
di RN7 (via Fennec + Firefox Remote Debugging Protocol), tunggu jawaban tiap
AI selesai, lalu simpan ketiganya jadi 1 entri wiki markdown.

Prasyarat:
  - RN7 nyala & terhubung: adb -s 10.66.66.6:5555 devices -> "device"
  - Fennec sudah login di ChatGPT+Gemini+Claude (akun clawapp810@gmail.com)
  - RDP debugging Fennec sudah aktif (Setelan -> Tingkat Lanjut -> Pengawakutuan
    jarak jauh melalui USB = ON) -- sekali setting, permanen nyala

Pemakaian:
  python3 ai_wiki_query.py "Judul Topik" "Pertanyaan lengkap yang mau ditanyakan"
  python3 ai_wiki_query.py "Judul Topik" "Pertanyaan..." --only chatgpt,gemini
  python3 ai_wiki_query.py "Judul Topik" "Pertanyaan..." --wiki-dir /path/lain

Output:
  Satu file markdown di --wiki-dir (default: ./wiki/), nama file dari slug
  judul+tanggal, isi = pertanyaan + jawaban ChatGPT/Gemini/Claude berdampingan.

Detail selector & jebakan tiap situs ada di dokumentasi:
  tool-appium/docs/{chatgpt-web-rn7-map.md,gemini-web-rn7-map.md,claude-web-rn7-map.md}
"""
import argparse
import datetime
import json
import re
import socket
import subprocess
import sys
import time

ADB_SERIAL = "10.66.66.6:5555"
RDP_PORT = 6001
FENNEC_PKG = "org.mozilla.fennec_fdroid"

POLL_INTERVAL_S = 5
POLL_STABLE_CHECKS = 5       # jawaban dianggap selesai kalau teks TAK berubah N kali beruntun
                              # (5x5dtk=25dtk stabil - ChatGPT pernah kena jeda tanggung ~12dtk
                              # di tengah stream lalu lanjut lagi, jangan diturunkan lagi)
MAX_WAIT_S = 150             # nyerah kalau jawaban tak kunjung stabil dlm waktu ini
LOAD_WAIT_S = 3              # jeda setelah buka/navigasi tab sebelum mulai interaksi


# ---------------------------------------------------------------------------
# Klien RDP minimal (protokol: "<panjang>:<json>", lihat fennec-rn7-map.md)
# ---------------------------------------------------------------------------
class RDPError(RuntimeError):
    pass


class RDP:
    def __init__(self, port=RDP_PORT, timeout=15):
        self.sock = socket.create_connection(("127.0.0.1", port), timeout=timeout)
        self.sock.settimeout(timeout)
        self._recv_packet()  # hello

    def _recv_packet(self):
        buf = b""
        while b":" not in buf:
            c = self.sock.recv(1)
            if not c:
                return None
            buf += c
        n = int(buf[:-1])
        data = b""
        while len(data) < n:
            chunk = self.sock.recv(n - len(data))
            if not chunk:
                break
            data += chunk
        return json.loads(data)

    def _send(self, obj):
        b = json.dumps(obj).encode()
        self.sock.sendall(str(len(b)).encode() + b":" + b)

    def _wait_for(self, pred, limit=100):
        for _ in range(limit):
            p = self._recv_packet()
            if p is None:
                return None
            if pred(p):
                return p
        return None

    def find_console(self, domain):
        """Cari tab yg URL-nya benar2 situs `domain` (match di AWAL url, bukan
        substring sembarang) - substring longgar pernah kena false-positive
        nyata 11/9: tab lain (interstisial Google) yg query-string-nya
        KEBETULAN mengandung teks "gemini.google.com" ikut ke-match."""
        self._send({"to": "root", "type": "listTabs"})
        tabs = self._wait_for(lambda p: "tabs" in p)
        if not tabs:
            raise RDPError("listTabs gagal / timeout")
        prefix = "https://" + domain
        matches = [t for t in tabs["tabs"] if (t.get("url") or "").startswith(prefix)]
        if not matches:
            raise RDPError(f"Tak ada tab yg URL-nya diawali '{prefix}'. Tab terbuka: "
                            + ", ".join(t.get("url", "") for t in tabs["tabs"]))
        tab = matches[0]
        self._send({"to": tab["actor"], "type": "getTarget"})
        target = self._wait_for(lambda p: "frame" in p)
        if not target:
            raise RDPError("getTarget gagal / timeout")
        return target["frame"]["consoleActor"], tab

    def wait_for_truthy(self, console, expr, timeout_s=20, interval_s=1):
        """Poll `expr` via evaluateJSAsync sampai hasilnya truthy, atau timeout.
        Dipakai gantikan sleep tetap - jauh lebih andal utk nunggu elemen SPA
        yg waktu render-nya tak konsisten (kadang <1dtk, kadang >5dtk)."""
        waited = 0.0
        while waited < timeout_s:
            try:
                r = self.eval_js(console, expr)
            except RDPError:
                r = None
            if r:
                return r
            time.sleep(interval_s)
            waited += interval_s
        return None

    def eval_js(self, console, expr):
        self._send({"to": console, "type": "evaluateJSAsync", "text": expr})
        r = self._wait_for(lambda p: p.get("type") == "evaluationResult")
        if r is None:
            raise RDPError("evaluateJSAsync timeout")
        result = r.get("result")
        if isinstance(result, dict) and result.get("type") == "undefined":
            return None
        return result

    def close(self):
        try:
            self.sock.close()
        except Exception:
            pass


def adb(*args, timeout=30):
    cmd = ["adb", "-s", ADB_SERIAL] + list(args)
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)


def foreground_app():
    """Bawa app Fennec ke foreground TANPA intent-data (cuma resume ke state
    terakhir) - socket RDP butuh app 'visible' baru muncul di /proc/net/unix
    (fakta lama, lihat map), tapi INI TAK BOLEH bawa data-URL: `am start -a
    VIEW -d <url>` kalau tab tujuan sudah 'drift' (URL beda dari saat dibuka,
    mis. sudah masuk /c/<id> stlh kirim pesan) bikin Fennec buka TAB BARU
    alih-alih reuse - persis penyebab duplikasi tab nyata 11/9. Reuse tab
    SELALU lewat RDP (location.href), bukan lewat intent."""
    adb("shell", "am", "start", "-n", f"{FENNEC_PKG}/org.mozilla.fenix.HomeActivity")
    time.sleep(LOAD_WAIT_S)


def bootstrap_tab(url):
    """HANYA dipanggil kalau tab utk situs itu belum ada sama sekali (RDP
    listTabs nggak nemu) - buka via intent VIEW. Sekali per situs per 'siklus
    hidup' tab; sesudahnya query_site() selalu reuse via RDP, tak pernah
    manggil ini lagi selama tab masih ada (walau di-discard GeckoView -
    am start dgn url yg PERSIS SAMA akan wake tab lama, bukan bikin baru,
    karena masih 'exact URL match' saat itu)."""
    adb("shell", "am", "start", "-a", "android.intent.action.VIEW",
        "-d", url, FENNEC_PKG)
    time.sleep(LOAD_WAIT_S)


def ensure_rdp_forward():
    adb("forward", f"tcp:{RDP_PORT}",
        f"localabstract:{FENNEC_PKG}/firefox-debugger-socket")


TAB_SWITCHER_ICON = (838, 165)  # posisi tetap toolbar Fennec, 1080x2340 (verifikasi 11/9)


def dedupe_parked_tabs(canonical_title, keep=1, max_rounds=6):
    """Tutup tab EKSTRA yg judulnya PERSIS `canonical_title` (mis. "ChatGPT"),
    sisakan `keep`. Dipakai HANYA setelah bootstrap_tab() - GeckoView men-
    discard tab yg tak lagi 'selected' (fakta ditemukan 11/9: RDP listTabs
    sama sekali tak bisa lihat tab ter-discard, walau tab itu MASIH ADA di
    tab-switcher) sehingga query_site() bisa salah kira "tab belum ada" &
    bootstrap tab BARU - hasilnya 2 tab utk situs sama menumpuk pelan2 tiap
    kali terjadi. Exact-title-match AMAN krn tiap situs, saat idle/fresh di
    root (dipaksa oleh reset di akhir query_site), SELALU py judul canonical
    yg SAMA - tab lain yg lagi berisi percakapan aktif py judul beda/
    deskriptif, TAK TERSENTUH (sengaja, default aman: jangan tutup percakapan
    yg mungkin masih dipakai user).
    Murni via uiautomator dump (native UI Fennec, BUKAN konten WebView) -
    tanpa screenshot/PIL, ringan. Re-dump tiap ronde krn bounds card lain
    bisa geser sesudah 1 card ditutup."""
    closed = 0
    for _ in range(max_rounds):
        adb("shell", "input", "tap", str(TAB_SWITCHER_ICON[0]), str(TAB_SWITCHER_ICON[1]))
        time.sleep(1)
        adb("shell", "uiautomator", "dump", "/sdcard/_aiq_tabs.xml")
        xml = adb("shell", "cat", "/sdcard/_aiq_tabs.xml").stdout
        pat = r'content-desc="Tutup tab (' + re.escape(canonical_title) + r')"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"'
        cards = re.findall(pat, xml)
        if len(cards) <= keep:
            adb("shell", "input", "keyevent", "4")  # keluar tab-switcher
            break
        # Tutup dari DEPAN (tab terlama) - tab BARU yg baru dibuat bootstrap
        # SELALU nampil PALING BELAKANG di grid (terverifikasi empiris 11/9:
        # tab baru selalu muncul di posisi terakhir) - salah arah bisa
        # menutup tab yg justru baru dibuat & ingin dipertahankan.
        _title, x1, y1, x2, y2 = cards[0]
        cx, cy = (int(x1) + int(x2)) // 2, (int(y1) + int(y2)) // 2
        adb("shell", "input", "tap", str(cx), str(cy))
        time.sleep(0.8)
        closed += 1
    else:
        adb("shell", "input", "keyevent", "4")
    return closed


# ---------------------------------------------------------------------------
# JS snippets: isi-input & baca-jawaban, per situs
# (verbatim dari resep teruji di tool-appium/docs/*-web-rn7-map.md)
# ---------------------------------------------------------------------------

FILL_WITH_RANGE_SELECT = """
(function(){{
  var el = document.querySelector('{input_sel}');
  if (!el) return 'NO_INPUT';
  el.focus();
  var sel = window.getSelection();
  var range = document.createRange();
  range.selectNodeContents(el);
  sel.removeAllRanges();
  sel.addRange(range);
  document.execCommand('insertText', false, {prompt_json});
  return el.innerText;
}})()
"""

FILL_SIMPLE = """
(function(){{
  var el = document.querySelector('{input_sel}');
  if (!el) return 'NO_INPUT';
  el.focus();
  document.execCommand('insertText', false, {prompt_json});
  return el.innerText;
}})()
"""

SITES = {
    "chatgpt": {
        "label": "ChatGPT",
        "new_chat_url": "https://chatgpt.com/",
        "url_match": "chatgpt.com",
        "parked_title": "ChatGPT",  # document.title persis ini saat idle di root (terverifikasi 11/9)
        "input_sel": "#prompt-textarea",
        "fill_template": FILL_WITH_RANGE_SELECT,
        "send_ready_js": '!!document.querySelector(\'[data-testid="send-button"]\')',
        "send_js": """
(function(){
  var b = document.querySelector('[data-testid="send-button"]');
  if (!b) return 'NO_SEND_BTN';
  b.click();
  return 'sent';
})()
""",
        "read_js": """
(function(){
  var nodes = document.querySelectorAll('[data-message-author-role="assistant"]');
  if (!nodes.length) return '';
  return nodes[nodes.length-1].innerText;
})()
""",
    },
    "gemini": {
        "label": "Gemini",
        "new_chat_url": "https://gemini.google.com/app",
        "url_match": "gemini.google.com",
        "parked_title": "Google Gemini",  # verifikasi 11/9
        "input_sel": ".ql-editor",
        "fill_template": FILL_WITH_RANGE_SELECT,
        "send_ready_js": (
            "!!Array.from(document.querySelectorAll('button'))"
            ".find(function(x){ return x.getAttribute('aria-label') === 'Kirim pesan'; })"
        ),
        "send_js": """
(function(){
  var b = Array.from(document.querySelectorAll('button'))
    .find(function(x){ return x.getAttribute('aria-label') === 'Kirim pesan'; });
  if (!b) return 'NO_SEND_BTN';
  b.click();
  return 'sent';
})()
""",
        "read_js": """
(function(){
  var nodes = document.querySelectorAll('model-response');
  if (!nodes.length) return '';
  return nodes[nodes.length-1].innerText.replace(/^Gemini berkata\\n\\n/, '');
})()
""",
    },
    "claude": {
        "label": "Claude",
        "new_chat_url": "https://claude.ai/new",
        "url_match": "claude.ai",
        "parked_title": "Chat baru - Claude",  # verifikasi 11/9
        "input_sel": ".ProseMirror",
        "fill_template": FILL_WITH_RANGE_SELECT,
        "send_ready_js": '!!document.querySelector(\'[data-testid="chat-input-send"]\')',
        "send_js": """
(function(){
  var b = document.querySelector('[data-testid="chat-input-send"]');
  if (!b) return 'NO_SEND_BTN';
  b.click();
  return 'sent';
})()
""",
        "read_js": """
(function(){
  var rows = document.querySelectorAll('[data-testid="transcript-row"]');
  for (var i = rows.length - 1; i >= 0; i--) {
    if (!rows[i].querySelector('[data-testid="user-message"]')) {
      return rows[i].innerText.replace(/^Claude merespons:[^\\n]*\\n\\n/, '');
    }
  }
  return '';
})()
""",
    },
}


def query_site(site_key, prompt, verbose=True):
    cfg = SITES[site_key]
    label = cfg["label"]

    def log(msg):
        if verbose:
            print(f"[{label}] {msg}", file=sys.stderr)

    log("foreground Fennec (resume, tanpa buka URL)")
    foreground_app()

    ensure_rdp_forward()
    rdp = RDP()
    console = None
    try:
        # REUSE tab yg sudah ada via RDP - JANGAN `am start -a VIEW -d url`
        # tiap panggilan (itu yg bikin tab baru numpuk kalau tab lama sudah
        # 'drift' dari URL semula). Bootstrap (buka tab baru) HANYA kalau
        # RDP sama sekali tak nemu tab situs itu (pertama kali / tab ditutup
        # user / ke-discard total oleh GeckoView).
        try:
            console, tab = rdp.find_console(cfg["url_match"])
        except RDPError:
            log("tab tak kelihatan RDP (kemungkinan di-discard GeckoView) - bootstrap")
            bootstrap_tab(cfg["new_chat_url"])
            console, tab = rdp.find_console(cfg["url_match"])
            # Bootstrap BISA nyisain tab lama yg ke-discard (RDP tak bisa
            # lihat dia utk ditutup manual - dia tetap ADA di tab-switcher).
            # Beresin skrg selagi tahu persis situs apa yg baru di-bootstrap,
            # drpd numpuk pelan2 tiap kali discard kejadian lagi ke depan.
            n = dedupe_parked_tabs(cfg["parked_title"])
            if n:
                log(f"beres-beres: {n} tab lama '{cfg['parked_title']}' basi ditutup")

        # Paksa navigasi ulang via RDP (location.href, SAMA tab, bukan tab
        # baru) supaya SELALU landing di halaman chat kosong yg fresh, apa
        # pun state tab-nya sebelumnya (chat lama/percakapan drift/dst).
        rdp.eval_js(console, f"location.href = {json.dumps(cfg['new_chat_url'])}")
        time.sleep(LOAD_WAIT_S)
        console, tab = rdp.find_console(cfg["url_match"])
        log(f"tab siap (fresh, reused): {tab.get('url')}")

        input_ready = rdp.wait_for_truthy(
            console, f"!!document.querySelector('{cfg['input_sel']}')", timeout_s=25)
        if not input_ready:
            raise RDPError(f"input '{cfg['input_sel']}' tak muncul dlm 25dtk - halaman lambat/gagal render?")
        log("input siap")

        fill_expr = cfg["fill_template"].format(
            input_sel=cfg["input_sel"],
            prompt_json=json.dumps(prompt, ensure_ascii=False),
        )
        filled = rdp.eval_js(console, fill_expr)
        if filled in (None, "NO_INPUT"):
            raise RDPError(f"gagal isi input ({filled!r}) - cek selector '{cfg['input_sel']}' masih valid")
        log(f"prompt terisi ({len(filled or '')} char)")
        # verifikasi: kalau hasil isi jauh lebih pendek dari prompt asli, sesuatu gagal
        # (pernah kejadian nyata: teknik fill tanpa seleksi-range cuma keisi 0-1 char)
        if len(filled or "") < len(prompt) * 0.8:
            raise RDPError(
                f"input cuma terisi {len(filled or '')}/{len(prompt)} char - "
                f"kemungkinan teknik fill gagal (cek ulang selector/teknik di {cfg['input_sel']})"
            )

        btn_ready = rdp.wait_for_truthy(console, cfg["send_ready_js"], timeout_s=15)
        if not btn_ready:
            raise RDPError("tombol kirim tak pernah 'ready' dlm 15dtk setelah input terisi")
        sent = rdp.eval_js(console, cfg["send_js"])
        if sent not in ("sent",):
            raise RDPError(f"gagal klik kirim: {sent!r}")
        log("terkirim, menunggu jawaban...")

        last_text = None
        stable_count = 0
        waited = 0
        consecutive_errors = 0
        while waited < MAX_WAIT_S:
            time.sleep(POLL_INTERVAL_S)
            waited += POLL_INTERVAL_S
            try:
                text = rdp.eval_js(console, cfg["read_js"]) or ""
                consecutive_errors = 0
            except (RDPError, socket.timeout, OSError) as e:
                # RDP/socket kadang flaky di tengah polling panjang (pernah
                # kejadian nyata) - jangan crash, anggap "belum ada info baru"
                # & coba lagi, tapi reconnect kalau gagal beruntun terlalu lama.
                consecutive_errors += 1
                log(f"poll gagal ({e}), coba lagi ({consecutive_errors}x beruntun)")
                if consecutive_errors >= 4:
                    log("koneksi RDP tampak mati, reconnect...")
                    try:
                        rdp.close()
                    except Exception:
                        pass
                    rdp = RDP()
                    console, tab = rdp.find_console(cfg["url_match"])
                    consecutive_errors = 0
                continue
            if text and text == last_text:
                stable_count += 1
                log(f"stabil {stable_count}/{POLL_STABLE_CHECKS} ({len(text)} char)")
                if stable_count >= POLL_STABLE_CHECKS:
                    return clean_response_text(text)
            else:
                stable_count = 0
                last_text = text
                if text:
                    log(f"masih berubah... ({len(text)} char)")
        log("TIMEOUT menunggu jawaban stabil, pakai teks terakhir apa adanya")
        return clean_response_text(last_text or "") or "[TIMEOUT: tak ada jawaban terbaca]"
    finally:
        # Parkir tab balik ke root (judul jadi canonical spt "ChatGPT") biar
        # BEBAS PERCAKAPAN sebelum idle - ini yg bikin dedupe_parked_tabs()
        # bisa diandalkan next run kalau tab ini nanti ke-discard GeckoView.
        # Best-effort: jangan sampai gagal di sini menutupi hasil/exception asli.
        try:
            if console:
                rdp.eval_js(console, f"location.href = {json.dumps(cfg['new_chat_url'])}")
        except Exception:
            pass
        rdp.close()


_TRAILING_TIMESTAMP_RE = re.compile(
    r"^\s*(sekarang|now|\d+\s*(detik|menit|jam|hari|min|sec|hr|day)s?\s*(yang\s+)?lalu|"
    r"\d+\s*(s|m|h|d)\s*ago)\s*$",
    re.IGNORECASE,
)


def clean_response_text(text):
    """Buang baris kosong & baris timestamp-relatif ('sekarang'/'5 menit lalu') yang
    kadang ikut kebaca krn read_js ambil innerText satu row penuh (isi+metadata)."""
    lines = text.splitlines()
    while lines and (not lines[-1].strip() or _TRAILING_TIMESTAMP_RE.match(lines[-1])):
        lines.pop()
    return "\n".join(lines).strip()


def slugify(s):
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:60] or "untitled"


def write_wiki_entry(wiki_dir, title, prompt, answers):
    import os
    os.makedirs(wiki_dir, exist_ok=True)
    today = datetime.date.today().isoformat()
    fname = f"{today}-{slugify(title)}.md"
    path = os.path.join(wiki_dir, fname)

    lines = []
    lines.append(f"# {title}")
    lines.append("")
    lines.append(f"**Tanggal:** {today}  ")
    lines.append(f"**Sumber:** ChatGPT + Gemini + Claude (RN7, akun `clawapp810@gmail.com`)")
    lines.append("")
    lines.append("## Pertanyaan")
    lines.append("")
    lines.append(prompt.strip())
    lines.append("")
    for key, text in answers.items():
        label = SITES[key]["label"]
        lines.append(f"## Jawaban {label}")
        lines.append("")
        if text.startswith("[ERROR") or text.startswith("[TIMEOUT"):
            lines.append(f"> ⚠️ {text}")
        else:
            lines.append(text)
        lines.append("")

    content = "\n".join(lines).rstrip("\n") + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return path


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                  formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("title", nargs="?", help="Judul topik (dipakai jadi nama file). Diabaikan kalau pakai --raw.")
    ap.add_argument("prompt_pos", metavar="prompt", nargs="?",
                     help="Pertanyaan/prompt. Diabaikan kalau pakai --raw (pakai --prompt).")
    ap.add_argument("--only", default="chatgpt,gemini,claude",
                     help="Subset situs, pisah koma (default: semua)")
    ap.add_argument("--wiki-dir", default="wiki",
                     help="Folder output wiki (default: ./wiki)")
    ap.add_argument("--raw", metavar="SITE",
                     help="Mode pipeline/n8n: query 1 AI (chatgpt|gemini|claude), "
                          "cetak JSON {ok,site,answer|error} ke stdout, TANPA tulis "
                          "file wiki. Pakai bareng --prompt. Exit code 0=sukses, 1=gagal.")
    ap.add_argument("--prompt", help="Prompt teks, dipakai bareng --raw.")
    args = ap.parse_args()

    if args.raw:
        if args.raw not in SITES:
            ap.error(f"situs tak dikenal: {args.raw} (pilihan: {', '.join(SITES)})")
        prompt = args.prompt
        if not prompt:
            ap.error("--raw butuh --prompt \"...\"")
        try:
            answer = query_site(args.raw, prompt, verbose=True)
            print(json.dumps({"ok": True, "site": args.raw, "answer": answer}, ensure_ascii=False))
            sys.exit(0)
        except Exception as e:
            print(json.dumps({"ok": False, "site": args.raw, "error": str(e)}, ensure_ascii=False))
            sys.exit(1)

    if not args.title or not args.prompt_pos:
        ap.error("butuh 'title' dan 'prompt' (atau pakai --raw SITE --prompt \"...\")")

    sites = [s.strip() for s in args.only.split(",") if s.strip()]
    for s in sites:
        if s not in SITES:
            ap.error(f"situs tak dikenal: {s} (pilihan: {', '.join(SITES)})")

    print(f"=== Mengirim ke {len(sites)} AI: {', '.join(sites)} ===", file=sys.stderr)
    answers = {}
    for s in sites:
        try:
            answers[s] = query_site(s, args.prompt_pos)
        except Exception as e:
            print(f"[{SITES[s]['label']}] ERROR: {e}", file=sys.stderr)
            answers[s] = f"[ERROR: {e}]"

    path = write_wiki_entry(args.wiki_dir, args.title, args.prompt_pos, answers)
    print(f"\n=== Selesai. Wiki tersimpan: {path} ===", file=sys.stderr)
    print(path)


if __name__ == "__main__":
    main()
