# SelfMe 官网

静态 HTML、CSS 与 JavaScript，无需安装依赖或构建。GitHub Pages 从 `main` 分支根目录发布，域名为 `selfme.ai`。

## 本地预览

在本目录运行 `python3 -m http.server 8080`，访问 `http://localhost:8080/`；使用工作区统一服务时访问 `/website/`。请通过 HTTP 预览，直接双击 `index.html` 可能导致内嵌界面无法加载。

## 发布配置

统一编辑 `scripts/release.js`：

- `repository` 填 SelfMe 软件仓库地址，控制源码与所有版本入口；不使用官网仓库代替。
- `preview` 是当前用于观察正式排版的模拟版本、体积与系统要求，不提供真实下载。
- `platforms` 中的 `targets` 列出平台和架构，`packages` 填实际 GitHub Release 附件地址及其版本、体积；`minimumSystem` 填对应最低系统要求，`notes` 填发布说明地址。

目前安装包和软件仓库入口点击后显示即将推出提示。真实附件信息优先于模拟数据，缺失字段不会借用模拟值。

运行 `node --test tests/release.test.cjs` 检查发布规则。`tests/` 随源码保留，不加入 Git 忽略，官网页面不加载它。

## 后续自动同步

软件发布流水线建立后，从 Release tag 读取版本，从附件读取下载地址、文件格式与体积，从构建配置或发布清单读取最低系统要求；自动生成官网发布数据、关闭 `preview.enabled` 并触发 Pages 更新。该流水线目前尚未接入，两行下载信息后续应随实际发布自动更新。
