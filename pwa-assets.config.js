import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

const background = '#445455';

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background, fit: 'contain' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background, fit: 'contain' } },
  },
  images: ['public/favicon.svg'],
});
