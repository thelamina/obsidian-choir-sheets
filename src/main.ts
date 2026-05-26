import { Plugin, MarkdownPostProcessorContext } from 'obsidian';
import { ChoirSheetsSettings, DEFAULT_SETTINGS } from './choirSettings';
import { ChoirSheetsSettingTab } from './choirSettingTab';
import { ChoirBlockGroupRenderer } from './reading-mode/choirBlockRenderer';
import { choirSheetsEditorExtension } from './editor-extension/choirSheetsEditorExtension';
import { choirSheetsConfig, choirSheetsConfigFacet } from './editor-extension/choirBlocksStateField';
import { isMultiPartSource, expandMultiPartSource } from './sheet-parsing/multiPartParser';

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

			codeblocks.forEach(cb => {
				const codeblock = cb as HTMLElement;
				const langClass = Array.from(codeblock.classList)
					.find(cls => cls.startsWith(`language-${prefix}`));
				if (!langClass) return;
				if (langClass !== `language-${prefix}`) return;

				const source = codeblock.textContent || '';
				if (!source.trim()) return;

				const pre = codeblock.parentElement as HTMLElement;

				if (isMultiPartSource(source)) {
					const blocks = expandMultiPartSource(source);
					if (blocks.length > 0) {
						context.addChild(new ChoirBlockGroupRenderer(
							pre, [pre], blocks, this.settings,
						));
					}
				}
			});
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
