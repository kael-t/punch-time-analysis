import Vue from 'vue';
import axios from 'axios';
import {
  Input,
  Button,
  Select,
  Menu,
  MenuItem,
  Tooltip,
  Upload,
  Form,
  FormItem,
  Table,
  TableColumn,
  Dialog,
  TimePicker,
  Container,
  Aside,
  Main,
  Dropdown,
  Tree,
  DropdownItem,
  DropdownMenu,
  Popover,
} from 'element-ui';

import App from './App';
import router from './router';
import store from './store';

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
const eleComp = [
  Input,
  Button,
  Select,
  Menu,
  MenuItem,
  Tooltip,
  Upload,
  Form,
  FormItem,
  Table,
  TableColumn,
  Dialog,
  TimePicker,
  Container,
  Aside,
  Main,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Tree,
  Popover,
];
eleComp.forEach(comp => Vue.use(comp));

Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>',
}).$mount('#app');
