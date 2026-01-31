import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

const isDev = process.env.NODE_ENV === 'development';
const netlifyAdapter = isDev
    ? null
    : netlify({
          devFeatures: {
              environmentVariables: true
          }
      });

// https://astro.build/config
export default defineConfig({
    vite: {
        plugins: [tailwindcss()]
    },
    integrations: [react()],
    ...(netlifyAdapter ? { adapter: netlifyAdapter } : {})
});
