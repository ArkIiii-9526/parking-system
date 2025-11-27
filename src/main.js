import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 引入ElementPlus组件库
import ElementPlus from 'element-plus'
// 引入ElementPlus默认样式
import 'element-plus/dist/index.css'
// 引入ElementPlus图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// 引入ElementPlus主题颜色变量（可以自定义）
import './assets/main.css'

const app = createApp(App)

// 注册所有ElementPlus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用ElementPlus组件库
app.use(ElementPlus, {
  // 配置ElementPlus
  size: 'default', // 默认尺寸
  zIndex: 3000 // 弹出层的默认z-index
})

// 使用路由
app.use(router)

// 挂载应用
app.mount('#app')
