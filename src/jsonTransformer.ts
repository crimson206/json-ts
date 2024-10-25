export type KeyExtractStrategy = 'enumerable' | 'all-string' | 'symbols' | 'all';

export class JSONTransformer {
    private keysToExclude: string[];
    private functionsToProcess: string[];
    private targets: string[];
    private keyExtractStrategy: KeyExtractStrategy;

    constructor(
        keysToExclude: string[] = ["__proto__"], 
        functionsToProcess: string[]= [], 
        targets: string[]= ['object'],
        keyExtractStrategy: KeyExtractStrategy = 'enumerable',
    ) {
        this.keysToExclude = keysToExclude;
        this.functionsToProcess = functionsToProcess;
        this.targets = targets;
        this.keyExtractStrategy = keyExtractStrategy;
    }

    processFunction(value: any, funcName: string) {
        if (typeof value[funcName] === 'function') {
            try {
                const result = value[funcName]();
                return result;
            } catch (error) {
                return `Error in ${funcName}: ${error}`;
            }
        }
        return undefined;
    }

    private getKeys(value: any): (string | symbol)[] {
        switch (this.keyExtractStrategy) {
            case 'enumerable':
                return Object.keys(value);
            case 'all-string':
                return Object.getOwnPropertyNames(value);
            case 'symbols':
                return Object.getOwnPropertySymbols(value);
            case 'all':
                return Reflect.ownKeys(value);
            default:
                return Object.keys(value);
        }
    }

    edit = (key: string, value: any): any => {
        if (this.keysToExclude.includes(key)) {
            return undefined;
        }

        if (this.targets.includes(typeof value) && value !== null) {
            const newValue: any = {};
            const className = value.constructor.name;

            this.getKeys(value).forEach(k => {
                if (typeof value[k] !== 'function') {
                    newValue[k] = value[k];
                }
            });

            this.functionsToProcess.forEach(func => {
                const result = this.processFunction(value, func);
                if (result !== undefined) {
                    if (!newValue[className]) {
                        newValue[className] = {};
                    }
                    newValue[className][func] = result;
                }
            });

            return newValue;
        }

        return value;
    }
}

export function transform(obj: any, transformer?: JSONTransformer): any {
    if (transformer) {
        return JSON.parse(JSON.stringify(obj, transformer.edit));
    } else {
        return JSON.parse(JSON.stringify(obj));
    }
}

export function print(obj: any, transformer?: JSONTransformer) {
    if (transformer) {
        console.log(JSON.stringify(obj, transformer.edit, 2));
    } else {
        console.log(JSON.stringify(obj, null, 2));
    }
}
