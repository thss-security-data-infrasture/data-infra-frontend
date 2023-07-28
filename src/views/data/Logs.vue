<script setup>
import axios from "axios";

import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";

const logQueryTimeRange = ref("");
const logQueryTimeRangeShortcuts = [
  {
    text: "Last 1h",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000);
      return [start, end];
    },
  },
  {
    text: "Last 6h",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 6);
      return [start, end];
    },
  },
  {
    text: "Last 12h",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 12);
      return [start, end];
    },
  },
  {
    text: "Last Day",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24);
      return [start, end];
    },
  },
  {
    text: "Last Week",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      return [start, end];
    },
  },
  {
    text: "Last Month",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
      return [start, end];
    },
  },
];
let lastLogQueryTypes = [];
const logQueryTypes = ref(["traffic", "alert", "app", "audit"]);
const logQueryIp = ref("");
function setCellStyle({ row, column, rowIndex, columnIndex }) {
  const styleObject = {
    'background': '#E5EBFB !important',
    'color': '#6B78D3',
    'font-size': '14px',
    'borderRadius': '',
    'padding': '10px 0'
  }
  
  if (columnIndex === 0) {
    styleObject.borderRadius = '23px 0 0 23px'
  }
  if (column.label === "设备列表" || column.label === "告警设备" || column.label === "路径") {
    styleObject.borderRadius = '0 23px 23px 0'
  }
  return styleObject
}
function setCellStyle1({ row, column, rowIndex, columnIndex }) {
  const styleObject = {
    'background': '#F8F8F8 !important',
    'color': '#6B78D3',
    'font-size': '14px',
    'borderRadius': ''
  }
  
  // if (columnIndex === 0) {
  //   styleObject.borderRadius = '23px 0 0 23px'
  // }
  // if (column.label === "设备列表" || column.label === "告警设备" || column.label === "路径") {
  //   styleObject.borderRadius = '0 23px 23px 0'
  // }
  return styleObject
}
function setBodyCellStyle({ row, column, rowIndex, columnIndex }) {
  const styleObject = {
    'background': '#F7F7F7 !important',
    'color': '#242145',
    'fontSize': '12px'
  }
  return styleObject
}
function logQuery() {
  if (!logQueryTimeRange.value) {
    ElMessage({
      message: "请选择时间范围",
      type: "warning",
      grouping: true,
      showClose: true,
    });
    return;
  }
  if (logQueryTypes.value.length === 0) {
    ElMessage({
      message: "请选择日志类型",
      type: "warning",
      grouping: true,
      showClose: true,
    });
    return;
  }
  const queryReqs = [];
  if (logQueryTypes.value.includes("traffic")) {
    queryReqs.push(trafficLogQuery(1));
  }
  if (logQueryTypes.value.includes("alert")) {
    queryReqs.push(alertLogQuery());
  }
  if (logQueryTypes.value.includes("app")) {
    queryReqs.push(appLogPreQuery());
  }
  if (logQueryTypes.value.includes("audit")) {
    queryReqs.push(auditLogQuery(1));
  }
  Promise.allSettled(queryReqs);
  lastLogQueryTypes = logQueryTypes.value;
}

onMounted(() => {
  const start = new Date("2023-04-26 00:00:00");
  const end = new Date("2023-04-29 00:00:00");
  logQueryTimeRange.value = [start, end];
  logQueryIp.value = "10.0.0.193";
  // query on page loaded
  logQuery();
});

const trafficDataLoading = ref(false);
const trafficData = ref([]);
const trafficDataTotal = ref(0);
const trafficCurrentPage = ref(1);
function trafficLogQuery(page) {
  trafficCurrentPage.value = page;
  trafficDataLoading.value = true;
  axios
    .post("http://10.0.0.236:8000/api/fused_info/traffic", {
      start: logQueryTimeRange.value[0].toISOString(),
      end: logQueryTimeRange.value[1].toISOString(),
      ipList: logQueryIp.value.length > 0 ? logQueryIp.value.split(",") : [],
      page: page - 1,
      size: 10, // 10 items per page
      demo: false,
    })
    .then((res) => {
      trafficData.value = res.data.data.map((item) => ({
        ...item,
        startTime: item.startTime.split(".")[0].replaceAll("T", " "),
        endTime: item.endTime.split(".")[0].replaceAll("T", " "),
      }));
      trafficDataTotal.value = Math.min(res.data.total, 1_000); // 最大显示 1k 条
    })
    .finally(() => {
      trafficDataLoading.value = false;
    });
}

const alertDataLoading = ref(false);
const alertData = ref([]);
const alertDataDisplay = ref([]);
const alertDataTotal = ref(0);
const alertCurrentPage = ref(1);
function alertLogQuery() {
  alertDataLoading.value = true;
  axios
    .post("http://10.0.0.236:8000/api/fused_info/alert", {
      start: logQueryTimeRange.value[0].toISOString(),
      end: logQueryTimeRange.value[1].toISOString(),
      ipList: logQueryIp.value.length > 0 ? logQueryIp.value.split(",") : [],
      page: 0,
      size: 1000, // load all items by default because of backend's limitation
      demo: false,
    })
    .then((res) => {
      alertData.value = res.data.data.map((item) => ({
        ...item,
        time: item.time.split(".")[0].replaceAll("T", " "),
      }));
      alertDataDisplay.value = alertData.value.slice(0, 10);
      alertDataTotal.value = res.data.total;
    })
    .finally(() => {
      alertDataLoading.value = false;
    });
}
function alertDataNextPage(page) {
  alertCurrentPage.value = page;
  alertDataDisplay.value = alertData.value.slice((page - 1) * 10, page * 10);
}

const appDataLoading = ref(false);
const activeApps = ref([]);
const appDataAttrsMap = ref({});
const appDataTotalMap = ref({});
const appDataDisplayMap = ref({});
const appDataCurrentPageMap = ref({});
const appDataIsLoadingMap = reactive({});
const appDataLoadedMap = ref({});
function appLogPreQuery() {
  appDataLoading.value = true;
  axios
    .get("http://10.0.0.236:8000/api/fused_info/app/pre")
    .then((res) => {
      appDataAttrsMap.value = res.data.columns;
      Object.keys(res.data.columns).forEach((key) => {
        appDataTotalMap.value[key] = [];
        appDataDisplayMap.value[key] = [];
        appDataCurrentPageMap.value[key] = 1;
        appDataIsLoadingMap[key] = false;
        appDataLoadedMap.value[key] = false;
      });
    })
    .finally(() => {
      appDataLoading.value = false;
    });
}
function getActiveAppsData(appNames) {
  if (appNames.length > 0) {
    const appsToQuery = appNames.filter((appName) => {
      return !appDataLoadedMap.value[appName];
    });
    if (appsToQuery.length > 0) {
      appsToQuery.forEach((appName) => {
        appDataIsLoadingMap[appName] = true;
      });
      axios
        .post("http://10.0.0.236:8000/api/fused_info/app", {
          start: logQueryTimeRange.value[0].toISOString(),
          end: logQueryTimeRange.value[1].toISOString(),
          ipList: logQueryIp.value.length > 0 ? logQueryIp.value.split(",") : [],
          appList: appsToQuery,
          page: 0,
          size: 1000, // load all items by default because of backend's limitation
        })
        .then((res) => {
          appsToQuery.forEach((appName) => {
            appDataTotalMap.value[appName] = res.data.data[appName];
            appDataDisplayMap.value[appName] = appDataTotalMap.value[appName]
              .slice(0, 10)
              .map((item) => item.parsed);
            appDataCurrentPageMap.value[appName] = 1;
            appDataLoadedMap.value[appName] = true;
          });
        })
        .finally(() => {
          appsToQuery.forEach((appName) => {
            appDataIsLoadingMap[appName] = false;
          });
        });
    }
  }
}
function appDataNextPage(page, appName) {
  appDataCurrentPageMap.value[appName] = page;
  appDataDisplayMap.value[appName] = appDataTotalMap.value[appName]
    .slice((page - 1) * 10, page * 10)
    .map((item) => item.parsed);
}
function appDataColumnWidth(column) {
  if (column === "timestamp") {
    return 230;
  } else if (column === "http_user_agent") {
    return 200;
  } else if (column === "uri") {
    return 300;
  } else {
    return column.length * 10 + 20;
  }
}

const auditDataLoading = ref(false);
const auditData = ref([]);
const auditDataDisplay = ref([]);
const auditDataTotal = ref(0);
const auditCurrentPage = ref(1);
function auditLogQuery() {
  auditDataLoading.value = true;
  axios
    .post("http://10.0.0.236:8000/api/fused_info/audit", {
      start: logQueryTimeRange.value[0].toISOString(),
      end: logQueryTimeRange.value[1].toISOString(),
      ipList: logQueryIp.value.length > 0 ? logQueryIp.value.split(",") : [],
      adv_param: {
        syscall_whitelist: ["execve", "fork", "vfork", "clone", "clone3"],
      },
      page: 0,
      size: 1000, // load all items by default because of backend's limitation
      demo: false,
    })
    .then((res) => {
      auditData.value = res.data.data.map((item) => ({
        ...item,
        time: item.time.split(".")[0].replaceAll("T", " "),
      }));
      auditDataDisplay.value = auditData.value.slice(0, 10);
      auditDataTotal.value = res.data.total;
    })
    .finally(() => {
      auditDataLoading.value = false;
    });
}
function auditDataNextPage(page) {
  auditCurrentPage.value = page;
  auditDataDisplay.value = auditData.value.slice((page - 1) * 10, page * 10);
}
</script>

<template>
  <!--avoid css pollution-->
  <div id="log-fusion" style="height: 100%">
    <el-container style="height: 100%">
      <el-header>
        <el-row>
          <el-col :span="16" style="display: flex; min-width: 800px;">
            <el-date-picker v-model="logQueryTimeRange" type="datetimerange" :shortcuts="logQueryTimeRangeShortcuts"
              range-separator="-" start-placeholder="开始时间" end-placeholder="结束时间" style="min-width: 460px;border-radius: 20px;"
              popper-class="'datetimerange-class'" />
            <el-select v-model="logQueryTypes" multiple collapse-tags collapse-tags-tooltip placeholder="请选择日志类型"
              style="min-width: 240px;" popper-class="log-type-sel">
              <el-option label="流量日志" value="traffic" />
              <el-option label="告警日志" value="alert" />
              <el-option label="应用日志" value="app" />
              <el-option label="审计日志" value="audit" />
            </el-select>
            <el-input v-model="logQueryIp" placeholder="请输入 ip，多个 ip 请用 , 分隔（可以为空）" clearable>
              <template #append>
                <el-button>
                  <el-icon @click="logQuery">
                    <Search />
                  </el-icon>
                </el-button>
              </template>
            </el-input>
          </el-col>
        </el-row>
      </el-header>
      <el-main style="
          height: 100%;
          padding-top: 0;
          padding-right: 0;
          padding-bottom: 0;
        ">
        <el-row>
          <el-col :span="11" v-loading.lock="trafficDataLoading"
            style="display: flex; flex-direction: column; margin-right: -5%">
            <el-divider>流量信息</el-divider>
            <el-table :data="trafficData" height="450px" style="background:#F8F8F8;border-radius: 23px 23px 0 0;" :header-cell-style="setCellStyle"
              :cell-style="setBodyCellStyle">
              <el-table-column prop="clientIp" label="客户端 IP" min-width="100px" />
              <el-table-column prop="serverIp" label="服务端 IP" min-width="100px" />
              <el-table-column prop="serverPort" label="服务端端口" min-width="100px" />
              <el-table-column prop="startTime" label="开始时间" min-width="200px" />
              <el-table-column prop="endTime" label="结束时间" min-width="200px" />
              <el-table-column prop="pkts" label="总数据包数" min-width="100px" />
              <el-table-column prop="devices" label="设备列表" min-width="100px" />
            </el-table>
            <el-pagination :total="trafficDataTotal" :current-page="trafficCurrentPage" @current-change="trafficLogQuery"
              layout="prev, pager, next" />
          </el-col>
          <el-col :span="11" :offset="2" v-loading.lock="alertDataLoading" style="display: flex; flex-direction: column">
            <el-divider>告警信息</el-divider>
            <el-table :data="alertDataDisplay" height="450px" style="background:#F8F8F8;border-radius: 23px 23px 0 0;" :header-cell-style="setCellStyle"
              :cell-style="setBodyCellStyle">
              <el-table-column type="expand">
                <template #default="props">
                  <!--原来叫详情链接，后面改成详情内容了-->
                  <ul>
                    <li v-for="(item, idx) in props.row.link" :key="idx">
                      {{ item }}
                    </li>
                  </ul>
                </template>
              </el-table-column>
              <el-table-column prop="host" label="主机" min-width="100px" />
              <el-table-column prop="alert" label="告警名称" />
              <el-table-column prop="time" label="时间" min-width="200px" />
              <el-table-column prop="device" label="告警设备" min-width="100px" />
            </el-table>
            <el-pagination :total="alertDataTotal" :current-page="alertCurrentPage" @current-change="alertDataNextPage"
              layout="prev, pager, next" />
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="11" v-loading.lock="appDataLoading"
            style="display: flex; flex-direction: column; margin-right: -5%">
            <el-divider>应用信息</el-divider>
            <el-collapse v-model="activeApps" @change="getActiveAppsData">
              <el-collapse-item v-for="(appName, appNameIdx) of Object.keys(appDataAttrsMap)" :title="appName"
                :name="appName" :key="'name' + appNameIdx">
                <div v-if="activeApps.includes(appName)" v-loading.lock="appDataIsLoadingMap[appName]"
                  style="display: flex; flex-direction: column">
                  <el-table :data="appDataDisplayMap[appName]" style="background:#F8F8F8;border-radius: 23px 23px 0 0;" :header-cell-style="setCellStyle1"
                    :cell-style="setBodyCellStyle">
                    <el-table-column v-for="(column, columnIdx) of appDataAttrsMap[appName]" :prop="column"
                      :label="column" :key="'column' + columnIdx" :min-width="appDataColumnWidth(column)" />
                  </el-table>
                  <el-pagination :total="appDataTotalMap[appName].length" :current-page="appDataCurrentPageMap[appName]"
                    @current-change="appDataNextPage($event, appName)" layout="prev, pager, next" />
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-col>
          <el-col :span="11" :offset="2" v-loading.lock="auditDataLoading" style="display: flex; flex-direction: column">
            <el-divider>审计信息</el-divider>
            <el-table :data="auditDataDisplay" height="520px" style="background:#F8F8F8;border-radius: 23px 23px 0 0;" :header-cell-style="setCellStyle"
              :cell-style="setBodyCellStyle">
              <el-table-column type="expand">
                <template #default="props">
                  <div style="padding: 0 20px">
                    <p>proctitle:</p>
                    <pre>{{ props.row.title }}</pre>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="host" label="宿主机" min-width="100px" />
              <el-table-column prop="time" label="时间" min-width="200px" />
              <el-table-column prop="syscall" label="系统调用" />
              <el-table-column prop="pid" label="进程ID" />
              <el-table-column prop="ppid" label="父进程ID" min-width="100px" />
              <el-table-column prop="pname" label="进程名" />
              <el-table-column prop="exe" label="执行文件" min-width="150px" />
              <el-table-column prop="cwd" label="当前工作目录" min-width="150px" />
              <el-table-column prop="path" label="路径" min-width="150px" />
            </el-table>
            <el-pagination :total="auditDataTotal" :current-page="auditCurrentPage" @current-change="auditDataNextPage"
              layout="prev, pager, next" />
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<style lang="scss" scoped>
$theme-color: #6B78D3;

#log-fusion .el-input-group__prepend {
  padding: 0;
}
// :root { --el-border-radius-base: '20px';}
:deep .el-select {
  margin: 0 12px;
  .el-input__wrapper{
    border-radius: 20px;
  }
}

:deep .el-input-group {
  align-items: center;
  .el-input__wrapper{
    border-radius: 20px 0 0 20px;
  }
}

:deep .el-input__wrapper{
  box-shadow: rgba(107, 120, 211, 1) 0px 0px 0px 1px inset;
  height: 40px;
}

:deep .el-input__inner,
:deep .el-date-editor .el-range-input {
  color: #242145;
}

:deep .el-date-editor .el-range-input {
  height: 40px;
  line-height: 40px;
}

:deep .el-select .el-select-tags-wrapper.has-prefix {
  margin-left: 8px;
}

:deep .el-input-group__append {
  background: $theme-color;
  border-radius: 0 20px 20px 0;
  height: 44px;
}

:deep .el-icon {
  font-size: 18px;
}

:deep .el-input-group__append.el-input-group .el-input__wrapper {
    border-radius: 20px 0 0 20px !important;
}

:deep .el-input-group__append {
  .el-icon {
    color: #fff;
    font-size: 24px;
  }

  .el-button {
    padding: 0;
    margin: 0 -5px;
  }
}

:deep .el-select__tags .el-tag {
  margin: 0 6px 0 0;
}

:deep .el-tag.el-tag--info {
  border-radius: 13px;
  background: #E5EBFB;
  color: $theme-color;
  height: 28px;
  /* line-height: 26px; */
}


:deep .el-tag .el-tag__close {
  color: $theme-color;
}

.el-divider--horizontal {
  border-color: $theme-color;
}

:deep .el-divider__text.is-center {
  font-size: 18px;
  color: $theme-color;
}

:deep .el-scrollbar {
  --el-scrollbar-bg-color: #6B78D3;
  --el-scrollbar-opacity: 1;
}

:deep .el-pagination {
  margin: 22px auto;

  button {
    min-width: 25px;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    background-color: #E6EBFB;

    .el-icon {
      font-size: 16px;
      color: $theme-color;
    }
  }

  button:disabled {
    .el-icon {
      color: #fff;
    }
  }
}
:deep .el-pager{
  margin: 0 15px;
  li {
  font-size: 14px;
  color: #BFBECC;
}
li.is-active {
  color: $theme-color;
}
}
// :deep .el-popper.is-pure{
//   border-radius: 30px;
// }

.el-select-dropdown{

  --el-border-radius-base: 20px;padding: 10px 0;
}

:deep .el-collapse{
  border: none;
  background: #F8F8F8;
  border-radius: 23px 23px 0 0;
  .el-collapse-item__header{
    background: #E5EBFB;
    border-radius: 23px;
    padding: 0 36px;
    height: 44px;
    line-height: 44px;
  }
}
</style>
<style lang="scss">
.log-type-sel {
  border-radius: 30px;
  .el-select-dropdown__list {
    margin: 20px 0 !important;
  }
  .el-select-dropdown__item {
    color: #6B78D3 !important;
    font-size: 14px;
    height: 38px;
    line-height: 38px;
  }
  .el-select-dropdown__item.selected {
    background: #F7F7FE !important;
    &::after{
      --el-color-primary: #6B78D3;
    }
  }
}
</style>