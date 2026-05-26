export type Part = 'soprano' | 'alto' | 'tenor' | 'chord';
export type NotationSystem = 'nigerian' | 'sharp-flat' | 'number';
export type DisplayMode = 'single' | 'all';

export interface SolfaNote {
	syllable: string;
	step: number;
	accidental: '' | '#' | 'b';
	octave: number;
	display: string;
	notation: NotationSystem;
}

const NATURAL_STEPS: Record<string, number> = {
	'd': 0, 'r': 2, 'm': 4, 'f': 5, 's': 7, 'l': 9, 't': 11,
};

const NUMBER_STEPS: Record<string, number> = {
	'1': 0, '2': 2, '3': 4, '4': 5, '5': 7, '6': 9, '7': 11,
};

const NIGERIAN_ACCIDENTALS: Record<string, { step: number; display: string }> = {
	'di':  { step: 1, display: 'di' },
	'ri':  { step: 3, display: 'ri' },
	'mo':  { step: 3, display: 'mo' },
	'fi':  { step: 6, display: 'fi' },
	'fe':  { step: 6, display: 'fe' },
	'si':  { step: 8, display: 'si' },
	'se':  { step: 8, display: 'se' },
	'li':  { step: 10, display: 'li' },
	'toh': { step: 10, display: 'toh' },
	'ra':  { step: 1, display: 'ra' },
	'me':  { step: 3, display: 'me' },
	'le':  { step: 8, display: 'le' },
	'te':  { step: 10, display: 'te' },
};

export function isSolfaSyllable(word: string): boolean {
	if (!word) return false;
	return (
		isNigerianSolfa(word) ||
		isSharpFlatSolfa(word) ||
		isNumberSolfa(word) ||
		isRest(word)
	);
}

export function isRest(word: string): boolean {
	return word === 'z' || word === '-';
}

function isNigerianSolfa(word: string): boolean {
	const clean = word.replace(/'+$/, '');
	const base = clean.replace(/[iloeah]+$/, '');
	if (base.length === 1 && base in NATURAL_STEPS) return true;
	if (clean in NIGERIAN_ACCIDENTALS) return true;
	return false;
}

function isSharpFlatSolfa(word: string): boolean {
	const clean = word.replace(/'+$/, '');
	const match = clean.match(/^([#b]?)([dr mflst])$/);
	if (!match) return false;
	const syllable = match[2];
	if (syllable in NATURAL_STEPS) return true;
	return false;
}

function isNumberSolfa(word: string): boolean {
	const clean = word.replace(/'+$/, '');
	const match = clean.match(/^([#b]?)([0-9]+)$/);
	if (!match) return false;
	const num = match[2];
	return num in NUMBER_STEPS || (num === '0' || num === '');
}

export function parseSolfaNote(word: string): SolfaNote | null {
	if (!word || isRest(word)) return null;

	const octave = (word.match(/'/g) || []).length;
	const clean = word.replace(/'/g, '');

	if (clean in NIGERIAN_ACCIDENTALS) {
		const info = NIGERIAN_ACCIDENTALS[clean];
		return {
			syllable: clean[0],
			step: info.step,
			accidental: info.step % 2 === 1 ? (info.step > (NATURAL_STEPS[clean[0]] || 0) ? '#' : 'b') : '',
			octave,
			display: word,
			notation: 'nigerian',
		};
	}

	const nigerianBase = clean.replace(/[iloeah]+$/, '');
	if (nigerianBase.length === 1 && nigerianBase in NATURAL_STEPS && clean === nigerianBase) {
		return {
			syllable: nigerianBase,
			step: NATURAL_STEPS[nigerianBase],
			accidental: '',
			octave,
			display: word,
			notation: 'nigerian',
		};
	}

	const sharpMatch = clean.match(/^#([dr mflst])$/);
	if (sharpMatch) {
		const step = (NATURAL_STEPS[sharpMatch[1]] + 1) % 12;
		return {
			syllable: sharpMatch[1],
			step,
			accidental: '#',
			octave,
			display: word,
			notation: 'sharp-flat',
		};
	}

	const flatMatch = clean.match(/^b([dr mflst])$/);
	if (flatMatch) {
		const step = ((NATURAL_STEPS[flatMatch[1]] - 1) + 12) % 12;
		return {
			syllable: flatMatch[1],
			step,
			accidental: 'b',
			octave,
			display: word,
			notation: 'sharp-flat',
		};
	}

	const naturalMatch = clean.match(/^([dr mflst])$/);
	if (naturalMatch && naturalMatch[1] in NATURAL_STEPS) {
		return {
			syllable: naturalMatch[1],
			step: NATURAL_STEPS[naturalMatch[1]],
			accidental: '',
			octave,
			display: word,
			notation: 'sharp-flat',
		};
	}

	const numMatch = clean.match(/^([#b]?)(\d+)$/);
	if (numMatch) {
		const num = numMatch[2];
		const accidental = numMatch[1] as '' | '#' | 'b';
		if (num in NUMBER_STEPS) {
			let step = NUMBER_STEPS[num];
			if (accidental === '#') step = (step + 1) % 12;
			if (accidental === 'b') step = (step - 1 + 12) % 12;
			return {
				syllable: num,
				step,
				accidental,
				octave,
				display: word,
				notation: 'number',
			};
		}
	}

	return null;
}

export function getPartColor(part: Part, colors: Record<Part, string>): string {
	return colors[part] || '#888';
}

export function partLabel(part: Part): string {
	return part.charAt(0).toUpperCase() + part.slice(1);
}


