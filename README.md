# dsh-custom-skin

DeepSeek Harness（DSH）Web GUI 插件：自定义 **界面字体 / 代码字体**，以及**主题选择**（调色板移植自 [dsh-refined](https://github.com/djh2203/dsh-refined)：Border / Nord / Twilight / GitHub / Atom One）。

- 改字体：覆盖 `--dsw-font-family`、`--ds-font-family-code`
- 选主题：`ctx.theme.overrideTokens` 覆盖 `--dsw-alias-*` 令牌（light/dark 成对）+ Markdown 美化 CSS（标题色条、代码/引用样式，选择器与当前 DSH 构建一致）
- 偏好存在浏览器 `localStorage`（键 `dsh-custom-skin.v1`），刷新不丢
- 设置页「Custom Skin」里可即时编辑（若当前 DSH 版本支持 `settings.section` 注入）

## 安装

从 GitHub（推荐）：

```bash
dsh plugin --profile web add github:v587d/dsh-custom-skin
```

本地开发（改代码即时映射，不用重新 add）：

```bash
dsh plugin --profile web add link:/home/shawn/projects/dsh-custom-skin
```

安装完成后重启：

```bash
dsh web
```

> 安装命令会把插件自动加入 `dsh.profile.bundles`（reconcile 检测到
> `package.json` 里的 `dsh.bundle.patch` 声明），无需手动改配置。
> 卸载：`dsh plugin --profile web remove dsh-custom-skin`。
> 验证：重启后 设置 → Custom Skin 出现，或 `grep dsh-custom-skin ~/.dsh/profiles/web/package.json`。

> 兼容性：在 DSH `0.1.1-rc.2` 上开发验证。主题令牌与 Markdown 选择器
> （`[class*="_markdown_"]`、`body[data-ds-dark-theme]`）随 DSH 构建版本
> 变化，升级 DSH 后如失效，按文末「开发注意事项」复查。

## 使用

1. 打开 Web UI → **设置 → Custom Skin**（若有该分节）
2. **Color theme**：选 `Default (DSH theme)` 或 Border / Nord / Twilight / GitHub / Atom One（默认 GitHub）
3. 填写本机已安装的字体名，例如：
   - UI：`"OPPO Sans 4.0", "Microsoft YaHei", sans-serif`
   - Code：`"Geist Mono", "Fira Code", Consolas, monospace`

没有设置页时，也可在控制台执行：

```js
localStorage.setItem('dsh-custom-skin.v1', JSON.stringify({
  uiFont: '"OPPO Sans 4.0", "Microsoft YaHei", sans-serif',
  codeFont: '"Geist Mono", "Fira Code", Consolas, monospace',
  theme: 'github'   // 'default' | 'border' | 'nord' | 'twilight' | 'github' | 'atom-one'
}))
location.reload()
```

## 注意

- **字体必须已安装在操作系统里**，插件不打包字体文件
- 其他主题/皮肤插件若也写同一批 CSS 变量，后加载的会盖掉先加载的
- 卸载插件后 `localStorage` 里的配置仍会留着，可手动清：`localStorage.removeItem('dsh-custom-skin.v1')`

## 开发注意事项（重要）

- **`lib/client.js` 必须是「经典脚本」，不能含顶层 `export`/`import`**。
  DSH 用 `<script src>` 加载 client bundle（见 `dsh-client-modules` 的
  `loadBundle`），文件里出现 `export` 会直接 `SyntaxError: Unexpected token 'export'`，
  整个插件加载失败，Web 启动页报 "Failed to load plugins"。
  正确形态：`window.__ModuleLoader__.load({ id: 'dsh-custom-skin', factory: (require) => { ... return module.exports } })`，
  与官方编译产物一致。
- 主题走 `ctx.theme.overrideTokens('custom-skin', { '--dsw-alias-xxx': { light, dark } })`，
  不要手写 `:root` 覆盖颜色令牌（令牌要求 light/dark 成对）。
  `buildTokens` 只输出**当前 DSH 构建真实存在的令牌**（以 Theme inspect provider 为准；
  `--dsw-alias-bg-layer-3`、`--dsw-alias-label-tertiary`、`--dsw-alias-markdown-*` 等在
  0.1.1-rc.2 不存在）；Markdown 美化 CSS 依赖 `[class*="_markdown_"]` 与
  `body[data-ds-dark-theme]` 两个选择器，升级 DSH 后需复查。
- **宽表格抖动修复（主题无关，总是生效）**：DSH 对 ≥4 列的宽表格
  （`.md-table-wide`）平时 `overflow-x:hidden` + `padding-bottom:
  var(--dsh-scrollbar-width, 8px)`，hover 时切到 `overflow-x:auto` 并清零
  padding，但 DSH 构建从未定义 `--dsh-scrollbar-width`（恒为 8px 兜底）。
  在传统滚动条系统（Windows 等约 15–17px）下 hover 会让表格高度跳变、页面
  抖动。插件在 `applySkin` 中**无条件**发布 `:root { --dsh-scrollbar-width:
  <实测值>px }`（探针实测水平滚动条高度；悬浮滚动条系统实测为 0），使 hover
  前后总高度一致；不再依赖是否选择了配色主题。该令牌名与 DSH 构建耦合，升级
  DSH 后需复查。
- 设置页用 `ctx.slots.inject('settings.section', () => ctx.slots.register({...}, Panel))`。
- **inject 有两处、写法不同**：
  - bundle 内插件对象的 `inject` 用**服务 key**：`['slots', 'theme']`
    （fiber 靠它在 ctx 注册表里等服务；写包名会永远 pending，
    启动页报 "waiting for services: @deepseek-ai/..."）；
  - `package.json` 的 `dsh.client.inject` 用**包名**：
    `['@deepseek-ai/dsh-client-ui-slots', '@deepseek-ai/dsh-client-ui-theme']`
    （仅用于 boot 清单预取/排序）。两者各司其职，别混。
- 改完 `lib/client.js` 后无需重装，重启 `dsh web` 即可（bundle 内容 hash 变化会自动换 rev）。

## 目录

```
dsh-custom-skin/
├── package.json
├── cordis.patch.yml
├── lib/
│   ├── index.js    # host 半边（占位）
│   └── client.js   # 浏览器半边（应用样式 + 设置 UI）
└── README.md
```

## License

MIT
