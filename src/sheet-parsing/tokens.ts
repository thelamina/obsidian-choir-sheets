import { SolfaNote } from '../solfaUtils';

export interface Token {
	type: 'word' | 'solfa' | 'whitespace' | 'header' | 'rhythm' | 'rest' | 'chord';
	value: string;
}

export interface ChordToken extends Token {
	type: 'chord';
}

export interface HeaderToken extends Token {
	type: 'header';
	openingBracket: string;
	headerName: string;
	closingBracket: string;
}

export interface SolfaToken extends Token {
	type: 'solfa';
	solfaNote: SolfaNote;
}

export interface TokenizedLine {
	tokens: Token[];
	isSolfaLine: boolean;
	header?: string;
	hasChord?: boolean;
}
