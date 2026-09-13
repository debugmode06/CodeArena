import { LanguageConfig, ProblemConfig } from './types';
import { TYPE_REGISTRY, STRUCTURE_DEFS, STRUCT_NAMES, typeRecord, preambleId } from './registry';
import { rawEntry } from './resolve';
import * as cConfig from './c/config.json';
import * as cppConfig from './cpp/config.json';
import * as javaConfig from './java/config.json';
import * as pythonConfig from './python/config.json';

const LANGUAGE_CONFIGS = [cConfig, cppConfig, javaConfig, pythonConfig] as unknown as LanguageConfig[];

export const SUPPORTED_TYPES = Object.keys(TYPE_REGISTRY) as [string, ...string[]];

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const GENERATED_SUFFIX = /\{var\}_([A-Za-z0-9_]+)/g;

const KEYWORDS = new Set([
    'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double',
    'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'inline', 'int', 'long',
    'register', 'restrict', 'return', 'short', 'signed', 'sizeof', 'static', 'struct',
    'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while',
    'alignas', 'alignof', 'and', 'asm', 'bitand', 'bitor', 'bool', 'catch', 'class',
    'compl', 'concept', 'consteval', 'constexpr', 'constinit', 'const_cast', 'decltype',
    'delete', 'dynamic_cast', 'explicit', 'export', 'false', 'friend', 'mutable',
    'namespace', 'new', 'noexcept', 'not', 'nullptr', 'operator', 'or', 'private',
    'protected', 'public', 'reinterpret_cast', 'requires', 'static_assert',
    'static_cast', 'template', 'this', 'thread_local', 'throw', 'true', 'try',
    'typeid', 'typename', 'using', 'virtual', 'wchar_t', 'xor',
    'abstract', 'assert', 'boolean', 'byte', 'extends', 'final', 'finally',
    'implements', 'import', 'instanceof', 'interface', 'native', 'package', 'strictfp',
    'super', 'synchronized', 'throws', 'transient', 'var', 'record', 'sealed', 'yield',
    'and', 'as', 'async', 'await', 'def', 'del', 'elif', 'except', 'from', 'global',
    'in', 'is', 'lambda', 'None', 'nonlocal', 'not', 'or', 'pass', 'raise', 'with',
]);

const DRIVER_NAMES = new Set([
    'main', 'Main', 'Code', 'args', 'scanner', 'iterator', 'input_data', 'i', 'j',
    'std', 'sys', 'cin', 'cout', 'printf', 'scanf', 'malloc', 'System', 'Scanner',
    '_v', '_t', 'null', 'Edge',
    ...STRUCT_NAMES,
]);

// Suffixes the generated readers append to a variable name (nums_size, root_toks, …),
// discovered from the reader sources themselves so they can never drift.
function generatedSuffixes(type: string): string[] {
    const suffixes = new Set<string>();

    for (const config of LANGUAGE_CONFIGS) {
        const entry = rawEntry(config, type);
        if (!entry) continue;

        const sources = [
            entry.reader,
            entry.preamble,
            ...(entry.sizeParams || []).map((p) => `${p.decl} ${p.name}`),
        ];

        for (const source of sources) {
            if (!source) continue;
            const text = Array.isArray(source) ? source.join('\n') : source;
            for (const match of text.matchAll(GENERATED_SUFFIX)) {
                suffixes.add(match[1]);
            }
        }
    }

    return [...suffixes];
}

function checkName(name: unknown, label: string, errors: string[]): void {
    if (typeof name !== 'string' || name.trim() === '') {
        errors.push(`${label} is required`);
        return;
    }
    const trimmed = name.trim();
    if (!IDENTIFIER.test(trimmed)) {
        errors.push(`${label} "${trimmed}" is not a valid identifier (letters, digits and underscore only, cannot start with a digit)`);
        return;
    }
    if (KEYWORDS.has(trimmed)) {
        errors.push(`${label} "${trimmed}" is a reserved keyword in one of the supported languages`);
        return;
    }
    if (DRIVER_NAMES.has(trimmed)) {
        errors.push(`${label} "${trimmed}" is used by the generated test harness and would be shadowed`);
    }
}

export function validateProblemConfig(config: ProblemConfig): string[] {
    const errors: string[] = [];

    checkName(config.method, 'Function name', errors);

    const inputs = Array.isArray(config.input) ? config.input : [];
    if (inputs.length === 0) {
        errors.push('At least one input variable is required');
    }

    const seen = new Set<string>();
    const generated = new Map<string, string>();
    const structDefs = new Map<string, { id: string; type: string }>();

    for (const param of inputs) {
        const name = typeof param?.variable === 'string' ? param.variable.trim() : '';
        checkName(param?.variable, 'Variable name', errors);

        if (name) {
            if (seen.has(name)) {
                errors.push(`Variable name "${name}" is used more than once`);
            }
            seen.add(name);
        }

        let record;
        try {
            record = typeRecord(param?.type);
        } catch {
            errors.push(`Unsupported type "${param?.type}"${name ? ` for variable "${name}"` : ''}`);
            continue;
        }

        // Structures emit their preamble under a fixed struct name, so two types that
        // define the same name with different fields would declare it twice.
        if (record.structure) {
            const { structName } = STRUCTURE_DEFS[record.structure];
            const id = preambleId(param.type);
            const previous = structDefs.get(structName);
            if (previous && previous.id !== id) {
                errors.push(`"${param.type}" and "${previous.type}" both define ${structName} with different fields and cannot be used in the same question`);
            }
            structDefs.set(structName, { id, type: param.type });
        }

        if (name) {
            for (const suffix of generatedSuffixes(param.type)) {
                generated.set(`${name}_${suffix}`, name);
            }
        }
    }

    for (const name of seen) {
        const owner = generated.get(name);
        if (owner && owner !== name) {
            errors.push(`Variable name "${name}" collides with a parameter generated for "${owner}"`);
        }
    }

    if (config.method && generated.has(config.method.trim())) {
        errors.push(`Function name "${config.method.trim()}" collides with a generated parameter`);
    }

    return errors;
}
