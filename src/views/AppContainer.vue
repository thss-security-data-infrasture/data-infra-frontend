<template>
    <el-container style="height: 100%">
        <el-container>
            <el-aside width="200px">
                <el-menu default-active="/data/fields" default-openeds="['/data','/info','/knowledge']" style="height: 100%"
                    router>
                    <el-sub-menu index="/data">
                        <template #title>
                            <el-icon>
                                <DataAnalysis />
                            </el-icon>
                            <span>数据库</span>
                        </template>
                        <el-menu-item index="/data/fields">字段表</el-menu-item>
                        <el-menu-item index="/data/prov">溯源图</el-menu-item>
                    </el-sub-menu>
                    <el-sub-menu index="/info">
                        <template #title>
                            <el-icon>
                                <Notebook />
                            </el-icon>
                            <span>情报库</span>
                        </template>
                        <el-menu-item index="/info/assets">资产列表</el-menu-item>
                        <el-menu-item index="/info/situation">系统态势</el-menu-item>
                    </el-sub-menu>
                    <el-sub-menu index="/knowledge">
                        <template #title>
                            <el-icon>
                                <Document />
                            </el-icon>
                            <span>知识库</span>
                        </template>
                        <el-menu-item index="/knowledge/studies">教学材料</el-menu-item>
                        <el-menu-item index="/knowledge/exps">经验沉淀</el-menu-item>
                        <el-menu-item index="/knowledge/recomms">知识推荐</el-menu-item>
                    </el-sub-menu>
                </el-menu>
            </el-aside>
            <el-main>
                <router-view />
            </el-main>
        </el-container>
    </el-container>
</template>
