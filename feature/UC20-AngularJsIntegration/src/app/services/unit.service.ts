import { Injectable, signal } from '@angular/core';

export type MeasurementType = 'Length' | 'Weight' | 'Temperature' | 'Volume';
export type OperationType = 'convert' | 'add' | 'subtract' | 'multiply' | 'divide' | 'compare';

interface UnitTypeConfig {
  base?: string;
  units: string[];
  conversionMap?: Record<string, number>;
  special?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UnitService {
  readonly unitDB: Record<MeasurementType, UnitTypeConfig> = {
    Length: {
      base: 'm',
      units: ['mm', 'cm', 'm', 'km', 'inch', 'foot', 'yard', 'mile'],
      conversionMap: { mm: 0.001, cm: 0.01, m: 1, km: 1000, inch: 0.0254, foot: 0.3048, yard: 0.9144, mile: 1609.344 }
    },
    Weight: {
      base: 'kg',
      units: ['mg', 'g', 'kg', 'ton', 'oz', 'lb'],
      conversionMap: { mg: 1e-6, g: 0.001, kg: 1, ton: 1000, oz: 0.0283495, lb: 0.453592 }
    },
    Temperature: {
      special: true,
      units: ['C', 'F', 'K']
    },
    Volume: {
      base: 'm³',
      units: ['ml', 'l', 'm3', 'tsp', 'tbsp', 'cup', 'pint', 'quart', 'gallon'],
      conversionMap: { ml: 1e-6, l: 0.001, m3: 1, tsp: 4.92892e-6, tbsp: 1.47868e-5, cup: 0.000236588, pint: 0.000473176, quart: 0.000946353, gallon: 0.00378541 }
    }
  };

  currentType = signal<MeasurementType>('Length');

  getUnits(type: MeasurementType): string[] {
    return this.unitDB[type].units;
  }

  toBase(val: number, unit: string, type: MeasurementType): number {
    if (type === 'Temperature') {
      if (unit === 'C') return val;
      if (unit === 'F') return (val - 32) * 5 / 9;
      if (unit === 'K') return val - 273.15;
      return val;
    }
    const map = this.unitDB[type].conversionMap!;
    return val * map[unit];
  }

  fromBase(baseVal: number, unit: string, type: MeasurementType): number {
    if (type === 'Temperature') {
      if (unit === 'C') return baseVal;
      if (unit === 'F') return baseVal * 9 / 5 + 32;
      if (unit === 'K') return baseVal + 273.15;
      return baseVal;
    }
    const map = this.unitDB[type].conversionMap!;
    return baseVal / map[unit];
  }

  convert(val: number, from: string, to: string, type: MeasurementType): number {
    const base = this.toBase(val, from, type);
    return this.fromBase(base, to, type);
  }

  add(v1: number, u1: string, v2: number, u2: string, resultUnit: string, type: MeasurementType): number {
    return this.fromBase(this.toBase(v1, u1, type) + this.toBase(v2, u2, type), resultUnit, type);
  }

  subtract(v1: number, u1: string, v2: number, u2: string, resultUnit: string, type: MeasurementType): number {
    return this.fromBase(this.toBase(v1, u1, type) - this.toBase(v2, u2, type), resultUnit, type);
  }

  multiply(v1: number, u1: string, v2: number, u2: string, resultUnit: string, type: MeasurementType): number {
    return this.fromBase(this.toBase(v1, u1, type) * this.toBase(v2, u2, type), resultUnit, type);
  }

  divide(v1: number, u1: string, v2: number, u2: string, type: MeasurementType): number {
    const den = this.toBase(v2, u2, type);
    if (Math.abs(den) < 1e-12) throw new Error('Division by zero');
    return this.toBase(v1, u1, type) / den;
  }

  compare(v1: number, u1: string, v2: number, u2: string, type: MeasurementType): boolean {
    return Math.abs(this.toBase(v1, u1, type) - this.toBase(v2, u2, type)) < 1e-9;
  }

  formatResult(val: number): string {
    return val.toFixed(6).replace(/\.?0+$/, '');
  }
}
