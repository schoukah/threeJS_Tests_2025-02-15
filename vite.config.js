// vite.config.js
import { defineConfig } from 'vite'
// import path from 'path'

export default defineConfig({
    base: ' /threeJS_Tests_2025-02-15/',
    build: {
    outDir : 'docs',
    rollupOptions: {
      input: {
        index: '/index.html',
        main: '/src/js/main.js',
        styles: '/src/css/style.css',
        // logo: '/src/js/animated_logo_v1_2025-02-21.js'
      },
      external: [
        // Exclude all files in the src/excluded directory
        // /^\/src\/excluded\/.*/,
        
        // Exclude specific files
        '/A_Cursor_Follows.js',
        '/blue_A_letter_left_pan.js',
        '/blue_A_letter.js',
        '/cube_initial_example.js',
        '/line_initial_example.js',
        '/old_css.css',
        '/style_for_letters_page.css',
        '/two_letters_goes_with_premier_index_html.js',
        '/animated_logo_v1__with_Orbit_controls_2025-02-21.js',
        '/animated_logo_v1_2025-02-21_with_Bloom_Effect.js',
        '/animated_logo_v1_With_Helpers_2025-02-23.js',
        '/animated_logo_v1_2025-02-21.js',
        '/animated_logo_v1_wO_helpers_wO_effects_2025-02-23.js',

        // Exclude a specific npm package
        // 'lodash',
        
        // Use a function for more complex exclusions
        // (id) => id.includes('test') || id.includes('spec'),
      ],
      output: {
        manualChunks: {
          three: ['three'],
          // Split large dependencies into separate chunks
        }
      }
    }
  }
})
