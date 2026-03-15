import router from './src/router/index.js'

// 打印所有路由路径
console.log('=== 所有路由路径 ===')
const routes = router.getRoutes()
routes.forEach(route => {
  console.log(`Path: ${route.path}, Name: ${route.name}`)
  if (route.children) {
    route.children.forEach(child => {
      console.log(`  Child: ${child.path}, Name: ${child.name}`)
    })
  }
})
