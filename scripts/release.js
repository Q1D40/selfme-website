/*
 * 在官网仓库根目录运行 python3 -m http.server 8080，通过 HTTP 预览内嵌演示。
 * 正式发布时将 repository 指向 SelfMe 软件仓库，供源码和所有版本入口使用。
 * 按 targets 的 id、label 和 architecture 填写 packages，补齐 GitHub Release 附件的 url、version 和 size。
 * 按平台填写 minimumSystem 和 notes，关闭 preview.enabled，再运行 node --test tests/release.test.cjs。
 */
window.SelfMeRelease = Object.freeze({
  repository: null,
  preview: {
    enabled: true,
    version: '0.1.0',
    platforms: {
      macos: { format: '.dmg', size: '128–134 MB', minimumSystem: 'macOS 14.0 或更高版本' },
      windows: { format: '.exe', size: '112–118 MB', minimumSystem: 'Windows 11 或更高版本' }
    },
    targets: {
      'macos-arm64': { size: '128 MB' },
      'macos-x64': { size: '134 MB' },
      'windows-x64': { size: '118 MB' },
      'windows-arm64': { size: '112 MB' }
    }
  },
  platforms: {
    macos: {
      version: null, minimumSystem: null, notes: null,
      targets: [
        { id: 'macos-arm64', label: 'Apple silicon', architecture: 'arm64' },
        { id: 'macos-x64', label: 'Intel', architecture: 'x64' }
      ],
      packages: []
    },
    windows: {
      version: null, minimumSystem: null, notes: null,
      targets: [
        { id: 'windows-x64', label: 'x64', architecture: 'x64' },
        { id: 'windows-arm64', label: 'ARM64', architecture: 'arm64' }
      ],
      packages: []
    }
  }
});
