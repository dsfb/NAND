import fs, { WriteStream } from "fs";
import nReadlines from "n-readlines";
import NANDException from "../core/exceptions";

export enum TokenType {
    KEYWORD,
    SYMBOL,
    IDENTIFIER,
    INT_CONST,
    STRING_CONST,
}

const SymbolTokens = [
    '{',
    '}',
    '(',
    ')',
    '[',
    ']',
    '.',
    ',',
    ';',
    '+',
    '-',
    '*',
    '/',
    '&',
    '|',
    '<',
    '>',
    '=',
    '~',
];

const Keywords = [
    'class',
    'method',
    'function',
    'constructor',
    'int',
    'boolean',
    'char',
    'void',
    'var',
    'static',
    'field',
    'let',
    'do',
    'if',
    'else',
    'while',
    'return',
    'true',
    'false',
    'null',
    'this',
]

const Digits = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
]

export default class Tokenizer {
    private inputStream: nReadlines;
    private outputStream: WriteStream;
    private currentLine: string = '';
    private currentLineNumber: number = 0;
    private currentLineIndex: number = 0;
    private currentToken: string | null = null;
    private currentTokenType: TokenType | null = null;
    private inComment: boolean = false;

    constructor(file: string) {
        this.inputStream = new nReadlines(file);
        this.outputStream = fs.createWriteStream(file.substring(0, file.length - 5) + 'T_.xml');
        this.outputStream.write('<tokens>');
    }

    public write(out: string): void {
        this.outputStream.write('\n' + out);
    }

    public writeXML(tag: string, data: string): void {
        switch (data) {
            case '<':
                data = '&lt;';
                break;
            case '>':
                data = '&gt;';
                break;
            case '"':
                data = '&quot;';
                break;
            case '&':
                data = '&amp;';
                break;
        }
        this.write(`<${tag}>${data}</${tag}>`);
    }

    static isLetter(char: string): boolean {
        return /[a-z]/i.test(char);
    }

    static isNumber(char: string): boolean {
        return Digits.includes(char);
    }

    public advance(): boolean {
        let line: Buffer | boolean;
        if (this.currentLine.length === this.currentLineIndex) {
            line = this.inputStream.next();
            this.currentLineNumber++;
            if (!line) {
                this.write("</tokens>");
                return false;
            }
            this.currentLineIndex = 0;
            this.currentLine = line.toString('ascii');
            let startComment: number = this.currentLine.indexOf("/*");
            let endComment: number = this.currentLine.indexOf("*/");
            if (endComment !== -1) {
                endComment += 2;
            }
            if (startComment === -1) {
                if (endComment === -1) {
                    if (this.inComment) {
                        this.currentLineIndex = this.currentLine.length;
                        return this.advance();
                    }
                } else {
                    if (!this.inComment) {
                        throw new NANDException("Invalid end comment");
                    }
                    this.currentLine = this.currentLine.substring(endComment);
                }
            } else {
                if (endComment === -1) {
                    this.currentLine = this.currentLine.substring(0, startComment);;
                    this.inComment = true;
                } else {
                    this.currentLine = this.currentLine.substring(0, startComment) + this.currentLine.substring(endComment);
                }
            }
            const comment: number = this.currentLine.indexOf("//");
            if (comment !== -1)
                this.currentLine = this.currentLine.substring(0, comment);
            this.currentLine = this.currentLine.trim().replace(/ {2,}/, ' ');
            if (!this.currentLine)
                return this.advance();
        }
        let start: number = this.currentLineIndex;
        let firstIteration: boolean = true;
        this.currentToken = null;
        findToken: do {
            const char: string = this.currentLine[this.currentLineIndex];
            if (char === undefined) {
                break;
            }
            if (SymbolTokens.includes(char)) {
                this.currentToken = char;
                this.currentTokenType = TokenType.SYMBOL;
                this.currentLineIndex++;
                break;
            }
            if (firstIteration) {
                if (char === ' ') {
                    start++;
                    continue;
                }
                firstIteration = false;
                if (char === '"') {
                    this.currentTokenType = TokenType.STRING_CONST;
                } else if (Tokenizer.isLetter(char)) {
                    this.currentTokenType = TokenType.IDENTIFIER;
                } else if (Tokenizer.isNumber(char)) {
                    this.currentTokenType = TokenType.INT_CONST;
                } else {
                    throw new NANDException("Unrecognized token: " + this.currentLine.substring(start, this.currentLineIndex))
                }
                continue;
            }
            switch (this.currentTokenType) {
                case TokenType.STRING_CONST:
                    if (char === '"') {
                        this.currentToken = this.currentLine.substring(start + 1, this.currentLineIndex - 1);
                        break findToken;
                    }
                    break;
                case TokenType.IDENTIFIER:
                    if (!(Tokenizer.isLetter(char) || Tokenizer.isNumber(char) || char === '_')) {
                        this.currentToken = this.currentLine.substring(start, this.currentLineIndex);
                        if (Keywords.includes(this.currentToken)) {
                            this.currentTokenType = TokenType.KEYWORD;
                        }
                        break findToken;
                    }
                    break;
                case TokenType.INT_CONST:
                    if (!Tokenizer.isNumber(char)) {
                        this.currentToken = this.currentLine.substring(start, this.currentLineIndex);
                        break findToken;
                    }
                    break;
                default:
                    throw new NANDException(`Invalid token type ${this.currentTokenType} for: ${this.currentLine.substring(start, this.currentLineIndex)}`);
            }
        } while (++this.currentLineIndex < this.currentLine.length);
        if (this.currentToken === null) {
            return this.advance();
        }
        return true;
    }

    public tokenType(): TokenType {
        if (this.currentTokenType === null)
            throw new NANDException("Null token has no type at line: " + this.currentLine);
        return this.currentTokenType;
    }

    public token(): string {
        if (this.currentToken === null)
            throw new NANDException("Token does not exist at line: " + this.currentLine);
        return this.currentToken;
    }
}