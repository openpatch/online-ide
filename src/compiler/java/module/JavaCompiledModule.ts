import { BaseSymbol } from "../../common/BaseSymbolTable.ts";
import { Error } from "../../common/Error";
import { UsagePosition } from "../../common/UsagePosition.ts";
import { CodeFragment } from "../../common/disassembler/CodeFragment.ts";
import { Step } from "../../common/interpreter/Step.ts";
import { Klass } from "../../common/interpreter/StepFunction.ts";
import { Thread } from "../../common/interpreter/Thread.ts";
import { CompilerFile } from "../../common/module/CompilerFile";
import { Module } from "../../common/module/Module.ts";
import { Position } from "../../common/range/Position.ts";
import { IRange } from "../../common/range/Range.ts";
import { JavaCompilerStringConstants } from "../JavaCompilerStringConstants.ts";
import { TokenType } from "../TokenType.ts";
import { JavaSymbolTable } from "../codegenerator/JavaSymbolTable.ts";
import { JavaCompiledModuleMessages } from "../language/JavaCompiledModuleMessages.ts";
import { LexerOutput } from "../lexer/Lexer.ts";
import { TokenList } from "../lexer/Token";
import { Quickfix } from "../monacoproviders/quickfix/Quickfix.ts";
import { ASTBlockNode, ASTClassDefinitionNode, ASTGlobalNode } from "../parser/AST";
import { JavaArrayType } from "../types/JavaArrayType.ts";
import { JavaClass } from "../types/JavaClass.ts";
import { JavaMethod } from "../types/JavaMethod.ts";
import { JavaType } from "../types/JavaType";
import { NonPrimitiveType } from "../types/NonPrimitiveType";
import { StaticNonPrimitiveType } from "../types/StaticNonPrimitiveType.ts";
import { JavaBaseModule } from "./JavaBaseModule";
import { JavaModuleManager } from "./JavaModuleManager";
import { TypePosition } from "./TypePosition.ts";
import * as monaco from 'monaco-editor'


export type JavaMethodCallPosition = {
    identifierRange: monaco.IRange,
    possibleMethods: JavaMethod[] | string, // string for print, println, ...
    commaPositions: monaco.IPosition[],
    rightBracketPosition: monaco.IPosition,
    bestMethod?: JavaMethod
}

/**
 * A JavaModule represents a compiled Java Sourcecode File.
 */
export class JavaCompiledModule extends JavaBaseModule {

    tokens?: TokenList;

    ast?: ASTGlobalNode;
    mainClass?: ASTClassDefinitionNode;

    errors: Error[] = [];

    symbolTables: JavaSymbolTable[] = [];  // contains one symbol table for main program and one for each class/interface/enum in global scope

    typePositions: { [line: number]: TypePosition[] } = {};

    methodCallPositions: { [line: number]: JavaMethodCallPosition[] } = {};

    methodDeclarationRanges: IRange[] = [];

    inlayHints: monaco.languages.InlayHint[] = [];

    hasDependencyInjectionAnnotations: boolean = false;

    constructor(file: CompilerFile, public moduleManager?: JavaModuleManager) {
        super(file, false);
    }


    getCodeFragments(): CodeFragment[] {
        let fragments: CodeFragment[] = [];
        let mainClassType = this.mainClass?.resolvedType;
        if (mainClassType && this.types.indexOf(mainClassType) < 0) {
            this.getCodeFragmentsForType(mainClassType, fragments);
        }

        for (let type of this.types) {
            if (type instanceof NonPrimitiveType) this.getCodeFragmentsForType(type, fragments);
        }

        return fragments;
    }

    private getCodeFragmentsForType(type: NonPrimitiveType, fragments: CodeFragment[]) {

        if (type.staticInitializer && type.staticInitializer.stepsSingle.length > 0) {
            fragments.push({
                type: type,
                signature: JavaCompiledModuleMessages.staticInitializerComment(),
                program: type.staticInitializer,
                methodDeclarationRange: type.identifierRange
            })
        }

        // instance initializers are included in constructors, so we omit them here.

        for (let method of type.getOwnMethods()) {
            if (method.program) fragments.push({
                type: type,
                signature: method.getSignature(),
                program: method.program,
                methodDeclarationRange: method.identifierRange
            })
        }

    }

    isReplModule(): boolean {
        return false;
    }

    storeLexerOutput(lexerOutput: LexerOutput) {
        this.tokens = lexerOutput.tokens;
        this.errors = lexerOutput.errors;
        this.colorInformation = lexerOutput.colorInformation;
    }


    addTypePosition(position: Position, type: JavaType) {


        if (type instanceof NonPrimitiveType || type instanceof StaticNonPrimitiveType || type instanceof JavaArrayType) {
            let list = this.typePositions[position.lineNumber];
            if (list == null) {
                list = [];
                this.typePositions[position.lineNumber] = list;
            }
            list.push({
                type: type,
                position: position
            })
        }
    }

    getTypeAtPosition(line: number, column: number): NonPrimitiveType | StaticNonPrimitiveType | JavaArrayType | undefined {

        return this.typePositions[line]?.find(tp => tp.position.column == column)?.type;

    }

    findSteps(line: number): Step[] {

        let types = this.types;
        if (this.mainClass) {
            types = this.types.slice();
            types.push(this.mainClass.resolvedType!);
        }

        for (let type of types) {

            if (type instanceof NonPrimitiveType) {

                if (type.staticInitializer) {
                    let step = type.staticInitializer.findStep(line);
                    if (step) return [step];
                }

                // An instance initializer may have been copied to several constructors, so if
                // breakpoint in instance initializer is set there may be several steps to
                // consider setting a breakpoint in.
                let steps: Step[] = [];
                for (let method of type.getOwnMethods()) {
                    if (method.program) {
                        let step = method.program.findStep(line);
                        if (step) steps.push(step);
                    }
                }

                return steps;
            }

        }

        return [];

    }

    clearAllBreakpoints() {
        for (let program of this.programsToCompileToFunctions) {
            for (let step of program.stepsSingle) {
                step.clearBreakpoint(step.range?.startLineNumber!);
            }
        }

    }

    resetBeforeCompilation() {
        this.tokens = undefined;
        this.ast = undefined;
        this.types = [];
        this.errors = [];
        this.compiledSymbolsUsageTracker.clear();
        this.systemSymbolsUsageTracker.clear();
        this.typePositions = {};
        this.methodCallPositions = {};
        this.symbolTables = [];
        this.methodDeclarationRanges = [];
        this.quickfixes = [];
        this.inlayHints = [];
    }

    hasMainProgram(): boolean {
        return this.getStartableMainMethod() != null;

    }

    getClassWithStartableMainMethod(): JavaClass | undefined {
        return this.getStartableMainMethod()?.klass;
    }

    /**
     * Determines what to execute when the user starts this module:
     *  - the compiler-generated $main method holding all statements written outside of any class or
     *  - a main method declared outside of any class (Java 25 compact source file: "void main(){...}") or
     *  - a main method declared inside one of the classes of this module
     */
    getStartableMainMethod(): { klass: JavaClass, method: JavaMethod } | undefined {
        let mainClassType = this.mainClass?.resolvedType;
        if (mainClassType) {
            let syntheticMainMethodNode = this.mainClass!.methods.find(m => m.identifier == JavaCompilerStringConstants.mainMethodIdentifier);

            // first statement is always TokenType.firstMainProgramStatement, so we need more than one statement:
            let hasStatementsOutsideOfClasses = syntheticMainMethodNode != null &&
                (syntheticMainMethodNode.statement as ASTBlockNode).statements.length > 1;

            let method = hasStatementsOutsideOfClasses ? mainClassType.getSyntheticMainMethod() : mainClassType.getDeclaredMainMethod();
            if (method) return { klass: mainClassType, method: method };
        }

        if (!this.ast) return undefined;

        for (let innerType of this.ast.innerTypes) {
            if (innerType.kind != TokenType.keywordClass || innerType.isMainClass || !innerType.resolvedType) continue;
            let method = innerType.resolvedType.getDeclaredMainMethod();
            if (method) return { klass: innerType.resolvedType, method: method };
        }

        return undefined;
    }

    startMainProgram(thread: Thread, setOneTimeBreakpointAtFirstVisibleLine: boolean): boolean {
        let startableMainMethod = this.getStartableMainMethod();
        if (!startableMainMethod) return false;

        let mainRuntimeClass: Klass = startableMainMethod.klass.runtimeClass;
        if (!mainRuntimeClass) return false;

        let mainMethod = startableMainMethod.method;
        let internalMethodName = mainMethod.getInternalNameWithGenericParameterIdentifiers("java");

        let setBreakpointIfNecessary = () => {
            if (!setOneTimeBreakpointAtFirstVisibleLine) return;
            let programState = thread.programStack[thread.programStack.length - 1];
            if (programState) {
                let firstVisibleStep = programState.currentStepList.find(s => s.range.startLineNumber >= 0);
                if (firstVisibleStep) {
                    firstVisibleStep.setBreakpoint(firstVisibleStep.range.startLineNumber, true);
                }
            }
        }

        if (mainMethod.isStatic) {
            let methodStub = mainRuntimeClass[internalMethodName];
            if (!methodStub) return false;

            // calling convention of static methods: (thread, ...parameters)
            if (mainMethod.parameters.length > 0) {
                methodStub.call(mainRuntimeClass, thread, []);   // main(String[] args) gets an empty array of arguments
            } else {
                methodStub.call(mainRuntimeClass, thread);
            }

            setBreakpointIfNecessary();
            return true;
        }

        // Java 25 (JEP 512) allows a non-static main method. In this case the class gets
        // instantiated with its parameterless constructor before main is called.
        if (!mainRuntimeClass.prototype[internalMethodName]) return false;

        let constructor = startableMainMethod.klass.methods.find(m => m.isConstructor && m.parameters.length == 0 && !m.hasOuterClassParameter);
        if (!constructor) return false;

        let mainObject = new mainRuntimeClass();

        let callMainMethod = () => {
            // calling convention of non-static methods: (thread, callback, ...parameters)
            if (mainMethod.parameters.length > 0) {
                mainObject[internalMethodName](thread, undefined, []);   // main(String[] args) gets an empty array of arguments
            } else {
                mainObject[internalMethodName](thread, undefined);
            }
            setBreakpointIfNecessary();
        }

        if (constructor.hasImplementationWithNativeCallingConvention) {
            mainObject[constructor.getInternalName("native")]();
            callMainMethod();
        } else {
            mainObject[constructor.getInternalName("java")](thread, () => {
                thread.s.pop();     // constructors return the newly created object
                callMainMethod();
            });
        }

        return true;

    }

    dependsOnOtherDirtyModule(): boolean {
        return this.compiledSymbolsUsageTracker.existsDependencyToOtherDirtyModule();
    }

    dependsOnModuleWithErrors(): boolean {
        return this.compiledSymbolsUsageTracker.existsDependencyToOtherModuleWithErrors();
    }

    dependsOnModule(module: Module): boolean {
        return this.compiledSymbolsUsageTracker.existsDependencyToModule(module);
    }

    findSymbolTableAtPosition(position: Position): JavaSymbolTable | undefined {
        let tableWithSmallestNumberOfLines: JavaSymbolTable | undefined;
        let smallestNumberOfLines: number = Number.MAX_SAFE_INTEGER;
        for (let table of this.symbolTables) {
            let t1: JavaSymbolTable | undefined = table.findSymbolTableAtPosition(position) as JavaSymbolTable;
            if (t1) {
                let lineCount = t1.range.endLineNumber - t1.range.startLineNumber + 1;
                if (lineCount < smallestNumberOfLines) {
                    smallestNumberOfLines = lineCount;
                    tableWithSmallestNumberOfLines = t1;
                }
            }
        }

        return tableWithSmallestNumberOfLines;
    }

    getUsagePositionsForSymbol(symbol: BaseSymbol): UsagePosition[] | undefined {
        return this.compiledSymbolsUsageTracker.getUsagePositionsForSymbol(symbol) || this.systemSymbolsUsageTracker.getUsagePositionsForSymbol(symbol);
    }

    pushMethodCallPosition(identifierRange: monaco.IRange, commaPositions: monaco.IPosition[],
        possibleMethods: JavaMethod[] | string, rightBracketPosition: monaco.IPosition,
        bestMethod?: JavaMethod) {

        let lines: number[] = [];
        lines.push(identifierRange.startLineNumber);
        for (let cp of commaPositions) {
            if (lines.indexOf(cp.lineNumber) < 0) {
                lines.push(cp.lineNumber);
            }
        }

        let mcp: JavaMethodCallPosition = {
            identifierRange: identifierRange,
            commaPositions: commaPositions,
            possibleMethods: possibleMethods,
            rightBracketPosition: rightBracketPosition,
            bestMethod: bestMethod
        };

        for (let line of lines) {
            let mcpList = this.methodCallPositions[line];
            if (mcpList == null) {
                this.methodCallPositions[line] = [];
                mcpList = this.methodCallPositions[line];
            }
            mcpList.push(mcp);
        }

    }

    addInlayHint(kind: monaco.languages.InlayHintKind, positionOrRange: monaco.IPosition | monaco.IRange, label: string,
        paddingLeft: boolean, paddingRight: boolean, tooltip: string
    ) {
        let position1: monaco.IPosition = <any>positionOrRange;
        if (positionOrRange["startLineNumber"]) {
            position1 = {
                lineNumber: (<monaco.IRange>positionOrRange).startLineNumber,
                column: (<monaco.IRange>positionOrRange).startColumn
            }
        }

        this.inlayHints.push({
            kind: kind,
            position: position1,
            label: label,
            paddingLeft: paddingLeft,
            paddingRight: paddingRight,
            tooltip: {
                value: "```myJava\n" + tooltip + "\n```"
            }
        })


    }

}
