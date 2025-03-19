import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import alias from '@rollup/plugin-alias';
import postcss from 'rollup-plugin-postcss';
import { fileURLToPath } from 'url';
import { dirname, resolve as resolvePath } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    },
    {
      file: 'dist/index.min.js',
      format: 'umd',
      name: 'PixPro',
      plugins: [terser()],
      sourcemap: true
    }
  ],
  plugins: [
    alias({
      entries: [
        { find: '@', replacement: resolvePath(__dirname, 'src') }
      ]
    }),
    postcss({
      extensions: ['.css'],
      extract: false,
      modules: false,
      inject: true,
      minimize: true
    }),
    typescript({
      tsconfig: './tsconfig.json'
    }),
    resolve(),
    commonjs()
  ],
  external: ['compressorjs', 'lodash-es', 'uuid']
}; 