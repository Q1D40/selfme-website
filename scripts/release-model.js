/* 发布数据与选择规则。浏览器和 Node 测试使用同一份实现。 */
(function (root, factory) {
  var model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.SelfMeReleaseModel = model;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  function text(value) { return typeof value === 'string' ? value.trim() : ''; }
  function githubURL(value, kind) {
    if (!text(value)) return null;
    try {
      var url = new URL(value);
      if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.username || url.password || url.port || url.search || url.hash) return null;
      var repo = /^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;
      var asset = /^\/[^/]+\/[^/]+\/releases\/(?:download\/[^/]+\/|latest\/download\/)[^/]+$/;
      var resource = /^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/.*)?$/;
      return (kind === 'asset' ? asset : kind === 'resource' ? resource : repo).test(url.pathname) ? url.href : null;
    } catch (_) { return null; }
  }
  function detectPlatform(input) {
    input = input || {};
    var ua = text(input.userAgent), platform = text(input.uaDataPlatform) || text(input.platform);
    if (/Android|iPhone|iPad|iPod|IEMobile|Windows Phone/i.test(ua) || (/Mac/i.test(platform + ua) && Number(input.maxTouchPoints) > 1)) return null;
    if (/Win/i.test(platform) || /Windows/i.test(ua)) return 'windows';
    if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) return 'macos';
    return null;
  }
  function platform(config, id) {
    id = id === 'windows' ? 'windows' : 'macos';
    var data = config && config.platforms && config.platforms[id] || {}, ids = new Set();
    var packages = (Array.isArray(data.packages) ? data.packages : []).reduce(function (items, item, index) {
      if (!item || !text(item.label)) return items;
      var url = githubURL(item.url, 'asset'), key = text(item.id) || String(index);
      if (!url || ids.has(key)) return items;
      ids.add(key);
      items.push({ id: key, label: text(item.label), architecture: text(item.architecture), url: url, size: text(item.size), version: text(item.version) || text(data.version) || null, minimumSystem: text(item.minimumSystem) || text(data.minimumSystem) || null });
      return items;
    }, []);
    var targetIds = new Set();
    var targets = (Array.isArray(data.targets) ? data.targets : []).reduce(function (items, item) {
      if (!item || !text(item.id) || !text(item.label) || !['arm64', 'x64', 'universal'].includes(item.architecture) || targetIds.has(item.id)) return items;
      targetIds.add(item.id);
      var released = packages.find(function (pkg) { return pkg.id === item.id; });
      items.push(Object.assign({ id: item.id, label: text(item.label), architecture: item.architecture, url: null, size: '', version: null }, released || {}));
      return items;
    }, []);
    packages.forEach(function (item) { if (!targetIds.has(item.id)) targets.push(item); });
    return { targets: targets, id: id, name: id === 'macos' ? 'macOS' : 'Windows', version: text(data.version) || null, minimumSystem: text(data.minimumSystem) || null, notes: githubURL(data.notes, 'resource'), packages: packages, available: packages.length > 0 };
  }
  function choosePackage(data, savedId, architecture) {
    var items = data.packages || [], saved = items.find(function (item) { return item.id === savedId; });
    if (saved) return saved;
    var universal = items.find(function (item) { return item.architecture === 'universal'; });
    if (universal) return universal;
    if (items.length === 1) return items[0];
    if (architecture) return items.find(function (item) { return item.architecture === architecture; }) || null;
    return null;
  }
  function chooseTarget(data, savedId, architecture) { return choosePackage({ packages: data.targets || [] }, savedId, architecture); }
  // Preview metadata describes the layout only; it never creates a downloadable asset.
  function displayInfo(config, data, item) {
    if (item && item.url) {
      var extension = item.url.match(/\.(dmg|exe|msi|zip|pkg)(?:$|\?)/i);
      return { version: item.version || data.version, format: extension ? '.' + extension[1].toLowerCase() : '', size: item.size || '', minimumSystem: item.minimumSystem || data.minimumSystem || null };
    }
    var preview = config && config.preview;
    if (preview && preview.enabled === true) {
      var summary = preview.platforms && preview.platforms[data.id] || {};
      var target = item && preview.targets && preview.targets[item.id] || {};
      return { version: text(target.version) || text(summary.version) || text(preview.version) || null, format: text(target.format) || text(summary.format), size: text(target.size) || text(summary.size), minimumSystem: text(target.minimumSystem) || text(summary.minimumSystem) || null };
    }
    return { version: item ? null : data.version, format: '', size: '', minimumSystem: data.minimumSystem };
  }
  function releasesURL(config) { var url = githubURL(config && config.repository); return url ? url.replace(/\/$/, '') + '/releases' : null; }
  function architecture(data) {
    if (!data) return null;
    if (data.architecture === 'arm' && data.bitness === '64') return 'arm64';
    if (data.architecture === 'x86' && data.bitness === '64') return 'x64';
    return null;
  }
  return Object.freeze({ githubURL: githubURL, detectPlatform: detectPlatform, platform: platform, choosePackage: choosePackage, chooseTarget: chooseTarget, displayInfo: displayInfo, releasesURL: releasesURL, architecture: architecture });
});
