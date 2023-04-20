<script setup></script>

<template>
  <!--avoid css pollution-->
  <div id="log-fusion" style="height: 100%">
    <el-container v-loading.lock="overviewGraphLoading" style="height: 100%">
      <el-header>
        <el-row>
          <el-col :span="16" style="display: flex">
            <el-date-picker
              v-model="overviewGraphTimeRange"
              type="datetimerange"
              :shortcuts="overviewGraphTimeRangeShortcuts"
              range-separator="-"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              style="min-width: 400px"
            />
            <el-select
              v-model="value3"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="Select"
              style="min-width: 150px"
            >
              <el-option
                v-for="item in options"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
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
          <el-col :span="8"> </el-col>
        </el-row>
      </el-header>
      <el-main style="height: 100%; overflow-y: hidden">
        <el-row>
          <el-col :span="12" style="display: flex; flex-direction: column">
            <el-divider>流量信息</el-divider>
            <el-table :data="tableData" style="width: 100%">
              <el-table-column
                prop="date"
                label="客户端 IP"
                min-width="100px"
              />
              <el-table-column
                prop="name"
                label="客户端端口"
                min-width="100px"
              />
              <el-table-column
                prop="date"
                label="服务端 IP"
                min-width="100px"
              />
              <el-table-column
                prop="name"
                label="服务端端口"
                min-width="100px"
              />
              <el-table-column prop="date" label="开始时间" min-width="100px" />
              <el-table-column prop="name" label="结束时间" min-width="100px" />
              <el-table-column
                prop="address"
                label="总数据包数"
                min-width="100px"
              />
              <el-table-column
                prop="address"
                label="设备列表"
                min-width="100px"
              />
            </el-table>
            <el-pagination
              layout="prev, pager, next"
              :total="50"
              style="margin: 0 auto"
            />
          </el-col>
          <el-col
            :span="11"
            :offset="1"
            style="display: flex; flex-direction: column"
          >
            <el-divider>告警信息</el-divider>
            <el-table :data="tableData">
              <el-table-column prop="date" label="主机" />
              <el-table-column prop="name" label="告警名称" />
              <el-table-column prop="date" label="时间" />
              <el-table-column prop="name" label="详情链接" />
              <el-table-column prop="date" label="告警设备" />
            </el-table>
            <el-pagination
              layout="prev, pager, next"
              :total="50"
              style="margin: 0 auto"
            />
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
