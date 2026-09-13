import { LanguageConfig } from '../types';
import { JudgeC } from '../c/JudgeC';
import * as configFile from './config.json';

export class JudgeCpp extends JudgeC {
    constructor() {
        super(configFile as LanguageConfig);
    }
}
