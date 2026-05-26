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

interface BlockInfo {
	part: string;
	source: string;
	from: number;
	to: number;
}

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
	const blocks: BlockInfo[] = [];
	let currentBlock: { from: number; part: string } | null = null;

	tree.iterate({
		enter(node) {
			if (node.type.name === 'HyperMD-codeblock-begin') {
				const line = state.doc.lineAt(node.from);
				const text = line.text;
				const match = text.match(new RegExp(`^(\`{3,}|~{3,})(${escapeRegex(prefix)})(?:-(\\w+))?`));
				if (match) {
					currentBlock = { from: node.from, part: match[3] || '' };
				}
			} else if (node.type.name === 'HyperMD-codeblock-end' && currentBlock) {
				const blockStart = currentBlock.from;
				const blockEnd = node.to;
				const source = extractSource(state, blockStart, blockEnd);

				if (!currentBlock.part && isMultiPartSource(source)) {
					const expanded = expandMultiPartSource(source);
					if (expanded.length > 0) {
						const sel = state.selection.main;
						const cursorInside = blockStart <= sel.head && sel.head <= blockEnd;
						if (!cursorInside) {
							const widget = new ChoirBlockGroupWidget(expanded, config);
							builder.add(blockStart, blockEnd, Decoration.replace({ widget }));
						}
					}
				} else {
					blocks.push({
						part: currentBlock.part || config.defaultPart || 'soprano',
						source,
						from: blockStart,
						to: blockEnd,
					});
				}

				currentBlock = null;
			}
		},
	});

	if (blocks.length === 0) return builder.finish();

	const selection = state.selection.main;
	const cursorInBlock = blocks.some(b => b.from <= selection.head && selection.head <= b.to);

	if (!cursorInBlock) {
		const groups = groupBlocks(blocks);

		for (const group of groups) {
			const from = group[0].from;
			const to = group[group.length - 1].to;

			const widget = new ChoirBlockGroupWidget(
				group.map(b => ({ part: b.part, source: b.source })),
				config,
			);

			builder.add(from, to, Decoration.replace({ widget }));
		}
	}

	return builder.finish();
}

function groupBlocks(blocks: BlockInfo[]): BlockInfo[][] {
	const groups: BlockInfo[][] = [];
	let current: BlockInfo[] = [];

	for (const block of blocks) {
		if (current.length === 0) {
			current.push(block);
		} else {
			const prev = current[current.length - 1];
			if (block.from <= prev.to + 1) {
				current.push(block);
			} else {
				groups.push(current);
				current = [block];
			}
		}
	}

	if (current.length > 0) groups.push(current);
	return groups;
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
