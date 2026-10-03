import * as monaco from 'monaco-editor';

export const GLSL_LANGUAGE_ID = "glsl";

let registered = false;

/**
 * Syntax highlighting for shader files (.frag, .vert, .glsl). Monaco ships no
 * GLSL, and the tokens reuse the names our editor themes already colour.
 */
export function registerGlslLanguage(): void {
    if (registered) return;
    registered = true;

    monaco.languages.register({
        id: GLSL_LANGUAGE_ID,
        extensions: ['.frag', '.vert', '.glsl'],
    });

    monaco.languages.setLanguageConfiguration(GLSL_LANGUAGE_ID, {
        comments: {
            lineComment: '//',
            blockComment: ['/*', '*/'],
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
        ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '/*', close: ' */', notIn: ['comment'] },
        ],
        surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
        ],
        indentationRules: {
            decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
            increaseIndentPattern: /^.*\{[^}"']*$/
        },
    });

    monaco.languages.setMonarchTokensProvider(GLSL_LANGUAGE_ID, {
        defaultToken: '',
        tokenPostfix: '.glsl',
        keywords: [
            'attribute', 'const', 'uniform', 'varying', 'buffer', 'shared',
            'in', 'out', 'inout', 'centroid', 'flat', 'smooth', 'noperspective',
            'layout', 'invariant', 'precise', 'precision', 'highp', 'mediump', 'lowp',
            'struct', 'true', 'false', 'coherent', 'volatile', 'restrict', 'readonly', 'writeonly'
        ],
        statements: [
            'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
            'break', 'continue', 'return', 'discard'
        ],
        types: [
            'void', 'bool', 'int', 'uint', 'float', 'double',
            'vec2', 'vec3', 'vec4', 'bvec2', 'bvec3', 'bvec4',
            'ivec2', 'ivec3', 'ivec4', 'uvec2', 'uvec3', 'uvec4',
            'dvec2', 'dvec3', 'dvec4',
            'mat2', 'mat3', 'mat4', 'mat2x2', 'mat2x3', 'mat2x4',
            'mat3x2', 'mat3x3', 'mat3x4', 'mat4x2', 'mat4x3', 'mat4x4',
            'sampler1D', 'sampler2D', 'sampler3D', 'samplerCube',
            'sampler2DShadow', 'samplerCubeShadow', 'sampler2DArray', 'sampler2DArrayShadow',
            'isampler2D', 'isampler3D', 'isamplerCube', 'usampler2D', 'usampler3D', 'usamplerCube'
        ],
        operators: [
            '=', '>', '<', '!', '~', '?', ':',
            '==', '<=', '>=', '!=', '&&', '||', '^^', '++', '--',
            '+', '-', '*', '/', '&', '|', '^', '%', '<<', '>>',
            '+=', '-=', '*=', '/=', '&=', '|=', '^=', '%=', '<<=', '>>='
        ],
        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        tokenizer: {
            root: [
                // preprocessor lines: #version, #define, #ifdef GL_ES, ...
                [/^\s*#\s*\w+/, 'keyword'],

                // built-in variables: gl_FragColor, gl_Position, ...
                [/gl_\w+/, 'class'],

                [/[a-zA-Z_]\w*(?=\s*\()/, {
                    cases: {
                        '@types': 'type',
                        '@statements': 'statement',
                        '@keywords': 'keyword',
                        '@default': 'method'
                    }
                }],
                [/[a-zA-Z_]\w*/, {
                    cases: {
                        '@types': 'type',
                        '@statements': 'statement',
                        '@keywords': 'keyword',
                        '@default': 'identifier'
                    }
                }],

                { include: '@whitespace' },

                [/[{}()\[\]]/, '@brackets'],
                [/@symbols/, {
                    cases: {
                        '@operators': 'delimiter',
                        '@default': ''
                    }
                }],

                [/\d*\.\d+([eE][\-+]?\d+)?[fF]?/, 'number.float'],
                [/\d+\.\d*([eE][\-+]?\d+)?[fF]?/, 'number.float'],
                [/\d+[eE][\-+]?\d+[fF]?/, 'number.float'],
                [/0[xX][0-9a-fA-F]+[uU]?/, 'number.hex'],
                [/\d+[uU]?/, 'number'],

                [/[;,.]/, 'delimiter'],
            ],
            whitespace: [
                [/[ \t\r\n]+/, ''],
                [/\/\*/, 'comment', '@comment'],
                [/\/\/.*$/, 'comment'],
            ],
            comment: [
                [/[^\/*]+/, 'comment'],
                [/\*\//, 'comment', '@pop'],
                [/[\/*]/, 'comment'],
            ],
        },
    });
}
