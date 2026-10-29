import { onBeforeUnmount, onMounted } from 'vue';

/**
 * 在深浅主题变化时重绘图表，并读取与页面一致的图表颜色。
 * @param redraw 主题变化后需要执行的重绘函数，组件卸载时自动停止监听。
 * @returns 当前主题的图表配色读取器。
 */
export function useChartTheme(redraw: () => void) {
	const observer = new MutationObserver(redraw);

	onMounted(() => observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }));
	onBeforeUnmount(() => observer.disconnect());

	/** 从当前主题的 CSS 变量读取图表的表面、文字和线条颜色。 */
	function getChartPalette() {
		const style = getComputedStyle(document.documentElement);
		const read = (name: string) => style.getPropertyValue(name).trim();
		return {
			primary: read('--admin-primary'),
			text: read('--admin-text'),
			secondary: read('--admin-text-secondary'),
			border: read('--admin-border'),
			surface: read('--admin-surface'),
			areaStart: read('--chart-area-start'),
			areaEnd: read('--chart-area-end'),
			font: read('--admin-font-sans'),
		};
	}

	return { getChartPalette };
}
