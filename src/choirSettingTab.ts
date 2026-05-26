import { App, PluginSettingTab, Setting } from 'obsidian';
import ChoirSheetsPlugin from './main';
import { Part, NotationSystem, DisplayMode } from './solfaUtils';
import { DEFAULT_PART_COLORS, DEFAULT_SETTINGS } from './choirSettings';

export class ChoirSheetsSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: ChoirSheetsPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Choir Sheets Settings' });

		new Setting(containerEl)
			.setName('Default part')
			.setDesc('Default voice part when not specified in the code block')
			.addDropdown(dropdown => {
				const parts: Part[] = ['soprano', 'alto', 'tenor', 'chord'];
				parts.forEach(p => dropdown.addOption(p, p.charAt(0).toUpperCase() + p.slice(1)));
				dropdown.setValue(this.plugin.settings.defaultPart);
				dropdown.onChange(async (value) => {
					this.plugin.settings.defaultPart = value as Part;
					await this.plugin.saveSettings();
					this.app.workspace.updateOptions();
				});
			});

		new Setting(containerEl)
			.setName('Notation system')
			.setDesc('How solfa notes are written')
			.addDropdown(dropdown => {
				const systems: { value: NotationSystem; label: string }[] = [
					{ value: 'nigerian', label: 'Nigerian (d di r mo m f fe s se l toh t d)' },
					{ value: 'sharp-flat', label: '#/b Solfa (#d r bm m f #f s #s l bt t)' },
					{ value: 'number', label: 'Number (#1 b3 3 #4 5 6 b7 7)' },
				];
				systems.forEach(s => dropdown.addOption(s.value, s.label));
				dropdown.setValue(this.plugin.settings.notationSystem);
				dropdown.onChange(async (value) => {
					this.plugin.settings.notationSystem = value as NotationSystem;
					await this.plugin.saveSettings();
					this.app.workspace.updateOptions();
				});
			});

		new Setting(containerEl)
			.setName('Display mode')
			.setDesc('Show one part at a time (tabs) or all parts stacked')
			.addDropdown(dropdown => {
				dropdown.addOption('single', 'Single (tab switcher)');
				dropdown.addOption('all', 'All (stacked)');
				dropdown.setValue(this.plugin.settings.displayMode);
				dropdown.onChange(async (value) => {
					this.plugin.settings.displayMode = value as DisplayMode;
					await this.plugin.saveSettings();
					this.app.workspace.updateOptions();
				});
			});

		new Setting(containerEl)
			.setName('Block language specifier')
			.setDesc('Code block language prefix (e.g. "choir" for ```choir-soprano)')
			.addText(text => {
				text.setValue(this.plugin.settings.blockLanguageSpecifier)
					.onChange(async (value) => {
						this.plugin.settings.blockLanguageSpecifier = value || 'choir';
						await this.plugin.saveSettings();
						this.app.workspace.updateOptions();
					});
			});

		containerEl.createEl('h3', { text: 'Part Colors' });

		this.addColorSetting('Soprano', 'soprano');
		this.addColorSetting('Alto', 'alto');
		this.addColorSetting('Tenor', 'tenor');
		this.addColorSetting('Chord', 'chord');

		containerEl.createEl('h3', { text: 'Display' });

		new Setting(containerEl)
			.setName('Highlight solfa notes')
			.setDesc('Apply part color to note syllables')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.highlightSolfa);
				toggle.onChange(async (value) => {
					this.plugin.settings.highlightSolfa = value;
					await this.plugin.saveSettings();
					this.app.workspace.updateOptions();
				});
			});

		new Setting(containerEl)
			.setName('Highlight section headers')
			.setDesc('Show section headers (Verse, Chorus, Bridge, etc.)')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.highlightHeaders);
				toggle.onChange(async (value) => {
					this.plugin.settings.highlightHeaders = value;
					await this.plugin.saveSettings();
					this.app.workspace.updateOptions();
				});
			});

		containerEl.createEl('h3', { text: 'Display Colors' });

		new Setting(containerEl)
			.setName('Section background')
			.setDesc('Background color of section cards')
			.addColorPicker(picker => {
				picker.setValue(this.plugin.settings.sectionBgColor);
				picker.onChange(async (value) => {
					this.plugin.settings.sectionBgColor = value;
					await this.plugin.saveSettings();
					this.app.workspace.updateOptions();
				});
			});

		new Setting(containerEl)
			.setName('Header background')
			.setDesc('Background color of header badges')
			.addColorPicker(picker => {
				picker.setValue(this.plugin.settings.headerBgColor);
				picker.onChange(async (value) => {
					this.plugin.settings.headerBgColor = value;
					await this.plugin.saveSettings();
					this.app.workspace.updateOptions();
				});
			});

		new Setting(containerEl)
			.setName('Header text')
			.setDesc('Text color of section header badges')
			.addColorPicker(picker => {
				picker.setValue(this.plugin.settings.headerTextColor);
				picker.onChange(async (value) => {
					this.plugin.settings.headerTextColor = value;
					await this.plugin.saveSettings();
					this.app.workspace.updateOptions();
				});
			});

		new Setting(containerEl)
			.setName('Active tab background')
			.setDesc('Background color of the active tab')
			.addColorPicker(picker => {
				picker.setValue(this.plugin.settings.tabActiveBgColor);
				picker.onChange(async (value) => {
					this.plugin.settings.tabActiveBgColor = value;
					await this.plugin.saveSettings();
					this.app.workspace.updateOptions();
				});
			});

		new Setting(containerEl)
			.setName('Reset display colors')
			.setDesc('Restore default section and header colors')
			.addButton(btn => {
				btn.setButtonText('Reset');
				btn.onClick(async () => {
					this.plugin.settings.sectionBgColor = DEFAULT_SETTINGS.sectionBgColor;
					this.plugin.settings.headerBgColor = DEFAULT_SETTINGS.headerBgColor;
					this.plugin.settings.headerTextColor = DEFAULT_SETTINGS.headerTextColor;
					this.plugin.settings.tabActiveBgColor = DEFAULT_SETTINGS.tabActiveBgColor;
					await this.plugin.saveSettings();
					this.app.workspace.updateOptions();
					this.display();
				});
			});

		new Setting(containerEl)
			.setName('Reset part colors')
			.setDesc('Restore default part and chord colors')
			.addButton(btn => {
				btn.setButtonText('Reset');
				btn.onClick(async () => {
					this.plugin.settings.partColors = { ...DEFAULT_PART_COLORS };
					await this.plugin.saveSettings();
					this.app.workspace.updateOptions();
					this.display();
				});
			});
	}

	private addColorSetting(name: string, part: Part) {
		new Setting(this.containerEl)
			.setName(`${name} color`)
			.setDesc(`Text color for ${name} solfa notes`)
			.addColorPicker(picker => {
				picker.setValue(this.plugin.settings.partColors[part]);
				picker.onChange(async (value) => {
					this.plugin.settings.partColors[part] = value;
					await this.plugin.saveSettings();
					this.app.workspace.updateOptions();
				});
			});
	}
}
