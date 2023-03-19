<template>
  <el-result icon="warning" title="404" sub-title="页面不存在" style="height: 100%">
    <template #extra>
      <el-button type="primary" @click="$router.go(-1)">返回上一页</el-button>
    </template>
  </el-result>
</template>
