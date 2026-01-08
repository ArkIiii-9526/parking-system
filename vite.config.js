import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  
  return {
    base: env.VITE_BASE_PATH || '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      port: env.VITE_PORT || 8077,
      host: true,
      open: true,
      strictPort: true,
      proxy: {
        [env.VITE_API_BASE_URL]: {
          target: env.VITE_API_TARGET_URL || 'http://localhost:8076',
          changeOrigin: true
        }
      }
    },
    plugins: [
      vue(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        resolvers: [ElementPlusResolver()],
        dts: 'src/auto-imports.d.ts'
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'src/components.d.ts'
      })
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/variables.scss" as *;`,
          api: 'modern'
        }
      }
    }
  }
})
