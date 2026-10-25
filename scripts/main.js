(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const model = window.SelfMeReleaseModel;
  const config = window.SelfMeRelease || {};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const text = (node, value) => { if (node.textContent !== value) node.textContent = value; };
  let noticeTimer, noticeOpener, pickerOpener, pickerAnchor, pickerOpen = false;
  const detectedPlatform = model.detectPlatform({ userAgent: navigator.userAgent, platform: navigator.platform, uaDataPlatform: navigator.userAgentData?.platform, maxTouchPoints: navigator.maxTouchPoints });
  const recommendedPlatform = detectedPlatform || 'macos';
  let architectureHint = null;
  let selectedPlatform = null, selectedTargetId = null;
  const platforms = ['macos', 'windows'].map(id => model.platform(config, id));
  const targetRows = [];
  const overviewFrame = $('overview-frame'), overviewRoot = $('overview-demo');
  let overviewVisible = false, overviewPaused = reduced.matches;
  $('year').textContent = new Date().getFullYear();

  function dismissNotice() {
    const focused = $('site-notice').contains(document.activeElement);
    clearTimeout(noticeTimer); $('site-notice').hidden = true;
    if (focused && noticeOpener?.isConnected) noticeOpener.focus({ preventScroll: true });
  }
  function scheduleNotice() { clearTimeout(noticeTimer); noticeTimer = setTimeout(dismissNotice, 6500); }
  function notify(message) {
    noticeOpener = document.activeElement; text($('notice-message'), ''); $('site-notice').hidden = false;
    requestAnimationFrame(() => text($('notice-message'), message)); scheduleNotice();
  }
  $('notice-close').addEventListener('click', dismissNotice);
  $('site-notice').addEventListener('mouseenter', () => clearTimeout(noticeTimer));
  $('site-notice').addEventListener('mouseleave', scheduleNotice);
  $('site-notice').addEventListener('focusin', () => clearTimeout(noticeTimer));
  $('site-notice').addEventListener('focusout', e => { if (!$('site-notice').contains(e.relatedTarget)) scheduleNotice(); });
  function setMenu(open) {
    $('mobile-nav').hidden = !open; $('menu-toggle').setAttribute('aria-expanded', String(open));
    $('menu-toggle').setAttribute('aria-label', open ? '收起导航' : '展开导航');
    $('menu-toggle').querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
  }
  $('menu-toggle').addEventListener('click', () => { closePicker(); setMenu($('mobile-nav').hidden); });
  $('mobile-nav').querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('pointerdown', e => {
    if (!$('mobile-nav').hidden && !e.target.closest('.site-header')) setMenu(false);
    if (pickerOpen && !$('download-options').contains(e.target) && !e.target.closest('[data-download-trigger]') && e.target !== $('download-primary')) closePicker();
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (pickerOpen) { e.preventDefault(); closePicker(true); }
    else if (!$('mobile-nav').hidden) { setMenu(false); $('menu-toggle').focus({ preventScroll: true }); }
  });
  matchMedia('(min-width:701px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  function platformData() { return platforms.find(data => data.id === (selectedPlatform || recommendedPlatform)); }
  function currentTarget(data) { return model.chooseTarget(data, data.id === selectedPlatform ? selectedTargetId : null, data.id === detectedPlatform ? architectureHint : null); }
  function targetName(data, item) { return data.name + (item ? ' · ' + item.label : ''); }
  function version(value) { return value ? (/^v/i.test(value) ? value : 'v' + value) : ''; }
  function details(data, item) {
    const info = model.displayInfo(config, data, item);
    return [version(info.version), info.format, info.size].filter(Boolean).join(' · ');
  }
  function platformIcon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const use = document.createElementNS(svg.namespaceURI, 'use');
    svg.setAttribute('class', 'icon small platform-symbol'); svg.setAttribute('aria-hidden', 'true');
    use.setAttribute('href', '#i-' + name); svg.append(use); return svg;
  }
  platforms.forEach(data => {
    const group = document.createElement('div'); group.className = 'download-package-group';
    data.targets.forEach(item => {
      const row = document.createElement(item.url ? 'a' : 'button'); row.className = 'download-package';
      if (item.url) row.href = item.url; else row.type = 'button';
      const copy = document.createElement('span'), title = document.createElement('strong'), meta = document.createElement('small'), end = document.createElement('span');
      title.textContent = targetName(data, item); meta.textContent = details(data, item); end.className = 'package-row-end';
      if (item.url || config.preview?.enabled) end.append(platformIcon('download')); else end.textContent = '即将推出';
      copy.append(title, meta); row.append(platformIcon(data.id === 'macos' ? 'apple' : 'windows'), copy, end);
      row.addEventListener('click', () => {
        selectedPlatform = data.id; selectedTargetId = item.id; renderDownload();
        closePicker(true);
        if (!item.url) notify(targetName(data, item) + ' 安装包即将推出。');
      });
      group.append(row); targetRows.push({ row, data, item });
    });
    $('download-package-list').append(group);
  });
  const notes = document.createElement('div'); notes.className = 'package-release-notes';
  platforms.filter(data => data.notes).forEach(data => {
    const link = document.createElement('a'); link.href = data.notes; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = data.name + ' 更新说明'; notes.append(link);
  });
  if (notes.childElementCount) $('download-package-list').append(notes);
  function renderDownload() {
    const data = platformData(), item = currentTarget(data), info = model.displayInfo(config, data, item);
    const hasPlatform = !!(selectedPlatform || detectedPlatform);
    const label = !hasPlatform ? '下载 SelfMe' : item ? '下载 ' + targetName(data, item) : '下载 ' + data.name;
    text($('download-button-label'), label); $('download-primary').setAttribute('aria-label', label);
    $('download-platform-icon').setAttribute('href', !hasPlatform ? '#i-download' : data.id === 'macos' ? '#i-apple' : '#i-windows');
    text($('download-version'), hasPlatform ? details(data, item) : version(info.version));
    text($('download-system'), hasPlatform ? info.minimumSystem ? '需要 ' + info.minimumSystem : '' : '适用于 macOS 与 Windows');
    $('download-version').hidden = !$('download-version').textContent;
    $('download-system').hidden = !$('download-system').textContent;
    targetRows.forEach(({ row, data: platform, item: target }) => {
      const selected = hasPlatform && platform.id === data.id && item?.id === target.id;
      row.classList.toggle('is-selected', selected);
      if (selected) row.setAttribute('aria-current', 'true'); else row.removeAttribute('aria-current');
    });
    updateOverview(); if (pickerOpen) positionPicker();
  }
  function positionPicker() {
    if (!pickerAnchor) return;
    const r = pickerAnchor.getBoundingClientRect(), panel = $('download-options'), bounds = panel.getBoundingClientRect();
    panel.style.left = Math.max(12, Math.min(r.right - bounds.width, innerWidth - bounds.width - 12)) + 'px';
    const below = r.bottom + 9, above = r.top - bounds.height - 9;
    panel.style.top = (below + bounds.height <= innerHeight - 12 ? below : above >= 12 ? above : Math.max(12, Math.min(below, innerHeight - bounds.height - 12))) + 'px';
  }
  function openPicker(opener) {
    setMenu(false); pickerOpener = opener; pickerAnchor = opener.closest('.download-split') || opener; pickerOpen = true;
    $('download-options').hidden = false; $('download-options-toggle').setAttribute('aria-expanded', 'true'); renderDownload();
    (targetRows.find(p => p.row.classList.contains('is-selected')) || targetRows.find(p => p.data.id === platformData().id) || targetRows[0])?.row.focus({ preventScroll: true });
  }
  function closePicker(restore) {
    pickerOpen = false; $('download-options').hidden = true; $('download-options-toggle').setAttribute('aria-expanded', 'false');
    if (restore && pickerOpener?.isConnected) pickerOpener.focus({ preventScroll: true });
  }
  $('download-options-toggle').addEventListener('click', () => pickerOpen ? closePicker(true) : openPicker($('download-options-toggle')));
  $('close-download-options').addEventListener('click', () => closePicker(true));
  $('download-primary').addEventListener('click', () => {
    const data = platformData(), item = currentTarget(data);
    if (!(selectedPlatform || detectedPlatform) || !item) { openPicker($('download-primary')); return; }
    closePicker(); if (item.url) location.assign(item.url); else notify(targetName(data, item) + ' 安装包即将推出。');
  });
  $('download-options').addEventListener('keydown', e => {
    const controls = Array.from($('download-options').querySelectorAll('button,a[href]'));
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault(); const i = controls.indexOf(document.activeElement);
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? controls.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + controls.length) % controls.length;
      controls[next]?.focus(); return;
    }
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === controls[0]) { e.preventDefault(); closePicker(true); }
    else if (!e.shiftKey && document.activeElement === controls.at(-1)) {
      e.preventDefault(); const opener = pickerOpener; closePicker();
      const all = Array.from(document.querySelectorAll('a[href],button')).filter(el => el.getClientRects().length && !el.closest('#download-options') && !el.disabled);
      (all[all.indexOf(opener) + 1] || opener)?.focus({ preventScroll: true });
    }
  });
  document.addEventListener('focusin', e => { if (pickerOpen && !$('download-options').contains(e.target) && !e.target.closest('[data-download-trigger]') && e.target !== $('download-primary')) closePicker(); });
  addEventListener('resize', () => { if (pickerOpen) positionPicker(); });
  addEventListener('scroll', () => {
    if (!pickerOpen) return; const r = pickerAnchor.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) closePicker(); else positionPicker();
  }, { passive: true });
  const repository = model.githubURL(config.repository), releases = model.releasesURL(config);
  $('github-link').title = repository ? '在 GitHub 查看 SelfMe 源码' : '源码仓库即将开放';
  $('github-link').addEventListener('click', () => {
    setMenu(false); closePicker(); if (repository) window.open(repository, '_blank', 'noopener,noreferrer'); else notify('SelfMe 源码仓库即将开放。');
  });
  $('all-releases').title = releases ? '在 GitHub Releases 查看所有版本' : '版本发布后可在此查看';
  $('all-releases').addEventListener('click', () => {
    setMenu(false); closePicker(); if (releases) window.open(releases, '_blank', 'noopener,noreferrer'); else notify('SelfMe 尚未发布版本。');
  });

  function updateOverview() {
    const playing = overviewVisible && !document.hidden && !overviewPaused;
    overviewRoot.dataset.playing = String(playing);
    const platform = detectedPlatform === 'windows' ? 'windows' : 'mac';
    if (document.documentElement.dataset.previewPlatform !== platform) {
      document.documentElement.dataset.previewPlatform = platform;
      window.dispatchEvent(new CustomEvent('selfme:platform', {detail:platform}));
    }
    overviewFrame.contentWindow?.postMessage({ channel: 'selfme-preview', platform, playing }, '*');
  }
  function sizeOverview() { overviewRoot.style.setProperty('--preview-scale', overviewRoot.clientWidth / 1512); }
  new ResizeObserver(sizeOverview).observe(overviewRoot); sizeOverview();
  overviewFrame.addEventListener('load', updateOverview);
  new IntersectionObserver(entries => { overviewVisible = entries[0].isIntersecting; updateOverview(); }, { threshold: .15 }).observe(overviewRoot);
  document.addEventListener('visibilitychange', updateOverview);
  reduced.addEventListener('change', e => { overviewPaused = e.matches; updateOverview(); });
  renderDownload();
  if (detectedPlatform && navigator.userAgentData?.getHighEntropyValues) navigator.userAgentData.getHighEntropyValues(['architecture', 'bitness']).then(data => { architectureHint = model.architecture(data); renderDownload(); }).catch(() => {});

  const navigation = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    document.querySelectorAll('.primary-nav>a').forEach(link => { if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
  }), { rootMargin:'-12% 0px -65% 0px' });
  ['workflow','capabilities','faq'].forEach(id => navigation.observe($(id))); navigation.observe(document.querySelector('.hero'));
})();
