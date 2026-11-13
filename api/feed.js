import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const GITHUB_USERNAME = "GabrielVBandeira";

export default async function handler(req, res) {
	try {
		const pipeline = redis.pipeline();
		pipeline.incr("mascot:feeds");
		pipeline.set("mascot:last_fed", Date.now());
		await pipeline.exec();
	} catch (error) {
		console.error("Erro ao salvar no Redis:", error);
	}

	res.writeHead(302, {
		Location: `https://github.com/${GITHUB_USERNAME}#mascote-interativo`,
		"Cache-Control": "no-cache, no-store, must-revalidate",
	});
	res.end();
}
