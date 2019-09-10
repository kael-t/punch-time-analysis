<template>
  <el-container class="height-100">
    <el-aside width="200px">
      <department-tree></department-tree>
    </el-aside>
    <el-main>
      <!-- <punch-time-table></punch-time-table> -->
      <punch-time-calendar></punch-time-calendar>
    </el-main>
  </el-container>
</template>

<script>
import DepartmentTree from './components/DepartmentTree';
// import PunchTimeTable from '@/components/PunchTimeTable';
import PunchTimeCalendar from './components/PunchTimeCalendar';
export default {
  components: {
    DepartmentTree,
    // PunchTimeTable,
    PunchTimeCalendar,
  },
};
</script>

<style scoped>
.height-100 {
  height: 100%;
}
</style>