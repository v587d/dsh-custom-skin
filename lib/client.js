/**
 * dsh-custom-skin — browser half
 *
 * DSH loads client bundles as classic <script> files, so this file must be a
 * single classic script: no top-level export/import, register only through
 * window.__ModuleLoader__.load({ id, factory }). The id must equal the package
 * name, otherwise the boot manifest never hands this module to the loader.
 *
 * - Fonts: override --dsw-font-family (UI) and --ds-font-family-code (code).
 * - Colors: palettes applied through ctx.theme.overrideTokens('custom-skin', ...)
 *   with light/dark pairs, plus markdown polish CSS on the same selectors the
 *   build uses ([class*="_markdown_"], body[data-ds-dark-theme]).
 * - Values live in the profile document: the host half (lib/index.js) declares
 *   the Config schema and dsh-settings projects it into a form namespace keyed
 *   by the entry id. The card writes through ctx.configForms, exactly like
 *   dsh-context and @v587d/capital-generation do.
 * - localStorage is only a first-paint cache: the form snapshot arrives after
 *   boot, so without it a reload would flash the default theme for a moment.
 *   The Host is the only authority on what is stored.
 */

window.__ModuleLoader__.load({
  id: 'dsh-custom-skin',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports

    // Filled in apply() from the primitives bundle; the card is the only
    // consumer, and an unavailable primitives bundle means no card (the skin
    // itself needs nothing from it).
    let SettingsForm = null
    let SettingsFormModel = null
    let SettingsValueField = null
    let settingsTextField = null

    // ===== theme palettes =====
    // Every field here is read by something: buildTokens() maps the ten alias
    // tokens plus the four 0.2.0 state tokens, buildCss() maps the markdown
    // accents, and the card's swatches show bg / bgLayer2 / brandPrimary /
    // heading[0]. Colors come from each scheme's own published table — the
    // source per palette is in README.md.
    const THEMES = {
      border: {
        label: 'Border',
        light: {
          bg: '#F9F6F4', bgBase: '#F9F6F4', bgLayer2: '#F2E0E4', toastBg: '#FFFFFF',
          labelPrimary: '#4A4348', labelSecondary: '#8B7F88', brandPrimary: '#793F82',
          borderL1: 'rgba(74, 67, 72, 0.06)', borderL2: 'rgba(74, 67, 72, 0.10)',
          strong: 'hsl(350, 80%, 55%)', em: 'hsl(28, 80%, 50%)', math: '#1A6FB5', inlineCodeText: '#DD1399',
          heading: ['#BD5151', '#C77B23', '#478F14', '#0585A8', '#726293', '#127D52'],
          blockquoteDot: '000000',
          state: { error: 'hsl(350, 80%, 55%)', warn: 'hsl(28, 80%, 50%)', success: '#478F14', idle: '#A9A0A6' },
        },
        dark: {
          bg: '#27282E', bgBase: '#27282E', bgLayer2: '#2D2E34', toastBg: '#2D2E34',
          labelPrimary: 'hsl(232, 6%, 88%)', labelSecondary: 'hsl(232, 9%, 64%)', brandPrimary: 'hsl(232, 70%, 65%)',
          borderL1: 'rgba(255, 255, 255, 0.06)', borderL2: 'rgba(255, 255, 255, 0.10)',
          strong: '#FF7881', em: '#FBBB83', math: '#8DD3F6', inlineCodeText: '#F2B6DE',
          heading: ['#D18989', '#CEA38D', '#93C89C', '#7EB8F1', '#BAB3EF', '#7EC8C5'],
          blockquoteDot: 'ffffff',
          state: { error: '#FF7881', warn: '#FBBB83', success: '#93C89C', idle: 'hsl(232, 12%, 48%)' },
        },
      },
      nord: {
        label: 'Nord',
        light: {
          bg: '#ECEFF4', bgBase: '#ECEFF4', bgLayer2: '#E5E9F0', toastBg: '#FFFFFF',
          labelPrimary: '#2E3440', labelSecondary: '#4C566A', brandPrimary: '#5E81AC',
          borderL1: 'rgba(46, 52, 64, 0.06)', borderL2: 'rgba(46, 52, 64, 0.10)',
          strong: '#BF616A', em: '#D08770', math: '#5E81AC', inlineCodeText: '#5E81AC',
          heading: ['#BF616A', '#D08770', '#A88B3F', '#7FA46B', '#5E81AC', '#8E6F9E'],
          blockquoteDot: '000000',
          state: { error: '#BF616A', warn: '#D08770', success: '#7FA46B', idle: '#7B88A1' },
        },
        dark: {
          bg: '#2E3440', bgBase: '#2E3440', bgLayer2: '#3B4252', toastBg: '#3B4252',
          labelPrimary: '#ECEFF4', labelSecondary: '#D8DEE9', brandPrimary: '#88C0D0',
          borderL1: 'rgba(216, 222, 233, 0.06)', borderL2: 'rgba(216, 222, 233, 0.10)',
          strong: '#BF616A', em: '#D08770', math: '#88C0D0', inlineCodeText: '#8FBCBB',
          heading: ['#BF616A', '#D08770', '#EBCB8B', '#A3BE8C', '#88C0D0', '#B48EAD'],
          blockquoteDot: 'ffffff',
          state: { error: '#BF616A', warn: '#D08770', success: '#A3BE8C', idle: '#7B88A1' },
        },
      },
      twilight: {
        label: 'Twilight',
        light: {
          bg: '#F7F3FB', bgBase: '#F7F3FB', bgLayer2: '#EDE4F5', toastBg: '#FFFFFF',
          labelPrimary: '#3D2E4F', labelSecondary: '#6E5C82', brandPrimary: '#8B5CF6',
          borderL1: 'rgba(61, 46, 79, 0.06)', borderL2: 'rgba(61, 46, 79, 0.10)',
          strong: '#DB2777', em: '#D97706', math: '#6D28D9', inlineCodeText: '#8B5CF6',
          heading: ['#DB2777', '#D97706', '#A16207', '#059669', '#2563EB', '#7C3AED'],
          blockquoteDot: '000000',
          state: { error: '#DB2777', warn: '#D97706', success: '#059669', idle: '#9C8AB0' },
        },
        dark: {
          bg: '#1A1124', bgBase: '#1A1124', bgLayer2: '#241736', toastBg: '#241736',
          labelPrimary: '#EDE4F5', labelSecondary: '#B9A6CC', brandPrimary: '#C084FC',
          borderL1: 'rgba(237, 228, 245, 0.06)', borderL2: 'rgba(237, 228, 245, 0.10)',
          strong: '#FF79C6', em: '#FFD866', math: '#82AAFF', inlineCodeText: '#C084FC',
          heading: ['#FF79C6', '#FFB86C', '#F1FA8C', '#50FA7B', '#8BE9FD', '#BD93F9'],
          blockquoteDot: 'ffffff',
          state: { error: '#FF79C6', warn: '#FFD866', success: '#50FA7B', idle: '#7E6C96' },
        },
      },
      github: {
        label: 'GitHub',
        light: {
          bg: '#FFFFFF', bgBase: '#FFFFFF', bgLayer2: '#F6F8FA', toastBg: '#FFFFFF',
          labelPrimary: '#1F2328', labelSecondary: '#59636E', brandPrimary: '#0969DA',
          borderL1: 'rgba(31, 35, 40, 0.06)', borderL2: 'rgba(31, 35, 40, 0.10)',
          strong: '#CF222E', em: '#9A6700', math: '#8250DF', inlineCodeText: '#8250DF',
          heading: ['#CF222E', '#BC4C00', '#1A7F37', '#0969DA', '#8250DF', '#1F2328'],
          blockquoteDot: '000000',
          state: { error: '#CF222E', warn: '#9A6700', success: '#1A7F37', idle: '#8D959E' },
        },
        dark: {
          bg: '#0D1117', bgBase: '#0D1117', bgLayer2: '#161B22', toastBg: '#21262D',
          labelPrimary: '#E6EDF3', labelSecondary: '#9198A1', brandPrimary: '#4493F8',
          borderL1: 'rgba(230, 237, 243, 0.06)', borderL2: 'rgba(230, 237, 243, 0.10)',
          strong: '#FF7B72', em: '#D29922', math: '#A371F7', inlineCodeText: '#79C0FF',
          heading: ['#FF7B72', '#FFA657', '#7EE787', '#79C0FF', '#A371F7', '#9198A1'],
          blockquoteDot: 'ffffff',
          state: { error: '#FF7B72', warn: '#D29922', success: '#7EE787', idle: '#7D8590' },
        },
      },
      'atom-one': {
        label: 'Atom One',
        light: {
          bg: '#FAFAFA', bgBase: '#FAFAFA', bgLayer2: '#F0F0F1', toastBg: '#FFFFFF',
          labelPrimary: '#383A42', labelSecondary: '#696C77', brandPrimary: '#4078F2',
          borderL1: 'rgba(56, 58, 66, 0.06)', borderL2: 'rgba(56, 58, 66, 0.10)',
          strong: '#E45649', em: '#C18401', math: '#4078F2', inlineCodeText: '#A626A4',
          heading: ['#E45649', '#C18401', '#986801', '#50A14F', '#4078F2', '#A626A4'],
          blockquoteDot: '000000',
          state: { error: '#E45649', warn: '#C18401', success: '#50A14F', idle: '#A0A1A7' },
        },
        dark: {
          bg: '#282C34', bgBase: '#282C34', bgLayer2: '#2C313A', toastBg: '#2C313A',
          labelPrimary: '#ABB2BF', labelSecondary: '#7F848E', brandPrimary: '#61AFEF',
          borderL1: 'rgba(171, 178, 191, 0.06)', borderL2: 'rgba(171, 178, 191, 0.10)',
          strong: '#E06C75', em: '#D19A66', math: '#61AFEF', inlineCodeText: '#98C379',
          heading: ['#E06C75', '#D19A66', '#E5C07B', '#98C379', '#61AFEF', '#C678DD'],
          blockquoteDot: 'ffffff',
          state: { error: '#E06C75', warn: '#D19A66', success: '#98C379', idle: '#5C6370' },
        },
      },
      catppuccin: {
        label: 'Catppuccin',
        light: {
          bg: '#EFF1F5', bgBase: '#EFF1F5', bgLayer2: '#CCD0DA', toastBg: '#E6E9EF',
          labelPrimary: '#4C4F69', labelSecondary: '#5C5F77', brandPrimary: '#8839EF',
          borderL1: 'rgba(76, 79, 105, 0.06)', borderL2: 'rgba(76, 79, 105, 0.10)',
          strong: '#D20F39', em: '#FE640B', math: '#1E66F5', inlineCodeText: '#8839EF',
          heading: ['#D20F39', '#FE640B', '#DF8E1D', '#40A02B', '#1E66F5', '#8839EF'],
          blockquoteDot: '000000',
          state: { error: '#D20F39', warn: '#DF8E1D', success: '#40A02B', idle: '#8C8FA1' },
        },
        dark: {
          bg: '#1E1E2E', bgBase: '#1E1E2E', bgLayer2: '#313244', toastBg: '#313244',
          labelPrimary: '#CDD6F4', labelSecondary: '#BAC2DE', brandPrimary: '#CBA6F7',
          borderL1: 'rgba(205, 214, 244, 0.06)', borderL2: 'rgba(205, 214, 244, 0.10)',
          strong: '#F38BA8', em: '#FAB387', math: '#89B4FA', inlineCodeText: '#F5C2E7',
          heading: ['#F38BA8', '#FAB387', '#F9E2AF', '#A6E3A1', '#89B4FA', '#CBA6F7'],
          blockquoteDot: 'ffffff',
          state: { error: '#F38BA8', warn: '#F9E2AF', success: '#A6E3A1', idle: '#7F849C' },
        },
      },
      'tokyo-night': {
        label: 'Tokyo Night',
        light: {
          bg: '#E1E2E7', bgBase: '#E1E2E7', bgLayer2: '#C4C8DA', toastBg: '#D0D5E3',
          labelPrimary: '#3760BF', labelSecondary: '#6172B0', brandPrimary: '#2E7DE9',
          borderL1: 'rgba(55, 96, 191, 0.06)', borderL2: 'rgba(55, 96, 191, 0.10)',
          strong: '#F52A65', em: '#B15C00', math: '#007197', inlineCodeText: '#7847BD',
          heading: ['#F52A65', '#B15C00', '#8C6C3E', '#587539', '#2E7DE9', '#7847BD'],
          blockquoteDot: '000000',
          state: { error: '#F52A65', warn: '#8C6C3E', success: '#587539', idle: '#848CB5' },
        },
        dark: {
          bg: '#1A1B26', bgBase: '#1A1B26', bgLayer2: '#292E42', toastBg: '#292E42',
          labelPrimary: '#C0CAF5', labelSecondary: '#A9B1D6', brandPrimary: '#7AA2F7',
          borderL1: 'rgba(192, 202, 245, 0.06)', borderL2: 'rgba(192, 202, 245, 0.10)',
          strong: '#F7768E', em: '#FF9E64', math: '#7DCFFF', inlineCodeText: '#9D7CD8',
          heading: ['#F7768E', '#FF9E64', '#E0AF68', '#9ECE6A', '#7AA2F7', '#9D7CD8'],
          blockquoteDot: 'ffffff',
          state: { error: '#F7768E', warn: '#E0AF68', success: '#9ECE6A', idle: '#565F89' },
        },
      },
      'rose-pine': {
        label: 'Rosé Pine',
        light: {
          bg: '#FAF4ED', bgBase: '#FAF4ED', bgLayer2: '#F2E9E1', toastBg: '#FFFAF3',
          labelPrimary: '#575279', labelSecondary: '#797593', brandPrimary: '#907AA9',
          borderL1: 'rgba(87, 82, 121, 0.06)', borderL2: 'rgba(87, 82, 121, 0.10)',
          strong: '#B4637A', em: '#D7827E', math: '#286983', inlineCodeText: '#907AA9',
          heading: ['#B4637A', '#D7827E', '#EA9D34', '#286983', '#56949F', '#907AA9'],
          blockquoteDot: '000000',
          state: { error: '#B4637A', warn: '#EA9D34', success: '#56949F', idle: '#9893A5' },
        },
        dark: {
          bg: '#232136', bgBase: '#232136', bgLayer2: '#393552', toastBg: '#2A273F',
          labelPrimary: '#E0DEF4', labelSecondary: '#908CAA', brandPrimary: '#C4A7E7',
          borderL1: 'rgba(224, 222, 244, 0.06)', borderL2: 'rgba(224, 222, 244, 0.10)',
          strong: '#EB6F92', em: '#EA9A97', math: '#9CCFD8', inlineCodeText: '#C4A7E7',
          heading: ['#EB6F92', '#EA9A97', '#F6C177', '#3E8FB0', '#9CCFD8', '#C4A7E7'],
          blockquoteDot: 'ffffff',
          state: { error: '#EB6F92', warn: '#F6C177', success: '#9CCFD8', idle: '#908CAA' },
        },
      },
      gruvbox: {
        label: 'Gruvbox',
        light: {
          bg: '#FBF1C7', bgBase: '#FBF1C7', bgLayer2: '#EBDBB2', toastBg: '#F2E5BC',
          labelPrimary: '#3C3836', labelSecondary: '#504945', brandPrimary: '#076678',
          borderL1: 'rgba(60, 56, 54, 0.06)', borderL2: 'rgba(60, 56, 54, 0.10)',
          strong: '#9D0006', em: '#AF3A03', math: '#076678', inlineCodeText: '#8F3F71',
          heading: ['#9D0006', '#AF3A03', '#B57614', '#79740E', '#076678', '#8F3F71'],
          blockquoteDot: '000000',
          state: { error: '#9D0006', warn: '#B57614', success: '#79740E', idle: '#7C6F64' },
        },
        dark: {
          bg: '#282828', bgBase: '#282828', bgLayer2: '#3C3836', toastBg: '#504945',
          labelPrimary: '#EBDBB2', labelSecondary: '#D5C4A1', brandPrimary: '#FABD2F',
          borderL1: 'rgba(235, 219, 178, 0.06)', borderL2: 'rgba(235, 219, 178, 0.10)',
          strong: '#FB4934', em: '#FE8019', math: '#83A598', inlineCodeText: '#D3869B',
          heading: ['#FB4934', '#FE8019', '#FABD2F', '#B8BB26', '#83A598', '#D3869B'],
          blockquoteDot: 'ffffff',
          state: { error: '#FB4934', warn: '#FABD2F', success: '#B8BB26', idle: '#7C6F64' },
        },
      },
      everforest: {
        label: 'Everforest',
        light: {
          bg: '#FDF6E3', bgBase: '#FDF6E3', bgLayer2: '#EFEBD4', toastBg: '#F4F0D9',
          labelPrimary: '#5C6A72', labelSecondary: '#829181', brandPrimary: '#8DA101',
          borderL1: 'rgba(92, 106, 114, 0.06)', borderL2: 'rgba(92, 106, 114, 0.10)',
          strong: '#F85552', em: '#F57D26', math: '#3A94C5', inlineCodeText: '#DF69BA',
          heading: ['#F85552', '#F57D26', '#DFA000', '#8DA101', '#3A94C5', '#DF69BA'],
          blockquoteDot: '000000',
          state: { error: '#F85552', warn: '#DFA000', success: '#8DA101', idle: '#A6B0A0' },
        },
        dark: {
          bg: '#2D353B', bgBase: '#2D353B', bgLayer2: '#3D484D', toastBg: '#343F44',
          labelPrimary: '#D3C6AA', labelSecondary: '#9DA9A0', brandPrimary: '#A7C080',
          borderL1: 'rgba(211, 198, 170, 0.06)', borderL2: 'rgba(211, 198, 170, 0.10)',
          strong: '#E67E80', em: '#E69875', math: '#7FBBB3', inlineCodeText: '#D699B6',
          heading: ['#E67E80', '#E69875', '#DBBC7F', '#A7C080', '#7FBBB3', '#D699B6'],
          blockquoteDot: 'ffffff',
          state: { error: '#E67E80', warn: '#DBBC7F', success: '#A7C080', idle: '#7A8478' },
        },
      },
      solarized: {
        label: 'Solarized',
        light: {
          bg: '#FDF6E3', bgBase: '#FDF6E3', bgLayer2: '#EEE8D5', toastBg: '#EEE8D5',
          labelPrimary: '#586E75', labelSecondary: '#657B83', brandPrimary: '#268BD2',
          borderL1: 'rgba(88, 110, 117, 0.06)', borderL2: 'rgba(88, 110, 117, 0.10)',
          strong: '#DC322F', em: '#CB4B16', math: '#2AA198', inlineCodeText: '#D33682',
          heading: ['#DC322F', '#CB4B16', '#B58900', '#859900', '#268BD2', '#6C71C4'],
          blockquoteDot: '000000',
          state: { error: '#DC322F', warn: '#B58900', success: '#859900', idle: '#93A1A1' },
        },
        dark: {
          bg: '#002B36', bgBase: '#002B36', bgLayer2: '#073642', toastBg: '#073642',
          labelPrimary: '#93A1A1', labelSecondary: '#839496', brandPrimary: '#268BD2',
          borderL1: 'rgba(147, 161, 161, 0.06)', borderL2: 'rgba(147, 161, 161, 0.10)',
          strong: '#DC322F', em: '#CB4B16', math: '#2AA198', inlineCodeText: '#D33682',
          heading: ['#DC322F', '#CB4B16', '#B58900', '#859900', '#268BD2', '#6C71C4'],
          blockquoteDot: 'ffffff',
          state: { error: '#DC322F', warn: '#B58900', success: '#859900', idle: '#586E75' },
        },
      },
      kanagawa: {
        label: 'Kanagawa',
        light: {
          bg: '#F2ECBC', bgBase: '#F2ECBC', bgLayer2: '#E7DBA0', toastBg: '#E4D794',
          labelPrimary: '#545464', labelSecondary: '#8A8980', brandPrimary: '#4D699B',
          borderL1: 'rgba(84, 84, 100, 0.06)', borderL2: 'rgba(84, 84, 100, 0.10)',
          strong: '#C84053', em: '#CC6D00', math: '#597B75', inlineCodeText: '#624C83',
          heading: ['#C84053', '#CC6D00', '#77713F', '#6F894E', '#4D699B', '#624C83'],
          blockquoteDot: '000000',
          state: { error: '#C84053', warn: '#DE9800', success: '#6F894E', idle: '#8A8980' },
        },
        dark: {
          bg: '#1F1F28', bgBase: '#1F1F28', bgLayer2: '#2A2A37', toastBg: '#363646',
          labelPrimary: '#DCD7BA', labelSecondary: '#C8C093', brandPrimary: '#7FB4CA',
          borderL1: 'rgba(220, 215, 186, 0.06)', borderL2: 'rgba(220, 215, 186, 0.10)',
          strong: '#E46876', em: '#FFA066', math: '#7AA89F', inlineCodeText: '#957FB8',
          heading: ['#E46876', '#FFA066', '#E6C384', '#98BB6C', '#7FB4CA', '#957FB8'],
          blockquoteDot: 'ffffff',
          state: { error: '#E82424', warn: '#FF9E3B', success: '#98BB6C', idle: '#727169' },
        },
      },
      ayu: {
        label: 'Ayu',
        light: {
          bg: '#FCFCFC', bgBase: '#FCFCFC', bgLayer2: '#F8F9FA', toastBg: '#FFFFFF',
          labelPrimary: '#5C6166', labelSecondary: '#828E9F', brandPrimary: '#FA8532',
          borderL1: 'rgba(92, 97, 102, 0.06)', borderL2: 'rgba(92, 97, 102, 0.10)',
          strong: '#E65050', em: '#EBA400', math: '#4CBF99', inlineCodeText: '#A37ACC',
          heading: ['#E65050', '#FA8532', '#EBA400', '#86B300', '#22A4E6', '#A37ACC'],
          blockquoteDot: '000000',
          state: { error: '#E65050', warn: '#EBA400', success: '#86B300', idle: '#828E9F' },
        },
        dark: {
          bg: '#0D1017', bgBase: '#0D1017', bgLayer2: '#10141C', toastBg: '#10141C',
          labelPrimary: '#BFBDB6', labelSecondary: '#5A6378', brandPrimary: '#FF8F40',
          borderL1: 'rgba(191, 189, 182, 0.06)', borderL2: 'rgba(191, 189, 182, 0.10)',
          strong: '#F07178', em: '#FFB454', math: '#95E6CB', inlineCodeText: '#D2A6FF',
          heading: ['#F07178', '#FF8F40', '#FFB454', '#AAD94C', '#59C2FF', '#D2A6FF'],
          blockquoteDot: 'ffffff',
          state: { error: '#D95757', warn: '#FFB454', success: '#AAD94C', idle: '#5A6378' },
        },
      },
      'night-owl': {
        label: 'Night Owl',
        light: {
          bg: '#FBFBFB', bgBase: '#FBFBFB', bgLayer2: '#F0F0F0', toastBg: '#FFFFFF',
          labelPrimary: '#403F53', labelSecondary: '#989FB1', brandPrimary: '#4876D6',
          borderL1: 'rgba(64, 63, 83, 0.06)', borderL2: 'rgba(64, 63, 83, 0.10)',
          strong: '#C96765', em: '#DAAA01', math: '#0C969B', inlineCodeText: '#994CC3',
          heading: ['#C96765', '#DAAA01', '#AA0982', '#0C969B', '#4876D6', '#994CC3'],
          blockquoteDot: '000000',
          state: { error: '#F76E6E', warn: '#DAAA01', success: '#0C969B', idle: '#989FB1' },
        },
        dark: {
          bg: '#011627', bgBase: '#011627', bgLayer2: '#1D3B53', toastBg: '#1D3B53',
          labelPrimary: '#D6DEEB', labelSecondary: '#637777', brandPrimary: '#82AAFF',
          borderL1: 'rgba(214, 222, 235, 0.06)', borderL2: 'rgba(214, 222, 235, 0.10)',
          strong: '#EF5350', em: '#F78C6C', math: '#7FDBCA', inlineCodeText: '#C792EA',
          heading: ['#EF5350', '#F78C6C', '#ECC48D', '#C5E478', '#82AAFF', '#C792EA'],
          blockquoteDot: 'ffffff',
          state: { error: '#EF5350', warn: '#B39554', success: '#C5E478', idle: '#637777' },
        },
      },
      modus: {
        label: 'Modus',
        light: {
          bg: '#FFFFFF', bgBase: '#FFFFFF', bgLayer2: '#F2F2F2', toastBg: '#FFFFFF',
          labelPrimary: '#000000', labelSecondary: '#595959', brandPrimary: '#0031A9',
          borderL1: 'rgba(0, 0, 0, 0.06)', borderL2: 'rgba(0, 0, 0, 0.10)',
          strong: '#A60000', em: '#884900', math: '#005E8B', inlineCodeText: '#721045',
          heading: ['#A60000', '#884900', '#6F5500', '#006800', '#0031A9', '#721045'],
          blockquoteDot: '000000',
          state: { error: '#A60000', warn: '#6F5500', success: '#006800', idle: '#595959' },
        },
        dark: {
          bg: '#000000', bgBase: '#000000', bgLayer2: '#1E1E1E', toastBg: '#1E1E1E',
          labelPrimary: '#FFFFFF', labelSecondary: '#989898', brandPrimary: '#2FAFFF',
          borderL1: 'rgba(255, 255, 255, 0.06)', borderL2: 'rgba(255, 255, 255, 0.10)',
          strong: '#FF5F59', em: '#FEC43F', math: '#00D3D0', inlineCodeText: '#FEACD0',
          heading: ['#FF5F59', '#FEC43F', '#D0BC00', '#44BC44', '#2FAFFF', '#FEACD0'],
          blockquoteDot: 'ffffff',
          state: { error: '#FF5F59', warn: '#D0BC00', success: '#44BC44', idle: '#989898' },
        },
      },
      dracula: {
        label: 'Dracula',
        // dark = Dracula OSS, light = Alucard (Dracula's official light variant)
        light: {
          bg: '#FFFBEB', bgBase: '#FFFBEB', bgLayer2: '#E2DECA', toastBg: '#CFCFDE',
          labelPrimary: '#1F1F1F', labelSecondary: '#6C664B', brandPrimary: '#A3144D',
          borderL1: 'rgba(31, 31, 31, 0.06)', borderL2: 'rgba(31, 31, 31, 0.10)',
          strong: '#CB3A2A', em: '#A34D14', math: '#036A96', inlineCodeText: '#644AC9',
          heading: ['#CB3A2A', '#A34D14', '#846E15', '#14710A', '#036A96', '#644AC9'],
          blockquoteDot: '000000',
          state: { error: '#CB3A2A', warn: '#A34D14', success: '#14710A', idle: '#6C664B' },
        },
        dark: {
          bg: '#21222C', bgBase: '#282A36', bgLayer2: '#44475A', toastBg: '#44475A',
          labelPrimary: '#F8F8F2', labelSecondary: '#6272A4', brandPrimary: '#FF79C6',
          borderL1: 'rgba(248, 248, 242, 0.06)', borderL2: 'rgba(248, 248, 242, 0.10)',
          strong: '#FF5555', em: '#FFB86C', math: '#8BE9FD', inlineCodeText: '#BD93F9',
          heading: ['#FF5555', '#FFB86C', '#F1FA8C', '#50FA7B', '#8BE9FD', '#BD93F9'],
          blockquoteDot: 'ffffff',
          state: { error: '#FF5555', warn: '#FFB86C', success: '#50FA7B', idle: '#6272A4' },
        },
      },
      monokai: {
        label: 'Monokai',
        light: {
          bg: '#FAFAFA', bgBase: '#FAFAFA', bgLayer2: '#E6E3C3', toastBg: '#CCC9AD',
          labelPrimary: '#49483E', labelSecondary: '#75715E', brandPrimary: '#0089B3',
          borderL1: 'rgba(73, 72, 62, 0.06)', borderL2: 'rgba(73, 72, 62, 0.10)',
          strong: '#F9005A', em: '#CF7000', math: '#0089B3', inlineCodeText: '#684D99',
          heading: ['#F9005A', '#CF7000', '#998F2F', '#679C00', '#0089B3', '#684D99'],
          blockquoteDot: '000000',
          state: { error: '#F9005A', warn: '#CF7000', success: '#679C00', idle: '#75715E' },
        },
        dark: {
          bg: '#272822', bgBase: '#272822', bgLayer2: '#3C3D37', toastBg: '#49483E',
          labelPrimary: '#F8F8F2', labelSecondary: '#75715E', brandPrimary: '#66D9EF',
          borderL1: 'rgba(248, 248, 242, 0.06)', borderL2: 'rgba(248, 248, 242, 0.10)',
          strong: '#F92672', em: '#FD971F', math: '#66D9EF', inlineCodeText: '#AE81FF',
          heading: ['#F92672', '#FD971F', '#E6DB74', '#A6E22E', '#66D9EF', '#AE81FF'],
          blockquoteDot: 'ffffff',
          state: { error: '#F92672', warn: '#FD971F', success: '#A6E22E', idle: '#75715E' },
        },
      },
      noctis: {
        label: 'Noctis',
        light: {
          bg: '#F9F1E1', bgBase: '#FEF8EC', bgLayer2: '#F0E9D6', toastBg: '#D2F3F9',
          labelPrimary: '#005661', labelSecondary: '#8CA6A6', brandPrimary: '#0095A8',
          borderL1: 'rgba(0, 86, 97, 0.06)', borderL2: 'rgba(0, 86, 97, 0.10)',
          strong: '#E64100', em: '#B3694D', math: '#0094F0', inlineCodeText: '#5842FF',
          heading: ['#E64100', '#FA8900', '#A88C00', '#00B368', '#0095A8', '#5842FF'],
          blockquoteDot: '000000',
          state: { error: '#FF530F', warn: '#A88C00', success: '#00B368', idle: '#8CA6A6' },
        },
        dark: {
          bg: '#041D20', bgBase: '#052529', bgLayer2: '#062E32', toastBg: '#0B515B',
          labelPrimary: '#B2CACD', labelSecondary: '#5B858B', brandPrimary: '#49D6E9',
          borderL1: 'rgba(178, 202, 205, 0.06)', borderL2: 'rgba(178, 202, 205, 0.10)',
          strong: '#DF769B', em: '#D67E5C', math: '#49ACE9', inlineCodeText: '#7060EB',
          heading: ['#E66533', '#D5971A', '#49E9A6', '#16A3B6', '#7060EB', '#DF769B'],
          blockquoteDot: 'ffffff',
          state: { error: '#E3541C', warn: '#D5971A', success: '#49E9A6', idle: '#5B858B' },
        },
      },
      material: {
        label: 'Material',
        light: {
          bg: '#FAFAFA', bgBase: '#FAFAFA', bgLayer2: '#EEEEEE', toastBg: '#EEEEEE',
          labelPrimary: '#263238', labelSecondary: '#90A4AE', brandPrimary: '#80CBC4',
          borderL1: 'rgba(38, 50, 56, 0.06)', borderL2: 'rgba(38, 50, 56, 0.10)',
          strong: '#E53935', em: '#F76D47', math: '#6182B8', inlineCodeText: '#9C3EDA',
          heading: ['#E53935', '#F76D47', '#E2931D', '#91B859', '#6182B8', '#9C3EDA'],
          blockquoteDot: '000000',
          state: { error: '#E53935', warn: '#E2931D', success: '#91B859', idle: '#90A4AE' },
        },
        dark: {
          bg: '#263238', bgBase: '#263238', bgLayer2: '#303C41', toastBg: '#303C41',
          labelPrimary: '#EEFFFF', labelSecondary: '#546E7A', brandPrimary: '#80CBC4',
          borderL1: 'rgba(238, 255, 255, 0.06)', borderL2: 'rgba(238, 255, 255, 0.10)',
          strong: '#F07178', em: '#F78C6C', math: '#82AAFF', inlineCodeText: '#C792EA',
          heading: ['#F07178', '#F78C6C', '#FFCB6B', '#C3E88D', '#82AAFF', '#C792EA'],
          blockquoteDot: 'ffffff',
          state: { error: '#F07178', warn: '#FFCB6B', success: '#C3E88D', idle: '#546E7A' },
        },
      },
      horizon: {
        label: 'Horizon',
        light: {
          bg: '#FDF0ED', bgBase: '#FDF0ED', bgLayer2: '#FADAD1', toastBg: '#F9CBBE',
          labelPrimary: '#06060C', labelSecondary: '#333333', brandPrimary: '#8A31B9',
          borderL1: 'rgba(6, 6, 12, 0.06)', borderL2: 'rgba(6, 6, 12, 0.10)',
          strong: '#DA103F', em: '#F6661E', math: '#1D8991', inlineCodeText: '#DC3318',
          heading: ['#DA103F', '#F77D26', '#F6661E', '#1D8991', '#8A31B9', '#DC3318'],
          blockquoteDot: '000000',
          state: { error: '#DA103F', warn: '#F77D26', success: '#07DA8C', idle: '#F9CEC3' },
        },
        dark: {
          bg: '#16161C', bgBase: '#1C1E26', bgLayer2: '#232530', toastBg: '#2E303E',
          labelPrimary: '#D5D8DA', labelSecondary: '#BBBBBB', brandPrimary: '#B877DB',
          borderL1: 'rgba(213, 216, 218, 0.06)', borderL2: 'rgba(213, 216, 218, 0.10)',
          strong: '#E95678', em: '#F09483', math: '#25B0BC', inlineCodeText: '#FAB795',
          heading: ['#E95678', '#F09483', '#FAB795', '#29D398', '#26BBD9', '#B877DB'],
          blockquoteDot: 'ffffff',
          state: { error: '#E95678', warn: '#FAB795', success: '#09F7A0', idle: '#6C6F93' },
        },
      },
      vitesse: {
        label: 'Vitesse',
        light: {
          bg: '#FFFFFF', bgBase: '#FFFFFF', bgLayer2: '#F1F0E9', toastBg: '#F1F0E9',
          labelPrimary: '#393A34', labelSecondary: '#A0ADA0', brandPrimary: '#1C6B48',
          borderL1: 'rgba(57, 58, 52, 0.06)', borderL2: 'rgba(57, 58, 52, 0.10)',
          strong: '#AB5959', em: '#A65E2B', math: '#296AA3', inlineCodeText: '#A13865',
          heading: ['#AB5959', '#A65E2B', '#BDA437', '#1E754F', '#296AA3', '#A13865'],
          blockquoteDot: '000000',
          state: { error: '#AB5959', warn: '#998418', success: '#1E754F', idle: '#A0ADA0' },
        },
        dark: {
          bg: '#121212', bgBase: '#121212', bgLayer2: '#222222', toastBg: '#222222',
          labelPrimary: '#DBD7CA', labelSecondary: '#758575', brandPrimary: '#4D9375',
          borderL1: 'rgba(219, 215, 202, 0.06)', borderL2: 'rgba(219, 215, 202, 0.10)',
          strong: '#CB7676', em: '#D4976C', math: '#6394BF', inlineCodeText: '#D9739F',
          heading: ['#CB7676', '#D4976C', '#E6CC77', '#4D9375', '#6394BF', '#D9739F'],
          blockquoteDot: 'ffffff',
          state: { error: '#CB7676', warn: '#B8A965', success: '#4D9375', idle: '#758575' },
        },
      },
      'paper-color': {
        label: 'PaperColor',
        light: {
          bg: '#EEEEEE', bgBase: '#EEEEEE', bgLayer2: '#E4E4E4', toastBg: '#FFFFFF',
          labelPrimary: '#444444', labelSecondary: '#878787', brandPrimary: '#005F87',
          borderL1: 'rgba(68, 68, 68, 0.06)', borderL2: 'rgba(68, 68, 68, 0.10)',
          strong: '#AF0000', em: '#D75F00', math: '#005FAF', inlineCodeText: '#8700AF',
          heading: ['#AF0000', '#D75F00', '#5F8700', '#008700', '#005FAF', '#8700AF'],
          blockquoteDot: '000000',
          state: { error: '#D70000', warn: '#D75F00', success: '#008700', idle: '#BCBCBC' },
        },
        dark: {
          bg: '#1C1C1C', bgBase: '#1C1C1C', bgLayer2: '#303030', toastBg: '#303030',
          labelPrimary: '#D0D0D0', labelSecondary: '#808080', brandPrimary: '#5F8787',
          borderL1: 'rgba(208, 208, 208, 0.06)', borderL2: 'rgba(208, 208, 208, 0.10)',
          strong: '#FF5FAF', em: '#FFAF00', math: '#5FAFD7', inlineCodeText: '#AF87D7',
          heading: ['#FF5FAF', '#FFAF00', '#D7AF00', '#5FAF5F', '#5FAFD7', '#AF87D7'],
          blockquoteDot: 'ffffff',
          state: { error: '#FF5FAF', warn: '#D7AF00', success: '#5FAF5F', idle: '#585858' },
        },
      },
      iceberg: {
        label: 'Iceberg',
        light: {
          bg: '#E8E9EC', bgBase: '#E8E9EC', bgLayer2: '#DCDFE7', toastBg: '#CAD0DE',
          labelPrimary: '#33374C', labelSecondary: '#8389A3', brandPrimary: '#2D539E',
          borderL1: 'rgba(51, 55, 76, 0.06)', borderL2: 'rgba(51, 55, 76, 0.10)',
          strong: '#CC517A', em: '#C57339', math: '#3F83A6', inlineCodeText: '#7759B4',
          heading: ['#CC517A', '#C57339', '#668E3D', '#2D539E', '#7759B4', '#3F83A6'],
          blockquoteDot: '000000',
          state: { error: '#CC3768', warn: '#C57339', success: '#668E3D', idle: '#9FA7BD' },
        },
        dark: {
          bg: '#161821', bgBase: '#161821', bgLayer2: '#1E2132', toastBg: '#272C42',
          labelPrimary: '#C6C8D1', labelSecondary: '#6B7089', brandPrimary: '#84A0C6',
          borderL1: 'rgba(198, 200, 209, 0.06)', borderL2: 'rgba(198, 200, 209, 0.10)',
          strong: '#E27878', em: '#E2A478', math: '#89B8C2', inlineCodeText: '#A093C7',
          heading: ['#E27878', '#E2A478', '#C0CA8E', '#B4BE82', '#91ACD1', '#ADA0D3'],
          blockquoteDot: 'ffffff',
          state: { error: '#E98989', warn: '#E9B189', success: '#C0CA8E', idle: '#444B71' },
        },
      },
      seoul256: {
        label: 'Seoul256',
        light: {
          bg: '#E1E1E1', bgBase: '#E1E1E1', bgLayer2: '#E9E9E9', toastBg: '#F1F1F1',
          labelPrimary: '#616161', labelSecondary: '#999872', brandPrimary: '#0099BD',
          borderL1: 'rgba(97, 97, 97, 0.06)', borderL2: 'rgba(97, 97, 97, 0.10)',
          strong: '#BF2172', em: '#BE7572', math: '#0074BE', inlineCodeText: '#9A7599',
          heading: ['#BF2172', '#BE7572', '#9A7200', '#006F00', '#0074BE', '#007173'],
          blockquoteDot: '000000',
          state: { error: '#9B1300', warn: '#9A7200', success: '#006F00', idle: '#727272' },
        },
        dark: {
          bg: '#333233', bgBase: '#4B4B4B', bgLayer2: '#565656', toastBg: '#565656',
          labelPrimary: '#D9D9D9', labelSecondary: '#999872', brandPrimary: '#98BEDE',
          borderL1: 'rgba(217, 217, 217, 0.06)', borderL2: 'rgba(217, 217, 217, 0.10)',
          strong: '#E17899', em: '#E19972', math: '#719CDF', inlineCodeText: '#9A7599',
          heading: ['#E17899', '#E19972', '#DFBC72', '#98BC99', '#719CDF', '#9A7599'],
          blockquoteDot: 'ffffff',
          state: { error: '#E12672', warn: '#DFBC72', success: '#98BC99', idle: '#719872' },
        },
      },
    }

    const THEME_IDS = Object.keys(THEMES)

    // ===== addresses =====
    // Two different strings that are easy to confuse and both fail silently:
    //  - ENTRY_ID is the profile entry id, and since 0.1.7 the settings
    //    namespace itself (dsh-settings keys the form off entry.options.id).
    //    lib/index.js mirrors it; it must also match cordis.patch.yml.
    //  - BUNDLE_NAME is the key of the keyed slot `plugins.bundle.config`: the
    //    page renders the section for `{ entryKey: pkg.name }`, so this has to
    //    equal the root package.json "name" verbatim.
    const ENTRY_ID = 'custom-skin'
    const BUNDLE_NAME = 'dsh-custom-skin'
    const LOCALE_NS = 'settings.customSkin'
    const STORAGE_KEY = 'dsh-custom-skin.v1'
    const STYLE_ID = 'dsh-custom-skin-style'
    const THEME_SOURCE = 'custom-skin'

    // ===== first-paint cache (Host is the authority) =====
    // Reading the form snapshot is async, so a reload would otherwise show the
    // default theme for a beat. The cache only ever replays what the Host last
    // accepted.
    function readCache() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        return {
          uiFont: typeof parsed.uiFont === 'string' ? parsed.uiFont : '',
          codeFont: typeof parsed.codeFont === 'string' ? parsed.codeFont : '',
          theme: typeof parsed.theme === 'string' ? parsed.theme : 'default',
        }
      } catch {
        return null
      }
    }

    function writeCache(prefs) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
      } catch {
        /* quota — the Host still holds the values */
      }
    }

    // ===== token layer for the active palette =====
    // Only the tokens the Theme inspect provider lists as overridable are
    // emitted; other names in the design-token table (--dsw-alias-bg-layer-3,
    // --dsw-alias-label-tertiary, --dsw-alias-markdown-*) are accepted by
    // overrideTokens but read by nothing, so they would be dead weight.
    // Every value must be a { light, dark } pair — a bare string throws.
    function buildTokens(p) {
      const L = p.light
      const D = p.dark
      return {
        '--dsw-alias-bg-base': { light: L.bgBase, dark: D.bgBase },
        '--dsw-alias-bg-layer-1': { light: L.bgBase, dark: D.bgBase },
        '--dsw-alias-bg-layer-2': { light: L.bgLayer2, dark: D.bgLayer2 },
        '--dsw-alias-bg-overlay': { light: L.toastBg, dark: D.toastBg },
        '--dsw-alias-border-l1': { light: L.borderL1, dark: D.borderL1 },
        '--dsw-alias-border-l2': { light: L.borderL2, dark: D.borderL2 },
        '--dsw-alias-brand-primary': { light: L.brandPrimary, dark: D.brandPrimary },
        '--dsw-alias-label-primary': { light: L.labelPrimary, dark: D.labelPrimary },
        '--dsw-alias-label-secondary': { light: L.labelSecondary, dark: D.labelSecondary },
        '--dsw-specific-sidebar-fill': { light: L.bg, dark: D.bg },
        '--dsw-alias-state-error-primary': { light: L.state.error, dark: D.state.error },
        '--dsw-alias-state-warn-primary': { light: L.state.warn, dark: D.state.warn },
        '--dsw-alias-state-success-primary': { light: L.state.success, dark: D.state.success },
        '--dsw-alias-state-idle-primary': { light: L.state.idle, dark: D.state.idle },
      }
    }

    // ===== wide-table jitter fix =====
    // DSH's .md-table-wide (>=4-column markdown tables) hides the horizontal
    // scrollbar until hover: at rest `overflow-x:hidden` + `padding-bottom:
    // var(--dsh-scrollbar-width, 5px)` (0.2.0 falls back to 5px, 0.1.2 to 8px),
    // on hover/focus-visible `overflow-x:scroll` + `padding-bottom:0`. The
    // wrapper height therefore changes on hover in both directions:
    //   - table overflows -> the scrollbar (its real height) replaces the pad,
    //   - table fits      -> no scrollbar appears but the pad is dropped, so
    //     the wrapper collapses by exactly that reserve.
    // Fix: keep the wrapper height constant in every state — scrollbar always
    // available (same behavior DSH uses for narrow .tableFill tables) and no
    // hover-dependent padding.
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
        /* keep 0 */
      }
      return scrollbarSize
    }

    // Publish the real scrollbar size: DSH's table rule reads it, and other
    // plugins (e.g. dsh-context charts) rely on the same token to reserve
    // scrollbar space correctly.
    function scrollbarTokenCss() {
      return `:root { --dsh-scrollbar-width: ${measuredScrollbarSize()}px; }`
    }

    // Height-invariant wide-table rules; must override DSH's hover rule, so
    // they are emitted unconditionally with !important.
    function tableStabilizeCss() {
      return '[class*="_markdown_"] .md-table-wide,' +
        '[class*="_markdown_"] .md-table-wide:hover,' +
        '[class*="_markdown_"] .md-table-wide:focus-visible {' +
        ' overflow-x: auto !important; padding-bottom: 0 !important; }'
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

      // Jitter fix (theme-independent, see the wide-table notes above): both
      // rules must be emitted even when no color theme is selected, otherwise
      // the behavior falls back to DSH's 5px reserve.
      parts.push(scrollbarTokenCss())
      parts.push(tableStabilizeCss())

      const theme = ctx.theme
      const pal = THEMES[prefs.theme]
      if (pal) {
        // overrideTokens() replaces the layer stored under THEME_SOURCE, so a
        // palette switch needs no dispose first — only a real change does work.
        if (appliedTheme !== prefs.theme && theme && typeof theme.overrideTokens === 'function') {
          try {
            tokenDisposer = theme.overrideTokens(THEME_SOURCE, buildTokens(pal))
            appliedTheme = prefs.theme
          } catch (e) {
            console.warn('[dsh-custom-skin] theme override failed', e)
          }
        }
        parts.push(buildCss(pal))
      } else {
        // 'default' (or an unknown id): drop the layer and let DSH's own theme through.
        if (appliedTheme !== null) {
          if (tokenDisposer) { tokenDisposer(); tokenDisposer = null }
          appliedTheme = null
        }
      }

      styleEl.textContent = parts.join('\n')
    }

    // ===== card controller =====
    // The two font fields ride the official staged-save flow; the palette
    // picker writes immediately, because "click a swatch, see the skin" is the
    // whole point of a skin plugin and a staged palette would preview a color
    // the Host has not accepted.
    const FONT_FIELDS = ['uiFont', 'codeFont']

    class SkinCardController {
      /** @param scope - ctx.configForms.get(ENTRY_ID): this entry's form and write queue. */
      constructor(scope) {
        this.scope = scope
        this.model = new SettingsFormModel(scope, FONT_FIELDS.map(settingsTextField))
        this.store = this.model.bind(() => this.projection())
        this.themeWriting = false
        this.themeFailed = false
        this.unsubscribe = scope.subscribe(() => this.publish())
      }

      dispose() {
        this.unsubscribe?.()
        this.model.dispose()
      }

      publish() {
        this.store.set(this.projection())
      }

      projection() {
        const snapshot = this.scope.getSnapshot()
        return {
          ...this.model.shell(),
          ...Object.fromEntries(FONT_FIELDS.map((field) => [field, this.model.field(field)])),
          theme: snapshot.value?.theme ?? 'default',
          themeWriting: this.themeWriting,
          themeFailed: this.themeFailed,
        }
      }

      /** Palette pick: one immediate, revision-fenced write. `set(field)` only
       *  addresses top-level paths, and a rejected write leaves the snapshot
       *  untouched — so the swatch simply does not move, and we say why. */
      async selectTheme(value) {
        const snapshot = this.scope.getSnapshot()
        if (this.themeWriting || snapshot.status !== 'ready' || !snapshot.writable) return
        if (snapshot.value?.theme === value) return
        this.themeWriting = true
        this.themeFailed = false
        this.publish()
        try {
          await this.scope.mutate([{ op: 'set', path: ['theme'], value }], snapshot.revision)
        } catch (e) {
          /* landing is verified by reading the snapshot back */
        }
        this.themeWriting = false
        if (this.scope.getSnapshot().value?.theme !== value) this.themeFailed = true
        this.publish()
      }

      inject() {
        return {
          hooks: { skinCard: this.store },
          ...this.model.actions(),
          selectTheme: (value) => this.selectTheme(value),
        }
      }
    }

    // ===== card chrome (self-drawn: DSH ships no select/swatch primitive) =====
    function installCardStyles() {
      if (typeof document === 'undefined' || document.querySelector('style[data-custom-skin-ui]')) return () => {}
      const style = document.createElement('style')
      style.dataset.customSkinUi = 'true'
      style.textContent = `
        .dcs-card { display: flex; flex-direction: column; gap: 12px; }
        .dcs-title { margin: 0; font-size: 14px; font-weight: 500; line-height: 20px; }
        .dcs-field { display: flex; flex-direction: column; gap: 6px; padding: 12px 0; border-top: 0.5px solid var(--dsw-alias-border-l2, #8884); }
        .dcs-label { color: var(--dsw-alias-label-primary); font-size: 13px; font-weight: 500; line-height: 20px; }
        .dcs-hint { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }
        .dcs-write-failed { margin: 0; color: var(--dsw-alias-state-error-primary); font-size: 12px; line-height: 18px; }
        .dcs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
        .dcs-swatch { display: flex; flex-direction: column; gap: 6px; padding: 6px; border-radius: 8px; cursor: pointer; text-align: left; font: inherit; font-size: 12px; line-height: 16px; color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1); }
        .dcs-swatch:hover { border-color: var(--dsw-alias-border-l2); }
        .dcs-swatch[aria-checked="true"] { border-color: var(--dsw-alias-brand-primary); box-shadow: inset 0 0 0 1px var(--dsw-alias-brand-primary); }
        .dcs-swatch:focus-visible { outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary)); outline-offset: 2px; }
        .dcs-swatch[disabled] { cursor: default; opacity: 0.55; }
        .dcs-chips { display: grid; grid-template-columns: repeat(4, 1fr); height: 22px; border-radius: 4px; overflow: hidden; }
        .dcs-chips > i { display: block; }
        .dcs-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      `
      document.head.appendChild(style)
      return () => style.remove()
    }

    /** The four colors that identify a palette: base, raised surface, text, accent. */
    function chipRow(mode) {
      const h = createElement
      return h('div', { className: 'dcs-chips', 'aria-hidden': 'true' },
        h('i', { style: { background: mode.bg } }),
        h('i', { style: { background: mode.bgLayer2 } }),
        h('i', { style: { background: mode.labelPrimary } }),
        h('i', { style: { background: mode.brandPrimary } }),
      )
    }

    // ===== card =====
    let createElement = null

    function makeCard(React) {
      createElement = React.createElement

      function Swatch({ id, label, light, dark, checked, disabled, onPick }) {
        return createElement(
          'button',
          {
            type: 'button',
            role: 'radio',
            className: 'dcs-swatch',
            'aria-checked': checked ? 'true' : 'false',
            disabled,
            onClick: () => onPick(id),
          },
          chipRow(light),
          chipRow(dark),
          createElement('span', { className: 'dcs-name' }, label),
        )
      }

      function FontField({ props, state, t, field }) {
        return createElement(
          'div',
          { className: 'dcs-field' },
          createElement(SettingsValueField, {
            id: `custom-skin-${field}`,
            label: t(`${field}Label`),
            hint: t(`${field}Hint`),
            text: state[field].text,
            overridden: state[field].overridden,
            invalid: state[field].invalid,
            overriddenLabel: t('overridden'),
            resetLabel: t('reset'),
            invalidLabel: t('invalid'),
            placeholder: t(`${field}Placeholder`),
            disabled: !state.writable || state.saving,
            onEdit: (text) => props.edit(field, text),
            onReset: () => props.resetField(field),
          }),
        )
      }

      return function Card(props) {
        const t = props.t
        const state = props.useSkinCard((snapshot) => snapshot)
        const themeChoice = (
          createElement(
            'div',
            { className: 'dcs-field' },
            createElement('span', { className: 'dcs-label' }, t('themeLabel')),
            createElement('p', { className: 'dcs-hint' }, t('themeHint')),
            createElement(
              'div',
              { className: 'dcs-grid', role: 'radiogroup', 'aria-label': t('themeLabel') },
              createElement(Swatch, {
                id: 'default',
                label: t('themeDefault'),
                light: { bg: '#FFFFFF', bgLayer2: '#F2F2F2', labelPrimary: '#1F2328', brandPrimary: '#8A8A8A' },
                dark: { bg: '#1C1C1C', bgLayer2: '#2A2A2A', labelPrimary: '#E6E6E6', brandPrimary: '#9A9A9A' },
                checked: state.theme === 'default',
                disabled: !state.writable || state.themeWriting,
                onPick: props.selectTheme,
              }),
              ...THEME_IDS.map((id) => createElement(Swatch, {
                id,
                label: THEMES[id].label,
                light: THEMES[id].light,
                dark: THEMES[id].dark,
                checked: state.theme === id,
                disabled: !state.writable || state.themeWriting,
                onPick: props.selectTheme,
              })),
            ),
            state.themeFailed
              ? createElement('p', { role: 'status', className: 'dcs-write-failed' }, t('saveFailed'))
              : null,
          )
        )
        return createElement(
          'div',
          { className: 'dcs-card' },
          createElement('h4', { className: 'dcs-title' }, t('title')),
          // The palette grid deliberately sits outside the form frame: the save
          // control belongs to the two staged font fields, and leaving it after
          // the swatches read as "palette picks need saving too".
          createElement(SettingsForm, {
            labels: {
              unavailable: t('unavailable'),
              readOnly: t('readOnly'),
              saveFailed: t('saveFailed'),
              save: t('save'),
              saving: t('saving'),
            },
            state,
            onSave: props.save,
            onDiscard: props.discard,
          },
            createElement(FontField, { props, state, t, field: 'uiFont' }),
            createElement(FontField, { props, state, t, field: 'codeFont' }),
          ),
          state.available ? themeChoice : null,
        )
      }
    }

    // ===== dictionaries =====
    const zh = {
      title: '皮肤与字体',
      uiFontLabel: '界面字体',
      uiFontHint: 'CSS 字体栈，须是本机已安装的字体。留空并保存 = 用 DSH 默认。',
      uiFontPlaceholder: '"OPPO Sans 4.0", "Microsoft YaHei", sans-serif',
      codeFontLabel: '代码字体',
      codeFontHint: '作用于代码块与行内代码。留空并保存 = 用 DSH 默认。',
      codeFontPlaceholder: '"Geist Mono", "Fira Code", Consolas, monospace',
      themeLabel: '调色板',
      themeHint: '点一下立即生效并写入 profile，不用按上面的「保存」——那个只提交字体。',
      themeDefault: 'DSH 默认',
      overridden: '已覆盖',
      reset: '重置',
      invalid: '这个值不被接受。',
      save: '保存',
      saving: '保存中…',
      readOnly: '本部署的设置为只读。',
      saveFailed: '本部署没有接受这些值，已保留供你修改。',
      unavailable: '该插件当前未加载，暂时无法配置。',
    }

    const en = {
      title: 'Skin & fonts',
      uiFontLabel: 'UI font',
      uiFontHint: 'A CSS font stack of fonts installed on this machine. Clear and save to go back to DSH’s default.',
      uiFontPlaceholder: '"Inter", "Segoe UI", system-ui, sans-serif',
      codeFontLabel: 'Code font',
      codeFontHint: 'Applies to code blocks and inline code. Clear and save to go back to DSH’s default.',
      codeFontPlaceholder: '"Geist Mono", "Fira Code", Consolas, monospace',
      themeLabel: 'Palette',
      themeHint: 'Click to apply immediately — it is written to this profile right away. The Save button above only commits the fonts.',
      themeDefault: 'DSH default',
      overridden: 'Overridden',
      reset: 'Reset',
      invalid: 'This value is not accepted.',
      save: 'Save',
      saving: 'Saving…',
      readOnly: 'This deployment stores settings read-only.',
      saveFailed: 'The deployment did not accept these values; they were left for you to correct.',
      unavailable: 'This plugin is not loaded, so it cannot be configured right now.',
    }

    // ===== plugin entry =====
    // NOTE: the plugin object's inject must be SERVICE KEYS (slots/theme/…);
    // package.json's dsh.client.inject uses package names (boot manifest only).
    const name = 'custom-skin'
    const inject = ['slots', 'theme', 'locale', 'configForms']

    function apply(ctx) {
      // Paint from the cache first so a reload never flashes the default theme,
      // then let the Host's snapshot take over as soon as it is ready.
      const cached = readCache()
      if (cached) applySkin(ctx, cached)

      ctx.effect(() => () => {
        if (tokenDisposer) { tokenDisposer(); tokenDisposer = null }
        if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl)
        styleEl = null
      })

      const scope = ctx.configForms.get(ENTRY_ID)
      let lastPainted = null
      let migrationChecked = false

      // One-time upgrade path. 0.1.x kept prefs in localStorage and the profile
      // entry starts empty, so an upgrading user who had picked a palette would
      // otherwise be painted straight back to the schema default. Only fields that
      // actually differ from what the Host resolves are written, so a fresh install
      // stores nothing and a deliberate reset is not resurrected (the cache has
      // already been rewritten with the reset values by then).
      const migrateFromCache = (snapshot) => {
        if (migrationChecked) return false
        migrationChecked = true
        const user = snapshot.user
        if (user && typeof user === 'object' && Object.keys(user).length > 0) return false
        const cached = readCache()
        if (!cached || !snapshot.writable) return false
        const ops = ['uiFont', 'codeFont', 'theme']
          .filter((field) => cached[field] !== (snapshot.value?.[field] ?? ''))
          .map((field) => ({ op: 'set', path: [field], value: cached[field] }))
        if (ops.length === 0) return false
        scope.mutate(ops, snapshot.revision).catch(() => {})
        // Skip this paint: the write re-notifies, and painting the defaults now
        // would flash the very skin the migration exists to preserve.
        return true
      }

      const syncFromHost = () => {
        const snapshot = scope.getSnapshot()
        // 'loading'/'unavailable': keep whatever is on screen; the Host has not
        // spoken yet (or has stopped serving the entry).
        if (snapshot.status !== 'ready' || snapshot.value === undefined) return
        if (migrateFromCache(snapshot)) return
        const prefs = {
          uiFont: snapshot.value.uiFont ?? '',
          codeFont: snapshot.value.codeFont ?? '',
          theme: snapshot.value.theme ?? 'default',
        }
        const key = JSON.stringify(prefs)
        if (key === lastPainted) return
        lastPainted = key
        applySkin(ctx, prefs)
        writeCache(prefs)
      }
      ctx.effect(() => scope.subscribe(syncFromHost))
      syncFromHost()

      ctx.effect(() => ctx.locale.register(LOCALE_NS, { zh, en }))

      let React = null
      let primitives = null
      try {
        React = require('react')
        primitives = require('@deepseek-ai/dsh-client-ui-primitives')
      } catch {
        /* Older/hostless composition: the skin still applies, there is just no card. */
        return
      }
      // Build the component once: a new function identity per registration would
      // remount the card (losing staged drafts) every time the slot re-injects.
      const Card = makeCard(React)
      SettingsForm = primitives.SettingsForm
      SettingsFormModel = primitives.SettingsFormModel
      SettingsValueField = primitives.SettingsValueField
      settingsTextField = primitives.settingsTextField

      const card = new SkinCardController(scope)
      ctx.effect(() => () => card.dispose())
      ctx.effect(installCardStyles)

      // Only register the card while the Host really serves this entry, so a
      // deployment without the custom-skin row leaves no trace.
      ctx.effect(() => ctx.configForms.whileServed([ENTRY_ID], () => ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
        name: 'plugins.bundle.config',
        key: BUNDLE_NAME,
        locale: LOCALE_NS,
        inject: () => card.inject(),
      }, Card))), 'custom-skin: plugin page card')
    }

    module.exports = { name, inject, apply }
    return module.exports
  },
})
