```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    host: "0.0.0.0",

    proxy: {
      // Local manual control
      "/api": {
        target: "http://172.20.10.2",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api/, ""),
      },

      // Local voice control
      "/voice": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
```
