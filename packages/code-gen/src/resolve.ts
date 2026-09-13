import { LanguageConfig, ResolvedType, TypeConfig } from './types';
import { TYPE_REGISTRY, typeRecord, preambleId } from './registry';

const ELEMENT_LOCAL = '_v';
const TOKEN_LOCAL = '_t';

const lines = (value: string | string[] | undefined): string | undefined =>
    value === undefined ? undefined : Array.isArray(value) ? value.join('\n') : value;

const substitute = (source: string, from: string, to: string): string => source.split(from).join(to);

export function resolveType(config: LanguageConfig, type: string): ResolvedType {
    const record = typeRecord(type);

    if (!record.structure) {
        const raw = config.types[type];
        if (!raw) throw new Error(`Unsupported type "${type}"`);
        return {
            hint: raw.hint,
            reader: lines(raw.reader) as string,
            preamble: lines(raw.preamble),
            preambleKey: preambleId(type),
            sizeParams: raw.sizeParams || [],
            selfDeclaring: raw.selfDeclaring === true,
        };
    }

    const raw = config.structures?.[record.structure];
    if (!raw) throw new Error(`Unsupported type "${type}"`);

    let reader = lines(raw.reader) as string;
    let preamble = lines(raw.preamble);
    let hint = raw.hint;

    if (record.element) {
        const element = config.types[record.element];
        if (!element) throw new Error(`Unsupported element type "${record.element}" for "${type}"`);

        const elementReader = lines(element.reader) as string;
        const replacements: [string, string][] = [
            ['{elem_hint}', element.hint],
            ['{elem_reader}', elementReader],
            ['{elem_read}', substitute(elementReader, '{var}', ELEMENT_LOCAL)],
            ['{elem_parse}', substitute(element.parse || TOKEN_LOCAL, '{tok}', TOKEN_LOCAL)],
        ];

        for (const [from, to] of replacements) {
            reader = substitute(reader, from, to);
            hint = substitute(hint, from, to);
            if (preamble) preamble = substitute(preamble, from, to);
        }
    }

    return {
        hint,
        reader,
        preamble,
        preambleKey: preambleId(type),
        sizeParams: raw.sizeParams || [],
        selfDeclaring: raw.selfDeclaring !== false,
    };
}

export function rawEntry(config: LanguageConfig, type: string): TypeConfig | undefined {
    const structure = TYPE_REGISTRY[type]?.structure;
    return structure ? config.structures?.[structure] : config.types[type];
}
