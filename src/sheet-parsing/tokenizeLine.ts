import {
	Token,
	TokenizedLine,
} from './tokens';
import { SolfaNote, isSolfaSyllable, isRest, parseSolfaNote } from '../solfaUtils';

const headerPattern = /^(\s*)(\[.+?\])(\s*)$/;
const rhythmWords = new Set(['|', '||', '|:', ':|', ':', '[', ']', '/', '/.']);
const CHORD_PATTERN = /^[A-G](#|b)?(m|min|maj|M|dim|aug|sus)?[24679]?(sus[24]|add[249]|dim7|aug7|maj7|min7)?(\/[A-G](#|b)?)?$/;

function isChordSymbol(word: string): boolean {
	return CHORD_PATTERN.test(word);
}

export function tokenizeLine(line: string): TokenizedLine {
	const trimmed = line.trim();

	if (!trimmed) {
		return { tokens: [{ type: 'whitespace', value: line }], isSolfaLine: false };
	}

	const headerMatch = trimmed.match(headerPattern);
	if (headerMatch && !trimmed.includes('\n')) {
		const headerText = headerMatch[2];
		const headerToken: Token & { openingBracket: string; headerName: string; closingBracket: string } = {
			type: 'header',
			value: headerText,
			openingBracket: '[',
			headerName: headerText.slice(1, -1),
			closingBracket: ']',
		};
		return {
			tokens: [headerToken],
			isSolfaLine: false,
			header: headerText.slice(1, -1),
		};
	}

	const tokens: Token[] = [];
	const parts = line.split(/(\s+)/);

	for (const part of parts) {
		if (!part) continue;

		if (/^\s+$/.test(part)) {
			tokens.push({ type: 'whitespace', value: part });
			continue;
		}

		if (rhythmWords.has(part)) {
			tokens.push({ type: 'rhythm', value: part });
			continue;
		}

		if (isRest(part)) {
			tokens.push({ type: 'rest', value: part });
			continue;
		}

		if (isChordSymbol(part)) {
			tokens.push({ type: 'chord', value: part });
			continue;
		}

		if (isSolfaSyllable(part)) {
			const note = parseSolfaNote(part);
			const solfaToken: Token & { solfaNote: SolfaNote } = {
				type: 'solfa',
				value: part,
				solfaNote: note || { syllable: part, step: 0, accidental: '', octave: 0, display: part, notation: 'tonic-solfa' },
			};
			tokens.push(solfaToken);
			continue;
		}

		tokens.push({ type: 'word', value: part });
	}

	const solfaCount = tokens.filter(t => t.type === 'solfa' || t.type === 'rest' || t.type === 'rhythm').length;
	const chordCount = tokens.filter(t => t.type === 'chord').length;
	const wordCount = tokens.filter(t => t.type === 'word').length;
	const isSolfaLine = solfaCount > 0 && (solfaCount >= wordCount || wordCount === 0) && chordCount === 0;
	const hasChord = chordCount > 0;

	return { tokens, isSolfaLine, hasChord };
}

export interface Section {
	header?: string;
	solfatextLines: string[];
	lyricLines: string[];
	chordLines: string[];
}

export function groupIntoSections(lines: string[]): Section[] {
	const sections: Section[] = [];
	let currentSection: Section | null = null;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const tokenized = tokenizeLine(line);

		if (tokenized.header) {
			if (currentSection) {
				sections.push(currentSection);
			}
			currentSection = { header: tokenized.header, solfatextLines: [], lyricLines: [], chordLines: [] };
			continue;
		}

		if (!tokenized.tokens.length || tokenized.tokens.every(t => t.type === 'whitespace')) {
			continue;
		}

		if (!currentSection) {
			currentSection = { solfatextLines: [], lyricLines: [], chordLines: [] };
		}

		if (tokenized.hasChord) {
			currentSection.chordLines.push(line);
		} else if (tokenized.isSolfaLine) {
			currentSection.solfatextLines.push(line);
		} else {
			currentSection.lyricLines.push(line);
		}
	}

	if (currentSection) {
		sections.push(currentSection);
	}

	return sections;
}
