import { TypeRecord } from '../registry';

export interface KindContext {
    variable: string;
    type: string;
    record: TypeRecord;
}

export interface TokenReader {
    // Consumes one token, or undefined when the stream is exhausted.
    next(): string | undefined;
    // Consumes one token as a count, treating anything unparseable as 0.
    count(): number;
    // Consumes up to `n` tokens.
    take(n: number): string[];
    done(): boolean;
}

export interface WireKindPlugin {
    serialize(value: unknown, ctx: KindContext): string[];
    parse(reader: TokenReader, ctx: KindContext): unknown;
    validate(value: unknown, ctx: KindContext): string[];
    empty(ctx: KindContext): unknown;
}
