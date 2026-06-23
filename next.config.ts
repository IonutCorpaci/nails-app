import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    'e31d-188-237-232-160.ngrok-free.app',
    ...(process.env.NGROK_HOST ? [process.env.NGROK_HOST] : [])
  ],
  devIndicators: false,
};

export default nextConfig;
