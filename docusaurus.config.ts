import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Laravel Chronicle',
  tagline: 'Verifiable audit trails for Laravel applications',
  favicon: 'img/favicon.svg',
  future: {
    v4: true,
  },
  url: 'https://laravel-chronicle.dev',
  baseUrl: '/',
  organizationName: 'laravel-chronicle',
  projectName: 'laravel-chronicle.dev',
  trailingSlash: false,
  onBrokenLinks: 'throw',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/laravel-chronicle/docs/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Laravel Chronicle',
      logo: {
        alt: 'Laravel Chronicle Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {to: '/docs/quick-start', label: 'Quick Start', position: 'left'},
        {
          href: 'https://github.com/laravel-chronicle/core',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Overview',
              to: '/docs/overview',
            },
            {
              label: 'Installation',
              to: '/docs/installation',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Quick Start',
              to: '/docs/quick-start',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/laravel-chronicle/core',
            },
          ],
        },
        {
          title: 'Project',
          items: [
            {
              label: 'Changelog',
              href: 'https://github.com/laravel-chronicle/core/blob/main/CHANGELOG.md',
            },
            {
              label: 'Contributing',
              href: 'https://github.com/laravel-chronicle/core/blob/main/CONTRIBUTING.md',
            },
            {
              label: 'Security Policy',
              href: 'https://github.com/laravel-chronicle/core/blob/main/SECURITY.md',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Laravel Chronicle. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
