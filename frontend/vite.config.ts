import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../public',
    emptyOutDir: true,
    // ▼▼▼ ここから追加・修正 ▼▼▼
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // node_modules配下の依存関係を個別のファイルに分割する
          if (id.includes('node_modules')) {
            // FFmpeg関連は特に重いので独立させる
            if (id.includes('@ffmpeg')) {
              return 'ffmpeg-vendor';
            }
            // 画像・PDF処理系も分ける
            if (id.includes('browser-image-compression') || id.includes('pdf-lib')) {
              return 'processing-vendor';
            }
            // UI系・React系
            if (id.includes('react') || id.includes('lucide')) {
              return 'react-vendor';
            }
            // その他はまとめてvendorへ
            return 'vendor';
          }
        },
      },
    },
    // ▲▲▲ ここまで ▲▲▲
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  server: {
    host: true,
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})