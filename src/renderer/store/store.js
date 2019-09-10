export const state = {
  expendMenu: false,
};

export const mutations = {
  SET_MENU(state, showMenu) {
    state.expendMenu = showMenu;
  },
};

export const actions = {
  toggleMenu({ commit, state }) {
    // do something async
    commit('SET_MENU', !state.expendMenu);
  },
};

export const getters = {
  expendMenu: state => state.expendMenu,
};
