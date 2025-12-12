<script setup>
/**
 * 调试弹窗组件
 * Debug Modal Component
 * 
 * 提供完整的调试功能：
 * - 顾客控制
 * - 菜品生成
 * - 随机事件概率设置
 * - 难度倍率调整
 * - 手动触发事件
 */
import { ref, reactive, computed, watch } from 'vue'
import { internalEvents, difficultyMultipliers } from '../game/events/internalEvents'
import { externalEvents } from '../game/events/externalEvents'

const props = defineProps({
  visible: { type: Boolean, default: false },
  customerSpawnEnabled: { type: Boolean, default: true },
  customerCount: { type: Number, default: 0 },
  customers: { type: Array, default: () => [] },
  dishList: { type: Array, default: () => [] },
  eventsEnabled: { type: Boolean, default: true },
  currentDay: { type: Number, default: 1 }
})

const emit = defineEmits([
  'close',
  'toggle-spawn',
  'spawn-customer',
  'spawn-customers',
  'clear-customers',
  'remove-customer',
  'spawn-dish',
  'toggle-events',
  'update-probability',
  'update-difficulty',
  'trigger-event',
  'reset-cooldowns'
])

// 当前选中的标签页
const activeTab = ref('general')

// 菜品选择
const selectedDish = ref('')

// 手动生成顾客数量
const manualSpawnCount = ref(1)

// 本地事件概率副本（用于编辑）
const localInternalProbabilities = reactive({})
const localExternalProbabilities = reactive({})

// 本地难度倍率副本
const localDifficultyMultipliers = reactive({})

// 初始化本地副本
function initLocalData() {
  // 内部事件概率
  Object.entries(internalEvents).forEach(([id, event]) => {
    localInternalProbabilities[id] = event.probability * 100 // 转换为百分比
  })
  
  // 外部事件概率
  Object.entries(externalEvents).forEach(([id, event]) => {
    localExternalProbabilities[id] = event.probability * 100
  })
  
  // 难度倍率
  Object.entries(difficultyMultipliers).forEach(([level, config]) => {
    localDifficultyMultipliers[level] = config.multiplier
  })
}
initLocalData()

// 当前难度等级（基于天数）
const currentDifficulty = computed(() => {
  const day = props.currentDay
  for (const [level, config] of Object.entries(difficultyMultipliers)) {
    if (day >= config.days[0] && day <= config.days[1]) {
      return level
    }
  }
  return 'beginner'
})

// 难度等级名称映射
const difficultyNames = {
  beginner: '新手',
  easy: '简单',
  normal: '普通',
  hard: '困难',
  expert: '专家'
}

// 内部事件列表
const internalEventList = computed(() => {
  return Object.entries(internalEvents).map(([id, event]) => ({
    id,
    name: event.name,
    icon: event.icon,
    probability: localInternalProbabilities[id]
  }))
})

// 外部事件列表
const externalEventList = computed(() => {
  return Object.entries(externalEvents).map(([id, event]) => ({
    id,
    name: event.name,
    icon: event.icon,
    category: event.category,
    probability: localExternalProbabilities[id]
  }))
})

// 生成菜品
function handleSpawnDish() {
  if (selectedDish.value) {
    emit('spawn-dish', selectedDish.value)
  }
}

// 手动生成指定数量的顾客
function handleSpawnCustomers() {
  if (manualSpawnCount.value > 0) {
    emit('spawn-customers', manualSpawnCount.value)
  }
}

// 保存内部事件概率
function saveInternalProbability(eventId) {
  const percentage = localInternalProbabilities[eventId]
  const probability = percentage / 100 // 转回小数
  emit('update-probability', { type: 'internal', eventId, probability })
}

// 保存外部事件概率
function saveExternalProbability(eventId) {
  const percentage = localExternalProbabilities[eventId]
  const probability = percentage / 100
  emit('update-probability', { type: 'external', eventId, probability })
}

// 保存难度倍率
function saveDifficultyMultiplier(level) {
  const multiplier = localDifficultyMultipliers[level]
  emit('update-difficulty', { level, multiplier })
}

// 重置所有冷却
function resetAllCooldowns() {
  emit('reset-cooldowns')
}

// 关闭弹窗
function handleClose() {
  emit('close')
}
</script>

<template>
  <div v-if="visible" class="debug-overlay" @click.self="handleClose">
    <div class="debug-modal">
      <!-- 标题栏 -->
      <div class="modal-header">
        <h2 class="modal-title">🐛 调试工具</h2>
        <button class="close-btn" @click="handleClose">✕</button>
      </div>
      
      <!-- 标签页导航 -->
      <div class="tab-nav">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'general' }"
          @click="activeTab = 'general'"
        >
          📋 通用
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'internal' }"
          @click="activeTab = 'internal'"
        >
          🍳 内部事件
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'external' }"
          @click="activeTab = 'external'"
        >
          🎭 外部事件
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'difficulty' }"
          @click="activeTab = 'difficulty'"
        >
          ⚙️ 难度
        </button>
      </div>
      
      <!-- 内容区域 -->
      <div class="modal-content">
        <!-- 通用标签页 -->
        <div v-if="activeTab === 'general'" class="tab-content">
          <div class="section">
            <h3 class="section-title">👥 顾客控制</h3>
            <div class="control-row">
              <span>生成模式</span>
              <button 
                class="toggle-btn" 
                :class="{ active: customerSpawnEnabled }"
                @click="emit('toggle-spawn')"
              >
                {{ customerSpawnEnabled ? '自动' : '手动' }}
              </button>
            </div>
            <div class="control-row">
              <span>当前顾客: {{ customerCount }}</span>
              <div class="btn-group">
                <button class="action-btn" @click="emit('spawn-customer')">
                  +1
                </button>
                <button class="action-btn" @click="emit('remove-customer', 0)" :disabled="customerCount === 0">
                  -1
                </button>
                <button class="action-btn danger" @click="emit('clear-customers')" :disabled="customerCount === 0">
                  清空
                </button>
              </div>
            </div>
            <div class="control-row">
              <span>手动生成</span>
              <div class="spawn-control">
                <select v-model.number="manualSpawnCount" class="spawn-select">
                  <option v-for="n in 7" :key="n-1" :value="n-1">{{ n-1 }} 个</option>
                </select>
                <button class="action-btn" @click="handleSpawnCustomers">
                  生成
                </button>
              </div>
            </div>
            <!-- 顾客列表 -->
            <div v-if="customers.length > 0" class="customer-list-debug">
              <div class="customer-list-header">顾客列表 (点击删除)</div>
              <div class="customer-items">
                <div 
                  v-for="(customer, index) in customers" 
                  :key="customer.id"
                  class="customer-item"
                  @click="emit('remove-customer', index)"
                >
                  <span class="customer-icon">{{ customer.icon }}</span>
                  <span class="customer-dish">{{ customer.dish }}</span>
                  <span class="remove-icon">✕</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h3 class="section-title">🍽️ 菜品生成</h3>
            <div class="dish-row">
              <select v-model="selectedDish" class="dish-select">
                <option value="">选择菜品...</option>
                <option v-for="dish in dishList" :key="dish.id" :value="dish.id">
                  {{ dish.icon }} {{ dish.name }}
                </option>
              </select>
              <button class="action-btn" @click="handleSpawnDish">生成</button>
            </div>
          </div>
          
          <div class="section">
            <h3 class="section-title">🎲 事件系统</h3>
            <div class="control-row">
              <span>事件系统</span>
              <button 
                class="toggle-btn" 
                :class="{ active: eventsEnabled }"
                @click="emit('toggle-events')"
              >
                {{ eventsEnabled ? '开启' : '关闭' }}
              </button>
            </div>
            <div class="control-row">
              <span>当前难度: {{ difficultyNames[currentDifficulty] }}</span>
              <button class="action-btn warning" @click="resetAllCooldowns">
                🔄 重置冷却
              </button>
            </div>
          </div>
        </div>
        
        <!-- 内部事件标签页 -->
        <div v-if="activeTab === 'internal'" class="tab-content">
          <div class="events-header">
            <span>事件名称</span>
            <span>概率 (%)</span>
            <span>操作</span>
          </div>
          <div class="events-list">
            <div 
              v-for="event in internalEventList" 
              :key="event.id"
              class="event-row"
            >
              <div class="event-name">
                <span class="event-icon">{{ event.icon }}</span>
                {{ event.name }}
              </div>
              <input 
                type="number" 
                class="probability-input"
                v-model.number="localInternalProbabilities[event.id]"
                min="0"
                max="100"
                step="0.1"
              />
              <button 
                class="trigger-btn"
                @click="saveInternalProbability(event.id)"
              >
                💾 保存
              </button>
            </div>
          </div>
        </div>
        
        <!-- 外部事件标签页 -->
        <div v-if="activeTab === 'external'" class="tab-content">
          <div class="events-header external">
            <span>事件名称</span>
            <span>类型</span>
            <span>概率 (%)</span>
            <span>操作</span>
          </div>
          <div class="events-list">
            <div 
              v-for="event in externalEventList" 
              :key="event.id"
              class="event-row external"
            >
              <div class="event-name">
                <span class="event-icon">{{ event.icon }}</span>
                {{ event.name }}
              </div>
              <span class="event-category" :class="event.category">
                {{ event.category === 'interactive' ? '交互' : '被动' }}
              </span>
              <input 
                type="number" 
                class="probability-input"
                v-model.number="localExternalProbabilities[event.id]"
                min="0"
                max="100"
                step="0.1"
              />
              <button 
                class="trigger-btn"
                @click="saveExternalProbability(event.id)"
              >
                💾 保存
              </button>
            </div>
          </div>
        </div>
        
        <!-- 难度标签页 -->
        <div v-if="activeTab === 'difficulty'" class="tab-content">
          <div class="info-box">
            <p>📅 当前天数: <strong>第 {{ currentDay }} 天</strong></p>
            <p>⚙️ 当前难度: <strong>{{ difficultyNames[currentDifficulty] }}</strong></p>
            <p class="hint">难度倍率会乘以事件的基础概率</p>
          </div>
          
          <div class="difficulty-list">
            <div 
              v-for="(config, level) in difficultyMultipliers" 
              :key="level"
              class="difficulty-row"
              :class="{ current: level === currentDifficulty }"
            >
              <div class="difficulty-info">
                <span class="difficulty-name">{{ difficultyNames[level] }}</span>
                <span class="difficulty-days">
                  第 {{ config.days[0] }}-{{ config.days[1] === Infinity ? '∞' : config.days[1] }} 天
                </span>
              </div>
              <div class="multiplier-control">
                <span>倍率:</span>
                <input 
                  type="number" 
                  class="multiplier-input"
                  v-model.number="localDifficultyMultipliers[level]"
                  min="0"
                  max="10"
                  step="0.1"
                />
                <span>x</span>
                <button 
                  class="trigger-btn small"
                  @click="saveDifficultyMultiplier(level)"
                >
                  💾
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.debug-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.debug-modal {
  position: relative;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border: 3px solid #6366f1;
  border-radius: 16px;
  width: 600px;
  height: 800px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 2px solid #4f46e5;
}

.modal-title {
  font-size: 20px;
  color: #a5b4fc;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: 2px solid #ef4444;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.4);
  transform: scale(1.1);
}

.tab-nav {
  display: flex;
  gap: 4px;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid #4f46e5;
}

.tab-btn {
  padding: 8px 16px;
  border: 2px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #e0e7ff;
  background: rgba(99, 102, 241, 0.2);
}

.tab-btn.active {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.tab-content {
  animation: fadeIn 0.2s ease;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.section {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid #4f46e5;
}

.section-title {
  font-size: 14px;
  color: #a5b4fc;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #4f46e5;
}

.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  color: #e0e7ff;
  font-size: 14px;
}

.toggle-btn {
  padding: 6px 16px;
  border: 2px solid #ef4444;
  border-radius: 6px;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.toggle-btn.active {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.action-btn {
  padding: 6px 14px;
  border: 2px solid #6366f1;
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(99, 102, 241, 0.4);
}

.action-btn.warning {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.action-btn.warning:hover {
  background: rgba(245, 158, 11, 0.4);
}

.dish-row {
  display: flex;
  gap: 10px;
}

.dish-select {
  flex: 1;
  padding: 8px 12px;
  background: rgba(99, 102, 241, 0.2);
  border: 2px solid #6366f1;
  border-radius: 8px;
  color: #e0e7ff;
  font-size: 13px;
  cursor: pointer;
  outline: none;
}

.dish-select:focus {
  border-color: #a5b4fc;
}

.dish-select option {
  background: #1a1a2e;
  color: #e0e7ff;
}

/* 顾客生成控制 */
.spawn-control {
  display: flex;
  gap: 8px;
  align-items: center;
}

.spawn-select {
  width: 80px;
  padding: 6px 10px;
  background: rgba(99, 102, 241, 0.2);
  border: 2px solid #6366f1;
  border-radius: 6px;
  color: #e0e7ff;
  font-size: 12px;
  cursor: pointer;
  outline: none;
}

.spawn-select:focus {
  border-color: #a5b4fc;
}

.spawn-select option {
  background: #1a1a2e;
  color: #e0e7ff;
}

/* 按钮组 */
.btn-group {
  display: flex;
  gap: 8px;
}

.action-btn.danger {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.action-btn.danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.4);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 顾客列表调试 */
.customer-list-debug {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #4f46e5;
}

.customer-list-header {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.customer-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 100px;
  overflow-y: auto;
}

.customer-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #4f46e5;
  border-radius: 6px;
  font-size: 11px;
  color: #e0e7ff;
  cursor: pointer;
  transition: all 0.2s;
}

.customer-item:hover {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.2);
}

.customer-item:hover .remove-icon {
  color: #ef4444;
}

.customer-icon {
  font-size: 14px;
}

.customer-dish {
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-icon {
  font-size: 10px;
  color: #94a3b8;
  margin-left: 2px;
}

/* 事件列表样式 */
.events-header {
  display: grid;
  grid-template-columns: 1fr 80px 80px;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(99, 102, 241, 0.2);
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #94a3b8;
}

.events-header.external {
  grid-template-columns: 1fr 60px 80px 80px;
}

.events-header span:nth-child(2),
.events-header span:nth-child(3),
.events-header span:nth-child(4) {
  text-align: center;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.event-row {
  display: grid;
  grid-template-columns: 1fr 80px 80px;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid #4f46e5;
}

.event-row.external {
  grid-template-columns: 1fr 60px 80px 80px;
}

.event-name {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e0e7ff;
  font-size: 13px;
}

.event-icon {
  font-size: 16px;
}

.event-category {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  text-align: center;
}

.event-category.interactive {
  background: rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
}

.event-category.passive {
  background: rgba(34, 197, 94, 0.3);
  color: #86efac;
}

.probability-input {
  width: 100%;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #4f46e5;
  border-radius: 6px;
  color: #e0e7ff;
  font-size: 13px;
  text-align: center;
  outline: none;
}

.probability-input:focus {
  border-color: #a5b4fc;
}

.trigger-btn {
  padding: 6px 12px;
  border: 2px solid #22c55e;
  border-radius: 6px;
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
}

.trigger-btn:hover {
  background: rgba(34, 197, 94, 0.4);
}

.trigger-btn.small {
  padding: 4px 8px;
  font-size: 12px;
}

/* 难度设置样式 */
.info-box {
  padding: 16px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid #4f46e5;
  border-radius: 12px;
  margin-bottom: 16px;
}

.info-box p {
  margin: 4px 0;
  color: #e0e7ff;
  font-size: 14px;
}

.info-box strong {
  color: #fbbf24;
}

.info-box .hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 8px;
}

.difficulty-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.difficulty-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 2px solid transparent;
}

.difficulty-row.current {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.2);
}

.difficulty-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.difficulty-name {
  color: #e0e7ff;
  font-size: 14px;
  font-weight: bold;
}

.difficulty-days {
  color: #94a3b8;
  font-size: 12px;
}

.multiplier-control {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e0e7ff;
  font-size: 13px;
}

.multiplier-input {
  width: 70px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #4f46e5;
  border-radius: 6px;
  color: #fbbf24;
  font-size: 14px;
  text-align: center;
  outline: none;
}

.multiplier-input:focus {
  border-color: #a5b4fc;
}
</style>
