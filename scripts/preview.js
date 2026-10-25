/* 只读播放从工作台实际界面导出的状态，不加载项目业务或 CLI 代码。 */
(() => {
  'use strict';
  const data = JSON.parse(document.getElementById('preview-data').textContent);
  const root = document.getElementById('preview-root');
  let frame = 0, playing = false, timer, remaining = 5400, due = 0;
  function applyMotion() {
    document.body.classList.toggle('preview-paused', !playing);
    root.querySelectorAll('.home-flow-shell').forEach(el => { el.dataset.motion = playing ? 'running' : 'paused'; });
    const icon = root.querySelector('#home-motion-toggle use');
    if (icon) icon.setAttribute('href', playing ? '#i-pause' : '#i-play');
  }
  function advance() {
    frame = (frame + 1) % data.frames.length;
    root.innerHTML = data.sprite + data.frames[frame];
    remaining = 5400; applyMotion(); schedule();
  }
  function schedule() { if (!playing) return; due = performance.now() + remaining; timer = setTimeout(advance, remaining); }
  function setPlaying(next) {
    if (next === playing) return;
    if (!next) { clearTimeout(timer); remaining = Math.max(0, due - performance.now()); }
    playing = next; applyMotion(); if (playing) schedule();
  }
  window.addEventListener('message', event => {
    if (event.source !== parent || event.origin !== new URL(location.href).origin || event.data?.channel !== 'selfme-preview') return;
    if (['mac', 'windows'].includes(event.data.platform)) document.documentElement.dataset.platform = event.data.platform;
    setPlaying(event.data.playing === true);
  });
  applyMotion();
})();
