/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // Reports used to live under /feedback; keep old links and bookmarks working.
  async redirects() {
    return [
      { source: "/dashboard/ai-interview/feedback", destination: "/dashboard/reports", permanent: true },
      { source: "/dashboard/ai-interview/report/:sessionId", destination: "/dashboard/reports/:sessionId", permanent: true },
      { source: "/feedback", destination: "/dashboard/reports", permanent: true },
      { source: "/feedback/role", destination: "/dashboard/reports", permanent: true },
      { source: "/feedback/role/:role", destination: "/dashboard/reports?role=:role", permanent: true },
    ];
  },
};

export default nextConfig;
