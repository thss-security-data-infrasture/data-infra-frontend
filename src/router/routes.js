export default [
  {
    path: "/",
    component: () => import("~/views/AppContainer.vue"),
  },
  {
    path: "/:notFound(.*)",
    component: () => import("~/views/NotFound.vue"),
  },
];
