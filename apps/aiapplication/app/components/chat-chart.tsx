"use client";

import React from "react";
import { ChartConfig } from "@/type/ai-conversation/report";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChatChartProps {
  config: ChartConfig;
}

const COLORS = ["#2563eb", "#059669", "#f59e0b", "#dc2626", "#7c3aed"];

function ChatChart({ config }: ChatChartProps) {
  const { type, title, data, xAxisKey, dataKeys } = config;

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {dataKeys.map((item, i) => (
              <Bar key={item.key} dataKey={item.key} name={item.name || item.key} fill={item.color || COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );
      case "line":
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {dataKeys.map((item, i) => (
              <Line key={item.key} type="monotone" dataKey={item.key} name={item.name || item.key} stroke={item.color || COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
            ))}
          </LineChart>
        );
      case "pie":
        return (
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey={dataKeys[0]?.key || "value"} nameKey={xAxisKey}>
              {data.map((_, i) => (
                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
      default:
        return <div className="text-sm text-red-600">Unsupported chart type.</div>;
    }
  };

  return (
    <div className="w-full my-2 rounded-lg border border-blue-200 bg-white p-3">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-900">{title}</h4>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ChatChart;
