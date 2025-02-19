// vite.config.js
import { defineConfig } from 'vite'
// import path from 'path'

export default defineConfig({
    base: 'https://flaneries.net/',
    build: {
    rollupOptions: {
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
        
        // Exclude a specific npm package
        // 'lodash',
        
        // Use a function for more complex exclusions
        // (id) => id.includes('test') || id.includes('spec'),
      ]
    }
  }
})
