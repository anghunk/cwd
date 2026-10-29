<template>
	<div class="page stats-page">
		<div class="page-heading">
			<h2 class="page-title">{{ t('stats.title') }}</h2>
			<p class="page-description">{{ t('ui.statsDescription') }}</p>
		</div>
		<div v-if="toastVisible" class="toast" :class="toastType === 'error' ? 'toast-error' : 'toast-success'">
			{{ toastMessage }}
		</div>

		<div class="card">
			<div class="card-title-row">
				<h3 class="card-title">{{ t('stats.overview') }}</h3>
			</div>
			<div v-if="statsLoading" class="page-hint">{{ t('common.loading') }}</div>
			<div v-else-if="statsError" class="page-error">{{ statsError }}</div>
			<div v-else>
				<div class="stats-grid">
					<div class="stats-item">
						<div class="stats-label"><PhChatCircleDots :size="15" aria-hidden="true" />{{ t('stats.total') }}</div>
						<div class="stats-value">{{ statsSummary.total }}</div>
					</div>
					<div class="stats-item">
						<div class="stats-label"><PhCheckCircle :size="15" aria-hidden="true" />{{ t('stats.approved') }}</div>
						<div class="stats-value stats-value-approved">
							{{ statsSummary.approved }}
						</div>
					</div>
					<div class="stats-item">
						<div class="stats-label"><PhClock :size="15" aria-hidden="true" />{{ t('stats.pending') }}</div>
						<div class="stats-value stats-value-pending">{{ statsSummary.pending }}</div>
					</div>
					<div class="stats-item">
						<div class="stats-label"><PhProhibit :size="15" aria-hidden="true" />{{ t('stats.rejected') }}</div>
						<div class="stats-value stats-value-rejected">
							{{ statsSummary.rejected }}
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="card">
			<div class="card-title-row">
				<h3 class="card-title">{{ t('stats.trend') }}</h3>
				<div class="chart-tabs">
					<button
						class="chart-tab"
						:class="{ 'chart-tab-active': chartRange === '7' }"
						type="button"
						:aria-pressed="chartRange === '7'"
						@click="changeChartRange('7')">
						{{ t('stats.last7Days') }}
					</button>
					<button
						class="chart-tab"
						:class="{ 'chart-tab-active': chartRange === '30' }"
						type="button"
						:aria-pressed="chartRange === '30'"
						@click="changeChartRange('30')">
						{{ t('stats.last30Days') }}
					</button>
				</div>
			</div>
			<div v-if="statsLoading" class="page-hint">{{ t('common.loading') }}</div>
			<div v-else-if="statsError" class="page-error">{{ statsError }}</div>
			<div class="chart-wrapper">
				<div ref="chartEl" class="chart"></div>
			</div>
		</div>

		<div class="card">
			<div class="card-title-row">
				<h3 class="card-title">{{ t('stats.bySite') }}</h3>
			</div>
			<div v-if="statsLoading" class="page-hint">{{ t('common.loading') }}</div>
			<div v-else-if="statsError" class="page-error">{{ statsError }}</div>
			<div v-else-if="domainStats.length === 0" class="page-hint">
				{{ t('stats.noData') }}
			</div>
			<div v-else class="domain-stats-layout">
				<div class="domain-table-wrapper">
					<div class="domain-table">
						<div class="domain-table-header">
							<div class="domain-cell domain-cell-domain">
								{{ t('stats.table.domain') }}
							</div>
							<div class="domain-cell">{{ t('stats.table.total') }}</div>
							<div class="domain-cell">{{ t('stats.table.approved') }}</div>
							<div class="domain-cell">{{ t('stats.table.pending') }}</div>
							<div class="domain-cell">{{ t('stats.table.rejected') }}</div>
						</div>
						<div v-for="item in domainStats" :key="item.domain" class="domain-table-row">
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
import { onMounted, onBeforeUnmount, ref, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import * as echarts from 'echarts';
import { useChartTheme } from '../../composables/useChartTheme';
import { fetchCommentStats } from '../../api/admin';
import { useSite } from '../../composables/useSite';

const { t } = useI18n();
const { getChartPalette } = useChartTheme(() => {
	renderChart();
	renderDomainPieChart();
});

type DomainStat = {
	domain: string;
	total: number;
	approved: number;
	pending: number;
	rejected: number;
};

const statsLoading = ref(false);
const statsError = ref('');
const statsSummary = ref({
	total: 0,
	approved: 0,
	pending: 0,
	rejected: 0,
});
const domainStats = ref<DomainStat[]>([]);
const last7Days = ref<{ date: string; total: number }[]>([]);
const chartRange = ref<'7' | '30'>('7');
const chartRangeStorageKey = 'cwd-stats-chart-range';

const { currentSiteId } = useSite();

const toastMessage = ref('');
const toastType = ref<'success' | 'error'>('success');
const toastVisible = ref(false);

const chartEl = ref<HTMLDivElement | null>(null);
const domainPieEl = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let domainPieChartInstance: echarts.ECharts | null = null;

function loadChartRangeFromStorage() {
	if (typeof window === 'undefined') {
		return;
	}
	try {
		const value = window.localStorage.getItem(chartRangeStorageKey);
		if (value === '7' || value === '30') {
			chartRange.value = value;
		}
	} catch {}
}

function saveChartRangeToStorage(value: '7' | '30') {
	if (typeof window === 'undefined') {
		return;
	}
	try {
		window.localStorage.setItem(chartRangeStorageKey, value);
	} catch {}
}

function showToast(msg: string, type: 'success' | 'error' = 'success') {
	toastMessage.value = msg;
	toastType.value = type;
	toastVisible.value = true;
	window.setTimeout(() => {
		toastVisible.value = false;
	}, 2000);
}

async function loadStats() {
	statsLoading.value = true;
	statsError.value = '';
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
		const msg = e.message || '加载统计数据失败';
		statsError.value = msg;
		showToast(msg, 'error');
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
	const seriesData = chartRange.value === '7' ? source.slice(-7) : source;
	const dates = seriesData.map((item) => item.date.slice(5));
	const values = seriesData.map((item) => item.total);
	const palette = getChartPalette();
	const option: echarts.EChartsOption = {
		animation: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
		color: [palette.primary, '#7aaf9a', '#a197cf', '#d3b486', '#83a7c4'],
		textStyle: { fontFamily: palette.font, color: palette.secondary, fontSize: 11 },
		tooltip: {
			trigger: 'axis',
			backgroundColor: palette.surface,
			borderColor: palette.border,
			textStyle: { color: palette.text, fontSize: 12 },
			extraCssText: 'border-radius: 10px; box-shadow: 0 4px 16px rgb(0 0 0 / 10%);',
		},
		grid: {
			left: 40,
			right: 16,
			top: 24,
			bottom: 32,
		},
		xAxis: {
			type: 'category',
			data: dates,
			boundaryGap: false,
			axisLine: { lineStyle: { color: palette.border } },
			axisLabel: { color: palette.secondary, margin: 12 },
			axisTick: {
				alignWithLabel: true,
			},
		},
		yAxis: {
			type: 'value',
			minInterval: 1,
			axisLabel: { color: palette.secondary },
			splitLine: { lineStyle: { color: palette.border, type: 'dashed' } },
		},
		series: [
			{
				type: 'line',
				smooth: true,
				data: values,
				areaStyle: {
					color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
						{ offset: 0, color: palette.areaStart },
						{ offset: 1, color: palette.areaEnd },
					]),
				},
				lineStyle: {
					width: 2,
					color: palette.primary,
				},
				symbol: 'circle',
				symbolSize: 5,
				showSymbol: false,
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
	} else if (domainPieChartInstance.getDom() !== el) {
		domainPieChartInstance.dispose();
		domainPieChartInstance = echarts.init(el);
	}
	if (!domainStats.value.length) {
		domainPieChartInstance.clear();
		return;
	}
	const source = domainStats.value.slice().sort((a, b) => b.total - a.total);
	const data = source.map((item) => ({
		name: item.domain || '未知',
		value: item.total,
	}));
	const palette = getChartPalette();
	const option: echarts.EChartsOption = {
		animation: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
		color: [palette.primary, '#7aaf9a', '#a197cf', '#d3b486', '#83a7c4'],
		textStyle: { fontFamily: palette.font, color: palette.secondary, fontSize: 11 },
		tooltip: {
			trigger: 'item',
			backgroundColor: palette.surface,
			borderColor: palette.border,
			textStyle: { color: palette.text, fontSize: 12 },
			formatter: '{b}: {c} ({d}%)',
		},
		legend: {
			orient: 'vertical',
			left: 'left',
			textStyle: { color: palette.secondary, fontSize: 11 },
		},
		series: [
			{
				type: 'pie',
				radius: ['40%', '70%'],
				center: ['60%', '50%'],
				avoidLabelOverlap: false,
				data,
			},
		],
	};
	domainPieChartInstance.setOption(option);
}

function changeChartRange(range: '7' | '30') {
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
	window.addEventListener('resize', handleResize);
});

watch(currentSiteId, () => {
	loadStats();
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', handleResize);
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
@import '../../styles/components/stats.less';
</style>
