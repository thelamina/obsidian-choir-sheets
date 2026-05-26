import { Extension } from '@codemirror/state';
import { ChoirSheetsSettings } from '../choirSettings';
import { choirSheetsConfig, choirSheetsConfigFacet, choirBlocksStateField } from './choirBlocksStateField';

export function choirSheetsEditorExtension(settings: ChoirSheetsSettings): Extension {
	return [
		choirSheetsConfig.of(choirSheetsConfigFacet.of({ ...settings })),
		choirBlocksStateField,
	];
}
