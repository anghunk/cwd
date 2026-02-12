import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));
const banner = `/*! CWDComments widget v${pkg.version} */`;

export default defineConfig({
	plugins: [cssInjectedByJsPlugin()],
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src'),
		},
	},
	build: {
		lib: {
			name: 'CWDComments',
			entry: resolve(__dirname, 'src/index.js'),
			formats: ['es', 'umd'],
			fileName: (format) => `cwd.${format}.js`,
		},
		rollupOptions: {
			output: {
				exports: 'named',
				banner,
			},
		},
		sourcemap: false,
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: false,
			},
		},
	},
});
