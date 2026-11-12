import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // 라이브러리는 앱 코드보다 훨씬 드물게 바뀐다. 따로 묶어두면 배포 후에도
        // 브라우저 캐시가 유지된다. 라우트 단위 분할은 화면 전환마다 로딩이
        // 보이게 되므로 적용하지 않는다.
        manualChunks: (id: string) => {
          if (!id.includes('node_modules')) return undefined
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react'
          if (/[\\/]node_modules[\\/]react-router/.test(id)) return 'router'
          return 'vendor'
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
      },
    },
  },
})
