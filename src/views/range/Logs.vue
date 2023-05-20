<script setup>
import axios from "axios";

import { onMounted, ref } from "vue";
import { useRoute, useRouter, onBeforeRouteUpdate } from "vue-router";
import { ElMessage } from "element-plus";

const router = useRouter();
const route = useRoute();

const start = new Date("2023-04-26 00:00:00");
const end = new Date("2023-04-29 00:00:00");
const logQueryTimeRange = ref([start, end]);
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
const logQueryIp = ref("10.0.0.193");

function onRouterChange() {
  router.push({
    path: "/range/logs",
    query: {
      start: logQueryTimeRange.value[0].toISOString(),
      end: logQueryTimeRange.value[1].toISOString(),
      agents: logQueryIp.value,
    },
  });
}

function setRouterProps(query, first = false) {
  if (
    query.hasOwnProperty("start") &&
    query.hasOwnProperty("end") &&
    query.hasOwnProperty("agents")
  ) {
    logQueryTimeRange.value[0] = new Date(query.start);
    logQueryTimeRange.value[1] = new Date(query.end);
    logQueryIp.value = query.agents;
    logQuery();
  } else {
    if (first) {
      return;
    }
    ElMessage({
      message: "路由参数有误，请检查路由参数是否正确",
      type: "warning",
      grouping: true,
      showClose: true,
    });
  }
}

onBeforeRouteUpdate((curRoute) => {
  setRouterProps(curRoute.query);
});

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
  const queryReqs = [trafficLogQuery(1), auditLogQuery(1)];
  Promise.allSettled(queryReqs);
}

onMounted(() => {
  setRouterProps(route.query, true);
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
      ipList: logQueryIp.value.split(","),
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
  <div id="log-fusion" style="height: 100%">
    <el-header>
      <el-row>
        <el-col
          :span="16"
          :offset="4"
          style="display: flex; min-width: 800px; padding-top: 14px"
        >
          <el-date-picker
            v-model="logQueryTimeRange"
            type="datetimerange"
            :shortcuts="logQueryTimeRangeShortcuts"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="min-width: 400px"
          />
          <el-input
            v-model="logQueryIp"
            placeholder="请输入 ip，多个 ip 请用 , 分隔（可以为空）"
            clearable
          >
            <template #append>
              <el-button>
                <el-icon @click="onRouterChange">
                  <Search />
                </el-icon>
              </el-button>
            </template>
          </el-input>
        </el-col>
      </el-row>
    </el-header>
    <el-container>
      <el-main style="padding-top: 0">
        <el-row>
          <el-col
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
        </el-row>
        <el-row>
          <el-col
            v-loading.lock="auditDataLoading"
            style="display: flex; flex-direction: column"
          >
            <el-divider>审计信息</el-divider>
            <el-table :data="auditDataDisplay" height="450px">
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
              <el-table-column
                prop="cwd"
                label="当前工作目录"
                min-width="150px"
              />
              <el-table-column prop="path" label="路径" min-width="150px" />
            </el-table>
            <el-pagination
              :total="auditDataTotal"
              :current-page="auditCurrentPage"
              @current-change="auditDataNextPage"
              layout="prev, pager, next"
              style="margin: 0 auto"
            />
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>
