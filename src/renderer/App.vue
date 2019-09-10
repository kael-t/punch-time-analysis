<template>
  <el-container id="app">
    <el-aside width="">
      <el-menu class="side-menu" router :collapse="collapse" default-active="/">
        <el-tooltip class="item" effect="dark" content="展开" placement="right" :disabled="!collapse">
          <div :class="['toggle-btn', collapse ? '' : 'expend']" @click="toggleMenu">
            <i class="el-icon-d-arrow-right"></i>
          </div>
        </el-tooltip>
        <el-menu-item index="/">
          <i class="el-icon-menu"></i>
          <span slot="title">使用</span>
        </el-menu-item>
        <el-menu-item index="/scheduling">
          <i class="el-icon-setting"></i>
          <span slot="title">配置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <div class="content">
        <router-view></router-view>
      </div>
    </el-main>
  </el-container>
</template>

<script>
import { mapState, mapActions } from 'vuex';
export default {
  name: 'electron-demo',
  data() {
    return {
      show: false,
    };
  },
  computed: {
    ...mapState({
      collapse: state => state.expendMenu,
    }),
  },
  methods: {
    ...mapActions([
      'toggleMenu',
    ]),
  },
};
</script>

<style>
  #app {
    display: flex;
    height: 100%;
  }
  .side-menu {
    height: 100%;
  }
  .side-menu:not(.el-menu--collapse) {
    width: 200px;
  }
  .el-main {
    padding: 0;
  }
  .el-menu-item {
    font-size: 12px;
  }
  .el-menu-item [class^=el-icon-] {
    font-size: 14px;
  }
  .toggle-btn {
    height: 60px;
    line-height: 60px;
    cursor: pointer;
    text-align: center;
    color: #888;
    transition: all 300ms ease;
  }
  .toggle-btn.expend {
    transform: rotate(180deg);
  }
  .toggle-btn:hover {
    outline: 0;
    background-color: #ecf5ff;
  }
  .content {
    display: flex;
    flex: 1;
    height: 100%;
    justify-content: center;
    align-items: center;
  }
</style>
