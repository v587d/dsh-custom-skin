/**
 * dsh-custom-skin — host half
 * 浏览器侧的字体/皮肤全部由 client.js 负责；host 侧仅做占位挂载。
 * 若以后要读 settings.yaml 或挂 /api，可在这里 inject settings / webServer。
 */
export const name = 'custom-skin'

export function apply() {
  // no-op on host
}
