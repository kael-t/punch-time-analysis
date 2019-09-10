<template>
  <div>
    <label>{{employer.name ? employer.department + '-->' + employer.name : ''}}</label>
    <el-table
      :data="data"
      :row-class-name="tableRowClassName"
    >
      <el-table-column
        prop="date"
        label="日期"
        width="180">
      </el-table-column>
      <el-table-column
        prop="totalCount"
        label="打卡次数"
        width="180">
      </el-table-column>
      <el-table-column
        prop="totalCount"
        label="班次"
        width="180">
        <template slot-scope="scope">
          <el-select
            v-model="scope.row.term"
            filterable
            @change="handleChange($event, scope.row)">
            <el-option
              v-for="item in scheduling"
              :key="item.id"
              :label="item.label"
              :value="item.id">
            </el-option>
          </el-select>
        </template>
      </el-table-column>
      <el-table-column
        prop="totalCount"
        label="打卡时间"
        width="180">
        <template slot-scope="scope">
          <el-popover
            placement="top-start"
            trigger="click">
            <div v-for="item in scope.row.list" :key="item.id">
              {{scope.row.date + ' ' + item}}
            </div>
            <el-button slot="reference" type="primary">查看打卡时间</el-button>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column
        prop="msg"
        label="状态"
        width="180">
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import scheduling from '@/scheduling';
export default {
  name: 'punch-time-table',
  data () {
    return {
      scheduling: scheduling,
      statusMap: {
        0: '正常',
        1: '缺卡',
        2: '迟到',
        3: '早退'
      }
    }
  },
  computed: {
    ...mapState({
      data: state => state.employer ? state.employer.punchTime : [],
      employer: state => state.employer || {}
    })
  },
  updated () {
    this.analysis()
  },
  methods: {
    tableRowClassName ({row, rowIndex}) {
      if (row.status !== 0) {
        return 'warning-row'
      } else {
        return ''
      }
    },
    handleChange (value, row) {
      this.analysisSingle(row)
      // this.analysis();
    },
    // 分析单条数据
    analysisSingle(item) {
      const shift = this.term2scheduling(item.term);
      const temp = this.checkPunchInCount(shift, item.list, item.date);
      item.status = temp.status;
      item.msg = temp.msg;
    },
    // 分析数据
    analysis() {
      this.data.forEach(item => {
        this.analysisSingle(item)
        // console.log('工作时间', shift)
        // console.log('打卡时间', item.list)
      })
    },
    // 班次id转成班次时间段
    term2scheduling (term) {
      return this.scheduling.find(item => item.id === term).value;
    },
    // 检查打卡次数
    checkPunchInCount (shouldPunchIn, realPunchIn, date) {
      // 扁平化数组
      let temp = shouldPunchIn.toString().split(',')
      if(realPunchIn.length < temp.length) {
        // 实际打卡次数 < 应打卡次数,肯定是缺卡
        // TODO:按单个班次和两头班分析缺哪次卡
        if (temp.length === 2) {
          // 单个班次
          const [testTime] = temp;
          let flagTime = null
          if (new Date(date + ' ' + testTime) < new Date(date + " 12:00:00")) {
            // 早直落班
            flagTime = new Date(date + " 12:00:00");
          } else {
            // 夜直落班
            flagTime = new Date(date + " 18:00:00");
          }
          const [punchInTime] = realPunchIn;
          const realShift = new Date(date + ' ' + punchInTime);
          if (realShift >= flagTime) {
            console.log(date + '早班缺卡')
            return {
              status: 1,
              msg: date + '早班缺卡'
            }
          } else {
            console.log(date + '夜班缺卡')
            return {
              status: 1,
              msg: date + '夜班缺卡'
            }
          }
        } else if (temp.length === 4) {
          // 两头班
          console.log(date + '两头班缺卡')
          return {
            status: 1,
            msg: date + '两头班缺卡'
          }
        }
        // console.log(date + '缺卡')
        return {
          status: 1,
          msg: '缺卡'
        }
      } else {
         if (realPunchIn.length === temp.length) {
           // 实际打卡次数 = 应打卡次数
           // 检查打卡时间
          return this.checkPunchInTime(shouldPunchIn, realPunchIn, date)
        } else {
          // 实际打卡次数 > 应打卡次数
          // TODO: 处理打卡时间
          if (temp.length === 2) {
            // 直落班
            // 取最早和最晚座位上下班卡
            realPunchIn = [realPunchIn[0], realPunchIn[realPunchIn.length - 1]];
            return this.checkPunchInTime(shouldPunchIn, realPunchIn, date)
          } else if (temp.length === 4) {
            // 两头班
            // 取最早的打卡作为早班上班卡,最晚的打卡作为晚班下班卡
            let firstPunch = realPunchIn[0], lastPunch = realPunchIn[realPunchIn.length - 1];
            const earlyNormalPunchOut = new Date(date + ' ' + temp[1]), latelyNormalPunchIn = new Date(date + ' ' + temp[2])
            let earlyPunchOut, latelyPunchIn;
            for (let i = 0;i < realPunchIn.length;i++) {
              if (!earlyPunchOut) {
                // 找早班打卡下班时间(第一个比正常下班时间晚的,且比夜班上班时间早的)
                if(new Date(date + ' ' + realPunchIn[i]) >= earlyNormalPunchOut && (new Date(date + ' ' + realPunchIn[i] < latelyNormalPunchIn))) {
                  earlyPunchOut = realPunchIn[i]
                }
              } else {
                if (!latelyPunchIn) {
                  // 找夜班打卡上班时间(从早班下班卡后开始找,比正常上班时间早,且与早班下班卡时间相差30分钟以上的(30分钟以上的要求主要是为了容错))
                  if(new Date(date + ' ' + realPunchIn[i]) <= latelyNormalPunchIn && (new Date(date + ' ' + realPunchIn[i]) - new Date(date + ' ' + earlyPunchOut) >= 30 * 60 * 1000)) {
                    latelyPunchIn = realPunchIn[i]
                  }
                }
              }
            }
            if (earlyPunchOut && latelyPunchIn) {
              realPunchIn = [firstPunch, earlyPunchOut, latelyPunchIn, lastPunch];
              // 检查打卡时间
              return this.checkPunchInTime(shouldPunchIn, realPunchIn, date)
            } else {
              console.log(date + '的打卡记录有问题')
              return {
                status: 1,
                msg: date + '的打卡记录有问题'
              }
            }
          }
        }
      }
    },
    // 检查打卡时间
    checkPunchInTime (shouldPunchIn, realPunchIn, date) {
      if (shouldPunchIn.length === 1) {
        // 单个班次
        let [normalShift] = shouldPunchIn;
        let [normalShift1, normalShift2] = normalShift;
        let [realShift1, realShift2] = realPunchIn;
        normalShift1 = new Date(date + ' ' + normalShift1);
        normalShift2 = new Date(date + ' ' + normalShift2);
        realShift1 = new Date(date + ' ' + realShift1);
        realShift2 = new Date(date + ' ' + realShift2);
        if (realShift1 <= normalShift1) {
          if (realShift2 >= normalShift2) {
            console.log(date + '正常')
            return {
              status: 0,
              msg: date + '正常'
            }
          } else {
            console.log(date + '早退')
            return {
              status: 1,
              msg: date + '早退'
            }
          }
        } else {
          if (realShift2 < normalShift2) {
            console.log(date + '迟到+早退')
            return {
              status: 1,
              msg: date + '迟到+早退'
            }
          } else {
            console.log(date + '迟到,正常落班')
            return {
              status: 1,
              msg: date + '迟到,正常落班'
            }
          }
        }
      } else if (shouldPunchIn.length === 2) {
        // 两头班
        let [normalShiftEarly, normalShiftLatly] = shouldPunchIn;
        let [normalShiftEarly1, normalShiftEarly2] = normalShiftEarly;
        let [normalShiftLatly1, normalShiftLatly2] = normalShiftLatly;
        let [realShiftEarly1, realShiftEarly2, realShiftlatly1, realShiftlatly2] = realPunchIn;
        let result = date + '';
        let status = 0;
        normalShiftEarly1 = new Date(date + ' ' + normalShiftEarly1);
        normalShiftEarly2 = new Date(date + ' ' + normalShiftEarly2);
        normalShiftLatly1 = new Date(date + ' ' + normalShiftLatly1);
        normalShiftLatly2 = new Date(date + ' ' + normalShiftLatly2);
        realShiftEarly1 = new Date(date + ' ' + realShiftEarly1);
        realShiftEarly2 = new Date(date + ' ' + realShiftEarly2);
        realShiftlatly1 = new Date(date + ' ' + realShiftlatly1);
        realShiftlatly2 = new Date(date + ' ' + realShiftlatly2);
        if (realShiftEarly1 <= normalShiftEarly1) {
          if (realShiftEarly2 >= normalShiftEarly2) {
            result += '早班正常、'
            status = 0;
          } else {
            result += '早班早退、'
            status = 1;
          }
        } else {
          if (realShiftEarly2 >= normalShiftEarly2) {
            result += '早班迟到、';
            status = 1;
          } else {
            result += '早班迟到+早退、'
            status = 1;
          }
        }
        if (realShiftlatly1 <= normalShiftLatly1) {
          if (realShiftlatly2 >= normalShiftLatly2) {
            result += '晚班正常'
            status = 0;
          } else {
            result += '晚班早退'
            status = 1;
          }
        } else {
          if (realShiftlatly2 >= normalShiftLatly2) {
            result += '晚班迟到'
            status = 1;
          } else {
            result += '晚班迟到+早退'
            status = 1;
          }
        }
        console.log(result)
        return {
          status: status,
          msg: result
        };
      } else {
        alert('错误')
      }
    }
  }
}
</script>

<style>
.el-table .warning-row {
  background: oldlace;
}
</style>
