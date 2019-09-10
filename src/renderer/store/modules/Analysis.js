const defaultTerm = 'A';

const state = {
  scheduling: [],
  data: null,
  departmentList: [],
  employer: null,
};

const mutations = {
  setScheduling(state, data) {
    state.scheduling = data;
  },
  setData(state, data) {
    state.data = data;
  },
  setDepartmentList(state, list) {
    state.departmentList = list;
  },
  setCurrentEmployer(state, employer) {
    // 同一个人, 无修改, 直接return
    if (state.employer && state.employer.name === employer.name) return;
    const temp = state.data
      .find(item => item.department === employer.department).employee
      .find(item => item.name === employer.name);
    // 设置默认班次
    for (let i = 0; i < temp.punchTime.length; i += 1) {
      temp.punchTime[i].term = defaultTerm;
    }
    state.employer = temp;
  },
};

const actions = {
  setAnalysisData({ commit }, payload) {
    const fs = require('fs');
    const scheduling = JSON.parse(fs.readFileSync(`${__static}/scheduling.json`).toString());
    commit('setScheduling', scheduling);
    const list = [];
    commit('setData', payload);
    for (let i = 0; i < payload.length; i += 1) {
      const temp = {
        label: payload[i].department,
        children: [],
      };

      for (let j = 0; j < payload[i].employee.length; j += 1) {
        temp.children.push({
          label: payload[i].employee[j].name,
        });
      }
      list.push(temp);
    }
    commit('setDepartmentList', list);
  },
  setCurrentEmployer({ commit }, payload) {
    commit('setCurrentEmployer', payload);
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
