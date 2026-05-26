import { Part, NotationSystem, DisplayMode } from './solfaUtils';

export interface ChoirSheetsSettings {
	defaultPart: Part;
	notationSystem: NotationSystem;
	displayMode: DisplayMode;
	partColors: Record<Part, string>;
	highlightSolfa: boolean;
	highlightHeaders: boolean;
	blockLanguageSpecifier: string;
	sectionBgColor: string;
	headerBgColor: string;
	headerTextColor: string;
	tabActiveBgColor: string;
}

export const DEFAULT_PART_COLORS: Record<Part, string> = {
	soprano: '#3b82f6',
	alto: '#ef4444',
	tenor: '#f59e0b',
	chord: '#10b981',
};

export const DEFAULT_SETTINGS: ChoirSheetsSettings = {
	defaultPart: 'soprano',
	notationSystem: 'nigerian',
	displayMode: 'single',
	partColors: { ...DEFAULT_PART_COLORS },
	highlightSolfa: true,
	highlightHeaders: true,
	blockLanguageSpecifier: 'choir',
	sectionBgColor: '#1e1e2e',
	headerBgColor: '#2a2a3e',
	headerTextColor: '#3b82f6',
	tabActiveBgColor: '#2a2a3e',
};
