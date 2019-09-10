<template>
  <el-upload
    class="upload-area"
    drag
    action=""
    accept="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    :before-upload="changeHandler"
  >
    <i class="el-icon-tickets"></i>
    <div class="el-upload__text">将文件拖到此处，或<em>点击选择</em></div>
    <div class="el-upload__tip" slot="tip">
      <p>
        <span class="tips">*&nbsp;</span>只能选择xls/xlsx文件, 并保证excel满足:<br/>
        <span class="tips">&emsp;</span>1.第2列(B)为员工姓名<br/>
        <span class="tips">&emsp;</span>2.第6列(F)为打卡时间<br/>
        <span class="tips">&emsp;</span>3.第11列(K)为部门名称<br/>
      </p>
    </div>
  </el-upload>
</template>

<script>
import { mapActions } from 'vuex';
export default {
  name: 'index',
  methods: {
    ...mapActions('Analysis', [
      'setAnalysisData',
    ]),
    changeHandler({ path }) {
      const xlsx = require('node-xlsx');
      new Promise((resolve) => {
        const workSheetsFromFile = xlsx.parse(path);
        resolve(workSheetsFromFile[0].data);
      })
        .then(this.nameExcelData)
        .then(this.mergePuchTime)
        .then(this.uniqueTime)
        .then(this.filterByDepartment)
        .then((arr) => {
          this.setAnalysisData(arr);
          this.$router.push({
            path: '/analysis',
          });
        });
      return false;
    },
    // excel数据给关键列起名
    nameExcelData(excelData) {
      const formatDate = (numb) => {
        const time = new Date((numb - 1) * 24 * 3600000 + 1);
        time.setYear(time.getFullYear() - 70);
        const year = `${time.getFullYear()}`;
        const month = `${time.getUTCMonth() + 1}`;
        const date = `${time.getUTCDate()}`;
        const hour = time.getUTCHours();
        const min = time.getMinutes();
        return `${year}/${month < 10 ? `0${month}` : month}/${date < 10 ? `0${date}` : date} ${hour < 10 ? `0${hour}` : hour}:${min < 10 ? `0${min}` : min}:00`;
      };
      return excelData.map(item => ({
        name: item[1],
        department: item[10],
        punchTime: formatDate(item[5]),
      }));
    },
    // 去掉表头, 并把同一个人的打卡数据合并到一个数组中
    mergePuchTime(list) {
      const arr = [];
      list.slice(1).forEach((item) => {
        const index = arr.findIndex(temp => temp.name === item.name);
        if (index > -1) {
          arr[index].punchTimeList.push(item.punchTime);
        } else {
          arr.push({
            name: item.name,
            department: item.department,
            punchTimeList: [item.punchTime],
          });
        }
      });
      return arr;
    },
    // 日期和时间分离并去重
    uniqueTime(arr) {
      return arr.map((item) => {
        const result = [];
        const obj = {};
        for (let i = 0; i < item.punchTimeList.length; i += 1) {
          const [date, time] = item.punchTimeList[i].split(' ');
          if (obj[date]) {
            obj[date].list.push(time);
          } else {
            obj[date] = {};
            obj[date].list = [time];
          }
        }
        Object.keys(obj).forEach((key) => {
          result.push({
            date: key,
            totalCount: obj[key].list.length,
            list: Array.from(new Set(obj[key].list)),
          });
        });
        return {
          name: item.name,
          department: item.department,
          punchTime: result,
        };
      });
    },
    // 按部门分类
    filterByDepartment(arr) {
      const result = [];
      arr.forEach((item) => {
        const index = result.findIndex(temp => temp.department === item.department);
        if (index > -1) {
          result[index].employee.push(item);
        } else {
          result.push({
            department: item.department,
            employee: [item],
          });
        }
      });
      return result;
    },
  },
};
</script>

<style scoped>
.el-icon-tickets {
  font-size: 67px;
  color: #c0c4cc;
  margin: 40px 0 16px;
  line-height: 50px;
}
.tips {
  color: red;
}
.el-upload__tip {
  font-size: 13px;
}
</style>
