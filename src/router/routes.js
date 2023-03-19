export default [
  {
    path: "/",
    component: () => import("~/views/Container.vue"),
    redirect: "/data/fields",
    children: [
      {
        path: "/data/fields",
        component: () => import("~/views/data/Fields.vue"),
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
    path: "/:notFound(.*)",
    component: () => import("~/views/NotFound.vue"),
  },
];
