import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import dts from 'vite-plugin-dts'

/** Ship the default stylesheet verbatim (library mode emits no standalone CSS). */
function copyStyles(): Plugin {
  return {
    name: 'ptpt-copy-styles',
    closeBundle() {
      copyFileSync(resolve(__dirname, 'src/styles.css'), resolve(__dirname, 'dist/styles.css'))
    },
  }
}

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      rollupTypes: false,
      entryRoot: 'src',
    }),
    copyStyles(),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'presets/index': resolve(__dirname, 'src/presets/index.ts'),
        'presets/default': resolve(__dirname, 'src/presets/default.ts'),
        'presets/alphanumeric': resolve(__dirname, 'src/presets/alphanumeric.ts'),
        'presets/digits': resolve(__dirname, 'src/presets/digits.ts'),
        'presets/alpha': resolve(__dirname, 'src/presets/alpha.ts'),
        'delays/index': resolve(__dirname, 'src/delays/index.ts'),
        'delays/uniform': resolve(__dirname, 'src/delays/uniform.ts'),
        'delays/random': resolve(__dirname, 'src/delays/random.ts'),
        'delays/wave': resolve(__dirname, 'src/delays/wave.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [],
    },
    sourcemap: true,
    target: 'es2022',
  },
})
