import { cpSync, mkdirSync, readdirSync, existsSync } from "node:fs";

const out = "public/vad";
mkdirSync(out, { recursive: true });

const vadDir = "node_modules/@ricky0123/vad-web/dist";
for (const file of readdirSync(vadDir)) {
  if (file.endsWith(".onnx") || file.startsWith("vad.worklet")) {
    cpSync(`${vadDir}/${file}`, `${out}/${file}`);
  }
}

const ortDir = "node_modules/onnxruntime-web/dist";
if (existsSync(ortDir)) {
  for (const file of readdirSync(ortDir)) {
    if (/^ort-wasm.*\.(wasm|mjs)$/.test(file)) {
      cpSync(`${ortDir}/${file}`, `${out}/${file}`);
    }
  }
} else {
  console.warn(
    "onnxruntime-web not found at top-level node_modules; copy its ort-wasm* files to public/vad manually.",
  );
}

console.log("VAD assets copied to", out);
