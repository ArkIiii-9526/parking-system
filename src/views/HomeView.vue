<script setup>
// 首页组件
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="home-container">
    <h2>欢迎使用智慧停车引导系统</h2>
    <div class="intro-section">
      <p>本系统提供智能停车管理、空位查询、停车引导等功能，帮助您轻松找到停车位。</p>
    </div>
    <div class="quick-actions">
      <RouterLink to="/parking" class="btn-primary">
        进入停车管理
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.home-container h2 {
  color: #333;
  margin-bottom: 1.5rem;
}

.intro-section {
  background-color: #f9f9f9;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.intro-section p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.quick-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
  padding: 1rem 2rem;
  border-radius: 4px;
  text-decoration: none;
  font-size: 1.1rem;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: #45a049;
}
</style>