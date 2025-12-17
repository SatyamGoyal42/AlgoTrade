import React, { useMemo, useState } from "react";
import { fundamentalsAPI } from "../services/api";

const INDENT_CLASSES = ["", "pl-4", "pl-8", "pl-12", "pl-16"];

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const formatLabel = (label) =>
  label
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const collectShareholdingDates = (shareholding) => {
  const dateSet = new Set();
  Object.values(shareholding).forEach((entries) => {
    if (!Array.isArray(entries)) {
      return;
    }
    entries.forEach((entry) => {
      if (entry?.date) {
        dateSet.add(entry.date);
      }
    });
  });
  return Array.from(dateSet).sort();
};

const renderShareholdingCell = (value) => {
  if (value === null || value === undefined) {
    return <span className="text-gray-500">—</span>;
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return <span className="font-mono">{numeric.toFixed(2)}%</span>;
  }

  return <span className="font-mono break-words">{String(value)}</span>;
};

const renderShareholdingTable = (shareholding) => {
  if (
    !shareholding ||
    typeof shareholding !== "object" ||
    Object.keys(shareholding).length === 0
  ) {
    return <span className="text-gray-500">No shareholding records</span>;
  }

  const dates = collectShareholdingDates(shareholding);

  if (dates.length === 0) {
    return <span className="text-gray-500">No shareholding records</span>;
  }

  return (
    <div className="overflow-x-auto border-2 border-black" style={{ boxShadow: "2px 2px 0px #000" }}>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100 text-gray-600 uppercase">
            <th className="px-3 py-2 font-semibold text-center border-b border-r border-black/20">
              Category
            </th>
            {dates.map((date) => (
              <th
                key={date}
                className="px-3 py-2 font-semibold text-center border-b border-black/20"
              >
                {date}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(shareholding).map(([category, entries]) => {
            const valuesByDate = new Map();
            if (Array.isArray(entries)) {
              entries.forEach((entry) => {
                if (entry?.date) {
                  valuesByDate.set(entry.date, entry.percentage);
                }
              });
            }

            return (
              <tr key={category} className="border-t border-black/20">
                <th className="px-3 py-2 font-semibold text-gray-700 text-left border-r border-black/20 bg-gray-50">
                  {category}
                </th>
                {dates.map((date) => (
                  <td
                    key={date}
                    className="px-3 py-2 text-center text-gray-900 border-l border-black/10"
                  >
                    {renderShareholdingCell(valuesByDate.get(date))}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const renderPrimitiveValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-gray-500">—</span>;
  }

  if (typeof value === "number") {
    return <span className="font-mono">{Number(value).toLocaleString()}</span>;
  }

  if (typeof value === "boolean") {
    return <span className="font-mono">{value ? "Yes" : "No"}</span>;
  }

  return <span className="font-mono break-words">{String(value)}</span>;
};

const splitEntries = (obj) => {
  const primitives = [];
  const nested = [];

  Object.entries(obj).forEach(([key, value]) => {
    if (isPlainObject(value) || Array.isArray(value)) {
      nested.push([key, value]);
    } else {
      primitives.push([key, value]);
    }
  });

  return { primitives, nested };
};

const renderNode = (value, level = 0) => {
  const indentClass = INDENT_CLASSES[Math.min(level, INDENT_CLASSES.length - 1)];

  if (!isPlainObject(value) && !Array.isArray(value)) {
    return renderPrimitiveValue(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-500">No records</span>;
    }

    return (
      <div className={`space-y-3 ${indentClass}`}>
        {value.map((item, index) => (
          <div
            key={index}
            className="border border-gray-300 rounded-lg bg-white shadow-sm"
          >
            <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-500 border-b border-gray-200">
              Item {index + 1}
            </div>
            <div className="px-4 py-3">{renderNode(item, level + 1)}</div>
          </div>
        ))}
      </div>
    );
  }

  const { primitives, nested } = splitEntries(value);

  return (
    <div className={`space-y-4 ${indentClass}`}>
      {primitives.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border-2 border-black" style={{ boxShadow: "2px 2px 0px #000" }}>
            <tbody>
              {primitives.map(([key, primitiveValue]) => (
                <tr key={key} className="border-b border-black/20 last:border-b-0">
                  <th className="bg-gray-100 px-3 py-2 font-semibold text-gray-600 uppercase w-48 border-r border-black/20">
                    {formatLabel(key)}
                  </th>
                  <td className="px-3 py-2 text-gray-900">
                    {renderPrimitiveValue(primitiveValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {nested.map(([key, nestedValue]) => (
        <div key={key} className="border-2 border-black bg-white" style={{ boxShadow: "2px 2px 0px #000" }}>
          <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-500 border-b border-black/20 bg-gray-100">
            {formatLabel(key)}
          </div>
          <div className="px-4 py-3">{renderNode(nestedValue, level + 1)}</div>
        </div>
      ))}
    </div>
  );
};

const Fundamentals = () => {
  const [symbol, setSymbol] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const latestData = useMemo(() => result?.data ?? null, [result]);
  const shareholdingData = latestData?.shareholding ?? null;
  const summaryData = latestData?.summary ?? null;
  const summaryDescription = summaryData?.companyDescription ?? null;
  const summaryTableData = useMemo(() => {
    if (!summaryData) {
      return null;
    }
    const { companyDescription, ...rest } = summaryData;
    return rest;
  }, [summaryData]);
  const otherData = useMemo(() => {
    if (!latestData) {
      return null;
    }
    const { shareholding, summary, ...rest } = latestData;
    return rest;
  }, [latestData]);
  const hasOtherData = otherData && Object.keys(otherData).length > 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!symbol.trim()) {
      setError("Please enter a stock name or symbol.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fundamentalsAPI.getBySymbol(symbol.trim());
      setResult(response.data);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.message ||
        "Unable to fetch fundamentals right now.";
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 p-8 text-black">
      <h1 className="text-3xl font-bold mb-6">Fundamentals</h1>

      <div
        className="bg-white border-2 border-black p-6 mb-8"
        style={{ boxShadow: "2px 2px 0px #000" }}
      >
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor="symbol" className="block text-sm font-semibold mb-2">
              Stock name / symbol
            </label>
            <input
              id="symbol"
              type="text"
              value={symbol}
              onChange={(event) => setSymbol(event.target.value)}
              placeholder="e.g. Tata Steel"
              className="w-full px-3 py-2 border-2 border-black bg-gray-100 focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-600">
              We forward the value to the fundamentals API exactly as entered.
            </p>
          </div>

          <div className="flex items-center md:items-end">
            <button
              type="submit"
              className="btn-xp w-full md:w-auto px-6 py-3 text-sm font-semibold tracking-wide uppercase border-2 border-black"
              disabled={loading}
            >
              {loading ? "Fetching..." : "Fetch fundamentals"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 border border-red-400 bg-red-100 text-red-700 px-4 py-3">
            {error}
          </div>
        )}
      </div>

      {latestData && (
        <div className="space-y-6">
          <div
            className="bg-white border-2 border-black p-6"
            style={{ boxShadow: "2px 2px 0px #000" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                Snapshot {result?.symbol ? `for ${result.symbol}` : ""}
              </h2>
              <button
                className="text-sm text-blue-600 hover:text-blue-700 underline"
                onClick={() => setResult(null)}
              >
                Clear results
              </button>
            </div>

            {summaryDescription && (
              <div
                className="mb-6 border-2 border-black bg-white"
                style={{ boxShadow: "2px 2px 0px #000" }}
              >
                <div className="px-3 py-2 text-lg font-semibold uppercase text-gray-700 border-b border-black/20 bg-gray-100">
                  Company Description
                </div>
                <div className="px-4 py-3 text-gray-900 leading-relaxed whitespace-pre-line">
                  {summaryDescription}
                </div>
              </div>
            )}
            {summaryTableData && Object.keys(summaryTableData).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Summary
                </h3>
                <div
                  className="border-2 border-black"
                  style={{ boxShadow: "2px 2px 0px #000" }}
                >
                  <table className="min-w-full text-sm">
                    <tbody>
                      {Object.entries(summaryTableData).map(([key, value]) => (
                        <tr
                          key={key}
                          className="border-b border-black/20 last:border-b-0"
                        >
                          <th className="bg-gray-100 px-3 py-2 font-semibold uppercase text-gray-700 border-r border-black/20 text-left w-56">
                            {formatLabel(key)}
                          </th>
                          <td className="px-3 py-2 text-gray-900">
                            {renderPrimitiveValue(value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {hasOtherData && renderNode(otherData)}
            {shareholdingData && (
              <div className="mt-6 space-y-3">
                <h3 className="text-lg font-semibold text-gray-700">Shareholding</h3>
                {renderShareholdingTable(shareholdingData)}
              </div>
            )}
          </div>
        </div>
      )}

      {!latestData && !loading && !error && (
        <div className="text-gray-600">
          Enter a stock name above to view its fundamentals.
        </div>
      )}
    </div>
  );
};

export default Fundamentals;

