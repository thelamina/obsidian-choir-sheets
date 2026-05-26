export interface BlockData {
	part: string;
	source: string;
}

const PART_MAP: Record<string, string> = {
	'S': 'soprano',
	'A': 'alto',
	'T': 'tenor',
	'C': 'chord',
};

const PART_PREFIX = /^\[([SATC])\]\s*(.*)/;

export function isMultiPartSource(source: string): boolean {
	const lines = source.split('\n');
	for (const line of lines) {
		if (PART_PREFIX.test(line.trim())) return true;
	}
	return false;
}

export function expandMultiPartSource(source: string): BlockData[] {
	const parts: { key: string; lines: string[] }[] = [
		{ key: 'soprano', lines: [] },
		{ key: 'alto', lines: [] },
		{ key: 'tenor', lines: [] },
		{ key: 'chord', lines: [] },
	];

	const lines = source.split('\n');
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];
		const trimmed = line.trim();

		if (!trimmed) {
			i++;
			continue;
		}

		if (trimmed.startsWith('[') && trimmed.endsWith(']') && !PART_PREFIX.test(trimmed)) {
			for (const p of parts) p.lines.push(line);
			i++;
			continue;
		}

		const partMatch = trimmed.match(PART_PREFIX);
		if (partMatch) {
			const partKey = PART_MAP[partMatch[1]];
			const content = partMatch[2];
			for (const p of parts) {
				if (p.key === partKey && content) {
					p.lines.push(content);
				}
			}
			i++;
			continue;
		}

		for (const p of parts) p.lines.push(line);
		i++;

		const partLines: { key: string; content: string }[] = [];
		while (i < lines.length) {
			const nextLine = lines[i];
			const nextTrimmed = nextLine.trim();
			if (!nextTrimmed) { i++; continue; }

			const m = nextTrimmed.match(PART_PREFIX);
			if (m) {
				if (m[2]) partLines.push({ key: PART_MAP[m[1]], content: m[2] });
				i++;
			} else if (nextTrimmed.startsWith('[') && nextTrimmed.endsWith(']')) {
				break;
			} else {
				break;
			}
		}

		if (partLines.length > 0) {
			for (const pl of partLines) {
				for (const p of parts) {
					if (p.key === pl.key) {
						p.lines.push(pl.content);
					}
				}
			}
		}
	}

	return parts
		.map(p => ({
			part: p.key,
			source: p.lines.join('\n'),
		}))
		.filter(b => b.source.trim().length > 0);
}
