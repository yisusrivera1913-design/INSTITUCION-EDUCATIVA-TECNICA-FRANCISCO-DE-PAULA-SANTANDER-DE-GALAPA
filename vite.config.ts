import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: ['docente-ai-pro.onrender.com'],
    },
    plugins: [react()],
    define: {
      'process.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY),
      'process.env.VITE_API_KEY_1': JSON.stringify(env.VITE_API_KEY_1),
      'process.env.VITE_API_KEY_2': JSON.stringify(env.VITE_API_KEY_2),
      'process.env.VITE_API_KEY_3': JSON.stringify(env.VITE_API_KEY_3),
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
