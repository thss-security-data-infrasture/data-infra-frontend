export default [
  {
    path: "/",
    component: () => import("~/views/Container.vue"),
    redirect: "/data/prov",
    children: [
      {
        path: "/data/fields",
        component: () => import("~/views/data/Fields.vue"),
      },
      {
        path: "/data/logs",
        component: () => import("~/views/data/Logs.vue"),
      },
      {
        path: "/data/prov",
        component: () => import("~/views/data/Prov.vue"),
      },
      {
        path: "/info/assets",
        component: () => import("~/views/info/Assets.vue"),
      },
      {
        path: "/info/vuls",
        component: () => import("~/views/info/Vuls.vue"),
      },
      {
        path: "/info/situation",
        component: () => import("~/views/info/Situation.vue"),
      },
      {
        path: "/knowledge/courses",
        component: () => import("~/views/knowledge/Courses.vue"),
      },
      {
        path: "/knowledge/recomms",
        component: () => import("~/views/knowledge/Recomms.vue"),
      },
      {
        path: "/knowledge/shares",
        component: () => import("~/views/knowledge/Shares.vue"),
      },
    ],
  },
  {
    path: "/range/logs",
    component: () => import("~/views/range/Logs.vue"),
  },
  {
    path: "/hw/logs",
    component: () => import("~/views/hw/Logs.vue"),
  },
  {
    path: "/:notFound(.*)",
    component: () => import("~/views/NotFound.vue"),
  },
];
