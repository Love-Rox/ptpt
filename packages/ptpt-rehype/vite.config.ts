import { isAbsolute, resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      rollupTypes: false,
      entryRoot: 'src',
      // Keep the workspace specifier bare in emitted .d.ts.
      aliasesExclude: [/^@love-rox\//],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        client: resolve(__dirname, 'src/client.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      // Externalize every bare import (deps + peer core); bundle only own source.
      external: (id) => !id.startsWith('.') && !isAbsolute(id),
    },
    sourcemap: true,
    target: 'es2022',
  },
})
