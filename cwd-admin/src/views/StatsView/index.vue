<template>
  <div class="page">
    <div style="display: flex; align-items: center; gap: 20px">
      <h2 class="page-title">数据看板</h2>
    </div>
    <div
      v-if="toastVisible"
      class="toast"
      :class="toastType === 'error' ? 'toast-error' : 'toast-success'"
    >
      {{ toastMessage }}
    </div>

    <div class="card">
      <div class="card-title-row">
        <h3 class="card-title">整体概览</h3>
      </div>
      <div v-if="statsLoading" class="page-hint">加载中...</div>
      <div v-else-if="statsError" class="page-error">{{ statsError }}</div>
      <div v-else>
        <div class="stats-grid">
          <div class="stats-item">
            <div class="stats-label">总评论数</div>
            <div class="stats-value">{{ statsSummary.total }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">已通过</div>
            <div class="stats-value stats-value-approved">
              {{ statsSummary.approved }}
            </div>
          </div>
          <div class="stats-item">
            <div class="stats-label">待审核</div>
            <div class="stats-value stats-value-pending">{{ statsSummary.pending }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">已拒绝</div>
            <div class="stats-value stats-value-rejected">
              {{ statsSummary.rejected }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title-row">
        <h3 class="card-title">评论数趋势</h3>
        <div class="chart-tabs">
          <button
            class="chart-tab"
            :class="{ 'chart-tab-active': chartRange === '7' }"
            type="button"
            @click="changeChartRange('7')"
          >
            最近 7 天
          </button>
          <button
            class="chart-tab"
            :class="{ 'chart-tab-active': chartRange === '30' }"
            type="button"
            @click="changeChartRange('30')"
          >
            最近 30 天
          </button>
        </div>
      </div>
      <div v-if="statsLoading" class="page-hint">加载中...</div>
      <div v-else-if="statsError" class="page-error">{{ statsError }}</div>
      <div class="chart-wrapper">
        <div ref="chartEl" class="chart"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title-row">
        <h3 class="card-title">按域名统计</h3>
      </div>
      <div v-if="statsLoading" class="page-hint">加载中...</div>
      <div v-else-if="statsError" class="page-error">{{ statsError }}</div>
      <div v-else-if="domainStats.length === 0" class="page-hint">暂无评论数据</div>
      <div v-else class="domain-stats-layout">
        <div class="domain-table-wrapper">
          <div class="domain-table">
            <div class="domain-table-header">
              <div class="domain-cell domain-cell-domain">域名</div>
              <div class="domain-cell">总数</div>
              <div class="domain-cell">已通过</div>
              <div class="domain-cell">待审核</div>
              <div class="domain-cell">已拒绝</div>
            </div>
            <div
              v-for="item in domainStats"
              :key="item.domain"
              class="domain-table-row"
            >
              <div class="domain-cell domain-cell-domain">{{ item.domain }}</div>
              <div class="domain-cell">{{ item.total }}</div>
              <div class="domain-cell">{{ item.approved }}</div>
              <div class="domain-cell">{{ item.pending }}</div>
              <div class="domain-cell">{{ item.rejected }}</div>
            </div>
          </div>
        </div>
        <div class="domain-pie-wrapper">
          <div ref="domainPieEl" class="domain-pie-chart"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick, watch, inject } from "vue";
import type { Ref } from "vue";
import * as echarts from "echarts";
import { fetchCommentStats } from "../../api/admin";
import { useSite } from "../../composables/useSite";

type DomainStat = {
  domain: string;
  total: number;
  approved: number;
  pending: number;
  rejected: number;
};

const statsLoading = ref(false);
const statsError = ref("");
const statsSummary = ref({
  total: 0,
  approved: 0,
  pending: 0,
  rejected: 0,
});
const domainStats = ref<DomainStat[]>([]);
const last7Days = ref<{ date: string; total: number }[]>([]);
const chartRange = ref<"7" | "30">("7");
const chartRangeStorageKey = "cwd-stats-chart-range";

const { currentSiteId } = useSite();

const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");
const toastVisible = ref(false);

const chartEl = ref<HTMLDivElement | null>(null);
const domainPieEl = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let domainPieChartInstance: echarts.ECharts | null = null;

function loadChartRangeFromStorage() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const value = window.localStorage.getItem(chartRangeStorageKey);
    if (value === "7" || value === "30") {
      chartRange.value = value;
    }
  } catch {
  }
}

function saveChartRangeToStorage(value: "7" | "30") {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(chartRangeStorageKey, value);
  } catch {
  }
}

function showToast(msg: string, type: "success" | "error" = "success") {
  toastMessage.value = msg;
  toastType.value = type;
  toastVisible.value = true;
  window.setTimeout(() => {
    toastVisible.value = false;
  }, 2000);
}

async function loadStats() {
  statsLoading.value = true;
  statsError.value = "";
  try {
    const res = await fetchCommentStats(currentSiteId.value);
    statsSummary.value = {
      total: res.summary.total,
      approved: res.summary.approved,
      pending: res.summary.pending,
      rejected: res.summary.rejected,
    };
    domainStats.value = res.domains;
    last7Days.value = Array.isArray(res.last7Days) ? res.last7Days : [];
  } catch (e: any) {
    const msg = e.message || "加载统计数据失败";
    statsError.value = msg;
    showToast(msg, "error");
  } finally {
    statsLoading.value = false;
    await nextTick();
    if (!statsError.value) {
      renderChart();
      renderDomainPieChart();
    }
  }
}

function renderChart() {
  const el = chartEl.value;
  if (!el) {
    return;
  }
  if (!chartInstance) {
    chartInstance = echarts.init(el);
  }
  const source = last7Days.value;
  const seriesData =
    chartRange.value === "7" ? source.slice(-7) : source;
  const dates = seriesData.map((item) => item.date.slice(5));
  const values = seriesData.map((item) => item.total);
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: "axis",
    },
    grid: {
      left: 40,
      right: 16,
      top: 24,
      bottom: 32,
    },
    xAxis: {
      type: "category",
      data: dates,
      boundaryGap: false,
      axisTick: {
        alignWithLabel: true,
      },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
    },
    series: [
      {
        type: "line",
        smooth: true,
        data: values,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(56, 189, 248, 0.80)" },
            { offset: 1, color: "rgba(56, 189, 248, 0.2)" },
          ]),
        },
        lineStyle: {
          width: 2,
          color: "#0ea5e9",
        },
        symbol: "circle",
        symbolSize: 3,
      },
    ],
  };
  chartInstance.setOption(option);
}

function renderDomainPieChart() {
  const el = domainPieEl.value;
  if (!el) {
    return;
  }
  if (!domainPieChartInstance) {
    domainPieChartInstance = echarts.init(el);
  }
  if (!domainStats.value.length) {
    domainPieChartInstance.clear();
    return;
  }
  const source = domainStats.value.slice().sort((a, b) => b.total - a.total);
  const data = source.map((item) => ({
    name: item.domain || "未知",
    value: item.total,
  }));
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      left: "left",
    },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        center: ["60%", "50%"],
        avoidLabelOverlap: false,
        data,
      },
    ],
  };
  domainPieChartInstance.setOption(option);
}

function changeChartRange(range: "7" | "30") {
  if (chartRange.value === range) {
    return;
  }
  chartRange.value = range;
  saveChartRangeToStorage(range);
  renderChart();
  renderDomainPieChart();
}

function handleResize() {
  if (chartInstance) {
    chartInstance.resize();
  }
  if (domainPieChartInstance) {
    domainPieChartInstance.resize();
  }
}

onMounted(() => {
  loadChartRangeFromStorage();
  loadStats();
  window.addEventListener("resize", handleResize);
});

watch(currentSiteId, () => {
  loadStats();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
  if (domainPieChartInstance) {
    domainPieChartInstance.dispose();
    domainPieChartInstance = null;
  }
});
</script>

<style scoped lang="less">
@import "../../styles/components/stats.less";
</style>
