/**
 * 游戏数据层索引
 * Game Data Index
 */

export * from './ingredients'
export * from './dishes'
export * from './customers'
export * from './config'
export * from './appliances'

// 默认导出所有数据
import { rawIngredients, preparedIngredients, seasonings } from './ingredients'
import dishes from './dishes'
import customerTypes from './customers'
import gameConfig from './config'
import appliances from './appliances'

export default {
  rawIngredients,
  preparedIngredients,
  seasonings,
  dishes,
  customerTypes,
  gameConfig,
  appliances
}
