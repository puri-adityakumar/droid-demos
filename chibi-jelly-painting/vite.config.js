import { defineConfig } from 'vite'

export default defineConfig( {
    // Relative asset URLs so dist/ works from any static host or sub-path.
    base: './',
    build: {
        // three/webgpu alone is ~1 MB minified; nothing to split off here.
        chunkSizeWarningLimit: 1200,
    },
} )
