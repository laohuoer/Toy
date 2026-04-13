/**
 * GitHub Pages 部署时 basePath 为 /Toy，本地开发为空字符串。
 * 供客户端代码（如 Three.js GLTFLoader）构建静态资源 URL 使用。
 */
export const BASE_PATH =
  process.env.NODE_ENV === 'production' ? '/Toy' : '';
