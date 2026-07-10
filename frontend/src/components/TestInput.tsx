"use client";

interface TestInputProps {
  stdin: string;
  onStdinChange: (value: string) => void;
  functionName: string;
  onFunctionNameChange: (value: string) => void;
  functionArgs: string;
  onFunctionArgsChange: (value: string) => void;
}

export default function TestInput({
  stdin,
  onStdinChange,
  functionName,
  onFunctionNameChange,
  functionArgs,
  onFunctionArgsChange,
}: TestInputProps) {
  return (
    <div className="flex flex-col gap-3 p-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-400">
          Standard Input
        </label>
        <textarea
          value={stdin}
          onChange={(e) => onStdinChange(e.target.value)}
          placeholder="Program input (stdin)..."
          rows={2}
          className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Function Name (optional)
          </label>
          <input
            type="text"
            value={functionName}
            onChange={(e) => onFunctionNameChange(e.target.value)}
            placeholder="e.g. two_sum"
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Function Args (JSON)
          </label>
          <input
            type="text"
            value={functionArgs}
            onChange={(e) => onFunctionArgsChange(e.target.value)}
            placeholder='e.g. [[2,7,11,15], 9]'
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
