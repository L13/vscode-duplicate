//	Imports ____________________________________________________________________

const child_process = require('child_process');
const del = require('del');
const fs = require('fs');
const glob = require('glob');
const gulp = require('gulp');
const { ESLint } = require('eslint');
const rollup = require('rollup');

const typescript = require('@rollup/plugin-typescript');

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

gulp.task('clean', () => {
	
	return del(['out', 'test']);
	
});

gulp.task('script:extension', () => {
	
	return rollup.rollup({
		input: 'src/extension.ts',
		onwarn,
		external: [
			'fs',
			'path',
			'vscode',
		],
		plugins: [
			typescript({
				include: [
					'src/**/!(*.test).ts',
				],
			}),
		]
	}).then(bundle => {
		
		return bundle.write({
			file: 'out/extension.js',
			format: 'cjs',
			globals: {
				fs: 'fs',
				path: 'path',
				vscode: 'vscode',
			},
		});
		
	}, onerror);
	
});

gulp.task('script:tests', () => {
	
	const promises = [];
	
	[{ in: 'src/test/index.ts', out: 'test/index.js'}]
	.concat(createInOut('src/**/*.test.ts'))
	.forEach((file) => {
		
		promises.push(rollup.rollup({
			input: file.in,
			treeshake: false,
			onwarn,
			external: [
				'assert',
				'glob',
				'fs',
				'mocha',
				'path',
			],
			plugins: [
				typescript({
					include: [
						'src/@l13/**/*.ts',
						'src/test/index.ts',
					],
				}),
			]
		}).then(bundle => {
			
			return bundle.write({
				file: file.out,
				format: 'cjs',
				globals: {
					assert: 'assert',
					glob: 'glob',
					fs: 'fs',
					mocha: 'mocha',
					path: 'path',
				},
			});
			
		}, onerror));
		
	});
	
	return Promise.all(promises);
	
});

gulp.task('lint', async (done) => {
	
	const eslint = new ESLint();
	const results = await eslint.lintFiles(['src/**/*.ts']);
	const formatter = await eslint.loadFormatter('stylish');
	const resultText = formatter.format(results);
	
	if (resultText) console.log(resultText);
	
	done();
	
});

gulp.task('test', (done) => {
	
	const tests = child_process.spawn('npm', ['test']).on('close', () => done());
	
	let logger = (buffer) => buffer.toString().split(/\n/).forEach((message) => message && console.log(message));
	
	tests.stdout.on('data', logger);
	tests.stderr.on('data', logger);
	
});

gulp.task('script', gulp.series('script:extension', 'script:tests'));

gulp.task('build', gulp.series('clean', 'script', 'lint', 'test'));

gulp.task('watch', () => {
	
	gulp.watch(['src/**/!(*.test).ts'], gulp.parallel('script'));
	
});

gulp.task('build & watch', gulp.series('build', 'watch'));

//	Functions __________________________________________________________________

function createInOut (pattern) {
	
	return glob.sync(pattern).map((filename) => {
		
		return {
			in: filename,
			out: filename.replace(/^src/, 'test').replace(/\.ts$/, '.js'),
		};
		
	});
	
}

function onwarn (warning) {
	
	console.warn(warning.toString());
	
}

function onerror (error) {
	
	console.error(`Error:${error.pluginCode ? ' ' + error.pluginCode : ''} ${error.message} ${error.loc.file}:${error.loc.line}:${error.loc.column}`);
	
	throw error;
	
}