/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		serverComponentsExternalPackages: ['fluent-ffmpeg', 'ffmpeg-static']
	},
	api: {
		bodyParser: {
			sizeLimit: '200mb'
		}
	}
};

module.exports = nextConfig;
