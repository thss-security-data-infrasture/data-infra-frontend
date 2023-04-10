<script setup>
import G6 from "@antv/g6";
import axios from "axios";

import { computed, nextTick, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";

// tools
const loading = ref(false);

function nodeTypeToShape(type) {
  if (type === "host") {
    return "diamond";
  } else if (type === "app") {
    return "rect";
  } else {
    return "circle";
  }
}

function nodeTypeToColor(type) {
  if (type === "alert") {
    return "#FCBBC1";
  } else {
    return "#C6E5FF";
  }
}

function getTooltip(model) {
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
        return `<div>
                  <p>ip: ${model.ip}</p>
                </div>`;
      } else {
        return `<div>
                  <p>id: ${model.id}</p>
                </div>`;
      }
    } else if (model.node_type === "app") {
      return `<div>
                <p>id: ${model.id}</p>
              </div>`;
    } else if (model.node_type === "alert") {
      return `<div>
                <p>ip: ${model.ip}</p>
                <p>time: ${model.time}</p>
              </div>`;
    } else {
      return ``;
    }
  }
}

function updateOverviewGraph(start, end, ip) {
  loading.value = true;
  if (overviewGraph) {
    overviewGraph.clear();
  }
  axios
    .post("http://10.0.0.236:8000/api/parser/", {
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      ip: ip,
      hostname: "",
      level: "holistic",
      demo: false,
    })
    .then((res) => {
      const graphData = {
        nodes: res.data.graph.nodes.map((node) => ({
          ...node,
          node_type: node.type,
          type: nodeTypeToShape(node.type),
        })),
        edges: res.data.graph.edges.map((edge) => ({
          ...edge,
          label: edge.access,
        })),
      };
      // multiple edges support
      G6.Util.processParallelEdges(graphData.edges);
      nextTick(() => {
        if (!overviewGraph) {
          overviewGraph = createOverviewGragh("overview-graph");
        }
        overviewGraph.data(graphData);
        overviewGraph.render();
        // FIXME: 暂时不知道这个 render 是怎么回事，似乎数量太多时渲染布局会出问题
        // 每一条边等 5ms，从观察来看，500 条边延迟 2500ms 比较合适
        setTimeout(() => {
          loading.value = false;
        }, graphData.edges.length * 5);
      });
    })
    .catch(() => {
      loading.value = false;
    });
}

function updateDetailGraph(type, start, end, ip) {
  loading.value = true;
  if (detailGraph) {
    detailGraph.clear();
  }
  // NOTE: 如果有必要，可以把之前的结果都缓存下来，避免重复发送请求
  if (type === "alert") {
    axios
      .post("http://10.0.0.236:8000/api/parser/", {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        ip: ip,
        hostname: "",
        level: type,
        demo: false,
      })
      .then((res) => {
        const graphData = {
          nodes: res.data.graph.nodes.map((node) => ({
            ...node,
            node_type: node.type,
            type: nodeTypeToShape(node.type),
            style: {
              fill: nodeTypeToColor(node.type),
              opacity: 0.8,
            },
          })),
          edges: res.data.graph.edges,
        };
        nextTick(() => {
          if (!detailGraph) {
            detailGraph = createDetailGragh("detail-graph");
          }
          detailGraph.data(graphData);
          detailGraph.render();
        });
      })
      .finally(() => {
        loading.value = false;
      });
  } else {
    loading.value = false;
  }
}

// overview graph
const overviewGraphIp = ref("");
const overviewGraphTimeRange = ref("");
const overviewGraphTimeRangeShortcuts = [
  {
    text: "Last 1h",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 1);
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
const search = () => {
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
};

let overviewGraph = null;
let overviewGraphContainer = null;
let overviewGraphHighlightedNode = null;

const overviewGraphColSpan = ref(24);

watch(overviewGraphColSpan, () => {
  nextTick(() => {
    const newWidth = overviewGraphContainer.clientWidth;
    const newHeight = overviewGraphContainer.clientHeight;
    overviewGraph.changeSize(newWidth, newHeight);
    overviewGraph.fitView(20);
  });
});

const closeDetailGraph = () => {
  // 取消变暗效果并恢复全屏
  overviewGraph.getNodes().forEach((node) => {
    overviewGraph.setItemState(node, "dim", false);
  });
  overviewGraphHighlightedNode = null;
  overviewGraphColSpan.value = 24;
};

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
      type: "gForce",
      preventOverlap: true,
      linkDistance: (d) => {
        return 100 + (d.source.size + d.target.size) / 2;
      },
    },
    defaultNode: {
      size: 30,
      style: {
        lineWidth: 2,
        fill: "#C6E5FF",
        stroke: "#5B8FF9",
      },
      stateStyles: {
        dim: {
          opacity: 0.2,
        },
      },
    },
    defaultEdge: {
      labelCfg: {
        autoRotate: true,
      },
      style: {
        stroke: "#C0C4CC",
        lineWidth: 2,
        endArrow: {
          path: G6.Arrow.triangle(3, 5, 15),
          d: 15,
        },
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

  // 高亮
  graph.on("node:click", (evt) => {
    const { item } = evt;

    if (overviewGraphHighlightedNode) {
      if (overviewGraphHighlightedNode === item) {
        // 点击已高亮的节点时取消变暗效果并恢复全屏
        graph.getNodes().forEach((node) => {
          graph.setItemState(node, "dim", false);
        });
        overviewGraphHighlightedNode = null;
        overviewGraphColSpan.value = 24;
      }
    } else {
      // 首次点击节点时使其他节点变暗并移到左边
      graph.getNodes().forEach((node) => {
        if (node !== item) {
          graph.setItemState(node, "dim", true);
        }
      });
      overviewGraphHighlightedNode = item;
      overviewGraphColSpan.value = 16;
    }
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

onMounted(() => {
  // last day
  const end = new Date();
  const start = new Date();
  start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
  overviewGraphTimeRange.value = [start, end];
  overviewGraphIp.value = "10.0.0.193";
  updateOverviewGraph(
    overviewGraphTimeRange.value[0],
    overviewGraphTimeRange.value[1],
    overviewGraphIp.value
  );
});

// detail graph
const detailGraphSelected = ref("alert");
const detailGraphOptions = ref([
  { label: "告警信息", value: "alert" },
  { label: "应用信息", value: "app" },
  { label: "容器信息", value: "docker" },
  { label: "审计溯源图", value: "audit" },
]);
watch(detailGraphSelected, (cur) => {
  nextTick(() => {
    updateDetailGraph(
      cur,
      overviewGraphTimeRange.value[0],
      overviewGraphTimeRange.value[1],
      overviewGraphHighlightedNode.getModel().ip ??
        overviewGraphHighlightedNode.getModel().id
    );
  });
});

let detailGraph = null;
let detailGraphContainer = null;
const detailGraphColSpan = computed(() => {
  return 24 - overviewGraphColSpan.value;
});
watch(detailGraphColSpan, (val) => {
  if (val > 0) {
    nextTick(() => {
      // 默认展示告警图
      updateDetailGraph(
        "alert",
        overviewGraphTimeRange.value[0],
        overviewGraphTimeRange.value[1],
        overviewGraphHighlightedNode.getModel().ip ??
          overviewGraphHighlightedNode.getModel().id
      );
    });
  }
});
function createDetailGragh(containerId) {
  detailGraphContainer = document.getElementById(containerId);
  const graph = new G6.Graph({
    container: containerId,
    width: detailGraphContainer.clientWidth,
    height: detailGraphContainer.clientHeight,
    modes: {
      default: ["drag-canvas", "zoom-canvas", "drag-node"],
    },
    layout: {
      type: "force",
      preventOverlap: true,
      linkDistance: (d) => {
        return 100 + (d.source.size + d.target.size) / 2;
      },
      edgeStrength: 0.5,
    },
    defaultNode: {
      size: 60,
      style: {
        lineWidth: 2,
      },
      stateStyles: {
        dim: {
          opacity: 0.2,
        },
      },
    },
    defaultEdge: {
      style: {
        stroke: "#C0C4CC",
        lineWidth: 2,
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
        itemTypes: ["node"],
      }),
    ],
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
    const newWidth = detailGraphContainer.clientWidth;
    const newHeight = detailGraphContainer.clientHeight;
    graph.changeSize(newWidth, newHeight);
    graph.fitView(20);
  });

  return graph;
}
</script>

<template>
  <el-container v-loading.lock="loading" style="height: 100%">
    <el-header>
      <el-row>
        <el-col :span="16">
          <el-input v-model="overviewGraphIp" placeholder="请输入 ip" clearable>
            <template #prepend>
              <el-date-picker
                v-model="overviewGraphTimeRange"
                type="datetimerange"
                :shortcuts="overviewGraphTimeRangeShortcuts"
                range-separator="-"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
              />
            </template>
            <template #append>
              <el-button>
                <el-icon type="primary" @click="search"><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </el-col>
      </el-row>
    </el-header>
    <el-main style="height: 100%; overflow-y: hidden">
      <el-row style="height: 100%">
        <el-col :span="overviewGraphColSpan">
          <div id="overview-graph" style="width: 100%; height: 100%"></div>
        </el-col>
        <el-col :span="detailGraphColSpan">
          <el-card
            style="height: 100%"
            :body-style="{
              height: '100%',
              padding: 0,
            }"
          >
            <template #header>
              <div class="card-header">
                <el-select v-model="detailGraphSelected" size="large">
                  <el-option
                    v-for="option in detailGraphOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                <el-button @click="closeDetailGraph">
                  <el-icon color="#F56C6C"><CloseBold /></el-icon>
                </el-button>
              </div>
            </template>
            <div id="detail-graph" style="width: 100%; height: 100%"></div>
          </el-card>
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<style>
.el-input-group__prepend {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
