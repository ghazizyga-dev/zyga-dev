import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: "src",
  manifest: {
    name: "AI Boilerplate - LinkedIn Assistant",
    description: "Import LinkedIn contacts and draft AI messages",
    permissions: ["storage"],
    host_permissions: [`${process.env.WXT_API_URL ?? "http://localhost:3000"}/*`],
  },
});
