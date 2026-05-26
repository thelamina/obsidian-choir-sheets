import { MarkdownRenderChild } from 'obsidian';
import { ChoirSheetsSettings } from '../choirSettings';
import { Part, getPartColor, partLabel } from '../solfaUtils';
import { tokenizeLine, groupIntoSections } from '../sheet-parsing/tokenizeLine';
import { Token, SolfaToken, HeaderToken } from '../sheet-parsing/tokens';

export interface BlockData {
	part: string;
	source: string;
}

export class ChoirBlockGroupRenderer extends MarkdownRenderChild {
	private tabContents!: HTMLElement;
	private allContents!: HTMLElement;
	private tabBar!: HTMLElement;

	constructor(
		container: HTMLElement,
		private preElements: HTMLElement[],
		private blocks: BlockData[],
		private settings: ChoirSheetsSettings,
	) {
		super(container);
	}

	onload() {
		this.render();
	}

	private render() {
		const parent = this.containerEl.parentElement;
		if (!parent) return;

		const wrapper = parent.createDiv({ cls: 'choir-block-wrapper' });
		this.applyColors(wrapper);
		parent.insertBefore(wrapper, this.containerEl);

		for (const pre of this.preElements) {
			pre.remove();
		}

		this.tabBar = wrapper.createDiv({ cls: 'choir-tab-bar' });
		this.tabContents = wrapper.createDiv({ cls: 'choir-tab-contents' });
		this.allContents = wrapper.createDiv({ cls: 'choir-all-contents' });

		this.renderTabMode();
		this.renderAllMode(this.blocks);

		this.tabContents.style.display = 'none';
	}

	private applyColors(wrapper: HTMLElement): void {
		wrapper.style.setProperty('--choir-section-bg', this.settings.sectionBgColor);
		wrapper.style.setProperty('--choir-header-bg', this.settings.headerBgColor);
		wrapper.style.setProperty('--choir-header-text', this.settings.headerTextColor);
		wrapper.style.setProperty('--choir-tab-active-bg', this.settings.tabActiveBgColor);
	}

	private renderAllMode(blocks: BlockData[], activeParts?: Set<string>): void {
		this.allContents.empty();

		type PartSec = { part: string; color: string; sections: ReturnType<typeof groupIntoSections> };
		const partSections: PartSec[] = blocks.map(block => ({
			part: block.part,
			color: getPartColor(block.part as Part, this.settings.partColors),
			sections: groupIntoSections(block.source.split('\n')),
		}));

		const chordPs = partSections.find(ps => ps.part === 'chord');
		const chordColor = chordPs?.color || getPartColor('chord', this.settings.partColors);

		const maxSections = Math.max(...partSections.map(ps => ps.sections.length));

		for (let si = 0; si < maxSections; si++) {
			const card = document.createElement('div');
			card.className = 'choir-section-card';

			const sec = partSections.find(ps => ps.sections[si]);
			if (!sec) continue;
			const section = sec.sections[si];

			if (section.header && this.settings.highlightHeaders) {
				const headerEl = document.createElement('div');
				headerEl.className = 'choir-section-header';
				headerEl.textContent = section.header;
				card.appendChild(headerEl);
			}

			const content = document.createElement('div');
			content.className = 'choir-section-content';

			const chordLines = chordPs?.sections[si]?.chordLines || [];

			const maxLines = Math.max(
				...partSections.map(ps => {
					const s = ps.sections[si];
					return s ? Math.max(s.solfatextLines.length, s.lyricLines.length) : 0;
				}),
				chordLines.length,
			);

			for (let li = 0; li < maxLines; li++) {
				const chordText = chordLines[li] || '';
				if (chordText) {
					const chordRow = document.createElement('div');
					chordRow.className = 'choir-row choir-chord-row';
					for (const token of tokenizeLine(chordText).tokens) {
						chordRow.appendChild(this.renderChordToken(token, chordColor));
					}
					content.appendChild(chordRow);
				}

				const lyricText = (() => {
					for (const ps of partSections) {
						const t = ps.sections[si]?.lyricLines[li];
						if (t) return t;
					}
					return '';
				})();
				if (lyricText) {
					const lyricRow = document.createElement('div');
					lyricRow.className = 'choir-row choir-lyric-row';
					for (const token of tokenizeLine(lyricText).tokens) {
						lyricRow.appendChild(this.renderLyricToken(token));
					}
					content.appendChild(lyricRow);
				}

				for (const ps of partSections) {
					if (activeParts && !activeParts.has(ps.part)) continue;
					const solfaText = ps.sections[si]?.solfatextLines[li] || '';
					if (solfaText) {
						const solfaRow = document.createElement('div');
						solfaRow.className = 'choir-row choir-solfa-row';

						for (const token of tokenizeLine(solfaText).tokens) {
							solfaRow.appendChild(this.renderSolfaToken(token, ps.color));
						}
						content.appendChild(solfaRow);
					}
				}
			}

			card.appendChild(content);
			this.allContents.appendChild(card);
		}
	}

	private renderTabMode(): void {
		this.blocks.forEach((block) => {
			const part = block.part as Part;
			const color = getPartColor(part, this.settings.partColors);

			const tabBtn = this.tabBar.createEl('button', {
				cls: 'choir-tab active',
			});
			tabBtn.dataset.part = block.part;
			tabBtn.textContent = partLabel(part);
			tabBtn.style.color = color;

			const content = this.renderBlock(block, false);
			content.dataset.part = block.part;
			this.tabContents.appendChild(content);

			tabBtn.addEventListener('click', () => {
				tabBtn.classList.toggle('active');
				const activeTabs = this.tabBar.querySelectorAll('.choir-tab.active');

				if (activeTabs.length === 0) {
					this.tabContents.style.display = 'none';
					this.allContents.style.display = '';
					this.renderAllMode(this.blocks, new Set());
				} else if (activeTabs.length === 1) {
					this.tabContents.style.display = '';
					this.allContents.style.display = 'none';
					const activeTab = activeTabs[0] as HTMLElement;
					this.tabContents.querySelectorAll('.choir-block').forEach(c => c.classList.add('hidden'));
					const activeBlock = this.tabContents.querySelector(`.choir-block[data-part="${activeTab.dataset.part}"]`);
					if (activeBlock) activeBlock.classList.remove('hidden');
				} else {
					this.tabContents.style.display = 'none';
					this.allContents.style.display = '';

					const activeParts = new Set<string>();
					activeTabs.forEach(t => activeParts.add((t as HTMLElement).dataset.part!));
					this.renderAllMode(this.blocks, activeParts);
				}
			});
		});
	}

	private renderBlock(block: BlockData, visible: boolean): HTMLElement {
		const el = document.createElement('div');
		el.className = 'choir-block' + (visible ? '' : ' hidden');
		el.dataset.part = block.part;

		const lines = block.source.split('\n');
		const sections = groupIntoSections(lines);
		const part = block.part as Part;
		const color = getPartColor(part, this.settings.partColors);

		for (const section of sections) {
			const card = document.createElement('div');
			card.className = 'choir-section-card';

			if (section.header && this.settings.highlightHeaders) {
				const headerEl = document.createElement('div');
				headerEl.className = 'choir-section-header';
				headerEl.textContent = section.header;
				card.appendChild(headerEl);
			}

			const content = document.createElement('div');
			content.className = 'choir-section-content';

			const maxLines = Math.max(section.solfatextLines.length, section.lyricLines.length, section.chordLines.length);
			for (let i = 0; i < maxLines; i++) {
				const chordText = section.chordLines[i] || '';
				if (chordText) {
					const chordRow = document.createElement('div');
					chordRow.className = 'choir-row choir-chord-row';
					for (const token of tokenizeLine(chordText).tokens) {
						chordRow.appendChild(this.renderChordToken(token, color));
					}
					content.appendChild(chordRow);
				}

				const lyricText = section.lyricLines[i] || '';
				if (lyricText) {
					const lyricRow = document.createElement('div');
					lyricRow.className = 'choir-row choir-lyric-row';
					for (const token of tokenizeLine(lyricText).tokens) {
						lyricRow.appendChild(this.renderLyricToken(token));
					}
					content.appendChild(lyricRow);
				}

				const solfaText = section.solfatextLines[i] || '';
				if (solfaText) {
					const solfaRow = document.createElement('div');
					solfaRow.className = 'choir-row choir-solfa-row';
					for (const token of tokenizeLine(solfaText).tokens) {
						solfaRow.appendChild(this.renderSolfaToken(token, color));
					}
					content.appendChild(solfaRow);
				}
			}

			card.appendChild(content);
			el.appendChild(card);
		}

		return el;
	}

	private renderChordToken(token: Token, color: string): Node {
		if (token.type === 'whitespace') {
			return document.createTextNode(token.value);
		}
		if (token.type === 'chord') {
			const span = document.createElement('span');
			span.className = 'choir-chord';
			span.style.color = color;
			span.textContent = token.value;
			return span;
		}
		return document.createTextNode(token.value);
	}

	private renderSolfaToken(token: Token, color: string): Node {
		if (token.type === 'whitespace') {
			return document.createTextNode(token.value);
		}
		if (token.type === 'rhythm') {
			const span = document.createElement('span');
			span.className = 'choir-rhythm';
			span.textContent = token.value;
			return span;
		}
		if (token.type === 'header') {
			const headerToken = token as HeaderToken;
			const span = document.createElement('span');
			span.className = 'choir-section-header';
			span.textContent = headerToken.headerName;
			return span;
		}
		if (token.type === 'solfa') {
			const solfaToken = token as SolfaToken;
			const span = document.createElement('span');
			span.className = 'choir-solfa';
			span.style.color = color;
			span.textContent = solfaToken.value;
			return span;
		}
		if (token.type === 'rest') {
			const span = document.createElement('span');
			span.className = 'choir-rest';
			span.textContent = token.value;
			return span;
		}
		return document.createTextNode(token.value);
	}

	private renderLyricToken(token: Token): Node {
		if (token.type === 'whitespace') {
			return document.createTextNode(token.value);
		}
		if (token.type === 'word') {
			const span = document.createElement('span');
			span.className = 'choir-word';
			span.textContent = token.value;
			return span;
		}
		if (token.type === 'rhythm') {
			const span = document.createElement('span');
			span.className = 'choir-rhythm';
			span.textContent = token.value;
			return span;
		}
		return document.createTextNode(token.value);
	}
}
