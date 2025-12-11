/**
 * 音效系统
 * SoundSystem - Web Audio API 实现
 */

class SoundManager {
  constructor() {
    this.audioContext = null
    this.masterGain = null
    this.musicGain = null
    this.sfxGain = null
    this.isMuted = false
    this.musicEnabled = true
    this.sfxEnabled = true
    this.musicVolume = 0.3
    this.sfxVolume = 0.5
    this.bgmInterval = null
    this.closingBgmInterval = null  // 打烊GBM定时器
    this.activeSounds = new Map()
    this.initialized = false
  }

  async init() {
    if (this.initialized) return
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)
      this.masterGain.gain.value = 0.8
      this.musicGain = this.audioContext.createGain()
      this.musicGain.connect(this.masterGain)
      this.musicGain.gain.value = this.musicVolume
      this.sfxGain = this.audioContext.createGain()
      this.sfxGain.connect(this.masterGain)
      this.sfxGain.gain.value = this.sfxVolume
      this.initialized = true
      console.log('🔊 音效系统初始化完成')
    } catch (e) {
      console.error('音效初始化失败:', e)
    }
  }

  resume() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  createOscillator(type, frequency, duration, gain = 0.3) {
    if (!this.initialized || !this.sfxEnabled) return
    const osc = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    osc.type = type
    osc.frequency.value = frequency
    gainNode.gain.setValueAtTime(gain, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)
    osc.connect(gainNode)
    gainNode.connect(this.sfxGain)
    osc.start()
    osc.stop(this.audioContext.currentTime + duration)
  }

  createNoise(duration, gain = 0.1) {
    if (!this.initialized || !this.sfxEnabled) return
    const bufferSize = this.audioContext.sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer
    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(gain, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 3000
    noise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(this.sfxGain)
    noise.start()
    noise.stop(this.audioContext.currentTime + duration)
  }

  // ========== UI 音效 ==========
  playClick() {
    this.createOscillator('sine', 800, 0.05, 0.15)
    setTimeout(() => this.createOscillator('sine', 1000, 0.03, 0.1), 20)
  }

  playSelect() {
    this.createOscillator('sine', 600, 0.08, 0.2)
    setTimeout(() => this.createOscillator('sine', 800, 0.08, 0.15), 50)
  }

  playHover() {
    this.createOscillator('sine', 400, 0.03, 0.05)
  }

  // ========== 顾客音效 ==========
  playCustomerArrive() {
    [523, 659, 784, 1047].forEach((f, i) => 
      setTimeout(() => this.createOscillator('sine', f, 0.15, 0.2), i * 100)
    )
  }

  playCustomerHappy() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => 
      setTimeout(() => this.createOscillator('sine', f, 0.12, 0.15), i * 60)
    )
  }

  playCustomerAngry() {
    this.createOscillator('sawtooth', 200, 0.3, 0.15)
    setTimeout(() => this.createOscillator('sawtooth', 150, 0.4, 0.12), 150)
  }

  playCustomerWarning() {
    this.createOscillator('square', 440, 0.1, 0.1)
    setTimeout(() => this.createOscillator('square', 440, 0.1, 0.1), 150)
  }

  // ========== 烹饪音效 ==========
  playChop() {
    this.createNoise(0.08, 0.25)
    this.createOscillator('triangle', 200 + Math.random() * 100, 0.05, 0.15)
  }

  playSizzle() {
    if (!this.initialized || !this.sfxEnabled) return
    const duration = 0.3
    const bufferSize = this.audioContext.sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.audioContext.sampleRate
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 5) * 0.5
    }
    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 5000 + Math.random() * 3000
    filter.Q.value = 2
    const gain = this.audioContext.createGain()
    gain.gain.value = 0.15
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain)
    noise.start()
    noise.stop(this.audioContext.currentTime + duration)
  }

  startSizzleLoop() {
    if (this.activeSounds.has('sizzle')) return
    this.activeSounds.set('sizzle', setInterval(() => this.sfxEnabled && this.playSizzle(), 200))
  }

  stopSizzleLoop() {
    if (this.activeSounds.has('sizzle')) {
      clearInterval(this.activeSounds.get('sizzle'))
      this.activeSounds.delete('sizzle')
    }
  }

  playStirFry() {
    this.createNoise(0.15, 0.2)
    this.createOscillator('sine', 150 + Math.random() * 50, 0.1, 0.1)
  }

  playBoil() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.createOscillator('sine', 100 + Math.random() * 100, 0.08, 0.08), i * 30)
    }
  }

  startBoilLoop() {
    if (this.activeSounds.has('boil')) return
    this.activeSounds.set('boil', setInterval(() => this.sfxEnabled && this.playBoil(), 300))
  }

  stopBoilLoop() {
    if (this.activeSounds.has('boil')) {
      clearInterval(this.activeSounds.get('boil'))
      this.activeSounds.delete('boil')
    }
  }

  playSteam() {
    if (!this.initialized || !this.sfxEnabled) return
    const duration = 0.4
    const bufferSize = this.audioContext.sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3
    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 2000
    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.08, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain)
    noise.start()
    noise.stop(this.audioContext.currentTime + duration)
  }

  startSteamLoop() {
    if (this.activeSounds.has('steam')) return
    this.activeSounds.set('steam', setInterval(() => this.sfxEnabled && this.playSteam(), 500))
  }

  stopSteamLoop() {
    if (this.activeSounds.has('steam')) {
      clearInterval(this.activeSounds.get('steam'))
      this.activeSounds.delete('steam')
    }
  }

  playGrill() {
    this.createNoise(0.2, 0.15)
    this.createOscillator('sawtooth', 80, 0.1, 0.05)
  }

  startGrillLoop() {
    if (this.activeSounds.has('grill')) return
    this.activeSounds.set('grill', setInterval(() => this.sfxEnabled && this.playGrill(), 400))
  }

  stopGrillLoop() {
    if (this.activeSounds.has('grill')) {
      clearInterval(this.activeSounds.get('grill'))
      this.activeSounds.delete('grill')
    }
  }

  playFlip() {
    this.createNoise(0.1, 0.2)
    this.createOscillator('sine', 300, 0.08, 0.1)
    setTimeout(() => this.createOscillator('sine', 400, 0.08, 0.1), 50)
  }

  playKnead() {
    this.createNoise(0.15, 0.12)
    this.createOscillator('sine', 100, 0.1, 0.08)
  }

  playMix() {
    this.createOscillator('sine', 200 + Math.random() * 50, 0.08, 0.08)
    this.createNoise(0.05, 0.05)
  }

  playPlate() {
    this.createOscillator('sine', 800, 0.1, 0.15)
    this.createOscillator('triangle', 1200, 0.08, 0.1)
  }

  playSeasoning() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => this.createOscillator('sine', 2000 + Math.random() * 1000, 0.02, 0.08), i * 20)
    }
  }

  // ========== 成就/奖励音效 ==========
  playSuccess() {
    [523, 659, 784].forEach((f, i) => 
      setTimeout(() => this.createOscillator('sine', f, 0.2, 0.2), i * 80)
    )
  }

  playPerfect() {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => 
      setTimeout(() => {
        this.createOscillator('sine', f, 0.15, 0.2)
        this.createOscillator('triangle', f * 2, 0.1, 0.1)
      }, i * 70)
    )
  }

  playFail() {
    this.createOscillator('sawtooth', 200, 0.3, 0.2)
    setTimeout(() => this.createOscillator('sawtooth', 150, 0.4, 0.15), 200)
  }

  playCoin() {
    this.createOscillator('sine', 1200, 0.1, 0.15)
    setTimeout(() => this.createOscillator('sine', 1600, 0.15, 0.12), 50)
  }

  playCoins(count = 1) {
    for (let i = 0; i < Math.min(count, 5); i++) {
      setTimeout(() => this.playCoin(), i * 80)
    }
  }

  playLevelUp() {
    [392, 523, 659, 784, 1047].forEach((f, i) => 
      setTimeout(() => {
        this.createOscillator('sine', f, 0.25, 0.2)
        this.createOscillator('triangle', f * 1.5, 0.2, 0.1)
      }, i * 120)
    )
  }

  playCombo(combo) {
    const baseFreq = 400 + Math.min(combo, 10) * 50
    this.createOscillator('sine', baseFreq, 0.15, 0.2)
    setTimeout(() => this.createOscillator('sine', baseFreq * 1.5, 0.1, 0.15), 50)
    setTimeout(() => this.createOscillator('sine', baseFreq * 2, 0.1, 0.1), 100)
  }

  playAchievement() {
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => 
      setTimeout(() => this.createOscillator('sine', f, 0.2, 0.18), i * 100)
    )
  }

  playGoalComplete() {
    [392, 523, 659, 784, 1047, 1319, 1568].forEach((f, i) => 
      setTimeout(() => {
        this.createOscillator('sine', f, 0.2, 0.2)
        if (i > 3) this.createOscillator('triangle', f * 2, 0.15, 0.1)
      }, i * 80)
    )
  }

  playUpgrade() {
    this.createOscillator('sine', 400, 0.1, 0.15)
    setTimeout(() => this.createOscillator('sine', 600, 0.1, 0.15), 80)
    setTimeout(() => this.createOscillator('sine', 800, 0.15, 0.2), 160)
  }

  playEventAlert() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.createOscillator('sine', 880, 0.1, 0.2), i * 200)
    }
  }

  playOpenShop() {
    [262, 330, 392, 523].forEach((f, i) => 
      setTimeout(() => this.createOscillator('sine', f, 0.2, 0.2), i * 100)
    )
  }

  playCloseShop() {
    [523, 392, 330, 262].forEach((f, i) => 
      setTimeout(() => this.createOscillator('sine', f, 0.2, 0.15), i * 100)
    )
  }

  playBuy() {
    this.createOscillator('sine', 600, 0.08, 0.15)
    setTimeout(() => this.createOscillator('sine', 800, 0.08, 0.12), 60)
  }

  // ========== 背景音乐 ==========
  startBGM() {
    if (!this.initialized || !this.musicEnabled) return
    if (this.bgmInterval) clearInterval(this.bgmInterval)
    
    const patterns = [
      [262, 294, 330, 392, 440, 392, 330, 294],
      [330, 392, 440, 523, 440, 392, 330, 262],
      [392, 440, 523, 587, 523, 440, 392, 330],
      [294, 330, 392, 440, 392, 330, 294, 262],
    ]
    let pIdx = 0, nIdx = 0
    
    const playNote = () => {
      if (!this.musicEnabled) return
      const freq = patterns[pIdx][nIdx]
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.08, this.audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4)
      osc.connect(gain)
      gain.connect(this.musicGain)
      osc.start()
      osc.stop(this.audioContext.currentTime + 0.5)
      
      if (nIdx % 2 === 0) {
        const osc2 = this.audioContext.createOscillator()
        const gain2 = this.audioContext.createGain()
        osc2.type = 'triangle'
        osc2.frequency.value = freq / 2
        gain2.gain.setValueAtTime(0.04, this.audioContext.currentTime)
        gain2.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.6)
        osc2.connect(gain2)
        gain2.connect(this.musicGain)
        osc2.start()
        osc2.stop(this.audioContext.currentTime + 0.7)
      }
      
      nIdx++
      if (nIdx >= patterns[pIdx].length) {
        nIdx = 0
        pIdx = (pIdx + 1) % patterns.length
      }
    }
    
    this.bgmInterval = setInterval(playNote, 500)
    playNote()
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval)
      this.bgmInterval = null
    }
  }

  /**
   * 打烊背景音乐 - 较慢、柔和的旋律，营造“收尾”氛围
   */
  startClosingBGM() {
    if (!this.initialized || !this.musicEnabled) return
    if (this.closingBgmInterval) clearInterval(this.closingBgmInterval)
    
    // 使用小调音阶，节奏更慢，营造“一天结束”的感觉
    const patterns = [
      [392, 349, 330, 294, 262, 294, 330, 294],  // G F E D C D E D
      [330, 294, 262, 247, 262, 294, 330, 349],  // E D C B C D E F
      [294, 262, 247, 220, 247, 262, 294, 262],  // D C B A B C D C
      [262, 247, 220, 196, 220, 247, 262, 294],  // C B A G A B C D
    ]
    let pIdx = 0, nIdx = 0
    
    const playNote = () => {
      if (!this.musicEnabled) return
      const freq = patterns[pIdx][nIdx]
      
      // 主旋律 - 更柔和
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.06, this.audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.6)
      osc.connect(gain)
      gain.connect(this.musicGain)
      osc.start()
      osc.stop(this.audioContext.currentTime + 0.7)
      
      // 低音伴奏 - 更深沉
      if (nIdx % 2 === 0) {
        const osc2 = this.audioContext.createOscillator()
        const gain2 = this.audioContext.createGain()
        osc2.type = 'triangle'
        osc2.frequency.value = freq / 2
        gain2.gain.setValueAtTime(0.03, this.audioContext.currentTime)
        gain2.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8)
        osc2.connect(gain2)
        gain2.connect(this.musicGain)
        osc2.start()
        osc2.stop(this.audioContext.currentTime + 0.9)
      }
      
      nIdx++
      if (nIdx >= patterns[pIdx].length) {
        nIdx = 0
        pIdx = (pIdx + 1) % patterns.length
      }
    }
    
    // 更慢的节奏（700ms vs 正常BGM的500ms）
    this.closingBgmInterval = setInterval(playNote, 700)
    playNote()
  }

  stopClosingBGM() {
    if (this.closingBgmInterval) {
      clearInterval(this.closingBgmInterval)
      this.closingBgmInterval = null
    }
  }

  // ========== 音量控制 ==========
  setMasterVolume(v) {
    if (this.masterGain) this.masterGain.gain.value = v
  }

  setMusicVolume(v) {
    this.musicVolume = v
    if (this.musicGain) this.musicGain.gain.value = v
  }

  setSFXVolume(v) {
    this.sfxVolume = v
    if (this.sfxGain) this.sfxGain.gain.value = v
  }

  toggleMute() {
    this.isMuted = !this.isMuted
    if (this.masterGain) this.masterGain.gain.value = this.isMuted ? 0 : 0.8
    return this.isMuted
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled
    this.musicEnabled ? this.startBGM() : this.stopBGM()
    return this.musicEnabled
  }

  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled
    if (!this.sfxEnabled) this.stopAllLoops()
    return this.sfxEnabled
  }

  stopAllLoops() {
    this.stopSizzleLoop()
    this.stopBoilLoop()
    this.stopSteamLoop()
    this.stopGrillLoop()
  }

  stopAll() {
    this.stopBGM()
    this.stopClosingBGM()
    this.stopAllLoops()
  }
}

// 导出单例
export const soundManager = new SoundManager()
export default soundManager
