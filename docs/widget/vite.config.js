import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync, copyFileSync } from 'fs';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));
const banner = `/*! CWDComments widget v${pkg.version} */`;

function copyDtsPlugin() {
  return {
    name: 'copy-dts',
    closeBundle() {
      const src = resolve(__dirname, 'src/index.d.ts');
      const dests = [
        resolve(__dirname, 'dist/index.d.ts'),
        resolve(__dirname, 'dist/cwd.es.d.ts'),
        resolve(__dirname, 'dist/cwd.umd.d.ts')
      ];
      
      dests.forEach(dest => {
        try {
          copyFileSync(src, dest);
          console.log(`[copy-dts] Copied ${src} to ${dest}`);
        } catch (e) {
          console.error(`[copy-dts] Failed to copy .d.ts file to ${dest}: ${e}`);
        }
      });
    }
  }
}

function copyUmdToCwdPlugin() {
  return {
    name: 'copy-umd-to-cwd',
    closeBundle() {
      const src = resolve(__dirname, 'dist/cwd.umd.js');
      const dest = resolve(__dirname, 'dist/cwd.js');
      try {
        copyFileSync(src, dest);
        console.log(`[copy-umd-to-cwd] Copied ${src} to ${dest}`);
      } catch (e) {
        console.error(`[copy-umd-to-cwd] Failed to copy UMD bundle to cwd.js: ${e}`);
      }
    }
  }
}

export default defineConfig({
	plugins: [cssInjectedByJsPlugin(), copyDtsPlugin(), copyUmdToCwdPlugin()],
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
			fileName: (format) => {
				if (format === 'es') return 'cwd.es.js';
				return 'cwd.umd.js';
			},
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
