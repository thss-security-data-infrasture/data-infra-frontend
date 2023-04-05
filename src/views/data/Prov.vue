<script setup>
import G6 from "@antv/g6";
import { computed, nextTick, onMounted, ref, watch } from "vue";

// overview graph
const data = {
  nodes: [
    { id: "node1", label: "Node 1", size: 50, type: "rect" },
    { id: "node2", label: "Node 2", size: 50, type: "diamond" },
    { id: "node3", label: "Node 3", size: 50, type: "ellipse" },
    { id: "node4", label: "Node 4", size: 50, type: "ellipse" },
    { id: "node5", label: "Node 5", size: 60, type: "ellipse" },
  ],
  edges: [
    { source: "node1", target: "node2", ts: 114514 },
    { source: "node2", target: "node3", ts: 1919810 },
    { source: "node3", target: "node4", ts: 7777777 },
    { source: "node4", target: "node5", ts: 6324 },
    { source: "node5", target: "node1", ts: 12306 },
  ],
};

let overviewGraph = null;
let overviewGraphContainer = null;
const overviewGraphColSpan = ref(24);
watch(overviewGraphColSpan, () => {
  nextTick(() => {
    const newWidth = overviewGraphContainer.clientWidth;
    const newHeight = overviewGraphContainer.clientHeight;
    overviewGraph.changeSize(newWidth, newHeight);
    overviewGraph.fitView(20);
  });
});

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
      size: 20,
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
        stroke: "#3F3F3F",
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
          if (model.id.startsWith("edge")) {
            return `<div>
                      <p>Timestamp: ${model.ts}</p>
                    </div>`;
          } else {
            return `<div>
                      <p>ID: ${model.id}</p>
                      <p>Label: ${model.label}</p>
                      <p>Size: ${model.size}</p>
                    </div>`;
          }
        },
        offsetX: 10,
        offsetY: 20,
        itemTypes: ["node", "edge"],
      }),
    ],
  });

  // 高亮
  let highlightedNode = null;
  graph.on("node:click", (evt) => {
    const { item } = evt;

    if (highlightedNode) {
      if (highlightedNode === item) {
        // 点击已高亮的节点时取消变暗效果并恢复全屏
        graph.getNodes().forEach((node) => {
          graph.setItemState(node, "dim", false);
        });
        highlightedNode = null;
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
        highlightedNode = item;
      }
    } else {
      // 首次点击节点时使其他节点变暗并移到左边
      graph.getNodes().forEach((node) => {
        if (node !== item) {
          graph.setItemState(node, "dim", true);
        }
      });
      highlightedNode = item;
      overviewGraphColSpan.value = 12;
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
  overviewGraph = createOverviewGragh("overview-graph");
  overviewGraph.data(data);
  overviewGraph.render();
});

// detail graph
const data2 = {
  nodes: [
    { id: "node11", label: "Node 1", size: 50, type: "rect" },
    { id: "node12", label: "Node 2", size: 50, type: "diamond" },
    { id: "node13", label: "Node 3", size: 50, type: "ellipse" },
    { id: "node14", label: "Node 4", size: 50, type: "ellipse" },
    { id: "node15", label: "Node 5", size: 60, type: "ellipse" },
  ],
  edges: [
    { source: "node11", target: "node12", ts: 114514 },
    { source: "node12", target: "node13", ts: 1919810 },
    { source: "node13", target: "node14", ts: 7777777 },
    { source: "node14", target: "node15", ts: 6324 },
    { source: "node15", target: "node11", ts: 12306 },
  ],
};

let detailGraph = null;
let detailGraphContainer = null;
const detailGraphColSpan = computed(() => {
  return 24 - overviewGraphColSpan.value;
});

watch(detailGraphColSpan, (val) => {
  if (val > 0) {
    nextTick(() => {
      detailGraph = createDetailGragh("detail-graph");
      detailGraph.data(data2);
      detailGraph.render();
    });
  } else {
    detailGraph.destroy();
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
      size: 20,
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
        stroke: "#3F3F3F",
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
          if (model.id.startsWith("edge")) {
            return `<div>
                      <p>Timestamp: ${model.ts}</p>
                    </div>`;
          } else {
            return `<div>
                      <p>ID: ${model.id}</p>
                      <p>Label: ${model.label}</p>
                      <p>Size: ${model.size}</p>
                    </div>`;
          }
        },
        offsetX: 10,
        offsetY: 20,
        itemTypes: ["node", "edge"],
      }),
    ],
  });

  // 高亮
  let highlightedNode = null;
  graph.on("node:click", (evt) => {
    const { item } = evt;

    if (highlightedNode) {
      if (highlightedNode === item) {
        // 点击已高亮的节点时取消变暗效果
        graph.getNodes().forEach((node) => {
          graph.setItemState(node, "dim", false);
        });
        highlightedNode = null;
      } else {
        // 点击其他节点时切换高亮状态
        graph.getNodes().forEach((node) => {
          if (node !== item) {
            graph.setItemState(node, "dim", true);
          } else {
            graph.setItemState(node, "dim", false);
          }
        });
        highlightedNode = item;
      }
    } else {
      // 首次点击节点时使其他节点变暗
      graph.getNodes().forEach((node) => {
        if (node !== item) {
          graph.setItemState(node, "dim", true);
        }
      });
      highlightedNode = item;
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
    const newWidth = detailGraphContainer.clientWidth;
    const newHeight = detailGraphContainer.clientHeight;
    graph.changeSize(newWidth, newHeight);
    graph.fitView(20);
  });

  return graph;
}
</script>

<template>
  <el-container style="height: 100%">
    <el-main style="height: 100%; overflow-y: hidden">
      <el-row style="height: 100%">
        <el-col :span="overviewGraphColSpan">
          <div id="overview-graph" style="width: 100%; height: 100%"></div>
        </el-col>
        <el-col :span="detailGraphColSpan">
          <div id="detail-graph" style="width: 100%; height: 100%"></div>
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<style>
.el-card__body {
  height: 100%;
  padding: 0;
}
</style>
