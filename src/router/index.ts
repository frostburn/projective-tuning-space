import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import UnisonPlaneView from "../views/UnisonPlaneView.vue";
import RankThreeView from "../views/RankThreeView.vue";
import MonzoSpaceView from "../views/MonzoSpaceView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/about",
      name: "about",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/AboutView.vue"),
    },
    {
      path: "/unison",
      name: "unisonPlane",
      component: UnisonPlaneView,
    },
    {
      path: "/rank3",
      name: "rankThree",
      component: RankThreeView,
    },
    {
      path: "/monzo-space",
      name: "monzoSpace",
      component: MonzoSpaceView,
    },
  ],
});

export default router;
