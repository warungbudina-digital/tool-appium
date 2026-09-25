// ==UserScript==
// @name         ChatGPT Fennec send-fix
// @namespace    warungbudina/rn7
// @version      1.0
// @description  Tombol kirim ChatGPT mati saat ada lampiran gambar di Firefox: slider tersembunyi "Berpikir lebih keras" dirender min=0 max=-1 -> Firefox anggap rangeOverflow -> form invalid -> submit diblokir senyap.
// @match        https://chatgpt.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const fix = () => {
    // Perbaikan terarah: slider dgn max < min dibuat valid (max = min).
    for (const r of document.querySelectorAll('input[type=range]')) {
      const min = parseFloat(r.min || '0');
      const max = parseFloat(r.max);
      if (!Number.isNaN(max) && max < min) r.max = String(min);
    }
    // Jaring pengaman: kalau masih ada elemen invalid lain, jangan biarkan
    // validasi native memblokir form komposer secara senyap.
    for (const f of document.querySelectorAll('form[data-mobile-composer]')) {
      f.noValidate = true;
    }
  };

  const start = () => {
    fix();
    new MutationObserver(fix).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['max', 'min'],
    });
  };

  if (document.documentElement) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
