/**
 * 商店组合式函数
 * useShop Composable
 */
import { ref, computed } from 'vue'
import { createShopSystem } from '../systems/ShopSystem'

/**
 * 商店组合式函数
 * @param {Object} options - 配置项
 * @param {Object} options.gameState - 游戏状态
 * @param {Object} options.inventory - 库存对象
 * @param {Object} options.applianceStates - 厨具状态
 * @param {Function} options.showToast - 显示提示函数
 */
export function useShop({ gameState, inventory, applianceStates, showToast }) {
  // 当前激活的标签页
  const activeTab = ref('ingredients') // 'ingredients' | 'equipment'
  
  // 创建商店系统
  const shopSystem = createShopSystem({
    gameState,
    inventory,
    applianceStates,
    showToast
  })
  
  // 已拥有的厨具ID列表（计算属性）
  const ownedApplianceIds = computed(() => shopSystem.getOwnedApplianceIds())
  
  // 可购买的设备列表（计算属性）
  const purchasableEquipment = computed(() => shopSystem.getPurchasableEquipment())
  
  // 切换标签页
  function setActiveTab(tab) {
    activeTab.value = tab
  }
  
  return {
    // 状态
    activeTab,
    ownedApplianceIds,
    purchasableEquipment,
    
    // 数据
    ingredientCategories: shopSystem.ingredientCategories,
    buyQuantityOptions: shopSystem.buyQuantityOptions,
    
    // 方法
    setActiveTab,
    buyIngredient: shopSystem.buyIngredient,
    canAffordIngredient: shopSystem.canAffordIngredient,
    getIngredientStock: shopSystem.getIngredientStock,
    buyAppliance: shopSystem.buyAppliance,
    canAffordAppliance: shopSystem.canAffordAppliance,
    isApplianceOwned: shopSystem.isApplianceOwned
  }
}

export default useShop
