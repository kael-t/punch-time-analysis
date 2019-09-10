<template>
  <div class="tableWrapper">
    <el-table
      :data="tableData"
      style="width: 100%"
      height="calc(100% - 50px)"
    >
      <el-table-column
        label="班次"
      >
        <template slot-scope="scope">
          <i class="el-icon-date"></i>
          <span style="margin-left: 10px">{{ scope.row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="时间"
      >
        <template slot-scope="scope">
          <div v-for="item in scope.row.value" :key="item.id">{{ item.join(' - ') }}</div>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template slot-scope="scope">
          <el-button
            size="mini"
            @click="editHandler(scope.row, scope.$index)">编辑</el-button>
          <el-button
            size="mini"
            type="danger"
            @click="deleteHandler(scope.row, scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="tool-bar">
      <el-button
        type="primary"
        size="small"
        @click="showModal(1)"
      >
        新增
      </el-button>
    </div>
    <el-dialog
      :title="modalData.title"
      :visible.sync="modalVisible"
      width="550px"
      @closed="modalData = defaultData"
    >
      <el-form
        label-width="60px"
        ref="form"
        :model="modalData"
      >
        <el-form-item
          label="班次"
          prop="id"
          :rules="[
            {
              required: true,
              message: 'id必填',
              trigger: 'blur',
            },
          ]"
        >
          <el-input v-model="modalData.id" :disabled="modalData.title === '编辑'"></el-input>
        </el-form-item>
        <el-form-item
          v-for="(shift, index) in modalData.value"
          :label="`时段${index + 1}`"
          :key="index"
          :prop="`value.${index}`"
          :rules="[
            {
              required: true,
              validator: validator,
              trigger: 'blur',
            },
          ]"
        >
          <el-time-picker
            is-range
            :clearable="false"
            v-model="modalData.value[index]"
            range-separator="-"
            start-placeholder="上班时间"
            end-placeholder="下班时间"
            placeholder="选择时间范围"
          ></el-time-picker>
          <el-button
            size="mini"
            type="danger"
            icon="el-icon-close"
            @click.prevent="removeTimeHandler(modalData.value[index])"
            :loading="updateLoading"
          >
            删除
          </el-button>
        </el-form-item>
        <div style="text-align: center;" v-show="modalData.value.length < 2">
          <span class="addMore" @click="addNewItem">
            <i class="el-icon-plus"></i> 新增时间段
          </span>
        </div>
        <el-form-item>
          <el-button
            size="medium"
            type="primary"
            @click="saveHandler"
            :loading="updateLoading"
          >
            保存
          </el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import { Message } from 'element-ui';
export default {
  props: {
    defaultData: {
      type: Object,
      default() {
        return {
          title: '新增',
          id: '',
          value: [],
          label: '',
        };
      },
    },
  },
  data() {
    const validator = (rule, value, callback) => {
      if (value.length > 0) {
        callback();
      } else {
        callback(new Error('时段必填'));
      }
    };
    return {
      tableData: [],
      modalData: this.defaultData,
      modalVisible: false,
      updateLoading: false,
      validator,
    };
  },
  created() {
    const fs = require('fs');
    this.tableData = JSON.parse(fs.readFileSync(`${__static}/scheduling.json`).toString());
  },
  methods: {
    // 编辑
    editHandler(row) {
      this.showModal(2, row);
    },
    // 删除
    deleteHandler(row, index) {
      this.tableData.splice(index, 1);
      this.updateSchedulingFile();
    },
    // 显示模态框
    showModal(type, data = this.modalData) {
      const map = {
        1: '新增',
        2: '编辑',
      };
      const { label, id, value } = data;
      this.modalData = {
        id,
        label,
        value: value.map(item => this.formatDate(item)),
        title: map[type],
      };
      this.modalVisible = true;
    },
    // 格式化时间
    formatDate(dateStrArr) {
      const dateStr = new Date().toLocaleDateString();
      const arr = dateStrArr.map(str => new Date(`${dateStr} ${str}`));
      return arr;
    },
    // 模态框删除时间段
    removeTimeHandler(item) {
      const index = this.modalData.value.indexOf(item);
      if (index > -1) {
        this.modalData.value.splice(index, 1);
      }
    },
    // 新增时间段
    addNewItem() {
      if (this.modalData.value.length >= 2) {
        Message({
          type: 'error',
          message: '时间段不得多于两个',
        });
        return;
      }
      this.modalData.value.push({});
    },
    // 保存按钮
    saveHandler() {
      if (!this.modalData.value.length) {
        Message({
          type: 'error',
          message: '每个班次至少要有1个时段',
        });
        return;
      }
      this.$refs.form.validate((valid) => {
        if (valid) {
          const date2str = value => value.map(arr => arr.map((item) => {
            let hours = item.getHours();
            let minutes = item.getMinutes();
            let secounds = item.getSeconds();
            hours = hours < 10 ? `0${hours}` : hours;
            minutes = minutes < 10 ? `0${minutes}` : minutes;
            secounds = secounds < 10 ? `0${secounds}` : secounds;
            return `${hours}:${minutes}:${secounds}`;
          }));

          if (this.modalData.title === '新增') {
            const id = this.modalData.id.toUpperCase();
            const { value } = this.modalData;
            if (this.tableData.some(item => item.id === id)) {
              Message({
                type: 'error',
                message: '存在相同班次',
              });
              return;
            }
            this.tableData.push({
              id,
              label: `${id}班`,
              value: date2str(value),
            });
          } else {
            const { id, label, value } = this.modalData;
            const index = this.tableData.findIndex(item => item.id === this.modalData.id);
            if (index > -1) {
              this.tableData.splice(index, 1, {
                id,
                label,
                value: date2str(value),
              });
            }
          }
          this.updateSchedulingFile();
          this.modalVisible = false;
        }
      });
    },
    // 更新文件
    updateSchedulingFile() {
      const fs = require('fs');
      this.updateLoading = true;
      fs.writeFile(`${__static}/scheduling.json`, JSON.stringify(this.tableData), (err) => {
        if (err) {
          Message({
            type: 'error',
            message: '写入文件失败',
          });
          return;
        }
        Message({
          type: 'success',
          message: '更改成功',
        });
        this.updateLoading = false;
      });
    },
  },
};
</script>
<style scoped>
.tableWrapper {
  height: 100%;
  width: 100%;
}
.tool-bar {
  display: flex;
  height: 50px;
  padding: 0 10px;
  align-items: center;
  justify-content: flex-end;
}
.addMore {
  color: #1890ff;
  background-color: transparent;
  box-shadow: none;
  cursor: pointer;
}
.addMore:hover {
  color: #40a9ff;
  background-color: transparent;
}
</style>