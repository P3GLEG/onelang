import {LangFileSchema} from "./LangFileSchema";
import {deindent} from "../Utils/Helpers";

export interface LangConfig {
    name?: string;
    yamlFile: string;
    stdlibFn: string;
    request: {
        lang?: string;
        code: string;
        stdlibCode?: string;
        className?: string;
        methodName?: string;
    };
    schema?: LangFileSchema.LangFile;
}

export type LangConfigs = { [name: string]: LangConfig };

export const langConfigs: LangConfigs = {
    cpp: {
        stdlibFn: "one.hpp",
        yamlFile: "cpp.yaml",
        request: {
            lang: "CPP",
            code: deindent(`
                #include <iostream>
                    
                class TestClass {
                    public:
                    void testMethod() {
                        std::cout << "Hello World!\\n";
                    }
                };
                
                int main()
                {
                    TestClass c;
                    c.testMethod();
                    return 0;
                }`)
        }
    },
    csharp: {
        stdlibFn: "one.cs",
        yamlFile: "csharp.yaml",
        request: {
            lang: "CSharp",
            code: deindent(`
                using System;
                
                public class TestClass
                {
                    public void TestMethod()
                    {
                        Console.WriteLine("Hello World!");
                    }
                }
                
                public class HelloWorld
                {
                    static public void Main()
                    {
                        new TestClass().TestMethod();
                    }
                }`)
        }
    },
    go: {
        stdlibFn: "one.go",
        yamlFile: "go.yaml",
        request: {
            lang: "Go",
            code: deindent(`
                package main
                
                import "fmt"
                
                type testClass struct {
                }
                
                func (this *testClass) testMethod() {
                    fmt.Println("Hello World!")
                }
                
                func main() {
                    c := (testClass{})
                    c.testMethod()
                }`)
        }
    },
    java: {
        stdlibFn: "one.java",
        yamlFile: "java.yaml",
        request: {
            lang: "Java",
            code: deindent(`
                public class TestClass {
                    public String testMethod() {
                        return "Hello World!";
                    }
                }`),
            className: 'Program',
            methodName: 'main'
        }
    },
    javascript: {
        stdlibFn: "one.js",
        yamlFile: "javascript.yaml",
        request: {
            lang: "JavaScript",
            code: deindent(`
                class TestClass {
                    testMethod() {
                        return "Hello World!";
                    }
                }
                
                new TestClass().testMethod()`),
            className: 'TestClass',
            methodName: 'testMethod'
        },
    },
    perl: {
        stdlibFn: "one.pl",
        yamlFile: "perl.yaml",
        request: {
            lang: "Perl",
            code: deindent(`
                use strict;
                use warnings;
                
                package TestClass;
                sub new
                {
                    my $class = shift;
                    my $self = {};
                    bless $self, $class;
                    return $self;
                }
                
                sub testMethod {
                    print "Hello World!\\n";
                }
                
                package Program;
                my $c = new TestClass();
                $c->testMethod()`)
        }
    },
    php: {
        stdlibFn: "one.php",
        yamlFile: "php.yaml",
        request: {
            lang: "PHP",
            code: deindent(`
                <?php
                
                class TestClass {
                    function testMethod() {
                        return "Hello World!";
                    }
                }`),
            className: 'TestClass',
            methodName: 'testMethod'
        }
    },
    python: {
        stdlibFn: "one.py",
        yamlFile: "python.yaml",
        request: {
            lang: "Python",
            className: 'TestClass',
            methodName: 'test_method',
            code: deindent(`
                class TestClass:
                    def test_method(self):
                        return  "Hello World!"`)
        }
    },
    ruby: {
        stdlibFn: "one.rb",
        yamlFile: "ruby.yaml",
        request: {
            lang: "Ruby",
            className: 'TestClass',
            methodName: 'test_method',
            code: deindent(`
                class TestClass
                    def test_method
                        return "Hello World!"
                    end
                end`)
        }
    },
    swift: {
        stdlibFn: "one.swift",
        yamlFile: "swift.yaml",
        request: {
            lang: "Swift",
            code: deindent(`
                class TestClass {
                    func testMethod() {
                        print("Hello World!")
                    }
                }
                
                TestClass().testMethod()`)
        }
    },
    typescript: {
        stdlibFn: "one.ts",
        yamlFile: "typescript.yaml",
        request: {
            lang: "TypeScript",
            className: 'TestClass',
            methodName: 'testMethod',
            code: deindent(`
                class TestClass {
                    testMethod() {
                        return "Hello World!";
                    }
                }
                
                new TestClass().testMethod()`),
        },
    },
};

export interface CompileResult {
    result?: string;
    elapsedMs?: number;
    exceptionText?: string;
}

for (const langName of Object.keys(langConfigs))
    langConfigs[langName].name = langName;