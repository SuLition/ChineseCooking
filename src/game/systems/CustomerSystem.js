/**
 * 顾客系统
 * Customer System
 * 
 * 管理顾客生成、耐心、服务等逻辑
 */

import { getRandomCustomerType } from '../data/customers'
import { getAvailableDishesByLevel, getSuggestedPatience, dishes, getPreparedCount, getSeasoningCount } from '../data/dishes'
import { gameConfig } from '../data/config'
import { appliances } from '../data/appliances'

export class CustomerSystem {
  constructor(store, timeSystem) {
    this.store = store
    this.timeSystem = timeSystem
    this.customerIdCounter = 0
  }
  
  /**
   * 生成指定菜品的顾客（调试用）
   * @param {string} dishId 菜品ID
   * @returns {Object|null} 生成的顾客对象
   */
  spawnCustomerWithDish(dishId) {
    if (!this.store.state.isOpen) return null
    
    const dish = dishes[dishId]
    if (!dish) return null
    
    const customerType = getRandomCustomerType()

    const patience = this.calculatePatience(dish, customerType)
    
    const customer = this.createCustomerFromDish(dish, customerType, patience)
    
    this.store.addCustomer(customer)
    return customer
  }
  
  /**
   * 从菜品创建顾客对象
   */
  createCustomerFromDish(dish, customerType, patience) {
    // 获取厨具信息
    const applianceData = appliances[dish.appliance]
    
    return {
      id: ++this.customerIdCounter,
      typeId: customerType.id,
      name: customerType.name,
      icon: customerType.icon,
      image: customerType.image,  // 顾客图片
      dish: dish.name,
      dishId: dish.id,
      dishIcon: dish.icon,
      dishImage: dish.image,
      // 厨具信息
      applianceId: dish.appliance,
      applianceName: applianceData?.name || '',
      applianceIcon: applianceData?.icon || '',
      applianceImage: applianceData?.image || '',
      recipe: [...dish.recipe], // 新版配方
      patience: patience,
      maxPatience: patience,
      reward: dish.price,
      difficulty: dish.difficulty,
      tipMultiplier: customerType.tip * this.store.tipBonus.value,
      special: customerType.special
    }
  }
  
  /**
   * 生成新顾客
   * @returns {Object|null} 生成的顾客对象，如果无法生成返回null
   */
  spawnCustomer() {
    if (!this.store.state.isOpen) return null
    if (this.store.customers.value.length >= gameConfig.maxCustomers) return null
    
    // 获取可用菜品（基于等级）
    const availableDishes = getAvailableDishesByLevel(this.store.state.level)
    if (availableDishes.length === 0) return null
    
    // 随机选择菜品和顾客类型
    const dish = availableDishes[Math.floor(Math.random() * availableDishes.length)]
    const customerType = getRandomCustomerType()
    
    // 计算耐心值
    const patience = this.calculatePatience(dish, customerType)
    
    // 创建顾客对象
    const customer = this.createCustomerFromDish(dish, customerType, patience)
    
    this.store.addCustomer(customer)
    return customer
  }
  
  /**
   * 计算顾客耐心值
   * 基于配方复杂度、难度、价格和顾客类型
   */
  calculatePatience(dish, customerType) {
    // 使用菜品的建议耐心值
    const basePatience = getSuggestedPatience(dish)
    
    // 考虑配方数量（配方越复杂，需要的时间越长）
    const preparedCount = getPreparedCount(dish)
    const seasoningCount = getSeasoningCount(dish)
    const recipeBonus = (preparedCount * 15) + (seasoningCount * 5)
    
    return Math.floor((basePatience + recipeBonus) * customerType.patience)
  }
  
  /**
   * 智能生成顾客（基于时间段概率和当前顾客数量）
   * @returns {Object|null} 生成的顾客对象
   */
  trySpawnCustomer() {
    if (!this.store.state.isOpen) return null
    if (this.store.customers.value.length >= gameConfig.maxCustomers) return null
    
    // 基础概率（时间段）
    const baseChance = this.timeSystem.getSpawnChance()
    
    // 顾客数量修正：顾客越少概率越高，顾客越多概率越低
    // 0个顾客 -> 6倍
    // 1个顾客 -> 5倍
    // 2个顾客 -> 4倍
    // 3个顾客 -> 3倍
    // 4个顾客 -> 2倍
    // 5个顾客 -> 1倍
    // 6个顾客 -> 0倍
    const currentCount = this.store.customers.value.length
    const customerMultiplier = Math.max(0, 6 - currentCount)
    
    // 最终概率
    const finalChance = baseChance * customerMultiplier
    
    if (Math.random() >= finalChance) return null
    
    return this.spawnCustomer()
  }
  
  /**
   * 更新所有顾客耐心值
   * @returns {Array} 离开的顾客列表
   */
  updatePatience() {
    const leftCustomers = []
    const toRemove = this.store.updateCustomerPatience()
    
    // 从后往前移除，避免索引问题
    for (let i = toRemove.length - 1; i >= 0; i--) {
      const index = toRemove[i]
      const customer = this.store.customers.value[index]
      leftCustomers.push({ ...customer, satisfied: false })
      this.customerLeave(index, false)
    }
    
    return leftCustomers
  }
  
  /**
   * 顾客离开
   * @param {number} index 顾客索引
   * @param {boolean} satisfied 是否满意
   */
  customerLeave(index, satisfied) {
    const customer = this.store.customers.value[index]
    
    if (!satisfied) {
      this.store.resetCombo()
      this.store.addReputation(-5)
    }
    
    this.store.removeCustomer(index)
    return customer
  }
  
  /**
   * 服务顾客（完成订单）
   * @param {number} index 顾客索引
   * @param {number} qualityMultiplier 品质加成
   */
  serveCustomer(index, qualityMultiplier = 1.0) {
    const customer = this.store.customers.value[index]
    if (!customer) return null
    
    // 计算收入
    const baseReward = customer.reward
    const tipMultiplier = customer.tipMultiplier
    const comboBonus = 1 + this.store.state.combo * 0.1 // 连击加成
    
    const totalReward = Math.floor(baseReward * tipMultiplier * qualityMultiplier * comboBonus)
    
    // 更新状态
    this.store.addMoney(totalReward)
    this.store.addReputation(customer.special ? 10 : 3)
    this.store.incrementCombo()
    this.store.serveCustomer()
    
    // 移除顾客
    this.store.removeCustomer(index)
    
    return {
      customer,
      reward: totalReward,
      combo: this.store.state.combo
    }
  }
  
  /**
   * 选择顾客
   */
  selectCustomer(index) {
    this.store.selectCustomer(index)
  }
  
  /**
   * 获取顾客数量
   */
  getCustomerCount() {
    return this.store.customers.value.length
  }
  
  /**
   * 清空所有顾客
   */
  clearAllCustomers() {
    this.store.customers.value = []
    this.store.selectedCustomerIndex.value = -1
  }
}

export default CustomerSystem
