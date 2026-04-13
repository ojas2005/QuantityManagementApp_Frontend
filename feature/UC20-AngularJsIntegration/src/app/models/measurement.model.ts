export interface MeasurementRecord {
  id?: number;
  operationType: string;
  firstValue: number;
  firstUnit: string;
  firstMeasurementType?: string;
  secondValue?: number;
  secondUnit?: string;
  resultValue: number;
  resultUnit?: string;
  description: string;
  timestamp?: string;
}
