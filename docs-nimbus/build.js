import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const widgetSource = path.resolve(rootDir, 'widget/dist/cwd.js');
const emotionSource = path.resolve(rootDir, '../emotion');
const targetDirs = new Map([
	['public', path.resolve(rootDir, 'public')],
	['dist', path.resolve(rootDir, 'dist')],
]);
const targetName = process.argv[2] || 'public';
const targetDir = targetDirs.get(targetName);

if (!targetDir) {
	throw new Error(`不支持的资源复制目标：${targetName}，仅支持 public 或 dist。`);
}

/**
 * 将 Widget 产物和表情资源复制到 Nimbus 的开发或发布目录。
 * @param {string} destination 资源目标目录；仅由上面的 public / dist 映射指定。
 * @returns {void} 资源缺失或复制失败时抛出异常，终止构建。
 */
function copyBuildAssets(destination) {
	fs.accessSync(widgetSource, fs.constants.R_OK);
	fs.accessSync(emotionSource, fs.constants.R_OK);
	fs.mkdirSync(destination, { recursive: true });
	fs.copyFileSync(widgetSource, path.join(destination, 'cwd.js'));

	const emotionDestination = path.join(destination, 'emotion');
	fs.rmSync(emotionDestination, { recursive: true, force: true });
	fs.cpSync(emotionSource, emotionDestination, {
		recursive: true,
		filter: (source) => path.basename(source) !== '.DS_Store',
	});

	console.log(`已复制 cwd.js 和 emotion/ 到 ${destination}`);
}

copyBuildAssets(targetDir);
