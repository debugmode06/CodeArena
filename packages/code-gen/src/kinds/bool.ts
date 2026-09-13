import { WireKindPlugin } from './types';

const TRUTHY = new Set(['true', '1']);

export const bool: WireKindPlugin = {
    serialize: (value) => {
        if (typeof value === 'boolean') return [value ? '1' : '0'];
        return [TRUTHY.has(String(value ?? '').trim().toLowerCase()) ? '1' : '0'];
    },
    parse: (reader) => reader.next() === '1',
    // A checkbox cannot produce anything else, and a legacy string coerces cleanly.
    validate: () => [],
    empty: () => false,
};
