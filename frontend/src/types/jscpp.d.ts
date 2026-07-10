declare module "JSCPP" {
  interface JSCPPVariable {
    name: string;
    type: string;
    value: string;
  }

  interface JSCPPNode {
    sLine: number;
    eLine: number;
    type: string | null;
  }

  interface JSCPPDebugger {
    done: boolean;
    next(): boolean | number;
    nextNode(): JSCPPNode;
    variable(name?: string): JSCPPVariable | JSCPPVariable[];
  }

  interface JSCPPConfig {
    stdio?: {
      write?: (text: string) => void;
      drain?: () => string;
    };
    debug?: boolean;
    maxTimeout?: number;
    unsigned_overflow?: "error" | "warn" | "ignore";
  }

  interface JSCPPModule {
    default: {
      run: (
        code: string,
        input: string,
        config?: JSCPPConfig
      ) => number | JSCPPDebugger;
    };
  }

  const JSCPP: JSCPPModule["default"];
  export default JSCPP;
}
