<script setup>
import axios from "axios";

import { onMounted, ref } from "vue";

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
const logQueryTypes = ref(["traffic", "alert"]);
const logQueryIp = ref("");
async function logQuery() {
  const promises = [];
  if (logQueryTypes.value.includes("traffic")) {
    promises.push(trafficLogQuery(1));
  }
  if (logQueryTypes.value.includes("alert")) {
    promises.push(alertLogQuery(1));
  }
  await Promise.allSettled(promises);
}

onMounted(() => {
  const start = new Date("2023-04-04 00:00:00");
  const end = new Date("2023-04-05 00:00:00");
  logQueryTimeRange.value = [start, end];
  logQueryIp.value = "10.0.0.193";
});

const trafficDataLoading = ref(false);
const trafficData = ref([]);
const trafficPageCount = ref(0);
const trafficCurrentPage = ref(1);
function trafficLogQuery(page) {
  trafficCurrentPage.value = page;
  trafficDataLoading.value = true;
  axios
    .post("http://10.0.0.236:8000/api/fused_info/traffic", {
      start: logQueryTimeRange.value[0].toISOString(),
      end: logQueryTimeRange.value[1].toISOString(),
      ipList: logQueryIp.value.split(","),
      page: page,
      size: 10, // 10 items per page
      demo: false,
    })
    .then((res) => {
      trafficData.value = res.data.data.map((item) => ({
        ...item,
        startTime: item.startTime.split(".")[0],
        endTime: item.endTime.split(".")[0],
      }));
      trafficPageCount.value = res.data.total;
    })
    .finally(() => {
      trafficDataLoading.value = false;
    });
}

const alertDataLoading = ref(false);
const alertData = ref([]);
const alertPageCount = ref(0);
const alertCurrentPage = ref(1);
function alertLogQuery(page) {
  alertCurrentPage.value = page;
  alertDataLoading.value = true;
  axios
    .post("http://10.0.0.236:8000/api/fused_info/alert", {
      start: logQueryTimeRange.value[0].toISOString(),
      end: logQueryTimeRange.value[1].toISOString(),
      ipList: logQueryIp.value.split(","),
      page: page,
      size: 10, // 10 items per page
      demo: true,
    })
    .then((res) => {
      alertData.value = res.data.data;
      alertPageCount.value = res.data.total;
      console.log(res.data);
    })
    .finally(() => {
      alertDataLoading.value = false;
    });
}
</script>

<template>
  <!--avoid css pollution-->
  <div id="log-fusion" style="height: 100%">
    <el-container style="height: 100%">
      <el-header>
        <el-row>
          <el-col :span="16" style="display: flex">
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
          <el-col :span="8"> </el-col>
        </el-row>
      </el-header>
      <el-main style="height: 100%">
        <el-row>
          <el-col
            :span="12"
            v-loading.lock="trafficDataLoading"
            style="display: flex; flex-direction: column"
          >
            <el-divider>流量信息</el-divider>
            <el-table :data="trafficData" height="500px">
              <el-table-column
                prop="clientIp"
                label="客户端 IP"
                min-width="100px"
              />
              <el-table-column
                prop="clientPort"
                label="客户端端口"
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
              :page-count="trafficPageCount"
              :current-page="trafficCurrentPage"
              @current-change="trafficLogQuery"
              layout="prev, pager, next"
              style="margin: 0 auto"
            />
          </el-col>
          <el-col
            :span="11"
            :offset="1"
            v-loading.lock="alertDataLoading"
            style="display: flex; flex-direction: column"
          >
            <el-divider>告警信息</el-divider>
            <el-table :data="alertData" height="500px">
              <el-table-column prop="host" label="主机" />
              <el-table-column prop="alert" label="告警名称" />
              <el-table-column prop="time" label="时间" />
              <el-table-column prop="device" label="告警设备" />
              <el-table-column prop="link" label="详情链接" />
            </el-table>
            <el-pagination
              :page-count="alertPageCount"
              :current-page="alertCurrentPage"
              @current-change="alertLogQuery"
              layout="prev, pager, next"
              style="margin: 0 auto"
            />
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12" style="display: flex; flex-direction: column">
            <el-divider>应用信息</el-divider>
          </el-col>
          <el-col
            :span="11"
            :offset="1"
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
