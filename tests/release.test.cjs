const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../scripts/release-model.js');
const asset = (name) => 'https://github.com/example/selfme/releases/download/v1.2.0/' + name;

test('推荐桌面系统，移动端与不支持的系统保持未知', () => {
  assert.equal(M.detectPlatform({ platform: 'MacIntel', userAgent: 'Macintosh', maxTouchPoints: 0 }), 'macos');
  assert.equal(M.detectPlatform({ uaDataPlatform: 'Windows', userAgent: 'Windows NT 10.0' }), 'windows');
  for (const input of [{ userAgent: 'iPhone' }, { userAgent: 'Android' }, { userAgent: 'Windows Phone 8.0', platform: 'Win32' }, { platform: 'MacIntel', maxTouchPoints: 5 }, { platform: 'Linux x86_64' }, {}]) assert.equal(M.detectPlatform(input), null);
});
test('仅接受真实格式的 HTTPS GitHub 仓库与 Release 附件地址', () => {
  assert.equal(M.githubURL('https://github.com/example/selfme'), 'https://github.com/example/selfme');
  assert.equal(M.githubURL(asset('selfme.dmg'), 'asset'), asset('selfme.dmg'));
  assert.equal(M.githubURL('https://github.com/example/selfme/releases/latest/download/selfme.exe', 'asset'), 'https://github.com/example/selfme/releases/latest/download/selfme.exe');
  for (const url of ['javascript:alert(1)', 'http://github.com/example/selfme', 'https://github.com.evil.test/example/selfme', 'https://github.com@example.test/example/selfme', 'https://github.com/example', 'https://github.com/example/selfme?token=secret']) assert.equal(M.githubURL(url), null);
  assert.equal(M.githubURL('https://github.com/example/selfme/releases/latest', 'asset'), null);
});
test('未发布不生成虚构版本或可下载安装包', () => {
  const data = M.platform({ platforms: { macos: { version: '1.0.0', packages: [{ label: 'DMG', url: '' }] } } }, 'macos');
  assert.equal(data.available, false);
  assert.deepEqual(data.packages, []);
  assert.equal(M.platform({}, 'windows').version, null);
  assert.equal(M.choosePackage(data), null);
});
test('各平台分别承载版本与最低系统要求', () => {
  const config = { platforms: { macos: { version: '1.2.0', minimumSystem: 'macOS 14+', packages: [{ label: 'Apple silicon', architecture: 'arm64', url: asset('arm.dmg') }] }, windows: { version: '1.1.0', minimumSystem: 'Windows 11', packages: [] } } };
  assert.equal(M.platform(config, 'macos').version, '1.2.0');
  assert.equal(M.platform(config, 'windows').version, '1.1.0');
  assert.equal(M.platform(config, 'windows').available, false);
  assert.equal(M.platform(config, 'macos').minimumSystem, 'macOS 14+');
});
test('多架构且无法判断时等待选择，不默认猜测第一个安装包', () => {
  const data = M.platform({ platforms: { macos: { packages: [{ id: 'arm', label: 'Apple silicon', architecture: 'arm64', url: asset('arm.dmg') }, { id: 'intel', label: 'Intel', architecture: 'x64', url: asset('intel.dmg') }] } } }, 'macos');
  assert.equal(M.choosePackage(data), null);
  assert.equal(M.choosePackage(data, null, 'arm64').id, 'arm');
  assert.equal(M.choosePackage(data, 'intel', 'arm64').id, 'intel');
  assert.equal(M.choosePackage(data, 'missing'), null);
});
test('单包与通用包可直接采用，失效包不成为下载候选', () => {
  const data = M.platform({ platforms: { windows: { packages: [{ id: 'bad', label: '不安全链接', url: 'https://other.test/a.exe' }, { id: 'one', label: 'Windows', url: asset('selfme.exe') }] } } }, 'windows');
  assert.equal(data.packages.length, 1);
  assert.equal(M.choosePackage(data).id, 'one');
  data.packages.push({ id: 'all', label: '通用包', architecture: 'universal' });
  assert.equal(M.choosePackage(data).id, 'all');
});
test('保留明确的架构信息，不从 MacIntel 或空值推断芯片', () => {
  assert.equal(M.architecture({ architecture: 'arm', bitness: '64' }), 'arm64');
  assert.equal(M.architecture({ architecture: 'x86', bitness: '64' }), 'x64');
  assert.equal(M.architecture({ architecture: 'MacIntel' }), null);
  assert.equal(M.architecture({ architecture: 'x86', bitness: '32' }), null);
  assert.equal(M.architecture(null), null);
});
test('未开放下载时仍完整展示计划架构，版本与下载地址不虚构', () => {
  const data = M.platform({platforms:{macos:{targets:[{id:'arm',label:'Apple silicon',architecture:'arm64'},{id:'intel',label:'Intel',architecture:'x64'}],packages:[]}}},'macos');
  assert.equal(data.targets.length,2); assert.equal(data.available,false);
  assert.equal(data.targets[0].url,null); assert.equal(data.targets[0].version,null);
  assert.equal(M.chooseTarget(data),null); assert.equal(M.chooseTarget(data,null,'arm64').id,'arm');
});
test('手动架构选择优先于自动识别',()=>{
  const data={targets:[{id:'arm',architecture:'arm64'},{id:'intel',architecture:'x64'}]};
  assert.equal(M.chooseTarget(data,'intel','arm64').id,'intel');
});
test('按稳定ID合并已发布附件，其他计划架构继续待发布',()=>{
  const data=M.platform({platforms:{macos:{version:'1.2.0',targets:[{id:'arm',label:'Apple silicon',architecture:'arm64'},{id:'intel',label:'Intel',architecture:'x64'}],packages:[{id:'arm',label:'Apple silicon',architecture:'arm64',url:asset('arm.dmg')}]}}},'macos');
  assert.equal(data.targets[0].version,'1.2.0');assert.equal(data.targets[0].url,asset('arm.dmg'));assert.equal(data.targets[1].version,null);assert.equal(data.targets[1].url,null);
});
test('重复或未知的架构目标不进入列表',()=>{
  const data=M.platform({platforms:{windows:{targets:[{id:'x64',label:'x64',architecture:'x64'},{id:'x64',label:'重复',architecture:'x64'},{id:'other',label:'未知',architecture:'unknown'}]}}},'windows');
  assert.equal(data.targets.length,1);
});
test('所有版本指向软件仓库Releases，未配置时不猜测网站仓库',()=>{
  assert.equal(M.releasesURL({repository:'https://github.com/example/selfme/'}),'https://github.com/example/selfme/releases');assert.equal(M.releasesURL({repository:null}),null);
});

test('完整模拟展示与真实下载能力分开，未知架构保留平台范围信息', () => {
  const config = { preview: { enabled: true, version: '0.1.0', platforms: { macos: { format: '.dmg', size: '128–134 MB', minimumSystem: 'macOS 14.0 或更高版本' } }, targets: { arm: { size: '128 MB' } } }, platforms: { macos: { targets: [{ id: 'arm', label: 'Apple silicon', architecture: 'arm64' }], packages: [] } } };
  const data=M.platform(config,'macos');
  assert.deepEqual(M.displayInfo(config,data,data.targets[0]), {version:'0.1.0',format:'.dmg',size:'128 MB',minimumSystem:'macOS 14.0 或更高版本'});
  assert.equal(M.displayInfo(config,data,null).size,'128–134 MB');
  assert.equal(data.available,false);
  assert.equal(M.choosePackage(data),null);
  assert.equal(data.targets[0].url,null);
  assert.equal(data.targets[0].version,null);
});
test('真实附件的版本、体积与系统要求优先，缺失字段不借用模拟值', () => {
  const config={preview:{enabled:true,version:'0.1.0',platforms:{macos:{size:'128 MB',minimumSystem:'macOS 14+'}}},platforms:{macos:{version:'1.2.0',minimumSystem:'macOS 13+',packages:[{id:'arm',label:'Apple silicon',architecture:'arm64',url:asset('selfme.dmg'),size:'42 MB'}]}}};
  let data=M.platform(config,'macos');
  assert.deepEqual(M.displayInfo(config,data,data.packages[0]),{version:'1.2.0',format:'.dmg',size:'42 MB',minimumSystem:'macOS 13+'});
  config.platforms.macos.version=null;config.platforms.macos.minimumSystem=null;config.platforms.macos.packages[0].size='';
  data=M.platform(config,'macos');
  assert.deepEqual(M.displayInfo(config,data,data.packages[0]),{version:null,format:'.dmg',size:'',minimumSystem:null});
});
test('关闭模拟展示后不再输出模拟版本或安装包大小', () => {
  const config={preview:{enabled:false,version:'0.1.0',platforms:{windows:{size:'118 MB',minimumSystem:'Windows 11'}}}};
  const info=M.displayInfo(config,M.platform(config,'windows'),null);
  assert.equal(info.version,null);assert.equal(info.size,'');assert.equal(info.minimumSystem,null);
});
