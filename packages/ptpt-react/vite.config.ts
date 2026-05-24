import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      rollupTypes: false,
      entryRoot: 'src',
    }),
  ],
  esbuild: {
    jsx: 'automatic',
  },
  build: {
    lib: {
      entry: { index: resolve(__dirname, 'src/index.ts') },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', '@love-rox/ptpt-core'],
      output: {
        // Re-add the client directive the bundler strips, so RSC frameworks
        // (Waku, Next.js) treat the entry as a client module.
        banner: (chunk) => (chunk.isEntry ? "'use client';" : ''),
      },
    },
    sourcemap: true,
    target: 'es2022',
  },
})
