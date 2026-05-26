import { EditorView } from '@codemirror/view';
import { Plugin, MarkdownPostProcessorContext } from 'obsidian';
import { ChoirSheetsSettings, DEFAULT_SETTINGS } from './choirSettings';
import { ChoirSheetsSettingTab } from './choirSettingTab';
import { ChoirBlockGroupRenderer, BlockData } from './reading-mode/choirBlockRenderer';
import { choirSheetsEditorExtension } from './editor-extension/choirSheetsEditorExtension';
import { choirSheetsConfig, choirSheetsConfigFacet } from './editor-extension/choirBlocksStateField';
import { isMultiPartSource, expandMultiPartSource } from './sheet-parsing/multiPartParser';
import { Part } from './solfaUtils';

export default class ChoirSheetsPlugin extends Plugin {
	settings: ChoirSheetsSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new ChoirSheetsSettingTab(this.app, this));

		this.registerEditorExtension(choirSheetsEditorExtension(this.settings));

		this.registerMarkdownPostProcessor((element: HTMLElement, context: MarkdownPostProcessorContext) => {
			const prefix = this.settings.blockLanguageSpecifier || 'choir';
			const codeblocks = element.querySelectorAll(`code[class*="language-${prefix}"]`);

			if (codeblocks.length === 0) return;

			const blockDataList: { pre: HTMLElement; part: string; source: string }[] = [];

			codeblocks.forEach(cb => {
				const codeblock = cb as HTMLElement;
				const langClass = Array.from(codeblock.classList)
					.find(cls => cls.startsWith(`language-${prefix}`));
				if (!langClass) return;

				const suffix = langClass.substring(`language-${prefix}`.length + 1);
				const source = codeblock.textContent || '';
				if (!source.trim()) return;

				const pre = codeblock.parentElement as HTMLElement;

				// Multi-part block — uses S:/A:/T: prefixes inside a single code block
				if (!suffix && isMultiPartSource(source)) {
					const blocks = expandMultiPartSource(source);
					if (blocks.length > 0) {
						context.addChild(new ChoirBlockGroupRenderer(
							pre, [pre], blocks, this.settings,
						));
					}
					return;
				}

				// Single-part block (old format)
				const part = (suffix || this.settings.defaultPart) as Part;
				blockDataList.push({ pre, part, source });
			});

			if (blockDataList.length === 0) return;

			const groups: { pre: HTMLElement[]; blocks: BlockData[] }[] = [];
			let currentPre: HTMLElement[] = [];
			let currentBlocks: BlockData[] = [];

			for (const item of blockDataList) {
				if (currentPre.length === 0) {
					currentPre.push(item.pre);
					currentBlocks.push({ part: item.part, source: item.source });
				} else {
					const prevPre = currentPre[currentPre.length - 1];
					if (prevPre.nextElementSibling === item.pre) {
						currentPre.push(item.pre);
						currentBlocks.push({ part: item.part, source: item.source });
					} else {
						groups.push({ pre: currentPre, blocks: currentBlocks });
						currentPre = [item.pre];
						currentBlocks = [{ part: item.part, source: item.source }];
					}
				}
			}
			if (currentPre.length > 0) groups.push({ pre: currentPre, blocks: currentBlocks });

			for (const group of groups) {
				const container = group.pre[0];
				context.addChild(new ChoirBlockGroupRenderer(
					container,
					group.pre,
					group.blocks,
					this.settings,
				));
			}
		});

		this.addCommand({
			id: 'toggle-display-mode',
			name: 'Toggle display mode (single/all)',
			callback: async () => {
				this.settings.displayMode = this.settings.displayMode === 'single' ? 'all' : 'single';
				await this.saveSettings();
			},
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.applySettingsToEditors();
		this.app.workspace.updateOptions();
	}

	private applySettingsToEditors() {
		const config = choirSheetsConfigFacet.of({ ...this.settings });
		this.app.workspace.getLeavesOfType('markdown').forEach(leaf => {
			const view = leaf.view as any;
			if (view?.editor?.cm) {
				view.editor.cm.dispatch({
					effects: choirSheetsConfig.reconfigure(config),
				});
			}
		});
	}
}
