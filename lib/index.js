/**
 * dsh-custom-skin — host half
 *
 * 这颗行的全部职责是**提供一份可编辑的配置 schema**。`dsh-settings` 把活动 profile 条目
 * `Config` 里标了 `.volatile()` 的字段投影成表单（命名空间恒等于条目 id，即
 * `cordis.patch.yml` 的 `id: custom-skin`），浏览器半边再经 `ctx.configForms.get(条目 id)`
 * 读写它，卡片坐在「插件 → 已安装插件 → dsh-custom-skin」的 `plugins.bundle.config` 段里。
 *
 * ⛔ 字段必须逐个 `.volatile()`：一个都没有时 `volatileForm()` 返回 `undefined`，本条目
 * 就不进 describe 镜像——卡片读不到命名空间，写入也会被
 * `Config field "…" is not volatile` 拒绝，表现是**配置段静默消失**（零报错）。
 *
 * 本行不消费自己的配置（皮肤全在浏览器侧落色），所以 `apply` 是空的。默认值只有这一份：
 * 浏览器半边从不硬编码默认，它读 host 解析后的快照。
 */
import z from '@deepseek-ai/schemastery'

export const name = 'custom-skin'

/** 与浏览器半边的 `ENTRY_ID` 逐字一致（那边还有另一个字符串 `BUNDLE_NAME` 是槽 key，两者不是一回事）。 */
export const SETTINGS_ENTRY_ID = 'custom-skin'

/** `theme` 取 'default' 或 client.js 里 THEMES 的 key。故意不用枚举：加皮肤不该让旧 profile 里的值失效。 */
export const Config = z.object({
  uiFont: z.string()
    .default('"OPPO Sans 4.0", "Microsoft YaHei", sans-serif')
    .volatile()
    .description('界面字体栈；须是本机已安装的字体，留空 = 用 DSH 默认'),
  codeFont: z.string()
    .default('"Geist Mono", "Fira Code", Consolas, monospace')
    .volatile()
    .description('代码字体栈；须是本机已安装的字体，留空 = 用 DSH 默认'),
  theme: z.string()
    .default('github')
    .volatile()
    .description("调色板 id；'default' = 不动 DSH 自带主题"),
})

export function apply() {
  // host 侧不落任何东西：皮肤由浏览器半边应用，配置的读写全在 dsh-settings 的投影里完成。
}
