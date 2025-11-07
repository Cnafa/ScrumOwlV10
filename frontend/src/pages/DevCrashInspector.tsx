import React from "react";
import { getLastCrash, clearLastCrash } from "../libs/logging/crashLogger";

export default function DevCrashInspector() {
  const [report, setReport] = React.useState(getLastCrash());
  const refresh = () => setReport(getLastCrash());

  if (!report) return (
    <div className="p-4 font-sans bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800">No crash captured</h2>
        <p className="my-2 text-gray-600">No crash has been logged in this session yet. If an error occurs, it will be displayed here.</p>
        <button className="border px-3 py-1 rounded bg-white hover:bg-gray-100 shadow-sm" onClick={refresh}>Refresh</button>
      </div>
    </div>
  );

  const { message, name, at, stack, culprit, context } = report;
  return (
    <div className="p-4 space-y-4 font-sans bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex justify-between items-center pb-2 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Last Crash Report</h2>
          <div className="text-sm text-gray-500">{new Date(at).toLocaleString()}</div>
        </div>
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
          <div className="font-mono text-red-900 font-semibold text-lg">{name}: {message}</div>
          {culprit.frame && (
            <div className="mt-2 font-mono text-sm text-red-700 bg-red-100 p-2 rounded inline-block">
              <strong>Culprit:</strong> {culprit.frame.functionName || "(anonymous)"} at <br/> {culprit.frame.fileName}:{culprit.frame.lineNumber}:{culprit.frame.columnNumber}
            </div>
          )}
        </div>

        <details open className="bg-white p-3 border rounded-lg shadow-sm">
          <summary className="font-semibold cursor-pointer text-gray-700">Stack Trace</summary>
          <pre className="mt-2 overflow-auto text-xs bg-gray-50 p-3 border rounded text-gray-800">{stack.map(f => `${f.raw || `${f.functionName || "(fn)"} @ ${f.fileName}:${f.lineNumber}:${f.columnNumber}`}`).join("\n")}</pre>
        </details>

        <details className="bg-white p-3 border rounded-lg shadow-sm">
          <summary className="font-semibold cursor-pointer text-gray-700">Context</summary>
          <pre className="mt-2 overflow-auto text-xs bg-gray-50 p-3 border rounded text-gray-800">{JSON.stringify(context, null, 2)}</pre>
        </details>

        <div className="flex gap-3 pt-4 border-t">
          <button className="border px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 shadow-sm text-sm font-medium" onClick={() => { navigator.clipboard.writeText(JSON.stringify(report, null, 2)); alert('Copied to clipboard!'); }}>Copy JSON</button>
          <button className="border px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 shadow-sm text-sm font-medium" onClick={() => { if(confirm('Are you sure you want to clear this report?')) { clearLastCrash(); refresh(); } }}>Clear Report</button>
        </div>
      </div>
    </div>
  );
}
