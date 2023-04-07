<script setup>
import G6 from "@antv/g6";
import axios from "axios";

import { computed, nextTick, onMounted, ref, watch } from "vue";

// tools
const loading = ref(false);

function nodeTypeToShape(type) {
  switch (type) {
    case "host":
      return "diamond";
    case "app":
      return "rect";
    default:
      return "circle";
  }
}

function getTooltip(model) {
  if (model.id.startsWith("edge")) {
    if (model.ts) {
      return `<div>
                <p>timestamp: ${model.ts}</p>
              </div>`;
    } else if (model.access) {
      return `<div>
                <p>access: ${model.access}</p>
              </div>`;
    } else {
      return ``;
    }
  } else {
    if (model.node_type === "host") {
      return `<div>
                <p>ip: ${model.ip}</p>
              </div>`;
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

function updateOverviewGraph() {
  loading.value = true;
  axios
    .post("http://10.0.0.236:8000/api/parser/", {
      start_time: "2023-04-03T00:00:00.000Z",
      end_time: "2023-04-06T00:00:00.000Z",
      ip: "10.0.0.47",
      hostname: "10-0-0-47",
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
        edges: res.data.graph.edges,
      };
      overviewGraph = createOverviewGragh("overview-graph");
      overviewGraph.data(graphData);
      overviewGraph.render();
      loading.value = false;
    });
}

function updateDetailGraph() {
  loading.value = true;
  axios
    .post("http://10.0.0.236:8000/api/parser/", {
      start_time: "2023-04-04T10:19:00.00Z",
      end_time: "2023-04-04T10:23:17.00Z",
      ip: "10.0.0.193",
      hostname: "",
      level: "alert",
      demo: true,
    })
    .then((res) => {
      const graphData = {
        nodes: res.data.graph.nodes.map((node) => ({
          ...node,
          node_type: node.type,
          type: nodeTypeToShape(node.type),
        })),
        edges: res.data.graph.edges,
      };
      detailGraph = createDetailGragh("detail-graph");
      detailGraph.data(graphData);
      detailGraph.render();
      loading.value = false;
    });
}

// overview graph
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
      type: "force",
      preventOverlap: true,
      linkDistance: (d) => {
        return 100 + (d.source.size + d.target.size) / 2;
      },
      edgeStrength: 0.5,
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
      style: {
        stroke: "#C0C4CC",
        lineWidth: 2,
        endArrow: true,
      },
    },
    maxZoom: 1.2, // 最大缩放比例
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
      } else {
        // 点击其他节点时切换高亮状态
        graph.getNodes().forEach((node) => {
          if (node !== item) {
            graph.setItemState(node, "dim", true);
          } else {
            graph.setItemState(node, "dim", false);
          }
        });
        overviewGraphHighlightedNode = item;
        // 更新 detail graph 内容
        updateDetailGraph();
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
  updateOverviewGraph();
});

// detail graph
let detailGraph = null;
let detailGraphContainer = null;
const detailGraphColSpan = computed(() => {
  return 24 - overviewGraphColSpan.value;
});

watch(detailGraphColSpan, (val) => {
  if (val > 0) {
    nextTick(() => {
      updateDetailGraph();
    });
  } else {
    nextTick(() => {
      detailGraph.destroy();
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
      style: {
        stroke: "#C0C4CC",
        lineWidth: 2,
        endArrow: true,
      },
    },
    maxZoom: 1.2, // 最大缩放比例
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
                <span>告警信息</span>
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
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
