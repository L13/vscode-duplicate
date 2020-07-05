//	Imports ____________________________________________________________________

const del = require('del');

const gulp = require('gulp');
const rollup = require('rollup');
const typescript = require('rollup-plugin-typescript');

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

gulp.task('clean', () => {

	return del(['out']);

});

gulp.task('script', () => {

	return rollup.rollup({
		input: 'src/extension.ts',
		external: [
			'fs',
			'path',
			'vscode',
		],
		plugins: [
			typescript({
				target: 'es6',
				lib: [
					'es6',
					'dom',
				],
				strict: true,
				removeComments: true,
			}),
		]
	}).then(bundle => {

		return bundle.write({
			file: './out/extension.js',
			format: 'cjs',
			globals: {
				fs: 'fs',
				path: 'path',
				vscode: 'vscode',
			},
		});

	});

});

gulp.task('build', gulp.series('clean', 'script'));

gulp.task('watch', () => {

	gulp.watch(['src/*.ts'], gulp.parallel('script'));

});

//	Functions __________________________________________________________________

