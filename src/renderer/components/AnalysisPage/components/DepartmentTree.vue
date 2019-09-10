<template>
  <el-tree
    :data="data"
    @node-click="handleClick"
  ></el-tree>
</template>

<script>
import { mapState, mapActions } from 'vuex';
export default {
  name: 'department-tree',
  computed: {
    ...mapState('Analysis', {
      data: state => state.departmentList,
    }),
  },
  methods: {
    ...mapActions('Analysis', [
      'setCurrentEmployer',
    ]),
    handleClick(vnode, node) {
      if (!node.isLeaf) return;
      const department = node.parent.label;
      const name = node.label;
      this.setCurrentEmployer({ department, name });
    },
  },
};
</script>
