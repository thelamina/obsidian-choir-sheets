import { Part, NotationSystem } from './solfaUtils';

export interface ChoirSheetsSettings {
	notationSystem: NotationSystem;
	partColors: Record<Part, string>;
	highlightSolfa: boolean;
	highlightHeaders: boolean;
	blockLanguageSpecifier: string;
	sectionBgColor: string;
	headerBgColor: string;
	headerTextColor: string;
	tabActiveBgColor: string;
	lyricsFontSize: number;
	lyricsFontWeight: number;
	solfaFontSize: number;
	solfaFontWeight: number;
	chordFontSize: number;
	chordFontWeight: number;
	headerFontSize: number;
	headerFontWeight: number;
	tabFontSize: number;
	tabFontWeight: number;
	wrapText: boolean;
}

export const DEFAULT_PART_COLORS: Record<Part, string> = {
	soprano: '#3b82f6',
	alto: '#ef4444',
	tenor: '#f59e0b',
	chord: '#10b981',
};

export const DEFAULT_SETTINGS: ChoirSheetsSettings = {
	notationSystem: 'tonic-solfa',
	partColors: { ...DEFAULT_PART_COLORS },
	highlightSolfa: true,
	highlightHeaders: true,
	blockLanguageSpecifier: 'choir',
	sectionBgColor: '#1e1e2e',
	headerBgColor: '#2a2a3e',
	headerTextColor: '#3b82f6',
	tabActiveBgColor: '#2a2a3e',
	lyricsFontSize: 14,
	lyricsFontWeight: 400,
	solfaFontSize: 13,
	solfaFontWeight: 600,
	chordFontSize: 13,
	chordFontWeight: 600,
	headerFontSize: 11.5,
	headerFontWeight: 600,
	tabFontSize: 11,
	tabFontWeight: 600,
	wrapText: true,
};
