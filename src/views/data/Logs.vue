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
const logQueryTypes = ref(["traffic", "alert", "app"]);
const logQueryIp = ref("");
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
  } else {
    if (lastLogQueryTypes.includes("traffic")) {
      trafficData.value = [];
      trafficDataTotal.value = 0;
    }
  }
  if (logQueryTypes.value.includes("alert")) {
    queryReqs.push(alertLogQuery(1));
  } else {
    if (lastLogQueryTypes.includes("alert")) {
      alertData.value = [];
      alertDataTotal.value = 0;
    }
  }
  if (logQueryTypes.value.includes("app")) {
    queryReqs.push(appLogPreQuery());
  } else {
    // if (lastLogQueryTypes.includes("app")) {
    //   appDataAttrsMap.value = {};
    //   appDataTotalMap.value = {};
    //   appDataDisplayMap.value = {};
    //   appDataCurrentPageMap.value = {};
    //   appDataIsLoadingMap.value = {};
    //   appDataLoadedMap.value = {};
    // }
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
      ipList: logQueryIp.value.split(","),
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
const alertDataTotal = ref(0);
const alertCurrentPage = ref(1);
function alertLogQuery(page) {
  alertCurrentPage.value = page;
  alertDataLoading.value = true;
  axios
    .post("http://10.0.0.236:8000/api/fused_info/alert", {
      start: logQueryTimeRange.value[0].toISOString(),
      end: logQueryTimeRange.value[1].toISOString(),
      ipList: logQueryIp.value.split(","),
      page: page - 1,
      size: 10, // 10 items per page
      demo: false,
    })
    .then((res) => {
      alertData.value = res.data.data.map((item) => ({
        ...item,
        time: item.time.split(".")[0].replaceAll("T", " "),
      }));
      alertDataTotal.value = Math.min(res.data.total, 1_000); // 最大显示 1k 条
    })
    .finally(() => {
      alertDataLoading.value = false;
    });
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
          ipList: logQueryIp.value.split(","),
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
</script>

<template>
  <!--avoid css pollution-->
  <div id="log-fusion" style="height: 100%">
    <el-container style="height: 100%">
      <el-header>
        <el-row>
          <el-col :span="16" style="display: flex; min-width: 800px">
            <el-date-picker
              v-model="logQueryTimeRange"
              type="datetimerange"
              :shortcuts="logQueryTimeRangeShortcuts"
              range-separator="-"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              style="min-width: 400px"
            />
            <el-select
              v-model="logQueryTypes"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择日志类型"
              style="min-width: 180px"
            >
              <el-option label="流量日志" value="traffic" />
              <el-option label="告警日志" value="alert" />
              <el-option label="应用日志" value="app" />
              <el-option label="审计日志" value="audit" />
            </el-select>
            <el-input
              v-model="logQueryIp"
              placeholder="请输入 ip，多个 ip 请用 , 分隔（可以为空）"
              clearable
            >
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
      <el-main
        style="
          height: 100%;
          padding-top: 0;
          padding-right: 0;
          padding-bottom: 0;
        "
      >
        <el-row>
          <el-col
            :span="11"
            v-loading.lock="trafficDataLoading"
            style="display: flex; flex-direction: column; margin-right: -5%"
          >
            <el-divider>流量信息</el-divider>
            <el-table :data="trafficData" height="450px">
              <el-table-column
                prop="clientIp"
                label="客户端 IP"
                min-width="100px"
              />
              <el-table-column
                prop="serverIp"
                label="服务端 IP"
                min-width="100px"
              />
              <el-table-column
                prop="serverPort"
                label="服务端端口"
                min-width="100px"
              />
              <el-table-column
                prop="startTime"
                label="开始时间"
                min-width="200px"
              />
              <el-table-column
                prop="endTime"
                label="结束时间"
                min-width="200px"
              />
              <el-table-column
                prop="pkts"
                label="总数据包数"
                min-width="100px"
              />
              <el-table-column
                prop="devices"
                label="设备列表"
                min-width="100px"
              />
            </el-table>
            <el-pagination
              :total="trafficDataTotal"
              :current-page="trafficCurrentPage"
              @current-change="trafficLogQuery"
              layout="prev, pager, next"
              style="margin: 0 auto"
            />
          </el-col>
          <el-col
            :span="11"
            :offset="2"
            v-loading.lock="alertDataLoading"
            style="display: flex; flex-direction: column"
          >
            <el-divider>告警信息</el-divider>
            <el-table :data="alertData" height="450px">
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
              <el-table-column prop="host" label="主机" />
              <el-table-column prop="alert" label="告警名称" />
              <el-table-column prop="time" label="时间" />
              <el-table-column prop="device" label="告警设备" />
            </el-table>
            <el-pagination
              :total="alertDataTotal"
              :current-page="alertCurrentPage"
              @current-change="alertLogQuery"
              layout="prev, pager, next"
              style="margin: 0 auto"
            />
          </el-col>
        </el-row>
        <el-row>
          <el-col
            :span="11"
            v-loading.lock="appDataLoading"
            style="display: flex; flex-direction: column; margin-right: -5%"
          >
            <el-divider>应用信息</el-divider>
            <el-collapse v-model="activeApps" @change="getActiveAppsData">
              <el-collapse-item
                v-for="(appName, appNameIdx) of Object.keys(appDataAttrsMap)"
                :title="appName"
                :name="appName"
                :key="'name' + appNameIdx"
              >
                <div
                  v-if="activeApps.includes(appName)"
                  v-loading.lock="appDataIsLoadingMap[appName]"
                  style="display: flex; flex-direction: column"
                >
                  <el-table :data="appDataDisplayMap[appName]">
                    <el-table-column
                      v-for="(column, columnIdx) of appDataAttrsMap[appName]"
                      :prop="column"
                      :label="column"
                      :key="'column' + columnIdx"
                      :min-width="appDataColumnWidth(column)"
                    />
                  </el-table>
                  <el-pagination
                    :total="appDataTotalMap[appName].length"
                    :current-page="appDataCurrentPageMap[appName]"
                    @current-change="appDataNextPage($event, appName)"
                    layout="prev, pager, next"
                    style="margin: 0 auto"
                  />
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-col>
          <el-col
            :span="11"
            :offset="2"
            style="display: flex; flex-direction: column"
          >
            <el-divider>审计信息</el-divider>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<style>
#log-fusion .el-input-group__prepend {
  padding: 0;
}
</style>
