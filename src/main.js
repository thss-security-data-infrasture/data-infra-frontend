import { createApp } from "vue";
import router from "./router";

import ElementPlus from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

import "normalize.css";
import "element-plus/dist/index.css";

import App from "./App.vue";

const app = createApp(App);
app.use(router).use(ElementPlus).mount("#app");
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}
