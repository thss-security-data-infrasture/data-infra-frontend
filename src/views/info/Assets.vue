<script setup>
import axios from "axios";

import { onMounted, ref } from "vue";

onMounted(() => {
  Promise.allSettled([
    queryHostInfo(),
    queryWebsiteInfo(),
    queryDockerImageInfo(),
    queryDockerContainerInfo(),
    queryDockerNetworkInfo(),
    queryProcessInfo(),
    queryPortInfo(),
    queryAppInfo(),
    queryUserInfo(),
  ]);
});

const hostNum = ref(0);
const hostLoading = ref(false);
const hostData = ref([]);
const hostDataDisplay = ref([]);
const hostDataColumns = ref([]);
const hostDataCurrentPage = ref(1);
function hostDataNextPage(page) {
  hostDataCurrentPage.value = page;
  hostDataDisplay.value = hostData.value.slice((page - 1) * 10, page * 10);
}
function queryHostInfo() {
  hostLoading.value = true;
  axios
    .get("http://10.0.0.236:8000/api/assets/overview/host")
    .then((res) => {
      hostData.value = res.data.rows;
      hostDataDisplay.value = res.data.rows.slice(0, 10);

      const columns = [];
      hostDataDisplay.value.forEach((item) => {
        columns.push(...Object.keys(item));
      });
      hostDataColumns.value = [...new Set(columns)];

      hostNum.value = res.data.total;
    })
    .finally(() => {
      hostLoading.value = false;
    });
}

const processNum = ref(0);
const processLoading = ref(false);
const processData = ref([]);
const processDataDisplay = ref([]);
const processDataColumns = ref([]);
const processDataCurrentPage = ref(1);
function processDataNextPage(page) {
  processDataCurrentPage.value = page;
  processDataDisplay.value = processData.value.slice(
    (page - 1) * 10,
    page * 10
  );
}
function queryProcessInfo() {
  processLoading.value = true;
  axios
    .get("http://10.0.0.236:8000/api/assets/overview/process")
    .then((res) => {
      processData.value = res.data.rows;
      processDataDisplay.value = res.data.rows.slice(0, 10);

      const columns = [];
      processDataDisplay.value.forEach((item) => {
        columns.push(...Object.keys(item));
      });
      processDataColumns.value = [...new Set(columns)];

      processNum.value = res.data.total;
    })
    .finally(() => {
      processLoading.value = false;
    });
}

const portNum = ref(0);
const portLoading = ref(false);
const portData = ref([]);
const portDataDisplay = ref([]);
const portDataColumns = ref([]);
const portDataCurrentPage = ref(1);
function portDataNextPage(page) {
  portDataCurrentPage.value = page;
  portDataDisplay.value = portData.value.slice((page - 1) * 10, page * 10);
}
function queryPortInfo() {
  portLoading.value = true;
  axios
    .get("http://10.0.0.236:8000/api/assets/overview/port")
    .then((res) => {
      portData.value = res.data.rows;
      portDataDisplay.value = res.data.rows.slice(0, 10);

      const columns = [];
      portDataDisplay.value.forEach((item) => {
        columns.push(...Object.keys(item));
      });
      portDataColumns.value = [...new Set(columns)];

      portNum.value = res.data.total;
    })
    .finally(() => {
      portLoading.value = false;
    });
}

const appNum = ref(0);
const appLoading = ref(false);
const appData = ref([]);
const appDataDisplay = ref([]);
const appDataColumns = ref([]);
const appDataCurrentPage = ref(1);
function appDataNextPage(page) {
  appDataCurrentPage.value = page;
  appDataDisplay.value = appData.value.slice((page - 1) * 10, page * 10);
}
function queryAppInfo() {
  appLoading.value = true;
  axios
    .get("http://10.0.0.236:8000/api/assets/overview/app")
    .then((res) => {
      appData.value = res.data.rows;
      appDataDisplay.value = res.data.rows.slice(0, 10);

      const columns = [];
      appDataDisplay.value.forEach((item) => {
        columns.push(...Object.keys(item));
      });
      appDataColumns.value = [...new Set(columns)];

      appNum.value = res.data.total;
    })
    .finally(() => {
      appLoading.value = false;
    });
}

const userNum = ref(0);
const userLoading = ref(false);
const userData = ref([]);
const userDataDisplay = ref([]);
const userDataColumns = ref([]);
const userDataCurrentPage = ref(1);
function userDataNextPage(page) {
  userDataCurrentPage.value = page;
  userDataDisplay.value = userData.value.slice((page - 1) * 10, page * 10);
}
function queryUserInfo() {
  userLoading.value = true;
  axios
    .get("http://10.0.0.236:8000/api/assets/overview/user")
    .then((res) => {
      userData.value = res.data.rows;
      userDataDisplay.value = res.data.rows.slice(0, 10);

      const columns = [];
      userDataDisplay.value.forEach((item) => {
        columns.push(...Object.keys(item));
      });
      userDataColumns.value = [...new Set(columns)];

      userNum.value = res.data.total;
    })
    .finally(() => {
      userLoading.value = false;
    });
}

const websiteNum = ref(0);
const websiteLoading = ref(false);
const websiteData = ref([]);
const websiteDataDisplay = ref([]);
const websiteDataColumns = ref([]);
const websiteDataCurrentPage = ref(1);
function websiteDataNextPage(page) {
  websiteDataCurrentPage.value = page;
  websiteDataDisplay.value = websiteData.value.slice(
    (page - 1) * 10,
    page * 10
  );
}
function queryWebsiteInfo() {
  websiteLoading.value = true;
  axios
    .get("http://10.0.0.236:8000/api/assets/overview/web")
    .then((res) => {
      websiteData.value = res.data.rows.map((item) => {
        const ports = item["端口"];
        item["端口"] = Array.isArray(ports)
          ? [...new Set(ports.map((port) => port.port))].join(",")
          : ports;
        return item;
      });
      websiteDataDisplay.value = res.data.rows.slice(0, 10);

      const columns = [];
      websiteDataDisplay.value.forEach((item) => {
        columns.push(...Object.keys(item));
      });
      websiteDataColumns.value = [...new Set(columns)];

      websiteNum.value = res.data.total;
    })
    .finally(() => {
      websiteLoading.value = false;
    });
}

const dockerImageNum = ref(0);
const dockerImageLoading = ref(false);
const dockerImageData = ref([]);
const dockerImageDataDisplay = ref([]);
const dockerImageDataColumns = ref([]);
const dockerImageDataCurrentPage = ref(1);
function dockerImageDataNextPage(page) {
  dockerImageDataCurrentPage.value = page;
  dockerImageDataDisplay.value = dockerImageData.value.slice(
    (page - 1) * 10,
    page * 10
  );
}
function queryDockerImageInfo() {
  dockerImageLoading.value = true;
  axios
    .get("http://10.0.0.236:8000/api/assets/overview/docker/image")
    .then((res) => {
      dockerImageData.value = res.data.rows;
      dockerImageDataDisplay.value = res.data.rows.slice(0, 10);

      const columns = [];
      dockerImageDataDisplay.value.forEach((item) => {
        columns.push(...Object.keys(item));
      });
      dockerImageDataColumns.value = [...new Set(columns)];

      dockerImageNum.value = res.data.total;
    })
    .finally(() => {
      dockerImageLoading.value = false;
    });
}

const dockerContainerNum = ref(0);
const dockerContainerLoading = ref(false);
const dockerContainerData = ref([]);
const dockerContainerDataDisplay = ref([]);
const dockerContainerDataColumns = ref([]);
const dockerContainerDataCurrentPage = ref(1);
function dockerContainerDataNextPage(page) {
  dockerContainerDataCurrentPage.value = page;
  dockerContainerDataDisplay.value = dockerContainerData.value.slice(
    (page - 1) * 10,
    page * 10
  );
}
function queryDockerContainerInfo() {
  dockerContainerLoading.value = true;
  axios
    .get("http://10.0.0.236:8000/api/assets/overview/docker/container")
    .then((res) => {
      dockerContainerData.value = res.data.rows;
      dockerContainerDataDisplay.value = res.data.rows.slice(0, 10);

      const columns = [];
      dockerContainerDataDisplay.value.forEach((item) => {
        columns.push(...Object.keys(item));
      });
      dockerContainerDataColumns.value = [...new Set(columns)];

      dockerContainerNum.value = res.data.total;
    })
    .finally(() => {
      dockerContainerLoading.value = false;
    });
}

const dockerNetworkNum = ref(0);
const dockerNetworkLoading = ref(false);
const dockerNetworkData = ref([]);
const dockerNetworkDataDisplay = ref([]);
const dockerNetworkDataColumns = ref([]);
const dockerNetworkDataCurrentPage = ref(1);
function dockerNetworkDataNextPage(page) {
  dockerNetworkDataCurrentPage.value = page;
  dockerNetworkDataDisplay.value = dockerNetworkData.value.slice(
    (page - 1) * 10,
    page * 10
  );
}
function queryDockerNetworkInfo() {
  dockerNetworkLoading.value = true;
  axios
    .get("http://10.0.0.236:8000/api/assets/overview/docker/network")
    .then((res) => {
      dockerNetworkData.value = res.data.rows;
      dockerNetworkDataDisplay.value = res.data.rows.slice(0, 10);

      const columns = [];
      dockerNetworkDataDisplay.value.forEach((item) => {
        columns.push(...Object.keys(item));
      });
      dockerNetworkDataColumns.value = [...new Set(columns)];

      dockerNetworkNum.value = res.data.total;
    })
    .finally(() => {
      dockerNetworkLoading.value = false;
    });
}

const currentDisplay = ref("host");
</script>

<template>
  <el-card style="width: 80%; margin: 0 auto">
    <template #header>
      <el-row>
        <el-col
          :span="6"
          v-loading.lock="hostLoading"
          style="display: flex; justify-content: center; align-items: center"
        >
          <el-statistic
            title="主机"
            :value="hostNum"
            @click="currentDisplay = 'host'"
            style="text-align: center; margin: 20px"
          />
        </el-col>
        <el-col :span="18">
          <el-row justify="space-evenly">
            <el-col
              :span="6"
              v-loading.lock="processLoading"
              style="
                border-right: 1px solid #dcdfe6;
                border-bottom: 1px solid #dcdfe6;
              "
            >
              <el-statistic
                title="进程"
                :value="processNum"
                @click="currentDisplay = 'process'"
                style="text-align: center; margin: 20px"
              />
            </el-col>
            <el-col
              :span="6"
              v-loading.lock="portLoading"
              style="
                border-right: 1px solid #dcdfe6;
                border-bottom: 1px solid #dcdfe6;
                border-left: 1px solid #dcdfe6;
              "
            >
              <el-statistic
                title="端口"
                :value="portNum"
                @click="currentDisplay = 'port'"
                style="text-align: center; margin: 20px"
              />
            </el-col>
            <el-col
              :span="6"
              v-loading.lock="appLoading"
              style="
                border-right: 1px solid #dcdfe6;
                border-bottom: 1px solid #dcdfe6;
                border-left: 1px solid #dcdfe6;
              "
            >
              <el-statistic
                title="应用"
                :value="appNum"
                @click="currentDisplay = 'app'"
                style="text-align: center; margin: 20px"
              />
            </el-col>
            <el-col
              :span="6"
              v-loading.lock="userLoading"
              style="
                border-bottom: 1px solid #dcdfe6;
                border-left: 1px solid #dcdfe6;
              "
            >
              <el-statistic
                title="用户"
                :value="userNum"
                @click="currentDisplay = 'user'"
                style="text-align: center; margin: 20px"
              />
            </el-col>
          </el-row>
          <el-row justify="space-evenly">
            <el-col
              :span="6"
              style="
                border-top: 1px solid #dcdfe6;
                border-right: 1px solid #dcdfe6;
              "
            >
              <el-statistic
                title="Web 网站"
                :value="websiteNum"
                @click="currentDisplay = 'website'"
                style="text-align: center; margin: 20px"
              />
            </el-col>
            <el-col
              :span="6"
              style="
                border-top: 1px solid #dcdfe6;
                border-right: 1px solid #dcdfe6;
                border-left: 1px solid #dcdfe6;
              "
            >
              <el-statistic
                title="Docker 镜像"
                :value="dockerImageNum"
                @click="currentDisplay = 'dockerImage'"
                style="text-align: center; margin: 20px"
              />
            </el-col>
            <el-col
              :span="6"
              style="
                border-top: 1px solid #dcdfe6;
                border-right: 1px solid #dcdfe6;
                border-left: 1px solid #dcdfe6;
              "
            >
              <el-statistic
                title="Docker 容器"
                :value="dockerContainerNum"
                @click="currentDisplay = 'dockerContainer'"
                style="text-align: center; margin: 20px"
              />
            </el-col>
            <el-col
              :span="6"
              style="
                border-top: 1px solid #dcdfe6;
                border-left: 1px solid #dcdfe6;
              "
            >
              <el-statistic
                title="Docker 网络"
                :value="dockerNetworkNum"
                @click="currentDisplay = 'dockerNetwork'"
                style="text-align: center; margin: 20px"
              />
            </el-col>
          </el-row>
        </el-col>
      </el-row>
    </template>

    <div
      v-if="currentDisplay === 'host'"
      v-loading.lock="hostLoading"
      class="card-body"
    >
      <el-table :data="hostDataDisplay">
        <el-table-column
          v-for="(column, columnIdx) of hostDataColumns"
          :prop="column"
          :label="column"
          :key="`host-column-${columnIdx}`"
        />
      </el-table>
      <el-pagination
        :total="hostNum"
        :current-page="hostDataCurrentPage"
        @current-change="hostDataNextPage"
        layout="prev, pager, next"
        style="margin: 0 auto"
      />
    </div>
    <div
      v-else-if="currentDisplay === 'process'"
      v-loading.lock="processLoading"
      class="card-body"
    >
      <el-table :data="processDataDisplay" :max-height="'100%'">
        <el-table-column
          v-for="(column, columnIdx) of processDataColumns"
          :prop="column"
          :label="column"
          :key="`process-column-${columnIdx}`"
        />
      </el-table>
      <el-pagination
        :total="processNum"
        :current-page="processDataCurrentPage"
        @current-change="processDataNextPage"
        layout="prev, pager, next"
        style="margin: 0 auto"
      />
    </div>
    <div
      v-else-if="currentDisplay === 'port'"
      v-loading.lock="portLoading"
      class="card-body"
    >
      <el-table :data="portDataDisplay">
        <el-table-column
          v-for="(column, columnIdx) of portDataColumns"
          :prop="column"
          :label="column"
          :key="`port-column-${columnIdx}`"
        />
      </el-table>
      <el-pagination
        :total="portNum"
        :current-page="portDataCurrentPage"
        @current-change="portDataNextPage"
        layout="prev, pager, next"
        style="margin: 0 auto"
      />
    </div>
    <div
      v-else-if="currentDisplay === 'app'"
      v-loading.lock="appLoading"
      class="card-body"
    >
      <el-table :data="appDataDisplay">
        <el-table-column
          v-for="(column, columnIdx) of appDataColumns"
          :prop="column"
          :label="column"
          :key="`app-column-${columnIdx}`"
        />
      </el-table>
      <el-pagination
        :total="appNum"
        :current-page="appDataCurrentPage"
        @current-change="appDataNextPage"
        layout="prev, pager, next"
        style="margin: 0 auto"
      />
    </div>
    <div
      v-else-if="currentDisplay === 'user'"
      v-loading.lock="userLoading"
      class="card-body"
    >
      <el-table :data="userDataDisplay">
        <el-table-column
          v-for="(column, columnIdx) of userDataColumns"
          :prop="column"
          :label="column"
          :key="`user-column-${columnIdx}`"
        />
      </el-table>
      <el-pagination
        :total="userNum"
        :current-page="userDataCurrentPage"
        @current-change="userDataNextPage"
        layout="prev, pager, next"
        style="margin: 0 auto"
      />
    </div>
    <div
      v-else-if="currentDisplay === 'website'"
      v-loading.lock="websiteLoading"
      class="card-body"
    >
      <el-table :data="websiteDataDisplay">
        <el-table-column
          v-for="(column, columnIdx) of websiteDataColumns"
          :prop="column"
          :label="column"
          :key="`website-column-${columnIdx}`"
        />
      </el-table>
      <el-pagination
        :total="websiteNum"
        :current-page="websiteDataCurrentPage"
        @current-change="websiteDataNextPage"
        layout="prev, pager, next"
        style="margin: 0 auto"
      />
    </div>
    <div
      v-else-if="currentDisplay === 'dockerImage'"
      v-loading.lock="dockerImageLoading"
      class="card-body"
    >
      <el-table :data="dockerImageDataDisplay">
        <el-table-column
          v-for="(column, columnIdx) of dockerImageDataColumns"
          :prop="column"
          :label="column"
          :key="`dockerImage-column-${columnIdx}`"
        />
      </el-table>
      <el-pagination
        :total="dockerImageNum"
        :current-page="dockerImageDataCurrentPage"
        @current-change="dockerImageDataNextPage"
        layout="prev, pager, next"
        style="margin: 0 auto"
      />
    </div>
    <div
      v-else-if="currentDisplay === 'dockerContainer'"
      v-loading.lock="dockerContainerLoading"
      class="card-body"
    >
      <el-table :data="dockerContainerDataDisplay">
        <el-table-column
          v-for="(column, columnIdx) of dockerContainerDataColumns"
          :prop="column"
          :label="column"
          :key="`dockerContainer-column-${columnIdx}`"
        />
      </el-table>
      <el-pagination
        :total="dockerContainerNum"
        :current-page="dockerContainerDataCurrentPage"
        @current-change="dockerContainerDataNextPage"
        layout="prev, pager, next"
        style="margin: 0 auto"
      />
    </div>
    <div
      v-else-if="currentDisplay === 'dockerNetwork'"
      v-loading.lock="dockerNetworkLoading"
      class="card-body"
    >
      <el-table :data="dockerNetworkDataDisplay">
        <el-table-column
          v-for="(column, columnIdx) of dockerNetworkDataColumns"
          :prop="column"
          :label="column"
          :key="`dockerNetwork-column-${columnIdx}`"
        />
      </el-table>
      <el-pagination
        :total="dockerNetworkNum"
        :current-page="dockerNetworkDataCurrentPage"
        @current-change="dockerNetworkDataNextPage"
        layout="prev, pager, next"
        style="margin: 0 auto"
      />
    </div>
  </el-card>
</template>

<style scoped>
.el-statistic {
  cursor: pointer;
}

.card-body {
  display: flex;
  flex-direction: column;
}
</style>
