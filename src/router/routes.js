export default [
  {
    path: "/",
    component: () => import("~/App.vue"),
  },
  {
    path: "/:notFound(.*)",
    component: () => import("~/views/NotFound.vue"),
  },
];
