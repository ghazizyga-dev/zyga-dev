import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: "src",
  manifest: {
    name: "Zyga - LinkedIn Assistant",
    description: "Import LinkedIn contacts and draft AI messages",
    permissions: ["storage"],
    icons: {
      16: "icon-16.png",
      48: "icon-48.png",
      128: "icon-128.png",
    },
    host_permissions: [`${process.env.WXT_API_URL ?? "http://localhost:3000"}/*`],
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxy2/tGCMPi/WnV/4+o3Bx3zRJM3jat2DISFd8SpJVS116G4XaGiOSkSXOWKAf3ngqyTl0alFTC3h/9WuVHCJzdiv9QK85HvciDAiIqg2zOmPiiu3Cqn9S/B4y5+QpFLtMu3ZZvCiLuRp7zM4+kVXS5xNn97czFAAEl2GUdwuE4AlzXvIqQMv0GQQB6qqTu1Yy4oX8jE/YzS8wxsHF5EMlm412ZUUvCVmYunPmmtJIGmFUD9MgLKv7RJY8R4NBokwDye08PNDP7oeyDmPkBhfJhX7ewUa2TvJSxOnrcYcW2BB71v0w7o6D5cMxl1itxSD/q+q68vIQRm5ddbxs80CeQIDAQAB",
  },
});
