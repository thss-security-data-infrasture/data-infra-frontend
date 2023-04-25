<script setup>
import G6 from "@antv/g6";
import axios from "axios";
import svgPanZoom from "svg-pan-zoom";

import {
  computed,
  nextTick,
  onMounted,
  reactive,
  ref,
  toRaw,
  watch,
} from "vue";
import { ElMessage } from "element-plus";

// tools
const overviewGraphLoading = ref(false);

function nodeTypeToShape(type) {
  if (type === "host") {
    return "diamond";
  } else if (type === "app") {
    return "rect";
  } else {
    return "circle";
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
                  <p>alerts: ${model.alerts}</p>
                </div>`;
      } else {
        return `<div>
                  <p>id: ${model.id}</p>
                </div>`;
      }
    } else if (model.node_type === "docker") {
      //容器信息，为docker设置鼠标悬浮内容
      return `<div>
                <p>id: ${model.id}</p>
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
    .post("http://10.0.0.236:8000/api/parser/", payload)
    .then((res) => {
      const graphData = {
        nodes: res.data.graph.nodes.map((node) => {
          const newNode = {
            ...node,
            node_type: node.type,
            type: nodeTypeToShape(node.type),
          };
          if (node.alerts > 0) {
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
      // multiple edges support
      G6.Util.processParallelEdges(graphData.edges);
      nextTick(() => {
        if (!overviewGraph) {
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

function updateDetailGraph(type, start, end, ip) {
  overviewGraphLoading.value = true;
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
        ip_list: [],
        hostname: "",
        level: type,
        demo: false,
      })
      .then((res) => {
        const graphData = {
          nodes: res.data.graph.nodes.map((node) => {
            const newNode = {
              ...node,
              node_type: node.type,
              type: nodeTypeToShape(node.type),
            };
            if (node.type === "alert") {
              newNode["style"] = {
                fill: "#FCBBC1",
              };
            }
            return newNode;
          }),
          edges: res.data.graph.edges,
        };
        nextTick(() => {
          if (!detailGraph) {
            detailGraph = createDetailGragh("detail-graph");
          }
          detailGraph.data(graphData);
          detailGraph.render();
          overviewGraphLoading.value = false;
        });
      })
      .catch(() => {
        overviewGraphLoading.value = false;
      });
  } else if (type === "app") {
    // 获取app信息，产生关系图
    const graphData = {
      nodes: [],
      edges: [],
    };
    const originNode = {
      id: ip,
      ip: ip,
      label: ip,
      node_type: "app",
      type: nodeTypeToShape("host"),
      style: {
        fill: "#87F7FF",
      },
    };
    graphData.nodes.push(originNode);
    axios
      .post("http://10.0.0.236:8000/api/assets/app", {
        host_id: ip,
      })
      .then((res) => {
        const nowNodes = res.data.assets.flatMap((asset) => {
          const nowNode = {
            id: "app-" + asset.app,
            ip: ip,
            label: asset.app,
            node_type: "app",
            type: nodeTypeToShape("app"),
            style: {
              fill: "#FFF4AB",
            },
          };
          return nowNode;
        });
        const nowEdges = res.data.assets.flatMap((asset) => {
          const nowEdge = {
            source: ip,
            target: "app-" + asset.app,
            type: "app",
          };
          return nowEdge;
        });
        graphData.nodes.push(...nowNodes);
        graphData.edges.push(...nowEdges);
        nextTick(() => {
          if (!detailGraph) {
            detailGraph = createDetailGragh("detail-graph");
          }
          detailGraph.data(graphData);
          detailGraph.render();
          overviewGraphLoading.value = false;
        });
      })
      .catch((error) => {
        console.log(error);
        overviewGraphLoading.value = false;
      });
  } else if (type === "docker") {
    // 获取容器信息，产生图
    const graphData = {
      nodes: [],
      edges: [],
    };
    const originNode = {
      id: ip,
      ip: ip,
      label: ip,
      node_type: "docker",
      type: nodeTypeToShape("host"),
      style: {
        fill: "#87F7FF",
      },
    };
    graphData.nodes.push(originNode);
    // 设置同步
    const promiseArr = [];
    // 是否获取结果
    let isGetResult = [false, false, false];
    // 获取container
    const containerPromise = axios
      .post("http://10.0.0.236:8000/api/assets/docker/container", {
        host_id: ip,
      })
      .then((res) => {
        const nowNodes = res.data.assets.map((assert) => {
          const nowNode = {
            id: "container-" + assert.id,
            ip: ip,
            label: assert.name,
            node_type: "container",
            type: nodeTypeToShape("container"),
            style: {
              fill: "#FFA3DC",
            },
          };
          return nowNode;
        });
        const nowEdges = res.data.assets.map((assert) => {
          const nowEdge = {
            source: ip,
            target: "container-" + assert.id,
            type: "container",
          };
          return nowEdge;
        });
        graphData.nodes.push(...nowNodes);
        graphData.edges.push(...nowEdges);
        isGetResult[0] = true;
      })
      .catch((error) => {
        console.log(error);
        overviewGraphLoading.value = false;
      });
    promiseArr.push(containerPromise);
    // 获取image
    const imagePromise = axios
      .post("http://10.0.0.236:8000/api/assets/docker/image", {
        host_id: ip,
      })
      .then((res) => {
        const nowNodes = res.data.assets.flatMap((asset) => {
          const Node = asset.repo_tags.map((tag) => {
            const nowNode = {
              id: "image-" + tag,
              ip: ip,
              label: tag,
              node_type: "image",
              type: nodeTypeToShape("image"),
              style: {
                fill: "#FFF4AB",
              },
            };
            return nowNode;
          });
          return Node;
        });
        const nowEdges = res.data.assets.flatMap((asset) => {
          const Edge = asset.repo_tags.map((tag) => {
            const nowEdge = {
              source: ip,
              target: "image-" + tag,
              type: "image",
            };
            return nowEdge;
          });
          return Edge;
        });
        graphData.nodes.push(...nowNodes);
        graphData.edges.push(...nowEdges);
        isGetResult[1] = true;
      })
      .catch((error) => {
        console.log(error);
        overviewGraphLoading.value = false;
      });
    promiseArr.push(imagePromise);
    // 获取network
    const networkPromise = axios
      .post("http://10.0.0.236:8000/api/assets/docker/network", {
        host_id: ip,
      })
      .then((res) => {
        const nowNodes = res.data.assets.map((assert) => {
          const nowNode = {
            id: "network-" + assert.id,
            ip: ip,
            label: assert.name,
            node_type: "network",
            type: nodeTypeToShape("network"),
            style: {
              fill: "#78E86F",
            },
          };
          return nowNode;
        });
        const nowEdges = res.data.assets.map((assert) => {
          const nowEdge = {
            source: ip,
            target: "network-" + assert.id,
            type: "network",
          };
          return nowEdge;
        });
        graphData.nodes.push(...nowNodes);
        graphData.edges.push(...nowEdges);
        isGetResult[2] = true;
      })
      .catch((error) => {
        console.log(error);
        overviewGraphLoading.value = false;
      });
    promiseArr.push(networkPromise);
    // 必须等待全部操作完成才能产生图
    Promise.allSettled(promiseArr)
      .then(() => {
        nextTick(() => {
          if (!isGetResult[0] || !isGetResult[1] || !isGetResult[2]) {
            graphData.nodes = [];
            graphData.edges = [];
          }
          if (!detailGraph) {
            detailGraph = createDetailGragh("detail-graph");
          }
          detailGraph.data(graphData);
          detailGraph.render();
          overviewGraphLoading.value = false;
        });
      })
      .catch((error) => console.log(error));
  } else {
    overviewGraphLoading.value = false;
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
    closeDetailGraph();
    updateOverviewGraph(
      overviewGraphTimeRange.value[0],
      overviewGraphTimeRange.value[1],
      overviewGraphIp.value
    );
  }
}

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

function closeDetailGraph() {
  // 取消变暗效果并恢复全屏
  overviewGraph.getNodes().forEach((node) => {
    overviewGraph.setItemState(node, "dim", false);
  });
  overviewGraphHighlightedNode = null;
  overviewGraphColSpan.value = 24;
  // 清空高亮选择
  detailGraphHighlightedNode.value = null;
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
  // 最近 24h
  const end = new Date();
  const start = new Date();
  start.setTime(end.getTime() - 3600 * 1000 * 24);
  overviewGraphTimeRange.value = [start, end];
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
]);
watch(detailGraphSelected, (cur) => {
  if (cur === "audit") {
    showAuditGraph.value = true;
  } else {
    nextTick(() => {
      updateDetailGraph(
        cur,
        overviewGraphTimeRange.value[0],
        overviewGraphTimeRange.value[1],
        overviewGraphHighlightedNode.getModel().ip ??
          overviewGraphHighlightedNode.getModel().id
      );
    });
  }
});

let detailGraph = null;
let detailGraphContainer = null;

const detailGraphHighlightedNode = ref(null);
const isDetailGraphSelected = computed(() => {
  return detailGraphHighlightedNode.value !== null;
});

const detailGraphColSpan = computed(() => {
  return 24 - overviewGraphColSpan.value;
});
watch(detailGraphColSpan, (val) => {
  if (val > 0) {
    nextTick(() => {
      // 默认展示告警图
      updateDetailGraph(
        // 如果选中其他图，则按照选项内容展示
        detailGraphSelected.value,
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
      size: 30,
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

  // 高亮
  graph.on("node:click", (evt) => {
    const { item } = evt;

    // if (detailGraphHighlightedNode.value) {
    if (toRaw(detailGraphHighlightedNode.value) === item) {
      // 点击已高亮的节点时取消变暗效果
      graph.getNodes().forEach((node) => {
        graph.setItemState(node, "dim", false);
      });
      detailGraphHighlightedNode.value = null;
      // }
    } else {
      // 首次点击节点时使其他节点变暗
      graph.getNodes().forEach((node) => {
        graph.setItemState(node, "dim", node !== item);
      });
      detailGraphHighlightedNode.value = item;
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

// audit graph
const auditGraphLoading = ref(false);

const showAuditGraphDialog = ref(false);
function openAuditGraphDialog() {
  showAuditGraphDialog.value = true;

  auditGraphIp.value =
    overviewGraphHighlightedNode.getModel().ip ??
    overviewGraphHighlightedNode.getModel().id;

  const alertTime = detailGraphHighlightedNode.value
    .getModel()
    .hasOwnProperty("time")
    ? new Date(detailGraphHighlightedNode.value.getModel().time)
    : new Date();
  const start = new Date();
  start.setTime(alertTime.getTime() - 300 * 1000);
  const end = new Date();
  end.setTime(alertTime.getTime());
  auditGraphTimeRange.value = [start, end];

  searchAuditGraph();
}
function closeAuditGraphDialog() {
  showAuditGraphDialog.value = false;
}

const auditGraphIp = ref("");
const auditGraphTimeRange = ref("");
const auditGraphTimeRangeShortcuts = [
  {
    text: "Last 5min",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 300 * 1000);
      return [start, end];
    },
  },
  {
    text: "Last 15min",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 900 * 1000);
      return [start, end];
    },
  },
  {
    text: "Last 30min",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 1800 * 1000);
      return [start, end];
    },
  },
  {
    text: "Last 1h",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000);
      return [start, end];
    },
  },
];
function searchAuditGraph() {
  auditGraphLoading.value = true;
  axios
    .post("http://10.0.0.236:8000/api/parser/audit/svg", {
      start_time: auditGraphTimeRange.value[0].toISOString(),
      end_time: auditGraphTimeRange.value[1].toISOString(),
      ip: auditGraphIp.value,
      demo: false,
    })
    .then((res) => {
      document.getElementById("audit-graph").innerHTML = "";
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "image/svg+xml" })
      );
      nextTick(() => {
        createNewEmbed(url);
        auditGraphLoading.value = false;
      });
    })
    .catch(() => {
      auditGraphLoading.value = false;
    });
}
function createNewEmbed(src) {
  const embed = document.createElement("embed");
  embed.setAttribute("style", "width: 100%; height: 100%");
  embed.setAttribute("type", "image/svg+xml");
  embed.setAttribute("src", src);

  document.getElementById("audit-graph").appendChild(embed);

  embed.addEventListener("load", () => {
    svgPanZoom(embed, {
      zoomEnabled: true,
      controlIconsEnabled: true,
      fit: true,
      center: true,
      maxZoom: 99999,
    });
  });
  return embed;
}

const showAdvancedSearchDialog = ref(false);
function openAdvancedSearchDialog() {
  showAdvancedSearchDialog.value = true;
}
function closeAdvancedSearchDialog() {
  showAdvancedSearchDialog.value = false;
}

const advancedSearchParams = reactive({ pid: "", ppid: "" });
function advancedSearchAuditGraph() {
  // close dialog
  showAdvancedSearchDialog.value = false;
  // ajax
  auditGraphLoading.value = true;
  axios
    .post("http://10.0.0.236:8000/api/parser/audit/svg", {
      start_time: auditGraphTimeRange.value[0].toISOString(),
      end_time: auditGraphTimeRange.value[1].toISOString(),
      ip: auditGraphIp.value,
      adv_params: advancedSearchParams,
      demo: false,
    })
    .then((res) => {
      document.getElementById("audit-graph").innerHTML = "";
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "image/svg+xml" })
      );
      nextTick(() => {
        createNewEmbed(url);
        auditGraphLoading.value = false;
      });
    })
    .catch(() => {
      auditGraphLoading.value = false;
    })
    .finally(() => {
      // reset
      advancedSearchParams.pid = "";
      advancedSearchParams.ppid = "";
    });
}
</script>

<template>
  <!--avoid css pollution-->
  <div id="prov-graph" style="height: 100%">
    <el-container v-loading.lock="overviewGraphLoading" style="height: 100%">
      <el-header>
        <el-row>
          <el-col :span="16">
            <el-input
              v-model="overviewGraphIp"
              placeholder="请输入 ip，多个 ip 请用 , 分隔（可以为空）"
              clearable
            >
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
                  <el-icon @click="searchOverviewGraph">
                    <Search />
                  </el-icon>
                </el-button>
              </template>
            </el-input>
          </el-col>
        </el-row>
      </el-header>
      <el-main style="height: 100%; overflow-y: hidden">
        <el-row style="height: 100%">
          <el-col :span="overviewGraphColSpan">
            <div id="overview-graph" style="width: 100%; height: 100%" />
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
                  <div>
                    <el-select v-model="detailGraphSelected" size="large">
                      <el-option
                        v-for="option in detailGraphOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                    <el-tooltip
                      v-if="detailGraphSelected === 'alert'"
                      content="审计溯源图"
                      placement="right"
                    >
                      <el-button
                        @click="openAuditGraphDialog"
                        :disabled="!isDetailGraphSelected"
                        size="large"
                      >
                        <el-icon>
                          <FullScreen />
                        </el-icon>
                      </el-button>
                    </el-tooltip>
                  </div>
                  <el-button @click="closeDetailGraph" size="large">
                    <el-icon color="#F56C6C">
                      <CloseBold />
                    </el-icon>
                  </el-button>
                </div>
              </template>
              <div id="detail-graph" style="width: 100%; height: 100%" />
            </el-card>
          </el-col>
          <el-dialog
            v-model="showAuditGraphDialog"
            :before-close="closeAuditGraphDialog"
            title="审计溯源图"
            fullscreen
          >
            <el-date-picker
              v-model="auditGraphTimeRange"
              type="datetimerange"
              :shortcuts="auditGraphTimeRangeShortcuts"
              range-separator="-"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
            />
            <el-button
              @click="searchAuditGraph"
              :disabled="auditGraphLoading"
              style="vertical-align: top"
            >
              <el-icon>
                <Search />
              </el-icon>
            </el-button>
            <el-link
              type="primary"
              @click="openAdvancedSearchDialog"
              :disabled="auditGraphLoading"
              style="vertical-align: top; line-height: 32px; margin-left: 20px"
            >
              高级搜索
            </el-link>
            <el-dialog
              v-model="showAdvancedSearchDialog"
              :before-close="closeAdvancedSearchDialog"
              width="30%"
              title="高级搜索"
              append-to-body
            >
              <el-form :model="advancedSearchParams" label-width="120px">
                <el-form-item label="时间范围">
                  <el-date-picker
                    v-model="auditGraphTimeRange"
                    type="datetimerange"
                    :shortcuts="auditGraphTimeRangeShortcuts"
                    range-separator="-"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
                  />
                </el-form-item>
                <el-form-item label="pid">
                  <el-input
                    v-model="advancedSearchParams.pid"
                    placeholder="请输入 pid"
                  />
                </el-form-item>
                <el-form-item label="ppid">
                  <el-input
                    v-model="advancedSearchParams.ppid"
                    placeholder="请输入 ppid"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="advancedSearchAuditGraph">
                    查询
                  </el-button>
                </el-form-item>
              </el-form>
            </el-dialog>
            <div
              v-loading.lock="auditGraphLoading"
              id="audit-graph"
              style="width: 100%; height: 100%; overflow-y: hidden"
            />
          </el-dialog>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<style>
#prov-graph .el-input-group__prepend {
  padding: 0;
}

#prov-graph .el-dialog__body {
  height: 80%;
}

#prov-graph .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
