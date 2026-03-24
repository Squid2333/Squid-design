import path from 'node:path';
import { defineConfig } from 'dumi';

export default defineConfig({
  alias: {
    '@squid-design/ui/styles/global.css': path.resolve(
      __dirname,
      '../../packages/ui/src/styles/global.css',
    ),
    '@squid-design/ui/button': path.resolve(
      __dirname,
      '../../packages/ui/src/components/Button/index.ts',
    ),
    '@squid-design/ui/form': path.resolve(
      __dirname,
      '../../packages/ui/src/components/Form/index.ts',
    ),
    '@squid-design/ui/input': path.resolve(
      __dirname,
      '../../packages/ui/src/components/Input/index.ts',
    ),
    '@squid-design/ui/modal': path.resolve(
      __dirname,
      '../../packages/ui/src/components/Modal/index.ts',
    ),
    '@squid-design/ui/select': path.resolve(
      __dirname,
      '../../packages/ui/src/components/Select/index.ts',
    ),
    '@squid-design/ui/table': path.resolve(
      __dirname,
      '../../packages/ui/src/components/Table/index.ts',
    ),
    '@squid-design/ui/upload': path.resolve(
      __dirname,
      '../../packages/ui/src/components/Upload/index.ts',
    ),
    '@squid-design/ui': path.resolve(
      __dirname,
      '../../packages/ui/src/index.ts',
    ),
  },
  themeConfig: {
    name: 'Squid\nDesign',
    nav: [
      { title: '指南', link: '/guide/install' },
      { title: '组件', link: '/components/button' },
    ],
  },
});
