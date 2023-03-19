/// <reference types="vite/client" />

declare module "vue/types/vue" {
  import { Router } from "vue-router";
  interface Vue {
    $router: Router;
  }
}
