// api/mascot.js
import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";

const redis = Redis.fromEnv();

function getSpriteBase64(filename) {
	const filePath = path.join(process.cwd(), "sprites", filename);
	const fileBuffer = fs.readFileSync(filePath);
	const ext = path.extname(filename).replace(".", "");
	return `data:image/${ext};base64,${fileBuffer.toString("base64")}`;
}

export default async function handler(req, res) {
	const [feeds, lastFed] = await Promise.all([
		redis.get("mascot:feeds"),
		redis.get("mascot:last_fed"),
	]);

	const totalFeeds = feeds || 0;
	const lastFedTime = lastFed || 0;

	const fiveMinutes = 5 * 60 * 1000;
	const isHappy = Date.now() - lastFedTime < fiveMinutes;

	const mascotImage = isHappy
		? getSpriteBase64("happy.gif")
		: getSpriteBase64("angry.gif");

	const borderColor = isHappy ? "#2ea043" : "#f85149";
	const badgeBg = isHappy ? "#122d1f" : "#3d1318";

	// Textos atualizados para o tema de café
	const badgeText = isHappy
		? "CAFEINADO (PRONTO PARA CODAR)"
		: "QUERO CAFÉ (ESSENCIAL PARA FUNCIONAMENTO)";

	const message = isHappy
		? "Obrigado pelo café! Pode explorar o perfil em paz."
		: "Sirva-me no botão abaixo antes de descer a página!";

	const svg = `
    <svg width="520" height="260" viewBox="0 0 520 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        .bg { fill: #0d1117; stroke: ${borderColor}; stroke-width: 2px; rx: 12px; }
        .badge { fill: ${badgeBg}; stroke: ${borderColor}; stroke-width: 1px; rx: 6px; }
        .badge-txt { font: bold 11px monospace; fill: ${borderColor}; letter-spacing: 0.8px; }
        .pixel-art {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
          animation: float 1.4s infinite ease-in-out;
        }
        .msg { font: 14px -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif; fill: #8b949e; }
        .counter { font: bold 15px monospace; fill: #58a6ff; }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      </style>

      <!-- Fundo do Card -->
      <rect x="2" y="2" width="516" height="256" class="bg" />

      <!-- Tag de Status mais larga para caber a frase nova -->
      <rect x="70" y="16" width="380" height="24" class="badge" />
      <text x="260" y="32" text-anchor="middle" class="badge-txt">${badgeText}</text>

      <!-- Pixel Art Ampliada (135x135 centralizada no eixo X=260) -->
      <image 
        href="${mascotImage}" 
        x="192.5" 
        y="48" 
        width="135" 
        height="135" 
        class="pixel-art" 
      />

      <!-- Frase Cinza -->
      <text x="260" y="205" text-anchor="middle" class="msg">${message}</text>

      <!-- Contador de Cafés -->
      <text x="260" y="235" text-anchor="middle" class="counter">
        ☕ Cafés recebidos da comunidade: ${totalFeeds}
      </text>
    </svg>
  `.trim();

	res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
	res.setHeader(
		"Cache-Control",
		"no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
	);
	res.setHeader("Pragma", "no-cache");
	res.setHeader("Expires", "0");

	return res.status(200).send(svg);
}
