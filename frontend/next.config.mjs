/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Se você usa imagens externas (ex: Google Avatar), adicione o domínio aqui:
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
