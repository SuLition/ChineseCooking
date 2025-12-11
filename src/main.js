import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// 注册菜谱测试工具到全局
import { registerGlobalTools } from './game/tools/recipeTestTools'
registerGlobalTools()

createApp(App).mount('#app')
