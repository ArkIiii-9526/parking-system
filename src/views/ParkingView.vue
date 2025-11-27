<script setup>
// 停车管理页面组件
import { ref } from 'vue'

// 示例数据：停车场信息
const parkingData = ref({
    totalSpaces: 200,
    availableSpaces: 150,
    occupiedSpaces: 50
})

// 示例数据：区域信息
const zones = ref([
    { id: 1, name: 'A区', available: 45, total: 50 },
    { id: 2, name: 'B区', available: 30, total: 50 },
    { id: 3, name: 'C区', available: 40, total: 50 },
    { id: 4, name: 'D区', available: 35, total: 50 }
])

// 计算占用率
const calculateOccupancy = (available, total) => {
    return ((total - available) / total * 100).toFixed(1)
}
</script>

<template>
    <div class="parking-container">
        <h2>停车管理系统</h2>
        <div class="dashboard">
            <div class="stats-card">
                <h3>总车位</h3>
                <p class="stat-value">{{ parkingData.totalSpaces }}</p>
            </div>
            <div class="stats-card">
                <h3>可用车位</h3>
                <p class="stat-value available">{{ parkingData.availableSpaces }}</p>
            </div>
            <div class="stats-card">
                <h3>已占车位</h3>
                <p class="stat-value occupied">{{ parkingData.occupiedSpaces }}</p>
            </div>
        </div>
        <div class="zones-section">
            <h3>区域车位信息</h3>
            <div class="zones-grid">
                <div v-for="zone in zones" :key="zone.id" class="zone-card">
                    <h4>{{ zone.name }}</h4>
                    <p>可用: {{ zone.available }}</p>
                    <p>总车位: {{ zone.total }}</p>
                    <p>占用率: {{ calculateOccupancy(zone.available, zone.total) }}%</p>
                    <div class="progress-bar">
                        <div class="progress-fill"
                            :style="{ width: calculateOccupancy(zone.available, zone.total) + '%' }" :class="{
                                'high': calculateOccupancy(zone.available, zone.total) >= 80,
                                'medium': calculateOccupancy(zone.available, zone.total) >= 50 && calculateOccupancy(zone.available, zone.total) < 80,
                                'low': calculateOccupancy(zone.available, zone.total) < 50
                            }"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.parking-container {
    max-width: 1000px;
    margin: 0 auto;
}

.parking-container h2 {
    color: #333;
    margin-bottom: 2rem;
    text-align: center;
}

.dashboard {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
}

.stats-card {
    background-color: white;
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-card h3 {
    color: #666;
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
}

.stat-value {
    font-size: 2rem;
    font-weight: bold;
    margin: 0;
}

.stat-value.available {
    color: #4CAF50;
}

.stat-value.occupied {
    color: #f44336;
}

.zones-section h3 {
    color: #333;
    margin-bottom: 1.5rem;
}

.zones-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
}

.zone-card {
    background-color: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.zone-card h4 {
    color: #333;
    margin: 0 0 1rem 0;
    font-size: 1.3rem;
}

.zone-card p {
    margin: 0.5rem 0;
    color: #666;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background-color: #e0e0e0;
    border-radius: 4px;
    margin-top: 1rem;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    transition: width 0.3s ease;
}

.progress-fill.high {
    background-color: #f44336;
}

.progress-fill.medium {
    background-color: #ff9800;
}

.progress-fill.low {
    background-color: #4CAF50;
}
</style>