<script setup>
import G6 from "@antv/g6";
import { onMounted } from "vue";

onMounted(() => {
  const overviewGraphContainer = document.getElementById("overview-graph");
  const graph = new G6.Graph({
    container: "overview-graph",
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
      size: 1,
      color: "#e2e2e2",
    },
    maxZoom: 1.2, // 设置最大缩放比例
    fitView: true,
    fitViewPadding: 20,
  });

  const data = {
    nodes: [
      { id: "node1", label: "Node 1", size: 20 },
      { id: "node2", label: "Node 2", size: 30 },
      { id: "node3", label: "Node 3", size: 40 },
      { id: "node4", label: "Node 4", size: 50 },
      { id: "node5", label: "Node 5", size: 60 },
    ],
    edges: [
      { source: "node1", target: "node2" },
      { source: "node2", target: "node3" },
      { source: "node3", target: "node4" },
      { source: "node4", target: "node5" },
      { source: "node5", target: "node1" },
    ],
  };

  graph.data(data);
  graph.render();

  let highlightedNode = null;

  graph.on("node:mouseenter", (evt) => {
    const { item } = evt;

    if (item !== highlightedNode) {
      const model = item.getModel();
      model.size = model.size * 1.2; // 让节点大小增加20%
      graph.updateItem(item, model);
    }
  });

  graph.on("node:mouseleave", (evt) => {
    const { item } = evt;

    if (item !== highlightedNode) {
      const model = item.getModel();
      model.size = model.size / 1.2; // 恢复节点原始大小
      graph.updateItem(item, model);
    }
  });

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

    // 更新图的尺寸
    graph.changeSize(newWidth, newHeight);
    graph.fitView(20);
  });
});

onMounted(() => {
  const detailGraphContainer = document.getElementById("detail-graph");
  const graph = new G6.Graph({
    container: "detail-graph",
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
      size: 1,
      color: "#e2e2e2",
    },
    maxZoom: 1.2, // 设置最大缩放比例
    fitView: true,
    fitViewPadding: 20,
  });

  const data = {
    nodes: [
      { id: "node1", label: "Node 1", size: 20 },
      { id: "node2", label: "Node 2", size: 30 },
      { id: "node3", label: "Node 3", size: 40 },
      { id: "node4", label: "Node 4", size: 50 },
      { id: "node5", label: "Node 5", size: 60 },
    ],
    edges: [
      { source: "node1", target: "node2" },
      { source: "node2", target: "node3" },
      { source: "node3", target: "node4" },
      { source: "node4", target: "node5" },
      { source: "node5", target: "node1" },
    ],
  };

  graph.data(data);
  graph.render();

  let highlightedNode = null;

  graph.on("node:mouseenter", (evt) => {
    const { item } = evt;

    if (item !== highlightedNode) {
      const model = item.getModel();
      model.size = model.size * 1.2; // 让节点大小增加20%
      graph.updateItem(item, model);
    }
  });

  graph.on("node:mouseleave", (evt) => {
    const { item } = evt;

    if (item !== highlightedNode) {
      const model = item.getModel();
      model.size = model.size / 1.2; // 恢复节点原始大小
      graph.updateItem(item, model);
    }
  });

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

    // 更新图的尺寸
    graph.changeSize(newWidth, newHeight);
    graph.fitView(20);
  });
});
</script>

<template>
  <p>溯源图</p>
  <el-container style="height: 100%">
    <el-main style="height: 100%">
      <el-row style="height: 100%">
        <el-col :span="12">
          <div id="overview-graph" style="width: 100%; height: 100%"></div>
        </el-col>
        <el-col :span="12">
          <div id="detail-graph" style="width: 100%; height: 100%"></div>
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>
