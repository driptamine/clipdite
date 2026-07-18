import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import linaria from '@wyw-in-js/vite'

export default defineConfig({
  plugins: [
    linaria({
      include: ['**/*.{ts,tsx}'],
      babelOptions: {
        presets: ['@babel/preset-typescript', '@babel/preset-react'],
      },
    }),
    react(),
  ],
})
