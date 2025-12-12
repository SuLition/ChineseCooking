/**
 * 游戏状态存储
 * Game State Store
 * 
 * 使用模块化架构，组合各个子模块
 * 保持对外 API 完全兼容
 */

import {
  createCoreState,
  createCustomerState,
  createInventoryState,
  createApplianceStateModule,
  createUserDataState
} from './modules'

// ========== 单例实例 ==========
let storeInstance = null

/**
 * 创建 Store 实例
 */
function createGameStore() {
  // 1. 创建用户数据模块（其他模块依赖）
  const userDataModule = createUserDataState()
  const { userData } = userDataModule
  
  // 2. 创建核心状态模块
  const coreModule = createCoreState()
  const { state } = coreModule
  
  // 3. 创建顾客状态模块
  const customerModule = createCustomerState()
  const { customers, selectedCustomerIndex, cookingState } = customerModule
  
  // 4. 创建库存模块（依赖 userData）
  const inventoryModule = createInventoryState(userData)
  const { selectedIngredients, preparedItems, inventory } = inventoryModule
  
  // 5. 创建厨具模块（依赖 userData）
  const applianceModule = createApplianceStateModule(userData)
  const { applianceStates, userApplianceLayout } = applianceModule
  
  // 初始化布局和厨具状态
  applianceModule.initUserApplianceLayout()
  applianceModule.initApplianceStates()
  
  // ========== 组合 Actions（保持 API 兼容） ==========
  
  // 打烊时需要调用多个模块
  function closeShop() {
    coreModule.closeShop()
    customerModule.clearCustomers()
  }
  
  // 开店时需要调用多个模块
  function openShop() {
    coreModule.openShop()
    customerModule.clearCustomers()
  }
  
  // 购买食材需要访问 state
  function buyIngredient(ingredientId, count, price) {
    return inventoryModule.buyIngredient(ingredientId, count, price, state)
  }
  
  // 购买调料需要访问 state
  function buySeasoning(seasoningId, amount, price) {
    return inventoryModule.buySeasoning(seasoningId, amount, price, state)
  }
  
  // 购买厨具需要重新初始化布局
  function buyAppliance(applianceId, price) {
    return userDataModule.buyAppliance(
      applianceId,
      price,
      state,
      applianceModule.initUserApplianceLayout,
      applianceModule.initApplianceStates
    )
  }
  
  // 购买盘子需要访问 state
  function buyPlates(count, price) {
    return userDataModule.buyPlates(count, price, state)
  }
  
  // 开始修理厨具需要访问 state
  function startRepairingAppliance(applianceId, repairTime, repairCost = 0) {
    return applianceModule.startRepairingAppliance(applianceId, repairTime, repairCost, state)
  }
  
  // ========== 返回统一接口 ==========
  return {
    // 状态
    state,
    customers,
    selectedCustomerIndex,
    cookingState,
    selectedIngredients,
    inventory,
    applianceStates,
    preparedItems,
    userApplianceLayout,
    userData,
    
    // 初始化函数
    initApplianceStates: applianceModule.initApplianceStates,
    initUserApplianceLayout: applianceModule.initUserApplianceLayout,
    
    // 计算属性（来自 coreModule）
    formattedTime: coreModule.formattedTime,
    goalProgress: coreModule.goalProgress,
    availableStations: coreModule.availableStations,
    tipBonus: coreModule.tipBonus,
    speedBonus: coreModule.speedBonus,
    
    // 计算属性（来自 customerModule）
    selectedCustomer: customerModule.selectedCustomer,
    
    // Core Actions
    startGame: coreModule.startGame,
    openShop,
    closeShop,
    updateTime: coreModule.updateTime,
    addMoney: coreModule.addMoney,
    deductMoney: coreModule.deductMoney,
    addReputation: coreModule.addReputation,
    incrementCombo: coreModule.incrementCombo,
    resetCombo: coreModule.resetCombo,
    serveCustomer: coreModule.serveCustomer,
    buyUpgrade: coreModule.buyUpgrade,
    
    // Customer Actions
    addCustomer: customerModule.addCustomer,
    removeCustomer: customerModule.removeCustomer,
    selectCustomer: customerModule.selectCustomer,
    updateCustomerPatience: customerModule.updateCustomerPatience,
    
    // Inventory Actions
    toggleIngredient: inventoryModule.toggleIngredient,
    clearSelectedIngredients: inventoryModule.clearSelectedIngredients,
    getInventory: inventoryModule.getInventory,
    consumeIngredients: inventoryModule.consumeIngredients,
    buyIngredient,
    hasEnoughIngredients: inventoryModule.hasEnoughIngredients,
    removePrepared: inventoryModule.removePrepared,
    clearPrepared: inventoryModule.clearPrepared,
    getSeasoningAmount: inventoryModule.getSeasoningAmount,
    consumeSeasoning: inventoryModule.consumeSeasoning,
    spillSeasoning: inventoryModule.spillSeasoning,
    buySeasoning,
    
    // Appliance Actions
    addIngredientToAppliance: applianceModule.addIngredientToAppliance,
    startProcessing: applianceModule.startProcessing,
    updateApplianceProgress: applianceModule.updateApplianceProgress,
    checkBurn: applianceModule.checkBurn,
    serveDish: applianceModule.serveDish,
    clearAppliance: applianceModule.clearAppliance,
    addTrashToTrashBin: applianceModule.addTrashToTrashBin,
    startEmptyingTrash: applianceModule.startEmptyingTrash,
    updateTrashCleaningProgress: applianceModule.updateTrashCleaningProgress,
    getTrashFillPercent: applianceModule.getTrashFillPercent,
    removeIngredientFromAppliance: applianceModule.removeIngredientFromAppliance,
    resetAppliance: applianceModule.resetAppliance,
    cleanAppliance: applianceModule.cleanAppliance,
    updateCleaningProgress: applianceModule.updateCleaningProgress,
    getBurnProgress: applianceModule.getBurnProgress,
    breakAppliance: applianceModule.breakAppliance,
    startRepairingAppliance,
    updateRepairingProgress: applianceModule.updateRepairingProgress,
    isApplianceBroken: applianceModule.isApplianceBroken,
    isApplianceRepairing: applianceModule.isApplianceRepairing,
    updateAppliancePosition: applianceModule.updateAppliancePosition,
    addAppliance: applianceModule.addAppliance,
    removeAppliance: applianceModule.removeAppliance,
    
    // User Data Actions
    getUserData: userDataModule.getUserData,
    buyAppliance,
    hasAppliance: userDataModule.hasAppliance,
    getPlatesCount: userDataModule.getPlatesCount,
    buyPlates,
    usePlate: userDataModule.usePlate,
    returnPlate: userDataModule.returnPlate
  }
}

// ========== 导出 ==========
export const useGameStore = () => {
  if (!storeInstance) {
    storeInstance = createGameStore()
  }
  return storeInstance
}

export default useGameStore
