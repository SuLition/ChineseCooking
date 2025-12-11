/**
 * 顾客类型数据
 * Customer Types Data
 */

// 顾客类型
export const customerTypes = {
  normal: {
    id: 'normal',
    name: '普通顾客',
    icon: '👤',
    image: '/images/customers/normal.png',
    patience: 1.0,    // 耐心倍率
    tip: 1.0,         // 小费倍率
    special: false,
    weight: 30        // 生成权重
  },
  elder_man: {
    id: 'elder_man',
    name: '老人',
    icon: '👴',
    image: '/images/customers/elder_man.png',
    patience: 1.0,
    tip: 1.0,
    special: false,
    weight: 15
  },
  elder_woman: {
    id: 'elder_woman',
    name: '老太太',
    icon: '👵',
    image: '/images/customers/elder_woman.png',
    patience: 1.0,
    tip: 1.0,
    special: false,
    weight: 15
  },
  office_worker: {
    id: 'office_worker',
    name: '上班族',
    icon: '👨‍💼',
    image: '/images/customers/office_worker.png',
    patience: 0.7,
    tip: 1.0,
    special: false,
    weight: 20
  },
  critic: {
    id: 'critic',
    name: '美食评论家',
    icon: '📝',
    image: '/images/customers/critic.png',
    patience: 1.2,
    tip: 2.0,
    special: true,
    weight: 8
  },
  couple: {
    id: 'couple',
    name: '情侣',
    icon: '👩‍❤️‍👨',
    image: '/images/customers/couple.png',
    patience: 1.2,
    tip: 1.0,
    special: false,
    weight: 10
  },
  child: {
    id: 'child',
    name: '孩子',
    icon: '👧',
    image: '/images/customers/child.png',
    patience: 0.6,
    tip: 1.0,
    special: false,
    weight: 10
  },
  foodie: {
    id: 'foodie',
    name: '美食家',
    icon: '👨‍🍳',
    image: '/images/customers/foodie.png',
    patience: 0.9,
    tip: 2.0,
    special: true,
    weight: 5
  }
}

// 获取顾客类型列表
export function getCustomerTypeList() {
  return Object.values(customerTypes)
}

// 根据权重随机选择顾客类型
export function getRandomCustomerType() {
  const types = Object.values(customerTypes)
  const totalWeight = types.reduce((sum, type) => sum + type.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const type of types) {
    random -= type.weight
    if (random <= 0) {
      return type
    }
  }
  
  return types[0] // 默认返回普通顾客
}

// 根据ID获取顾客类型
export function getCustomerTypeById(id) {
  return customerTypes[id] || null
}

export default customerTypes
