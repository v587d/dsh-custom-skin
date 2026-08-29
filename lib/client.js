/**
 * dsh-custom-skin — browser half
 *
 * DSH loads client bundles as classic <script> files, so this file must be a
 * single classic script: no top-level export/import, register only through
 * window.__ModuleLoader__.load({ id, factory }).
 *
 * - Fonts: override --dsw-font-family (UI) and --ds-font-family-code (code).
 * - Theme: palettes ported from dsh-refined (github.com/djh2203/dsh-refined),
 *   applied through ctx.theme.overrideTokens('custom-skin', ...) with
 *   light/dark pairs; the markdown CSS targets the same selectors that build
 *   uses ([class*="_markdown_"], body[data-ds-dark-theme]).
 * - Table jitter fix (theme-independent): DSH hides the horizontal scrollbar
 *   of wide tables until hover and reserves var(--dsh-scrollbar-width,8px);
 *   the DSH build never defines that token, so on classic-scrollbar systems
 *   hovering changes the table height. applySkin always publishes the measured
 *   real scrollbar size as --dsh-scrollbar-width so hover no longer changes
 *   the layout height — even with the Default theme selected.
 * - Settings page: slots.inject('settings.section', () => slots.register({...}, Panel)).
 * - Prefs live in localStorage (key dsh-custom-skin.v1).
 */

window.__ModuleLoader__.load({
  id: 'dsh-custom-skin',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports

    // ===== theme palettes (ported from dsh-refined) =====
    const THEMES = {
      border: {
        label: 'Border',
        light: {
          bg: '#F9F6F4', bgBase: '#F9F6F4', bgLayer2: '#F2E0E4', bgLayer3: '#EBE4F0',
          labelPrimary: '#4A4348', labelSecondary: '#8B7F88', labelTertiary: '#A9A0A6', labelCaption: '#8B7F88',
          brandPrimary: '#793f82', brandText: '#9B7AA0',
          borderL1: 'rgba(74, 67, 72, 0.06)', borderL2: 'rgba(74, 67, 72, 0.10)', borderL3: 'rgba(74, 67, 72, 0.14)',
          inlineCodeBg: '#F2E0E4', codeBlockBg: '#FEFBF5', codeBannerBg: '#F7F0E3',
          strong: 'hsl(350, 80%, 55%)', em: 'hsl(28, 80%, 50%)', math: '#1a6fb5', inlineCodeText: '#dd1399',
          heading: ['#bd5151', '#c77b23', '#478f14', '#0585a8', '#726293', '#127d52'],
          blockquoteDot: '000000', toastBg: '#fff', toastText: '#333',
        },
        dark: {
          bg: '#27282e', bgBase: '#27282e', bgLayer1: '#27282e', bgLayer2: '#2d2e34', bgLayer3: '#32333a',
          labelPrimary: 'hsl(232, 6%, 88%)', labelSecondary: 'hsl(232, 9%, 64%)', labelTertiary: 'hsl(232, 12%, 48%)', labelCaption: 'hsl(232, 9%, 56%)',
          brandPrimary: 'hsl(232, 70%, 65%)', brandText: 'hsl(232, 70%, 70%)',
          borderL1: 'rgba(255, 255, 255, 0.06)', borderL2: 'rgba(255, 255, 255, 0.10)', borderL3: 'rgba(255, 255, 255, 0.14)',
          inlineCodeBg: '#2d2e34', codeBlockBg: '#2d2e34', codeBannerBg: '#32333a',
          strong: '#ff7881', em: '#fbbb83', math: '#8dd3f6', inlineCodeText: '#f2b6de',
          heading: ['#d18989', '#cea38d', '#93c89c', '#7eb8f1', '#bab3ef', '#7ec8c5'],
          blockquoteDot: 'ffffff', toastBg: '#2d2e34', toastText: '#e0e0e0',
        },
      },
      nord: {
        label: 'Nord',
        light: {
          bg: '#ECEFF4', bgBase: '#ECEFF4', bgLayer2: '#E5E9F0', bgLayer3: '#D8DEE9',
          labelPrimary: '#2E3440', labelSecondary: '#4C566A', labelTertiary: '#7B88A1', labelCaption: '#4C566A',
          brandPrimary: '#5E81AC', brandText: '#5E81AC',
          borderL1: 'rgba(46, 52, 64, 0.06)', borderL2: 'rgba(46, 52, 64, 0.10)', borderL3: 'rgba(46, 52, 64, 0.14)',
          inlineCodeBg: '#E5E9F0', codeBlockBg: '#FFFFFF', codeBannerBg: '#D8DEE9',
          strong: '#BF616A', em: '#D08770', math: '#5E81AC', inlineCodeText: '#5E81AC',
          heading: ['#BF616A', '#D08770', '#A88B3F', '#7FA46B', '#5E81AC', '#8E6F9E'],
          blockquoteDot: '000000', toastBg: '#FFFFFF', toastText: '#2E3440',
        },
        dark: {
          bg: '#2E3440', bgBase: '#2E3440', bgLayer1: '#2E3440', bgLayer2: '#3B4252', bgLayer3: '#434C5E',
          labelPrimary: '#ECEFF4', labelSecondary: '#D8DEE9', labelTertiary: '#7B88A1', labelCaption: '#D8DEE9',
          brandPrimary: '#88C0D0', brandText: '#88C0D0',
          borderL1: 'rgba(216, 222, 233, 0.06)', borderL2: 'rgba(216, 222, 233, 0.10)', borderL3: 'rgba(216, 222, 233, 0.14)',
          inlineCodeBg: '#434C5E', codeBlockBg: '#3B4252', codeBannerBg: '#434C5E',
          strong: '#BF616A', em: '#D08770', math: '#88C0D0', inlineCodeText: '#8FBCBB',
          heading: ['#BF616A', '#D08770', '#EBCB8B', '#A3BE8C', '#88C0D0', '#B48EAD'],
          blockquoteDot: 'ffffff', toastBg: '#3B4252', toastText: '#ECEFF4',
        },
      },
      twilight: {
        label: 'Twilight',
        light: {
          bg: '#F7F3FB', bgBase: '#F7F3FB', bgLayer2: '#EDE4F5', bgLayer3: '#E3D4EF',
          labelPrimary: '#3D2E4F', labelSecondary: '#6E5C82', labelTertiary: '#9C8AB0', labelCaption: '#6E5C82',
          brandPrimary: '#8B5CF6', brandText: '#7C3AED',
          borderL1: 'rgba(61, 46, 79, 0.06)', borderL2: 'rgba(61, 46, 79, 0.10)', borderL3: 'rgba(61, 46, 79, 0.14)',
          inlineCodeBg: '#EDE4F5', codeBlockBg: '#FFFFFF', codeBannerBg: '#EDE4F5',
          strong: '#DB2777', em: '#D97706', math: '#6D28D9', inlineCodeText: '#8B5CF6',
          heading: ['#DB2777', '#D97706', '#A16207', '#059669', '#2563EB', '#7C3AED'],
          blockquoteDot: '000000', toastBg: '#FFFFFF', toastText: '#3D2E4F',
        },
        dark: {
          bg: '#1A1124', bgBase: '#1A1124', bgLayer1: '#1A1124', bgLayer2: '#241736', bgLayer3: '#2E1F44',
          labelPrimary: '#EDE4F5', labelSecondary: '#B9A6CC', labelTertiary: '#7E6C96', labelCaption: '#A894BC',
          brandPrimary: '#C084FC', brandText: '#D3A9FF',
          borderL1: 'rgba(237, 228, 245, 0.06)', borderL2: 'rgba(237, 228, 245, 0.10)', borderL3: 'rgba(237, 228, 245, 0.14)',
          inlineCodeBg: '#2E1F44', codeBlockBg: '#241736', codeBannerBg: '#2E1F44',
          strong: '#FF79C6', em: '#FFD866', math: '#82AAFF', inlineCodeText: '#C084FC',
          heading: ['#FF79C6', '#FFB86C', '#F1FA8C', '#50FA7B', '#8BE9FD', '#BD93F9'],
          blockquoteDot: 'ffffff', toastBg: '#241736', toastText: '#EDE4F5',
        },
      },
      github: {
        label: 'GitHub',
        light: {
          bg: '#FFFFFF', bgBase: '#FFFFFF', bgLayer2: '#F6F8FA', bgLayer3: '#EFF3F6',
          labelPrimary: '#1F2328', labelSecondary: '#59636E', labelTertiary: '#8D959E', labelCaption: '#59636E',
          brandPrimary: '#0969DA', brandText: '#0969DA',
          borderL1: 'rgba(31, 35, 40, 0.06)', borderL2: 'rgba(31, 35, 40, 0.10)', borderL3: 'rgba(31, 35, 40, 0.14)',
          inlineCodeBg: '#EFF1F3', codeBlockBg: '#F6F8FA', codeBannerBg: '#EFF3F6',
          strong: '#CF222E', em: '#9A6700', math: '#8250DF', inlineCodeText: '#8250DF',
          heading: ['#CF222E', '#BC4C00', '#1A7F37', '#0969DA', '#8250DF', '#1F2328'],
          blockquoteDot: '000000', toastBg: '#FFFFFF', toastText: '#1F2328',
        },
        dark: {
          bg: '#0D1117', bgBase: '#0D1117', bgLayer1: '#0D1117', bgLayer2: '#161B22', bgLayer3: '#21262D',
          labelPrimary: '#E6EDF3', labelSecondary: '#9198A1', labelTertiary: '#7D8590', labelCaption: '#9198A1',
          brandPrimary: '#4493F8', brandText: '#4493F8',
          borderL1: 'rgba(230, 237, 243, 0.06)', borderL2: 'rgba(230, 237, 243, 0.10)', borderL3: 'rgba(230, 237, 243, 0.14)',
          inlineCodeBg: '#21262D', codeBlockBg: '#161B22', codeBannerBg: '#21262D',
          strong: '#FF7B72', em: '#D29922', math: '#A371F7', inlineCodeText: '#79C0FF',
          heading: ['#FF7B72', '#FFA657', '#7EE787', '#79C0FF', '#A371F7', '#9198A1'],
          blockquoteDot: 'ffffff', toastBg: '#21262D', toastText: '#E6EDF3',
        },
      },
      'atom-one': {
        label: 'Atom One',
        light: {
          bg: '#FAFAFA', bgBase: '#FAFAFA', bgLayer2: '#F0F0F1', bgLayer3: '#E5E5E6',
          labelPrimary: '#383A42', labelSecondary: '#696C77', labelTertiary: '#A0A1A7', labelCaption: '#696C77',
          brandPrimary: '#4078F2', brandText: '#4078F2',
          borderL1: 'rgba(56, 58, 66, 0.06)', borderL2: 'rgba(56, 58, 66, 0.10)', borderL3: 'rgba(56, 58, 66, 0.14)',
          inlineCodeBg: '#F0F0F1', codeBlockBg: '#F5F5F6', codeBannerBg: '#E8E8EA',
          strong: '#E45649', em: '#C18401', math: '#4078F2', inlineCodeText: '#A626A4',
          heading: ['#E45649', '#C18401', '#986801', '#50A14F', '#4078F2', '#A626A4'],
          blockquoteDot: '000000', toastBg: '#FFFFFF', toastText: '#383A42',
        },
        dark: {
          bg: '#282C34', bgBase: '#282C34', bgLayer1: '#282C34', bgLayer2: '#2C313A', bgLayer3: '#353B45',
          labelPrimary: '#ABB2BF', labelSecondary: '#7F848E', labelTertiary: '#5C6370', labelCaption: '#7F848E',
          brandPrimary: '#61AFEF', brandText: '#61AFEF',
          borderL1: 'rgba(171, 178, 191, 0.06)', borderL2: 'rgba(171, 178, 191, 0.10)', borderL3: 'rgba(171, 178, 191, 0.14)',
          inlineCodeBg: '#353B45', codeBlockBg: '#21252B', codeBannerBg: '#2C313A',
          strong: '#E06C75', em: '#D19A66', math: '#61AFEF', inlineCodeText: '#98C379',
          heading: ['#E06C75', '#D19A66', '#E5C07B', '#98C379', '#61AFEF', '#C678DD'],
          blockquoteDot: 'ffffff', toastBg: '#2C313A', toastText: '#ABB2BF',
        },
      },
    }

    // ===== prefs =====
    const STORAGE_KEY = 'dsh-custom-skin.v1'
    const STYLE_ID = 'dsh-custom-skin-style'
    const THEME_SOURCE = 'custom-skin'

    const DEFAULTS = {
      uiFont: '"OPPO Sans 4.0", "Microsoft YaHei", sans-serif',
      codeFont: '"Geist Mono", "Fira Code", Consolas, monospace',
      // 'default' = keep the DSH theme untouched
      theme: 'github',
    }

    function loadPrefs() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return { ...DEFAULTS }
        return { ...DEFAULTS, ...JSON.parse(raw) }
      } catch {
        return { ...DEFAULTS }
      }
    }

    function savePrefs(prefs) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
      } catch {
        /* ignore quota */
      }
    }

    // ===== token layer for the active palette =====
    // Only tokens that exist in this DSH build are emitted (see the Theme
    // inspect provider); --dsw-alias-bg-layer-3, --dsw-alias-label-tertiary,
    // --dsw-alias-markdown-* and friends are not present in 0.1.1-rc.2.
    function buildTokens(p) {
      const L = p.light
      const D = p.dark
      return {
        '--dsw-alias-bg-base': { light: L.bgBase, dark: D.bgBase },
        '--dsw-alias-bg-layer-1': { light: L.bgLayer1 || L.bgBase, dark: D.bgLayer1 || D.bgBase },
        '--dsw-alias-bg-layer-2': { light: L.bgLayer2, dark: D.bgLayer2 },
        '--dsw-alias-bg-overlay': { light: L.toastBg, dark: D.toastBg },
        '--dsw-alias-border-l1': { light: L.borderL1, dark: D.borderL1 },
        '--dsw-alias-border-l2': { light: L.borderL2, dark: D.borderL2 },
        '--dsw-alias-brand-primary': { light: L.brandPrimary, dark: D.brandPrimary },
        '--dsw-alias-label-primary': { light: L.labelPrimary, dark: D.labelPrimary },
        '--dsw-alias-label-secondary': { light: L.labelSecondary, dark: D.labelSecondary },
        '--dsw-specific-sidebar-fill': { light: L.bg, dark: D.bg },
      }
    }

    // ===== real horizontal-scrollbar height =====
    // DSH gives wide markdown tables (.md-table-wide) a horizontal scrollbar
    // that only appears on hover, and reserves space for it with
    // `padding-bottom: var(--dsh-scrollbar-width, 8px)`. The variable is never
    // defined by the DSH build, so the 8px fallback always applies — on
    // systems with classic scrollbars (Windows ~15-17px) hovering the table
    // grows it by (real - 8)px and the page jitters between two heights.
    // We measure the real height once and publish it as the token, so the
    // reserved space equals the scrollbar and hover changes nothing.
    let scrollbarSize = null
    function measuredScrollbarSize() {
      if (scrollbarSize !== null) return scrollbarSize
      scrollbarSize = 0 // overlay scrollbars (macOS etc.) take no space
      try {
        const probe = document.createElement('div')
        probe.style.cssText = 'position:absolute;top:-9999px;left:0;width:100px;height:100px;overflow-x:scroll;white-space:nowrap;visibility:hidden'
        probe.textContent = 'x'.repeat(200)
        document.body.appendChild(probe)
        scrollbarSize = probe.offsetHeight - probe.clientHeight
        probe.remove()
      } catch (e) {
        /* keep 0; DSH's own fallback still applies */
      }
      return scrollbarSize
    }

    // ===== markdown polish CSS (same selectors as the DSH build) =====
    function buildCss(p) {
      const L = p.light
      const D = p.dark
      const md = '[class*="_markdown_"]'
      const lines = []
      // (--dsh-scrollbar-width is published unconditionally in applySkin, not
      // here, so the jitter fix also works with the default DSH theme.)
      lines.push(md + ' :where(h1,h2,h3,h4,h5,h6) { border-left: none !important; padding-left: 16px !important; position: relative; }')
      lines.push(md + ' :where(h1,h2,h3,h4,h5,h6)::before { content: ""; position: absolute; left: 0; top: 4px; bottom: 4px; width: 4px; border-radius: 4px; }')
      for (let i = 0; i < 6; i++) {
        lines.push(md + ` h${i + 1}::before { background: ${L.heading[i]}; }`)
        lines.push(`body[data-ds-dark-theme] ${md} h${i + 1}::before { background: ${D.heading[i]}; }`)
      }
      lines.push(md + ' strong { color: ' + L.strong + ' !important; }')
      lines.push('body[data-ds-dark-theme] ' + md + ' strong { color: ' + D.strong + ' !important; }')
      lines.push(md + ' em { color: ' + L.em + ' !important; }')
      lines.push('body[data-ds-dark-theme] ' + md + ' em { color: ' + D.em + ' !important; }')
      lines.push(md + ' .katex, ' + md + ' .katex * { color: ' + L.math + ' !important; }')
      lines.push('body[data-ds-dark-theme] ' + md + ' .katex, body[data-ds-dark-theme] ' + md + ' .katex * { color: ' + D.math + ' !important; }')
      lines.push(md + ' :not(pre)>code { color: ' + L.inlineCodeText + ' !important; }')
      lines.push('body[data-ds-dark-theme] ' + md + ' :not(pre)>code { color: ' + D.inlineCodeText + ' !important; }')
      lines.push(md + ' blockquote { border-left: none !important; border-radius: 6px; position: relative; background-image: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\' viewBox=\'0 0 4 4\'%3E%3Cpath fill=\'%23' + L.blockquoteDot + '\' fill-opacity=\'0.12\' d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\'%3E%3C/path%3E%3C/svg%3E"); }')
      lines.push('body[data-ds-dark-theme] ' + md + ' blockquote { background-image: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\' viewBox=\'0 0 4 4\'%3E%3Cpath fill=\'%23' + D.blockquoteDot + '\' fill-opacity=\'0.12\' d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\'%3E%3C/path%3E%3C/svg%3E"); }')
      lines.push(md + ' blockquote blockquote { background-image: none !important; }')
      lines.push(md + ' blockquote::before { content: ""; position: absolute; left: 0; top: 8px; bottom: 8px; width: 4px; border-radius: 4px; background: var(--dsw-alias-brand-primary); }')
      return lines.join('\n')
    }

    // ===== apply skin (fonts + theme) =====
    let styleEl = null
    let tokenDisposer = null
    let appliedTheme = null

    function applySkin(ctx, prefs) {
      if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.id = STYLE_ID
        styleEl.setAttribute('data-plugin', 'custom-skin')
        document.documentElement.appendChild(styleEl)
      }

      const parts = []
      const fontLines = []
      const ui = (prefs.uiFont || '').trim()
      const code = (prefs.codeFont || '').trim()
      if (ui) fontLines.push(`  --dsw-font-family: ${ui};`)
      if (code) fontLines.push(`  --ds-font-family-code: ${code};`)
      if (fontLines.length) parts.push(`:root, body {\n${fontLines.join('\n')}\n}`)

      // Jitter fix (theme-independent, see measuredScrollbarSize above):
      // DSH's .md-table-wide reserves padding-bottom via
      // var(--dsh-scrollbar-width, 8px) and shows the real horizontal
      // scrollbar only on hover; publishing the measured real size makes the
      // wrapper height identical in both states. Must be emitted even when no
      // color theme is selected, otherwise the 8px fallback stays in effect
      // and the table still grows on hover.
      parts.push(`:root { --dsh-scrollbar-width: ${measuredScrollbarSize()}px; }`)

      const theme = ctx && (ctx.theme || (typeof ctx.get === 'function' && ctx.get('theme')))
      const pal = THEMES[prefs.theme]
      if (pal) {
        if (appliedTheme !== prefs.theme && theme && typeof theme.overrideTokens === 'function') {
          try {
            if (tokenDisposer) { tokenDisposer(); tokenDisposer = null }
            tokenDisposer = theme.overrideTokens(THEME_SOURCE, buildTokens(pal))
          } catch (e) {
            console.warn('[dsh-custom-skin] theme override failed', e)
          }
        }
        parts.push(buildCss(pal))
        appliedTheme = prefs.theme
      } else if (appliedTheme !== 'default') {
        // switch back to the plain DSH theme
        if (tokenDisposer) { tokenDisposer(); tokenDisposer = null }
        if (theme && typeof theme.overrideTokens === 'function') {
          try { theme.overrideTokens(THEME_SOURCE, {}) } catch (e) { console.warn('[dsh-custom-skin] theme clear failed', e) }
        }
        appliedTheme = 'default'
      }

      styleEl.textContent = parts.join('\n')
    }

    // ===== settings panel =====
    function makePanel(React, ctx) {
      const { useState, useEffect, createElement: h } = React

      const fieldStyle = {
        padding: '6px 10px',
        borderRadius: 6,
        border: '1px solid var(--dsw-alias-border-l2, #ccc)',
        background: 'var(--dsw-alias-bg-layer-1, transparent)',
        color: 'inherit',
        fontFamily: 'inherit',
        fontSize: 13,
      }

      function Field({ label, value, onChange, placeholder }) {
        return h(
          'label',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              marginBottom: 12,
              fontSize: 13,
            },
          },
          h('span', { style: { opacity: 0.75 } }, label),
          h('input', {
            type: 'text',
            value: value ?? '',
            placeholder: placeholder || '',
            onChange: (e) => onChange(e.target.value),
            style: fieldStyle,
          }),
        )
      }

      return function Panel() {
        const [prefs, setPrefs] = useState(() => loadPrefs())

        useEffect(() => {
          applySkin(ctx, prefs)
          savePrefs(prefs)
        }, [prefs])

        const set = (key) => (val) => setPrefs((p) => ({ ...p, [key]: val }))

        const themeOptions = [
          h('option', { key: 'default', value: 'default' }, 'Default (DSH theme)'),
          ...Object.keys(THEMES).map((id) =>
            h('option', { key: id, value: id }, THEMES[id].label)),
        ]

        return h(
          'div',
          { style: { padding: '8px 0', maxWidth: 480 } },
          h('p', { style: { margin: '0 0 12px', opacity: 0.7, fontSize: 12 } },
            'Pick a color theme or keep the default DSH theme. Font names must be installed on this machine. Changes apply immediately.'),
          h(Field, {
            label: 'UI font',
            value: prefs.uiFont,
            onChange: set('uiFont'),
            placeholder: '"OPPO Sans 4.0", "Microsoft YaHei", sans-serif',
          }),
          h(Field, {
            label: 'Code font',
            value: prefs.codeFont,
            onChange: set('codeFont'),
            placeholder: '"Geist Mono", "Fira Code", Consolas, monospace',
          }),
          h(
            'label',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                marginBottom: 12,
                fontSize: 13,
              },
            },
            h('span', { style: { opacity: 0.75 } }, 'Color theme'),
            h('select', {
              value: prefs.theme,
              onChange: (e) => set('theme')(e.target.value),
              style: { ...fieldStyle, cursor: 'pointer' },
            }, themeOptions),
          ),
          h(
            'button',
            {
              type: 'button',
              onClick: () => setPrefs({ ...DEFAULTS }),
              style: {
                marginTop: 4,
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid var(--dsw-alias-border-l2, #ccc)',
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: 13,
              },
            },
            'Reset to defaults',
          ),
        )
      }
    }

    // ===== plugin entry =====
    // NOTE: the plugin object's inject must be SERVICE KEYS (slots/theme…);
    // package.json's dsh.client.inject uses package names (boot manifest only).
    const name = 'custom-skin'
    const inject = ['slots', 'theme']

    function apply(ctx) {
      const prefs = loadPrefs()
      applySkin(ctx, prefs)

      // cleanup on plugin unload
      ctx.effect(() => () => {
        if (tokenDisposer) { tokenDisposer(); tokenDisposer = null }
        if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl)
        styleEl = null
      })

      let React = null
      try {
        React = require('react')
      } catch {
        /* optional */
      }

      if (!React || !ctx.slots || typeof ctx.slots.inject !== 'function') return

      try {
        const Panel = makePanel(React, ctx)
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'custom-skin',
          order: 45,
          label: 'Custom Skin',
          inject: () => ({}),
        }, Panel))
      } catch (e) {
        console.warn('[dsh-custom-skin] settings.section registration failed', e)
      }
    }

    module.exports = { name, inject, apply }
    return module.exports
  },
})
