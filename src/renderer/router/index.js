import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'index',
      component: require('@/components/IndexPage/Index').default,
    },
    {
      path: '/scheduling',
      name: 'scheduling',
      component: require('@/components/SchedulingPage/SchedulingPage').default,
    },
    {
      path: '/analysis',
      name: 'analysis',
      component: require('@/components/AnalysisPage/AnalysisPage').default,
    },
    {
      path: '*',
      redirect: '/',
    },
  ],
});
