import { StateField, RangeSetBuilder, Facet, Compartment, EditorState, Transaction } from '@codemirror/state';
import { Decoration, EditorView, DecorationSet } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { ChoirSheetsSettings } from '../choirSettings';
import { ChoirBlockGroupWidget } from './choirBlockWidget';
import { isMultiPartSource, expandMultiPartSource } from '../sheet-parsing/multiPartParser';

export const choirSheetsConfig = new Compartment();
export const choirSheetsConfigFacet = Facet.define<ChoirSheetsSettings, ChoirSheetsSettings>({
	combine: values => values[0],
});

export const choirBlocksStateField = StateField.define<DecorationSet>({
	create(state: EditorState): DecorationSet {
		return buildDecos(state);
	},
	update(decos: DecorationSet, tr: Transaction): DecorationSet {
		if (tr.docChanged) {
			return buildDecos(tr.state);
		}
		const oldSel = tr.startState.selection.main;
		const newSel = tr.state.selection.main;
		if (oldSel.head !== newSel.head) {
			return buildDecos(tr.state);
		}
		return decos.map(tr.changes);
	},
	provide: (field: StateField<DecorationSet>) => EditorView.decorations.from(field),
});

function extractSource(state: EditorState, blockStart: number, blockEnd: number): string {
	const fullText = state.doc.sliceString(blockStart, blockEnd);
	const lines = fullText.split('\n');
	const sourceLines: string[] = [];
	for (let i = 1; i < lines.length - 1; i++) {
		sourceLines.push(lines[i]);
	}
	return sourceLines.join('\n');
}

function buildDecos(state: EditorState): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();
	const tree = syntaxTree(state);
	const config = state.facet(choirSheetsConfigFacet);
	if (!config) return builder.finish();

	const prefix = config.blockLanguageSpecifier || 'choir';
	let blockStart: number | null = null;

	tree.iterate({
		enter(node) {
			if (node.type.name === 'HyperMD-codeblock-begin') {
				const line = state.doc.lineAt(node.from);
				const text = line.text;
				const match = text.match(new RegExp(`^(\`{3,}|~{3,})${escapeRegex(prefix)}$`));
				if (match) {
					blockStart = node.from;
				}
			} else if (node.type.name === 'HyperMD-codeblock-end' && blockStart !== null) {
				const source = extractSource(state, blockStart, node.to);
				if (isMultiPartSource(source)) {
					const expanded = expandMultiPartSource(source);
					if (expanded.length > 0) {
						const sel = state.selection.main;
						const cursorInside = blockStart <= sel.head && sel.head <= node.to;
						if (!cursorInside) {
							const widget = new ChoirBlockGroupWidget(expanded, config);
							builder.add(blockStart, node.to, Decoration.replace({ widget }));
						}
					}
				}
				blockStart = null;
			}
		},
	});

	return builder.finish();
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
