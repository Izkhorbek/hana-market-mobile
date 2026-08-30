// Build a one-time map of every lucide icon export → real file path by
// parsing lucide's barrel. Many lucide names are aliases (e.g. CheckCircle2
// → circle-check, House → house), and naive PascalCase→kebab conversion
// breaks for digits and renamed icons. Reading the truth from the package
// itself avoids hard-coding edge cases and survives lucide version bumps.
const fs = require('fs')
const path = require('path')

const buildLucideMap = () => {
  const map = {}
  try {
    const barrelPath = path.resolve(
      __dirname,
      'node_modules/lucide-react-native/dist/esm/lucide-react-native.js'
    )
    const src = fs.readFileSync(barrelPath, 'utf8')
    // Each line looks like:
    //   export { default as Foo, default as Bar } from './icons/foo.js';
    const re = /export\s*\{([^}]+)\}\s*from\s*['"]\.\/icons\/([^'"]+)\.js['"]/g
    let m
    while ((m = re.exec(src)) !== null) {
      const file = m[2]
      m[1].split(',').forEach((piece) => {
        const alias = piece.trim().replace(/^default\s+as\s+/, '')
        if (alias) map[alias] = file
      })
    }
  } catch {
    // If lucide isn't installed yet (fresh clone), fall back to no-op map.
    // The plugin will then leave imports untouched.
  }
  return map
}

const LUCIDE_ICON_MAP = buildLucideMap()

module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo'],
    ],
    plugins: [
      // Tree-shake lucide-react-native barrel imports.
      // `import { Sun } from 'lucide-react-native'` pulls in the entire
      // ~560 KB icon catalog. This rewrites such imports to deep paths like
      // `import Sun from 'lucide-react-native/dist/esm/icons/sun'` so only
      // the icons actually used end up in the bundle.
      [
        'babel-plugin-transform-imports',
        {
          'lucide-react-native': {
            transform: (importName) => {
              const file = LUCIDE_ICON_MAP[importName]
              if (!file) {
                // Unknown export — let it fall through to the barrel so the
                // build doesn't break on a typo or a future icon name.
                return 'lucide-react-native'
              }
              return `lucide-react-native/dist/esm/icons/${file}`
            },
            // Each icon file's default export IS the component, so let the
            // plugin convert `import { Sun }` to `import Sun from '.../sun'`.
            preventFullImport: true,
          },
        },
        // Unique name so the plugin can be applied multiple times if needed.
        'lucide-react-native-tree-shake',
      ],
    ],
  }
}