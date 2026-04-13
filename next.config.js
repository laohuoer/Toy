/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  // 静态导出，支持 GitHub Pages
  output: 'export',

  // GitHub Pages 部署路径：https://laohuoer.github.io/Toy
  basePath: isProd ? '/Toy' : '',
  assetPrefix: isProd ? '/Toy/' : '',

  // GitHub Pages 不支持 Next.js Image Optimization，使用原生 img
  images: {
    unoptimized: true,
  },

  // 生成 trailing slash，确保静态路由正确解析
  trailingSlash: true,

  webpack: (config) => {
    config.externals = config.externals || [];
    return config;
  },
};

module.exports = nextConfig;
