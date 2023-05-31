<script setup>
import G6 from "@antv/g6";
import axios from "axios";

import { nextTick, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";

let overviewGraph = null;
let overviewGraphContainer = null;
let overviewGraphHighlightedEdge = null;

function getTooltip(model, is_center = false) {
  // 边
  if (model.hasOwnProperty("source") && model.hasOwnProperty("target")) {
    if (model.hasOwnProperty("ts")) {
      return `<div>
                <p>timestamp: ${model.ts}</p>
              </div>`;
    } else if (model.hasOwnProperty("access")) {
      return `<div>
                <p>access: ${model.access}</p>
              </div>`;
    } else {
      return ``;
    }
  } else {
    if (model.node_type === "host") {
      if (model.hasOwnProperty("ip")) {
        let host_tooltip = `<div>
                              <p>ip: ${model.ip}</p>`;
        if (model.hasOwnProperty("port")) {
          host_tooltip += `   <p>port: ${model.port}</p>`;
        }
        if (!is_center) {
          host_tooltip += `   <p>alerts: ${model.alerts}</p>`;
        }
        host_tooltip += `   </div>`;
        return host_tooltip;
      } else {
        return `<div>
                  <p>id: ${model.id}</p>
                </div>`;
      }
    } else {
      return ``;
    }
  }
}

function createOverviewGragh(containerId) {
  overviewGraphContainer = document.getElementById(containerId);
  const graph = new G6.Graph({
    container: containerId,
    width: overviewGraphContainer.clientWidth,
    height: overviewGraphContainer.clientHeight,
    modes: {
      default: ["drag-canvas", "zoom-canvas", "drag-node"],
    },
    layout: {
      type: "force",
      preventOverlap: true,
      linkDistance: (d) => {
        return 100 + d.source.size + d.target.size;
      },
    },
    defaultNode: {
      size: 30,
      style: {
        lineWidth: 2,
        fill: "#C6E5FF",
        stroke: "#5B8FF9",
      },
    },
    defaultEdge: {
      labelCfg: {
        autoRotate: true,
      },
      style: {
        stroke: "#C0C4CC",
        lineWidth: 3,
      },
    },
    maxZoom: 1.5, // 最大缩放比例
    linkCenter: true,
    // 启用tooltip
    plugins: [
      new G6.Tooltip({
        getContent(evt) {
          const { item } = evt;
          const model = item.getModel();
          return getTooltip(model);
        },
        offsetX: 10,
        offsetY: 20,
        itemTypes: ["node", "edge"],
      }),
    ],
  });

  // 弹出详情
  graph.on("edge:click", (evt) => {
    const { item } = evt;
    overviewGraphHighlightedEdge = item.getModel();
    // query
    console.log(overviewGraphHighlightedEdge);
    showTrafficDialog.value = true;
    trafficLogQuery(1);
  });

  // 重新布局
  function refreshDragedNodePosition(e) {
    const model = e.item.get("model");
    model.fx = e.x;
    model.fy = e.y;
  }
  graph.on("node:dragstart", function (e) {
    graph.layout();
    refreshDragedNodePosition(e);
  });
  graph.on("node:drag", function (e) {
    refreshDragedNodePosition(e);
  });
  graph.on("node:dragend", function (e) {
    e.item.get("model").fx = null;
    e.item.get("model").fy = null;
  });
  window.addEventListener("resize", () => {
    const newWidth = overviewGraphContainer.clientWidth;
    const newHeight = overviewGraphContainer.clientHeight;
    graph.changeSize(newWidth, newHeight);
    graph.fitView(20);
  });

  return graph;
}

function updateOverviewGraph(start, end, ip) {
  overviewGraphLoading.value = true;
  if (overviewGraph) {
    overviewGraph.clear();
  }
  const payload = {
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    ip: "",
    ip_list: [],
    hostname: "",
    level: "holistic",
    demo: false,
  };
  if (ip !== "") {
    const ipList = ip.split(",");
    if (ipList.length === 1) {
      payload.ip = ipList[0];
    } else {
      payload.ip_list = ipList;
    }
  }
  axios
    .post("http://10.0.0.236:8001/api/parser/", payload)
    .then((res) => {
      const graphData = {
        nodes: res.data.graph.nodes.map((node) => {
          const newNode = {
            ...node,
            node_type: node.type,
          };
          if (node.hasOwnProperty("alerts") && node.alerts > 0) {
            newNode["style"] = {
              fill: "#FCBBC1",
            };
          }
          return newNode;
        }),
        edges: res.data.graph.edges.map((edge) => ({
          ...edge,
          label: edge.access,
        })),
      };
      nextTick(() => {
        if (overviewGraph === null) {
          overviewGraph = createOverviewGragh("overview-graph");
        }
        overviewGraph.data(graphData);
        overviewGraph.render();
        // FIXME: 暂时不知道这个 render 是怎么回事，似乎数量太多时渲染布局会出问题
        // 每一条边等 10ms
        setTimeout(() => {
          overviewGraphLoading.value = false;
        }, graphData.edges.length * 10);
      });
    })
    .catch(() => {
      overviewGraphLoading.value = false;
    });
}

const overviewGraphLoading = ref(false);
const overviewGraphIp = ref("");
const overviewGraphTimeRange = ref("");
const overviewGraphTimeRangeShortcuts = [
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
function searchOverviewGraph() {
  if (!overviewGraphTimeRange.value) {
    ElMessage({
      message: "请选择时间范围",
      type: "warning",
      grouping: true,
      showClose: true,
    });
  } else {
    updateOverviewGraph(
      overviewGraphTimeRange.value[0],
      overviewGraphTimeRange.value[1],
      overviewGraphIp.value
    );
  }
}

onMounted(() => {
  const start = new Date("2023-04-20T00:00:00.000Z");
  const end = new Date("2023-04-26T00:00:00.000Z");
  overviewGraphIp.value = "99.999.9.31";
  overviewGraphTimeRange.value = [start, end];
  updateOverviewGraph(
    overviewGraphTimeRange.value[0],
    overviewGraphTimeRange.value[1],
    overviewGraphIp.value
  );
});

const showTrafficDialog = ref(false);
function closeTrafficDialog() {
  showTrafficDialog.value = false;
}

const trafficDataLoading = ref(false);
const trafficData = ref([]);
const trafficDataTotal = ref(0);
const trafficCurrentPage = ref(1);
function trafficLogQuery(page) {
  trafficCurrentPage.value = page;
  trafficDataLoading.value = true;
  axios
    .post("http://10.0.0.236:8001/api/fused_info/traffic", {
      start: overviewGraphTimeRange.value[0].toISOString(),
      end: overviewGraphTimeRange.value[1].toISOString(),
      src: overviewGraphHighlightedEdge.source,
      dst: overviewGraphHighlightedEdge.target,
      is_port: false,
      page: page - 1,
      size: 10, // 10 items per page
    })
    .then((res) => {
      console.log(res.data.data);
      trafficData.value = res.data.data.map((item) => ({
        ...item,
        timestamp: item.timestamp.split(".")[0].replaceAll("T", " "),
      }));
    })
    .finally(() => {
      trafficDataLoading.value = false;
    });
}
</script>

<template>
  <div id="hw-2023" style="height: 100%">
    <el-container v-loading.lock="overviewGraphLoading" style="height: 100%">
      <el-header>
        <el-row>
          <el-col
            :span="16"
            :offset="4"
            style="display: flex; min-width: 800px; padding-top: 14px"
          >
            <el-date-picker
              v-model="overviewGraphTimeRange"
              type="datetimerange"
              :shortcuts="overviewGraphTimeRangeShortcuts"
              range-separator="-"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              style="min-width: 400px"
            />
            <el-input
              v-model="overviewGraphIp"
              placeholder="请输入 ip，多个 ip 请用 , 分隔（可以为空）"
              clearable
            >
              <template #append>
                <el-button>
                  <el-icon @click="searchOverviewGraph">
                    <Search />
                  </el-icon>
                </el-button>
              </template>
            </el-input>
          </el-col>
        </el-row>
      </el-header>
      <el-main style="padding-top: 0; height: 100%; overflow-y: hidden">
        <el-row style="height: 100%">
          <el-col>
            <div id="overview-graph" style="width: 100%; height: 100%" />
          </el-col>
        </el-row>
      </el-main>
    </el-container>
    <el-dialog
      v-model="showTrafficDialog"
      :before-close="closeTrafficDialog"
      title="流量信息"
      fullscreen
    >
      <el-table :data="trafficData">
        <el-table-column type="expand">
          <template #default="props">
            <div style="padding: 0 20px">
              <p>content:</p>
              <pre>{{ props.row.content }}</pre>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="timestamp" min-width="200px" />
        <el-table-column prop="brief" label="brief" min-width="300px" />
        <el-table-column prop="uri" label="uri" min-width="350px" />
        <el-table-column prop="protocols" label="protocols" min-width="250px" />
        <el-table-column
          prop="content_short"
          label="content_short"
          min-width="350px"
        />
        <el-table-column
          prop="analyze_res"
          label="analyze_res"
          min-width="120px"
        />
      </el-table>
      <el-pagination
        :total="trafficDataTotal"
        :current-page="trafficCurrentPage"
        @current-change="trafficLogQuery"
        layout="prev, pager, next"
        style="margin: 0 auto"
      />
    </el-dialog>
  </div>
</template>

<style>
#hw-2023 .el-dialog__body {
  display: flex;
  flex-direction: column;
}
</style>
