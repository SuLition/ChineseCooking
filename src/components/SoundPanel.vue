<script setup>
/**
 * 音效设置面板组件
 * SoundPanel Component
 */
import { ref, watch } from 'vue'
import { soundManager } from '../game/systems/SoundSystem'

defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])

const bgmEnabled = ref(soundManager.musicEnabled)
const sfxEnabled = ref(soundManager.sfxEnabled)
const musicVolume = ref(Math.round(soundManager.musicVolume * 100))
const sfxVolume = ref(Math.round(soundManager.sfxVolume * 100))

function toggleBGM() {
  const enabled = soundManager.toggleMusic()
  bgmEnabled.value = enabled
  soundManager.playClick()
}

function toggleSFX() {
  const enabled = soundManager.toggleSFX()
  sfxEnabled.value = enabled
}

// 监听音量变化
watch(musicVolume, (val) => {
  soundManager.setMusicVolume(val / 100)
})

watch(sfxVolume, (val) => {
  soundManager.setSFXVolume(val / 100)
})
</script>

<template>
  <div class="sound-panel" :class="{ active: visible }">
    <div class="sound-panel-title">🔊 音效设置</div>
    
    <div class="sound-control-row">
      <span>🎵 背景音乐</span>
      <button 
        class="sound-toggle-btn" 
        :class="{ active: bgmEnabled }"
        @click="toggleBGM"
      >
        {{ bgmEnabled ? '开' : '关' }}
      </button>
    </div>
    
    <div class="sound-control-row">
      <span>🔈 音效</span>
      <button 
        class="sound-toggle-btn" 
        :class="{ active: sfxEnabled }"
        @click="toggleSFX"
      >
        {{ sfxEnabled ? '开' : '关' }}
      </button>
    </div>
    
    <div class="sound-control-row">
      <span>🎚️ 音乐音量</span>
      <input 
        type="range" 
        v-model="musicVolume" 
        min="0" 
        max="100"
      >
    </div>
    
    <div class="sound-control-row">
      <span>🎚️ 音效音量</span>
      <input 
        type="range" 
        v-model="sfxVolume" 
        min="0" 
        max="100"
      >
    </div>
    
    <button class="sound-close-btn" @click="$emit('close')">关闭</button>
  </div>
</template>

<style scoped>
.sound-panel {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 280px;
  background: linear-gradient(180deg, #3a2a1f 0%, #2a1a15 100%);
  border: 3px solid var(--gold);
  border-radius: 12px;
  padding: 15px;
  z-index: var(--z-sound-panel);
  display: none;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
}

.sound-panel.active {
  display: block;
  animation: fadeIn 0.2s;
}

.sound-panel-title {
  font-size: 18px;
  color: var(--gold);
  text-align: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--light-wood);
}

.sound-control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: var(--text-light);
  font-size: 14px;
}

.sound-toggle-btn {
  width: 50px;
  padding: 6px 12px;
  border: 2px solid var(--light-wood);
  background: #333;
  color: #888;
  border-radius: 5px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.sound-toggle-btn.active {
  background: var(--success-green);
  color: #fff;
  border-color: var(--success-green);
}

.sound-control-row input[type="range"] {
  width: 120px;
  height: 8px;
  -webkit-appearance: none;
  background: #444;
  border-radius: 4px;
  outline: none;
}

.sound-control-row input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: var(--gold);
  border-radius: 50%;
  cursor: pointer;
}

.sound-close-btn {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  background: linear-gradient(180deg, var(--primary-red) 0%, #8b1225 100%);
  border: 2px solid var(--gold);
  color: var(--text-light);
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  transition: all 0.2s;
}

.sound-close-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
}
</style>
