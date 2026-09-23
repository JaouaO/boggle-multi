const fs = require("node:fs");
const path = require("node:path");

const inputPath = path.join(__dirname, "..", "data", "dico_3_16.json");
const outputPath = path.join(
	__dirname,
	"..",
	"src",
	"engine",
	"generated-dictionary.ts"
);

if (!fs.existsSync(inputPath)) {
	throw new Error(`Dictionnaire introuvable : ${inputPath}`);
}

const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const entries = extractEntries(raw);

if (entries.length === 0) {
	console.log("Structure détectée :");
	console.log(Array.isArray(raw) ? "array" : typeof raw);

	if (raw && typeof raw === "object" && !Array.isArray(raw)) {
		console.log("Clés disponibles :", Object.keys(raw).slice(0, 30));
	}

	throw new Error("Impossible d’extraire des mots depuis ce dictionnaire.");
}

const words = [...new Set(entries.map(readWord).map(normalizeWord).filter(Boolean))]
	.filter((word) => word.length >= 3)
	.sort();

const content = [
	"// Fichier généré automatiquement par tools/build-dico.js",
	"// Ne pas modifier à la main.",
	"",
	`export const DICTIONARY_WORDS: string[] = ${JSON.stringify(words)};`,
	"",
].join("\n");

fs.writeFileSync(outputPath, content, "utf8");

console.log(`Entrées détectées : ${entries.length}`);
console.log(`Dictionnaire généré : ${words.length} mots`);
console.log(`Fichier : ${outputPath}`);

function extractEntries(value) {
	if (Array.isArray(value)) {
		return value;
	}

	if (!value || typeof value !== "object") {
		return [];
	}

	const preferredKeys = [
		"words",
		"mots",
		"dictionary",
		"dictionnaire",
		"entries",
		"data",
		"items",
	];

	for (const key of preferredKeys) {
		if (Array.isArray(value[key])) {
			return value[key];
		}
	}

	const values = Object.values(value);

	if (values.every((item) => typeof item === "string")) {
		return values;
	}

	if (values.every((item) => item === true || item === 1)) {
		return Object.keys(value);
	}

	const nestedArrays = values.filter(Array.isArray);

	if (nestedArrays.length > 0) {
		return nestedArrays.flat();
	}

	return Object.keys(value);
}

function readWord(entry) {
	if (typeof entry === "string") {
		return entry;
	}

	if (entry && typeof entry === "object") {
		return (
			entry.word ||
			entry.mot ||
			entry.graphie ||
			entry.graphie_2 ||
			entry.lemme ||
			entry.label ||
			entry.value ||
			""
		);
	}

	return "";
}

function normalizeWord(word) {
	return String(word)
		.trim()
		.toLocaleUpperCase("fr-FR")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/Œ/g, "OE")
		.replace(/Æ/g, "AE")
		.replace(/[^A-Z]/g, "");
}
