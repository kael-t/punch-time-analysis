import Vue from 'vue';
import Vuex from 'vuex';

import {
  createPersistedState,
  // NOTE: 这里有个坑, createSharedMutations这个插件是用于electron中的vuex的状态共享的
  // 如果没有多进程需求可以不引入
  // 引入了的话需要在主进程(即main/index.js中引入vuex: import '../renderer/store'), 即能在进程中通信
  // createSharedMutations,
} from 'vuex-electron';

import modules from './modules';
import { state, mutations, actions, getters } from './store';

Vue.use(Vuex);

export default new Vuex.Store({
  state,
  mutations,
  actions,
  getters,
  modules,
  plugins: [
    createPersistedState(),
  //   createSharedMutations(),
  ],
  strict: process.env.NODE_ENV !== 'production',
});
