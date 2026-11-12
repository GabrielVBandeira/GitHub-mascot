// api/mascot.js
import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";

const redis = Redis.fromEnv();

// Função auxiliar que converte seu GIF ou PNG da pasta /sprites para Base64
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

	// Carrega o GIF/PNG correspondente ao humor do mascote
	const mascotImage = isHappy
		? getSpriteBase64("happy.gif")
		: getSpriteBase64("angry.gif");

	const borderColor = isHappy ? "#2ea043" : "#f85149";
	const badgeBg = isHappy ? "#122d1f" : "#3d1318";
	const badgeText = isHappy
		? "STATUS: BUCHO CHEIO (SEGURO)"
		: "STATUS: FAMINTO (PERIGO DE BRIGA)";
	const message = isHappy
		? "Obrigado pelo petisco! Pode explorar o perfil em paz."
		: "Alimente-me no botão abaixo antes de descer a página!";

	const svg = `
    <svg width="440" height="210" viewBox="0 0 440 210" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        .bg { fill: #0d1117; stroke: ${borderColor}; stroke-width: 2px; rx: 12px; }
        .badge { fill: ${badgeBg}; stroke: ${borderColor}; stroke-width: 1px; rx: 6px; }
        .badge-txt { font: bold 10px monospace; fill: ${borderColor}; letter-spacing: 1px; }
        .pixel-art {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
          animation: float 1.4s infinite ease-in-out;
        }
        .msg { font: 13px -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif; fill: #8b949e; }
        .counter { font: bold 14px monospace; fill: #58a6ff; }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      </style>

      <!-- Fundo do Card -->
      <rect x="2" y="2" width="436" height="206" class="bg" />

      <!-- Tag de Status -->
      <rect x="95" y="16" width="250" height="22" class="badge" />
      <text x="220" y="31" text-anchor="middle" class="badge-txt">${badgeText}</text>

      <!-- Pixel Art Embutida (x = 220 - metade da largura para centralizar) -->
      <image 
        href="${mascotImage}" 
        x="180" 
        y="48" 
        width="80" 
        height="80" 
        class="pixel-art" 
      />

      <!-- Frase de Reação -->
      <text x="220" y="155" text-anchor="middle" class="msg">${message}</text>

      <!-- Contador Global -->
      <text x="220" y="185" text-anchor="middle" class="counter">
        🍖 Petiscos recebidos da comunidade: ${totalFeeds}
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
