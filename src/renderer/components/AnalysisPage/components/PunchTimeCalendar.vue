<template>
  <calendar :data="data" :employer="employer" style="height: 100%;"/>
</template>

<script>
import { mapState } from 'vuex';
import Calendar from './Calendar';
export default {
  name: 'punch-time-calendar',
  components: {
    Calendar,
  },
  computed: {
    ...mapState('Analysis', {
      data: state => state.employer ? state.employer.punchTime : [],
      employer: state => state.employer || {},
    }),
  },
};
</script>