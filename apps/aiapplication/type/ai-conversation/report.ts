export type ChartType = "bar" | "line" | "pie";

export interface ChartDataKey {
  key: string;
  color?: string;
  name?: string;
}

export interface ChartConfig {
  type: ChartType;
  title: string;
  xAxisKey: string;
  data: Record<string, string | number>[];
  dataKeys: ChartDataKey[];
}

export interface PdfConfig {
  title: string;
  filename: string;
  period?: string;
  description?: string;
  summary?: Record<string, string | number>;
  headers: string[];
  rows: Array<Array<string | number>>;
  orientation?: "portrait" | "landscape";
}
