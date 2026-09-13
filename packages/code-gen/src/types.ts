export interface SizeParam {
    decl: string;
    name: string;
}

export interface TypeConfig {
    reader: string | string[];
    hint: string;
    parse?: string;
    preamble?: string | string[];
    sizeParams?: SizeParam[];
    selfDeclaring?: boolean;
}

export interface LanguageConfig {
    boilerplate: string;
    template: string;
    lineComment: string;
    types: Record<string, TypeConfig>;
    structures?: Record<string, TypeConfig>;
}

export interface ResolvedType {
    hint: string;
    reader: string;
    preamble?: string;
    preambleKey: string;
    sizeParams: SizeParam[];
    selfDeclaring: boolean;
}

export interface ProblemInput {
    variable: string;
    type: string;
}

export interface ProblemConfig {
    method?: string;
    input: ProblemInput[];
}

export interface TestCase {
    input: string;
    output: string;
}

export interface Judge {
    generateBoilerplate(config: ProblemConfig): string;
    wrapCode(userCode: string, config: ProblemConfig): string;
}
