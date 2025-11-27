<script setup>
// 背景组件 - 使用图片作为背景
</script>

<template>
  <div class="background-container">
    <div class="image-background"></div>
  </div>
</template>

<style scoped>
.background-container {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: -1 !important;
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
  background: none !important;
}

.image-background {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  background-image: url('../assets/img/background.jpeg') !important;
  background-size: cover !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
  /* 保留清晰效果，让毛玻璃导航栏效果更明显 */
  filter: none !important;
  -webkit-filter: none !important;
  margin: 0 !important;
  padding: 0 !important;
  opacity: 0.8 !important;
  /* 降低透明度，让背景更加透明 */
  display: block !important;
  visibility: visible !important;
}

/* 确保全局样式不会覆盖背景 */
:global(html) {
  background: transparent !important;
  margin: 0 !important;
  padding: 0 !important;
}

:global(body) {
  background: transparent !important;
  margin: 0 !important;
  padding: 0 !important;
  min-height: 100vh;
}

/* 为内容添加半透明背景 - 确保没有毛玻璃效果 */
:global(.content-wrapper) {
  background: rgba(255, 255, 255, 0.85) !important;
  margin-top: 60px;
  /* 与导航栏高度匹配 */
  min-height: calc(100vh - 60px);
  position: relative;
  z-index: 1;
  backdrop-filter: none !important;
  /* 明确禁用毛玻璃效果 */
  -webkit-backdrop-filter: none !important;
}
</style>