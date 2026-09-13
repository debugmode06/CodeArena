import { Judge, ProblemConfig, LanguageConfig, ResolvedType } from '../types';
import { resolveType } from '../resolve';
import { indent, preambleBlock, commentBlock } from '../emit';
import * as configFile from './config.json';

const config = configFile as unknown as LanguageConfig;

export class JudgePython implements Judge {
    private readonly indent = '        ';

    private typeOf(type: string): ResolvedType {
        return resolveType(config, type);
    }

    generateBoilerplate(problemConfig: ProblemConfig): string {
        const method = problemConfig.method || 'solve';
        const resolved = (problemConfig.input || []).map((param) => this.typeOf(param.type));
        const args = (problemConfig.input || []).map(
            (param, index) => `${param.variable}: ${resolved[index].hint}`
        );

        const stub = config.boilerplate
            .split('{method}').join(method)
            .split('{args}').join(args.join(', '));

        return commentBlock(preambleBlock(resolved), config.lineComment) + stub;
    }

    wrapCode(userCode: string, problemConfig: ProblemConfig): string {
        const resolved = (problemConfig.input || []).map((param) => this.typeOf(param.type));

        return config.template
            .split('{preamble}').join(preambleBlock(resolved))
            .split('{code}').join(userCode)
            .split('{input_reading_code}').join(this.generateInputReader(problemConfig));
    }

    generateInputReader(problemConfig: ProblemConfig): string {
        const lines: string[] = [];
        const variables: string[] = [];

        for (const param of problemConfig.input || []) {
            const typeInfo = this.typeOf(param.type);
            const reader = typeInfo.reader.split('{var}').join(param.variable);
            lines.push(indent(
                typeInfo.selfDeclaring ? reader : `${param.variable} = ${reader}`,
                this.indent
            ));
            variables.push(param.variable);
        }

        const method = problemConfig.method || 'solve';
        lines.push(indent(`${method}(${variables.join(', ')})`, this.indent));

        return lines.join('\n');
    }
}
