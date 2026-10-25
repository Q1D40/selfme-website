/* 当前以模拟信息预览正式排版；真实附件与展示数据分开，尚不提供下载。 */
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
