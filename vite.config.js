import { defineConfig } from 'vite';

export default defineConfig({
    base: "/",

    server: {
        port: 5173,
        open: true,
        hmr: true
    },

    build: {
        outDir: "dist",
        sourcemap: true,
        minify: 'esbuild',
        cssMinify: true,
        rollupOptions: {
            input: {
                main: 'index.html',
                onboarding: 'doctor-onboarding.html'
            },
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                }
            }
        }
    }
});
