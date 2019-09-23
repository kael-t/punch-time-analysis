<template>
  <div class="flex-box">
    <div class="flex-box employer-info-wrapper">
      <div class="employer-info">{{employer.name ? employer.department + ' → ' + employer.name : ''}}</div>
      <el-button ref="analysisBtn" type="primary" size="mini" @click="handleClick">分析</el-button>
      <el-dropdown class="map-table">
        <el-button type="text" size="small">班次对照表<i class="el-icon-arrow-down el-icon--right"></i></el-button>
        <el-dropdown-menu slot="dropdown" class="dropdown">
          <el-dropdown-item disabled v-for="item in scheduling" :key="item.id">{{ `${item.id}：${item.value.map(arr => arr[0] + ' - ' + arr[1]).join(' / ')}` }}</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
    <header class="calendar-header">
      <div v-for="(item, index) in weekday" :key="index">{{ item }}</div>
    </header>
    <main class="flex-box calendar-body">
      <div
        class="calendar-row"
        v-for="(week, index) in displayCalendar"
        :key="index"
      >
        <div
          v-for="(date, day) in week"
          :key="day"
          :class="['calendar-item', date.status > 0 ? 'warning-row' : '']"
        >
          <div>{{ date.value | filterZero }}</div>
          <el-input
            size="small"
            v-if="date.show && date.msg === ''"
            v-model="date.term"
            @keyup.enter="$refs.analysisBtn.$el.click()"
          />
          <div v-if="date.msg">
            {{ date.msg }}
            <div>班次: {{ date.term.toUpperCase() }}</div>
            <el-popover
              placement="top-start"
              trigger="click">
              <div v-for="item in date.list" :key="item.id">
                {{ `${date.date} ${item}` }}
              </div>
              <el-button slot="reference" size="mini">打卡时间</el-button>
            </el-popover>
          </div>
        </div>
      </div>
    </main>
    <footer></footer>
  </div>
</template>

<script>
import { Message } from 'element-ui';
import dayjs from 'dayjs';
import { mapState } from 'vuex';
export default {
  name: 'calendar',
  data() {
    return {
      weekday: ['日', '一', '二', '三', '四', '五', '六'],
      displayCalendar: [],
      calendar: [],
      month: 0,
      firstDayOfMonth: 0,
      daysInMonth: 0,

      statusMap: {
        0: '正常',
        1: '缺卡',
        2: '迟到',
        3: '早退',
      },
    };
  },
  props: {
    data: {
      type: Array,
      required: true,
    },
    employer: {
      type: Object,
      required: true,
    },
  },
  watch: {
    data: {
      handler() {
        this.displayCalendar = this.genCalendar(this.month);
      },
      immediate: true,
    },
    displayCalendar() {
      this.calendar = this.displayCalendar.reduce((pre, week) => [...pre, ...week], []);
      this.setShow(this.calendar);
    },
  },
  computed: {
    ...mapState('Analysis', [
      'scheduling',
    ]),
  },
  created() {
    // 考勤月(0代表1月)
    this.month = dayjs().month() - 1;
  },
  methods: {
    // 创建日历表
    genCalendar(month) {
      // 处理给this.calendar赋值
      const time = dayjs().set('month', month);
      // 考勤月首日是周几(从0开始)
      const firstDayOfMonth = time.startOf('month').get('day');
      // 考勤月总天数
      const daysInMonth = time.daysInMonth();
      const result = [];
      let cur = 1;
      // 生成一周的日历
      const genWeek = (startIndex = 0) => {
        const temp = {
          value: 0,
          show: false,
        };
        const arr = new Array(startIndex).fill(temp);
        for (let i = 0; i < 7; i += 1) {
          if (arr[i] === undefined || arr[i] === null) {
            arr[i] = cur <= daysInMonth ? {
              value: cur,
              date: dayjs()
                .set('month', month)
                .set('date', cur)
                .format('YYYY/MM/DD'),
              show: false,
              term: 'A',
              list: [],
              totalCount: 0,
              status: null,
              msg: '',
            } : temp;
            cur += 1;
          }
        }
        result.push(arr);
      };

      genWeek(firstDayOfMonth);
      while (cur <= daysInMonth) {
        genWeek();
      }
      return result;
    },
    // 只展示有打卡记录的日期
    setShow(arr) {
      arr.forEach((item) => {
        const obj = this.data.find(temp => temp.date === item.date);
        if (obj) {
          item.show = true;
          item.list = obj.list;
          item.totalCount = obj.totalCount;
        }
      });
    },
    // 分析按钮回调
    handleClick() {
      const flag = this.calendar
        .filter(item => item.show)
        .every(item => this.scheduling.some(sc => sc.id === item.term.toUpperCase()));
      if (!flag) {
        Message.error('班次不存在');
        return;
      }
      this.analysis();
    },
    // 分析数据
    analysis() {
      this.calendar.filter(item => item.show).forEach(item => this.analysisSingle(item));
    },
    // 分析单条数据
    analysisSingle(item) {
      const shift = this.term2scheduling(item.term);
      const temp = this.checkPunchInCount(shift, item.list, item.date);
      item.status = temp.status;
      item.msg = temp.msg;
    },
    // 班次id转成班次时间段
    term2scheduling(term) {
      return this.scheduling.find(item => item.id === term.toUpperCase()).value;
    },
    // 检查打卡次数
    checkPunchInCount(shouldPunchIn, realPunchIn, date) {
      // 扁平化数组
      const temp = shouldPunchIn.toString().split(',');
      if (realPunchIn.length < temp.length) {
        // 实际打卡次数 < 应打卡次数,肯定是缺卡
        if (temp.length === 2) {
          // 单个班次
          const [testTime] = temp;
          let flagTime = null;
          if (new Date(`${date} ${testTime}`) < new Date(`${date} 12:00:00`)) {
            // 早直落班
            flagTime = new Date(`${date} 12:00:00`);
          } else {
            // 夜直落班
            flagTime = new Date(`${date} 18:00:00`);
          }
          const [punchInTime] = realPunchIn;
          const realShift = new Date(`${date} ${punchInTime}`);
          if (realShift >= flagTime) {
            console.log(`${date} 早班缺卡`);
            return {
              status: 1,
              msg: `${date} 早班缺卡`,
            };
          }
          console.log(`${date} 夜班缺卡`);
          return {
            status: 1,
            msg: `${date} 夜班缺卡`,
          };
        } else if (temp.length === 4) {
          // 两头班
          console.log(`${date} 两头班缺卡`);
          return {
            status: 1,
            msg: `${date} 两头班缺卡`,
          };
        }
        // console.log(date + '缺卡')
        return {
          status: 1,
          msg: '缺卡',
        };
      } else {
        if (realPunchIn.length === temp.length) {
          // 实际打卡次数 = 应打卡次数
          // 检查打卡时间
          return this.checkPunchInTime(shouldPunchIn, realPunchIn, date);
        } else {
          // 实际打卡次数 > 应打卡次数
          if (temp.length === 2) {
            // 直落班
            // 取最早和最晚座位上下班卡
            realPunchIn = [realPunchIn[0], realPunchIn[realPunchIn.length - 1]];
            return this.checkPunchInTime(shouldPunchIn, realPunchIn, date);
          } else if (temp.length === 4) {
            // 两头班
            // 取最早的打卡作为早班上班卡,最晚的打卡作为晚班下班卡
            const firstPunch = realPunchIn[0];
            const lastPunch = realPunchIn[realPunchIn.length - 1];
            const earlyNormalPunchOut = new Date(`${date} ${temp[1]}`);
            const latelyNormalPunchIn = new Date(`${date} ${temp[2]}`);
            let earlyPunchOut;
            let latelyPunchIn;
            for (let i = 0; i < realPunchIn.length; i += 1) {
              if (!earlyPunchOut) {
                // 找早班打卡下班时间(第一个比正常下班时间晚的,且比夜班上班时间早的)
                if (new Date(`${date} ${realPunchIn[i]}`) >= earlyNormalPunchOut && (new Date(`${date} ${realPunchIn[i]}`) < latelyNormalPunchIn)) {
                  earlyPunchOut = realPunchIn[i];
                }
              } else {
                if (!latelyPunchIn) {
                  // 找夜班打卡上班时间(从早班下班卡后开始找,比正常上班时间早,且与早班下班卡时间相差30分钟以上的(30分钟以上的要求主要是为了容错))
                  if (new Date(`${date} ${realPunchIn[i]}`) <= latelyNormalPunchIn && (new Date(`${date} ${realPunchIn[i]}`) - new Date(`${date} ${earlyPunchOut}`) >= 30 * 60 * 1000)) {
                    latelyPunchIn = realPunchIn[i];
                  }
                }
              }
            }
            if (earlyPunchOut && latelyPunchIn) {
              realPunchIn = [firstPunch, earlyPunchOut, latelyPunchIn, lastPunch];
              // 检查打卡时间
              return this.checkPunchInTime(shouldPunchIn, realPunchIn, date);
            } else {
              console.log(`${date}的打卡记录有问题`);
              return {
                status: 1,
                msg: `${date}的打卡记录有问题`,
              };
            }
          }
        }
      }
      alert('不可预知的错误');
      return false;
    },
    // 检查打卡时间
    checkPunchInTime(shouldPunchIn, realPunchIn, date) {
      if (shouldPunchIn.length === 1) {
        // 单个班次
        const [normalShift] = shouldPunchIn;
        let [normalShift1, normalShift2] = normalShift;
        let [realShift1, realShift2] = realPunchIn;
        normalShift1 = new Date(`${date} ${normalShift1}`);
        normalShift2 = new Date(`${date} ${normalShift2}`);
        realShift1 = new Date(`${date} ${realShift1}`);
        realShift2 = new Date(`${date} ${realShift2}`);
        if (realShift1 <= normalShift1) {
          if (realShift2 >= normalShift2) {
            console.log(`${date}正常`);
            return {
              status: 0,
              msg: `${date}正常`,
            };
          } else {
            console.log(`${date}早退`);
            return {
              status: 1,
              msg: `${date}早退`,
            };
          }
        } else {
          if (realShift2 < normalShift2) {
            console.log(`${date}迟到+早退`);
            return {
              status: 1,
              msg: `${date}迟到+早退`,
            };
          } else {
            console.log(`${date}迟到,正常落班`);
            return {
              status: 1,
              msg: `${date}迟到,正常落班`,
            };
          }
        }
      } else if (shouldPunchIn.length === 2) {
        // 两头班
        const [normalShiftEarly, normalShiftLatly] = shouldPunchIn;
        let [normalShiftEarly1, normalShiftEarly2] = normalShiftEarly;
        let [normalShiftLatly1, normalShiftLatly2] = normalShiftLatly;
        let [realShiftEarly1, realShiftEarly2, realShiftlatly1, realShiftlatly2] = realPunchIn;
        let result = `${date}`;
        let status = 0;
        normalShiftEarly1 = new Date(`${date} ${normalShiftEarly1}`);
        normalShiftEarly2 = new Date(`${date} ${normalShiftEarly2}`);
        normalShiftLatly1 = new Date(`${date} ${normalShiftLatly1}`);
        normalShiftLatly2 = new Date(`${date} ${normalShiftLatly2}`);
        realShiftEarly1 = new Date(`${date} ${realShiftEarly1}`);
        realShiftEarly2 = new Date(`${date} ${realShiftEarly2}`);
        realShiftlatly1 = new Date(`${date} ${realShiftlatly1}`);
        realShiftlatly2 = new Date(`${date} ${realShiftlatly2}`);
        if (realShiftEarly1 <= normalShiftEarly1) {
          if (realShiftEarly2 >= normalShiftEarly2) {
            result += '早班正常、';
            status = 0;
          } else {
            result += '早班早退、';
            status = 1;
          }
        } else {
          if (realShiftEarly2 >= normalShiftEarly2) {
            result += '早班迟到、';
            status = 1;
          } else {
            result += '早班迟到+早退、';
            status = 1;
          }
        }
        if (realShiftlatly1 <= normalShiftLatly1) {
          if (realShiftlatly2 >= normalShiftLatly2) {
            result += '晚班正常';
            status = 0;
          } else {
            result += '晚班早退';
            status = 1;
          }
        } else {
          if (realShiftlatly2 >= normalShiftLatly2) {
            result += '晚班迟到';
            status = 1;
          } else {
            result += '晚班迟到+早退';
            status = 1;
          }
        }
        console.log(result);
        return {
          status,
          msg: result,
        };
      } else {
        alert('错误');
      }
      alert('不可预知的错误');
      return false;
    },
  },
  filters: {
    filterZero(value) {
      return value === 0 ? '' : value;
    },
  },
};
</script>

<style scoped>
  .flex-box {
    display: flex;
    flex-direction: column;
  }
  .employer-info-wrapper {
    flex-direction: row;
    align-items: center;
  }
  .employer-info {
    flex: 1;
  }
  .map-table {
    margin: 0 20px;
  }
  .dropdown {
    height: 400px;
    overflow: auto;
  }
  .calendar-header {
    display: inherit;
    height: 30px;
  }
  .calendar-header > div {
    flex: 1;
    margin-right: 10px;
    border-bottom: solid 1px #ddd;
  }
  .calendar-row {
    display: inherit;
    flex: 1 0 150px;
  }
  .calendar-item {
    flex: 1;
    margin-right: 10px;
    margin-bottom: 10px;
    overflow-y: auto;
    font-size: 14px;
  }
  .warning-row {
    background: oldlace;
  }
</style>