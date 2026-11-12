// api/mascot.js
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
	// Busca o total de petiscos e o timestamp da última vez que foi alimentado
	const [feeds, lastFed] = await Promise.all([
		redis.get("mascot:feeds"),
		redis.get("mascot:last_fed"),
	]);

	const totalFeeds = feeds || 0;
	const lastFedTime = lastFed || 0;

	// Define que o mascote fica feliz por 5 minutos (300.000 ms) após comer
	const fiveMinutes = 5 * 60 * 1000;
	const isHappy = Date.now() - lastFedTime < fiveMinutes;

	// Variáveis visuais de acordo com o humor
	const borderColor = isHappy ? "#2ea043" : "#f85149";
	const badgeBg = isHappy ? "#122d1f" : "#3d1318";
	const badgeText = isHappy
		? "STATUS: BUCHO CHEIO (SEGURO)"
		: "STATUS: FAMINTO (PERIGO DE BRIGA)";
	const mascotArt = isHappy ? "( ˘▽˘)っ♨" : "( ╬◣ 益◢)🔪";
	const message = isHappy
		? "Obrigado pelo petisco! Pode explorar o perfil em paz."
		: "Alimente-me no botão abaixo antes de descer a página!";

	const svg = `
    <svg width="440" height="180" viewBox="0 0 440 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        .bg { fill: #0d1117; stroke: ${borderColor}; stroke-width: 2px; rx: 12px; }
        .badge { fill: ${badgeBg}; stroke: ${borderColor}; stroke-width: 1px; rx: 6px; }
        .badge-txt { font: bold 10px monospace; fill: ${borderColor}; letter-spacing: 1px; }
        .mascot { font: bold 38px monospace; fill: #e6edf3; animation: float 1.4s infinite ease-in-out; }
        .msg { font: 13px -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif; fill: #8b949e; }
        .counter { font: bold 14px monospace; fill: #58a6ff; }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      </style>

      <!-- Fundo do Card -->
      <rect x="2" y="2" width="436" height="176" class="bg" />

      <!-- Tag de Status no Topo -->
      <rect x="95" y="16" width="250" height="22" class="badge" />
      <text x="220" y="31" text-anchor="middle" class="badge-txt">${badgeText}</text>

      <!-- Mascote Animado -->
      <g class="mascot">
        <text x="220" y="92" text-anchor="middle">${mascotArt}</text>
      </g>

      <!-- Frase de Reação -->
      <text x="220" y="132" text-anchor="middle" class="msg">${message}</text>

      <!-- Contador Global -->
      <text x="220" y="158" text-anchor="middle" class="counter">
        🍖 Petiscos recebidos da comunidade: ${totalFeeds}
      </text>
    </svg>
  `.trim();

	// Headers críticos: impedem que o GitHub Camo guarde cache da imagem antiga
	res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
	res.setHeader(
		"Cache-Control",
		"no-cache, no-store, must-revalidate, max-age=0, s-maxage=0"
	);
	res.setHeader("Pragma", "no-cache");
	res.setHeader("Expires", "0");

	return res.status(200).send(svg);
}
