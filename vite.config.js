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
    optimizeDeps: {
      include: [
        'element-plus',
        '@element-plus/icons-vue',
        'echarts',
        '@amap/amap-jsapi-loader',
        'element-plus/es',
        'element-plus/es/components/base/style/css',
        'element-plus/es/components/radio-group/style/css',
        'element-plus/es/components/radio-button/style/css',
        'element-plus/es/components/icon/style/css',
        'element-plus/es/components/dropdown/style/css',
        'element-plus/es/components/dropdown-menu/style/css',
        'element-plus/es/components/dropdown-item/style/css',
        'element-plus/es/components/avatar/style/css',
        'element-plus/es/components/popover/style/css',
        'element-plus/es/components/input/style/css',
        'element-plus/es/components/breadcrumb/style/css',
        'element-plus/es/components/breadcrumb-item/style/css',
        'element-plus/es/components/scrollbar/style/css',
        'element-plus/es/components/drawer/style/css',
        'element-plus/es/components/dialog/style/css',
        'element-plus/es/components/form/style/css',
        'element-plus/es/components/switch/style/css',
        'element-plus/es/components/input-number/style/css',
        'element-plus/es/components/form-item/style/css',
        'element-plus/es/components/pagination/style/css',
        'element-plus/es/components/collapse/style/css',
        'element-plus/es/components/collapse-item/style/css',
        'element-plus/es/components/empty/style/css',
        'element-plus/es/components/table/style/css',
        'element-plus/es/components/table-column/style/css',
        'element-plus/es/components/button/style/css',
        'element-plus/es/components/checkbox/style/css',
        'element-plus/es/components/select/style/css',
        'element-plus/es/components/option/style/css',
        'element-plus/es/components/loading/style/css',
        'element-plus/es/components/checkbox-group/style/css',
        'element-plus/es/components/tag/style/css',
        'element-plus/es/components/card/style/css'
      ]
    },
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
