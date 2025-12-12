/**
 * 顾客状态模块
 * Customer State Module
 * 
 * 管理顾客队列、选择、耐心等状态
 */

import { ref, reactive, computed } from 'vue'
import { gameConfig } from '../../data/config'
import { CUSTOMER_STATUS } from '../../constants'

/**
 * 创建顾客状态
 */
export function createCustomerState() {
  // ========== 顾客状态 ==========
  const customers = ref([])
  const selectedCustomerIndex = ref(-1)

  // ========== 烹饪状态 ==========
  const cookingState = reactive({
    currentCustomer: null,
    hint: '选择一位顾客开始烹饪'
  })

  // ========== 计算属性 ==========
  const getters = {
    // 当前选中的顾客
    selectedCustomer: computed(() => {
      if (selectedCustomerIndex.value >= 0 && selectedCustomerIndex.value < customers.value.length) {
        return customers.value[selectedCustomerIndex.value]
      }
      return null
    })
  }

  // ========== Actions ==========
  const actions = {
    // 添加顾客
    addCustomer(customer) {
      if (customers.value.length < gameConfig.maxCustomers) {
        customers.value.push(customer)
        return true
      }
      return false
    },
    
    // 移除顾客
    removeCustomer(index) {
      if (index >= 0 && index < customers.value.length) {
        customers.value.splice(index, 1)
        
        // 更新选中索引
        if (selectedCustomerIndex.value === index) {
          selectedCustomerIndex.value = -1
          cookingState.currentCustomer = null
        } else if (selectedCustomerIndex.value > index) {
          selectedCustomerIndex.value--
        }
      }
    },
    
    // 选择顾客
    selectCustomer(index) {
      selectedCustomerIndex.value = index
      if (index >= 0 && index < customers.value.length) {
        cookingState.currentCustomer = customers.value[index]
        cookingState.hint = `已选择 ${customers.value[index].name}，开始烹饪！`
      }
    },
    
    // 更新顾客耐心（用餐中的顾客不消耗耐心）
    updateCustomerPatience() {
      const toRemove = []
      customers.value.forEach((customer, index) => {
        // 用餐中的顾客不消耗耐心
        if (customer.status === CUSTOMER_STATUS.EATING) return
        
        customer.patience -= 1
        if (customer.patience <= 0) {
          toRemove.push(index)
        }
      })
      return toRemove // 返回需要移除的顾客索引
    },
    
    // 清空所有顾客（打烊时调用）
    clearCustomers() {
      customers.value = []
      selectedCustomerIndex.value = -1
      cookingState.currentCustomer = null
      cookingState.isActive = false
    }
  }

  return {
    customers,
    selectedCustomerIndex,
    cookingState,
    ...getters,
    ...actions
  }
}
