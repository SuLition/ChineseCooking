/**
 * 时间系统
 * Time System
 * 
 * 管理游戏时间流逝和时间段判断
 */

import { getCurrentTimePeriod, gameConfig } from '../data/config'

export class TimeSystem {
  constructor(store) {
    this.store = store
    this.timer = null
  }
  
  /**
   * 获取当前时间段信息
   */
  getCurrentPeriod() {
    return getCurrentTimePeriod(this.store.state.hour)
  }
  
  /**
   * 获取当前时间段名称
   */
  getPeriodName() {
    const period = this.getCurrentPeriod()
    return `${period.icon} ${period.name}`
  }
  
  /**
   * 获取当前顾客生成概率
   */
  getSpawnChance() {
    const period = this.getCurrentPeriod()
    return period.spawnChance
  }
  
  /**
   * 格式化时间显示
   */
  getFormattedTime() {
    const h = String(this.store.state.hour).padStart(2, '0')
    const m = String(this.store.state.minute).padStart(2, '0')
    return `${h}:${m}`
  }
  
  /**
   * 推进时间
   * @returns {boolean} 是否仍在营业时间内
   */
  tick() {
    return this.store.updateTime()
  }
  
  /**
   * 重置到开店时间
   */
  reset() {
    this.store.state.hour = gameConfig.openHour
    this.store.state.minute = 0
  }
  
  /**
   * 是否是高峰期
   */
  isPeakHour() {
    const chance = this.getSpawnChance()
    return chance >= 0.30
  }
  
  /**
   * 是否是低谷期
   */
  isSlowHour() {
    const chance = this.getSpawnChance()
    return chance <= 0.10
  }
}

export default TimeSystem
