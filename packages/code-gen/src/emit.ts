import { ResolvedType } from './types';

export function indent(source: string, pad: string): string {
    return source.split('\n').map((line) => (line === '' ? line : pad + line)).join('\n');
}

// One preamble per structure, in first-use order — two ListNode parameters must not
// define the struct twice.
export function preambleBlock(resolved: ResolvedType[]): string {
    const seen = new Set<string>();
    const blocks: string[] = [];

    for (const type of resolved) {
        if (!type.preamble || seen.has(type.preambleKey)) continue;
        seen.add(type.preambleKey);
        blocks.push(type.preamble);
    }

    return blocks.join('\n\n');
}

// The stub shows the struct definition so the candidate knows its fields, but as a
// comment — live code there would redefine what the driver's preamble already declares.
export function commentBlock(block: string, lineComment: string): string {
    if (!block) return '';
    return block
        .split('\n')
        // A preamble may already carry its own doc comment; don't double-prefix it.
        .map((line) => (line.trimStart().startsWith(lineComment) ? line : `${lineComment} ${line}`).trimEnd())
        .join('\n') + '\n\n';
}
