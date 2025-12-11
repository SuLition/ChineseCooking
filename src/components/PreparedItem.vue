<script setup>
/**
 * 备菜卡片组件
 * 支持拖放功能，显示堆叠数量
 */
const props = defineProps({
  preparedId: {
    type: String,
    required: true
  },
  prepared: {
    type: Object,
    required: true
  },
  count: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['dragstart', 'dragend'])

function handleDragStart(e) {
  // 创建自定义拖拽预览卡片
  const dragPreview = document.createElement('div')
  dragPreview.style.cssText = `
    position: fixed;
    top: -1000px;
    left: -1000px;
    width: 80px;
    height: 80px;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid #ffd700;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px;
    box-sizing: border-box;
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
    z-index: 9999;
    pointer-events: none;
  `
  
  // 添加图片或图标
  if (props.prepared?.image) {
    const img = document.createElement('img')
    img.src = props.prepared.image
    img.style.cssText = 'width: 40px; height: 40px; object-fit: contain;'
    dragPreview.appendChild(img)
  } else {
    const icon = document.createElement('span')
    icon.textContent = props.prepared?.icon || '❓'
    icon.style.cssText = 'font-size: 30px;'
    dragPreview.appendChild(icon)
  }
  
  // 添加名称
  const name = document.createElement('span')
  name.textContent = props.prepared?.name || '未知'
  name.style.cssText = 'font-size: 10px; color: #fff; text-align: center; margin-top: 4px;'
  dragPreview.appendChild(name)
  
  document.body.appendChild(dragPreview)
  e.dataTransfer.setDragImage(dragPreview, 40, 40)
  setTimeout(() => document.body.removeChild(dragPreview), 0)
  
  // 使用新的统一 JSON 格式
  const dragData = JSON.stringify({
    type: 'prepared',
    id: props.preparedId,
    source: 'prepared_list',
    name: props.prepared?.name || '未知',
    icon: props.prepared?.icon || '❓',
    image: props.prepared?.image || null,
    maxStack: props.prepared?.maxStack || 1
  })
  
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', dragData)
  e.target.classList.add('dragging')
  emit('dragstart', e, props.preparedId)
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging')
  emit('dragend', e)
}
</script>

<template>
  <div 
    class="prepared-item"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <div class="prepared-icon">
      <img v-if="prepared?.image" :src="prepared.image" :alt="prepared.name" class="prepared-img" />
      <span v-else>{{ prepared?.icon || '❓' }}</span>
    </div>
    <div class="prepared-name">{{ prepared?.name || '未知' }}</div>
    <div class="prepared-stock">{{ count }}</div>
  </div>
</template>

<style scoped>
.prepared-item {
  width: 80px;
  height: 80px;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid #666;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: grab;
  flex-shrink: 0;
  transition: all 0.2s;
  position: relative;
}

.prepared-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.prepared-item:hover {
  border-color: var(--gold);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.prepared-icon {
  font-size: 30px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.prepared-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.prepared-name {
  font-size: 12px;
  color: var(--text-light);
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prepared-stock {
  position: absolute;
  top: 3px;
  right: 3px;
  min-width: 22px;
  height: 16px;
  background: #4ade80;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}
</style>
