import { createRouter, createWebHistory } from "vue-router";

import DataView from "../views/DataView.vue";
import PortfolioView from "../views/PortfolioView.vue";
import ChainStatusView from "../views/ChainStatusView.vue";

const routerHistory = createWebHistory();
const routes = [
  { path: "/", component: PortfolioView },
  { path: "/data", component: DataView },
  { path: "/chain", component: ChainStatusView },
];

const router = createRouter({
  history: routerHistory,
  routes,
});

export default router;
