import { Judge, ProblemConfig, LanguageConfig, ResolvedType } from '../types';
import { resolveType } from '../resolve';
import { indent, preambleBlock, commentBlock } from '../emit';
import * as configFile from './config.json';

const config = configFile as unknown as LanguageConfig;

export class JudgeC implements Judge {
    protected readonly config: LanguageConfig;
    protected readonly indent: string = '    ';

    constructor(languageConfig: LanguageConfig = config) {
        this.config = languageConfig;
    }

    protected typeOf(type: string): ResolvedType {
        return resolveType(this.config, type);
    }

    protected sizeParams(variable: string, typeInfo: ResolvedType) {
        return typeInfo.sizeParams.map((param) => ({
            decl: param.decl.split('{var}').join(variable),
            name: param.name.split('{var}').join(variable),
        }));
    }

    generateBoilerplate(problemConfig: ProblemConfig): string {
        const method = problemConfig.method || 'solve';
        const args: string[] = [];
        const resolved = (problemConfig.input || []).map((param) => this.typeOf(param.type));

        (problemConfig.input || []).forEach((param, index) => {
            args.push(`${resolved[index].hint} ${param.variable}`);
            for (const size of this.sizeParams(param.variable, resolved[index])) {
                args.push(size.decl);
            }
        });

        const stub = this.config.boilerplate
            .split('{method}').join(method)
            .split('{args}').join(args.join(', '));

        return commentBlock(preambleBlock(resolved), this.config.lineComment) + stub;
    }

    wrapCode(userCode: string, problemConfig: ProblemConfig): string {
        const resolved = (problemConfig.input || []).map((param) => this.typeOf(param.type));

        return this.config.template
            .split('{preamble}').join(preambleBlock(resolved))
            .split('{code}').join(userCode)
            .split('{input_reading_code}').join(this.generateInputReader(problemConfig));
    }

    generateInputReader(problemConfig: ProblemConfig): string {
        const lines: string[] = [];
        const callArgs: string[] = [];
        const inputs = problemConfig.input || [];
        const resolved = inputs.map((param) => this.typeOf(param.type));

        inputs.forEach((param, index) => {
            if (!resolved[index].selfDeclaring) {
                lines.push(indent(`${resolved[index].hint} ${param.variable};`, this.indent));
            }
        });

        lines.push('');

        inputs.forEach((param, index) => {
            lines.push(indent(resolved[index].reader.split('{var}').join(param.variable), this.indent));
            callArgs.push(param.variable, ...this.sizeParams(param.variable, resolved[index]).map((s) => s.name));
        });

        if (problemConfig.method) {
            lines.push(indent(`${problemConfig.method}(${callArgs.join(', ')});`, this.indent));
        }

        return lines.join('\n');
    }
}
