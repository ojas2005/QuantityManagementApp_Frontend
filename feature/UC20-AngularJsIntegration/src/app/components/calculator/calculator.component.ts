import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { UnitService, MeasurementType, OperationType } from '../../services/unit.service';
import { MeasurementService } from '../../services/measurement.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss']
})
export class CalculatorComponent implements OnInit {

  // ─── Signals for local state ───────────────────────────────────────────────
  currentType = signal<MeasurementType>('Length');
  currentOp   = signal<OperationType>('convert');
  refOpen     = signal(false);

  // ─── Computed units list based on currentType ──────────────────────────────
  units = computed(() => this.unitService.getUnits(this.currentType()));

  // ─── Static config arrays ──────────────────────────────────────────────────
  readonly measurementTypes: { key: MeasurementType; label: string }[] = [
    { key: 'Length',      label: 'Length' },
    { key: 'Weight',      label: 'Weight' },
    { key: 'Temperature', label: 'Temp'   },
    { key: 'Volume',      label: 'Volume' }
  ];

  readonly operations: { key: OperationType; label: string; icon: string }[] = [
    { key: 'convert',   label: 'Convert',   icon: '⇄'  },
    { key: 'add',       label: 'Add',       icon: '+'  },
    { key: 'subtract',  label: 'Subtract',  icon: '−'  },
    { key: 'multiply',  label: 'Multiply',  icon: '×'  },
    { key: 'divide',    label: 'Divide',    icon: '÷'  },
    { key: 'compare',   label: 'Compare',   icon: '='  }
  ];

  // ─── Reactive Forms (one per operation panel) ──────────────────────────────
  convertForm!:  FormGroup;
  addForm!:      FormGroup;
  subtractForm!: FormGroup;
  multiplyForm!: FormGroup;
  divideForm!:   FormGroup;
  compareForm!:  FormGroup;

  // ─── Result strings (displayed in result blocks) ───────────────────────────
  convertResult  = '—';
  addResult      = '—';
  subtractResult = '—';
  multiplyResult = '—';
  divideResult   = '—';
  compareResult  = '—';

  constructor(
    private fb: FormBuilder,
    public  unitService:       UnitService,
    private measurementService: MeasurementService,
    public  authService:       AuthService,
    private toastService:      ToastService
  ) {}

  ngOnInit(): void {
    this.buildForms();
    this.subscribeToFormChanges();
  }

  // ─── Form Construction ─────────────────────────────────────────────────────
  private buildForms(): void {
    const u = this.units();
    const u0 = u[0], u1 = u[1] ?? u[0];

    this.convertForm = this.fb.group({
      value:         [''],
      from:          [u0],
      to:            [u1],
      saveToHistory: [false]
    });

    this.addForm = this.fb.group({
      valueA: [''], unitA: [u0],
      valueB: [''], unitB: [u0],
      resultUnit: [u0], saveToHistory: [false]
    });

    this.subtractForm = this.fb.group({
      valueA: [''], unitA: [u0],
      valueB: [''], unitB: [u0],
      resultUnit: [u0], saveToHistory: [false]
    });

    this.multiplyForm = this.fb.group({
      valueA: [''], unitA: [u0],
      valueB: [''], unitB: [u0],
      resultUnit: [u0], saveToHistory: [false]
    });

    this.divideForm = this.fb.group({
      valueA: [''], unitA: [u0],
      valueB: [''], unitB: [u0],
      saveToHistory: [false]
    });

    this.compareForm = this.fb.group({
      valueA: [''], unitA: [u0],
      valueB: [''], unitB: [u0],
      saveToHistory: [false]
    });
  }

  /** Subscribe to each form's valueChanges for live computation */
  private subscribeToFormChanges(): void {
    this.convertForm.valueChanges.subscribe(()  => this.computeConvert());
    this.addForm.valueChanges.subscribe(()       => this.computeAdd());
    this.subtractForm.valueChanges.subscribe(()  => this.computeSubtract());
    this.multiplyForm.valueChanges.subscribe(()  => this.computeMultiply());
    this.divideForm.valueChanges.subscribe(()    => this.computeDivide());
    this.compareForm.valueChanges.subscribe(()   => this.computeCompare());
  }

  // ─── Type & Operation switching ────────────────────────────────────────────
  setType(type: MeasurementType): void {
    this.currentType.set(type);
    const u = this.unitService.getUnits(type);
    const u0 = u[0], u1 = u[1] ?? u[0];
    this.convertForm.patchValue(  { from: u0, to: u1 },                    { emitEvent: false });
    this.addForm.patchValue(      { unitA: u0, unitB: u0, resultUnit: u0 }, { emitEvent: false });
    this.subtractForm.patchValue( { unitA: u0, unitB: u0, resultUnit: u0 }, { emitEvent: false });
    this.multiplyForm.patchValue( { unitA: u0, unitB: u0, resultUnit: u0 }, { emitEvent: false });
    this.divideForm.patchValue(   { unitA: u0, unitB: u0 },                 { emitEvent: false });
    this.compareForm.patchValue(  { unitA: u0, unitB: u0 },                 { emitEvent: false });
    this.recomputeAll();
  }

  setOp(op: OperationType): void {
    this.currentOp.set(op);
  }

  toggleRef(): void {
    this.refOpen.update(v => !v);
  }

  // ─── Live Computation ──────────────────────────────────────────────────────
  private recomputeAll(): void {
    this.computeConvert(); this.computeAdd();  this.computeSubtract();
    this.computeMultiply(); this.computeDivide(); this.computeCompare();
  }

  computeConvert(): void {
    const { value, from, to } = this.convertForm.value;
    const v = parseFloat(value);
    if (isNaN(v)) { this.convertResult = '—'; return; }
    try {
      const res = this.unitService.convert(v, from, to, this.currentType());
      this.convertResult = `${this.unitService.formatResult(res)} ${to}`;
    } catch { this.convertResult = 'error'; }
  }

  computeAdd(): void {
    const { valueA, unitA, valueB, unitB, resultUnit } = this.addForm.value;
    const a = parseFloat(valueA), b = parseFloat(valueB);
    if (isNaN(a) || isNaN(b)) { this.addResult = '—'; return; }
    try {
      const res = this.unitService.add(a, unitA, b, unitB, resultUnit, this.currentType());
      this.addResult = `${this.unitService.formatResult(res)} ${resultUnit}`;
    } catch { this.addResult = 'error'; }
  }

  computeSubtract(): void {
    const { valueA, unitA, valueB, unitB, resultUnit } = this.subtractForm.value;
    const a = parseFloat(valueA), b = parseFloat(valueB);
    if (isNaN(a) || isNaN(b)) { this.subtractResult = '—'; return; }
    try {
      const res = this.unitService.subtract(a, unitA, b, unitB, resultUnit, this.currentType());
      this.subtractResult = `${this.unitService.formatResult(res)} ${resultUnit}`;
    } catch { this.subtractResult = 'error'; }
  }

  computeMultiply(): void {
    const { valueA, unitA, valueB, unitB, resultUnit } = this.multiplyForm.value;
    const a = parseFloat(valueA), b = parseFloat(valueB);
    if (isNaN(a) || isNaN(b)) { this.multiplyResult = '—'; return; }
    try {
      const res = this.unitService.multiply(a, unitA, b, unitB, resultUnit, this.currentType());
      this.multiplyResult = `${this.unitService.formatResult(res)} ${resultUnit}`;
    } catch { this.multiplyResult = 'error'; }
  }

  computeDivide(): void {
    const { valueA, unitA, valueB, unitB } = this.divideForm.value;
    const a = parseFloat(valueA), b = parseFloat(valueB);
    if (isNaN(a) || isNaN(b)) { this.divideResult = '—'; return; }
    try {
      const res = this.unitService.divide(a, unitA, b, unitB, this.currentType());
      this.divideResult = this.unitService.formatResult(res);
    } catch (e: any) { this.divideResult = e.message || 'error'; }
  }

  computeCompare(): void {
    const { valueA, unitA, valueB, unitB } = this.compareForm.value;
    const a = parseFloat(valueA), b = parseFloat(valueB);
    if (isNaN(a) || isNaN(b)) { this.compareResult = '—'; return; }
    const eq = this.unitService.compare(a, unitA, b, unitB, this.currentType());
    this.compareResult = eq ? '✓  EQUAL  ✓' : '✗  NOT EQUAL  ✗';
  }

  // ─── Copy to clipboard ─────────────────────────────────────────────────────
  copyResult(text: string): void {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text).then(() => this.toastService.show('Copied! 📋'));
  }

  // ─── Save helpers ──────────────────────────────────────────────────────────
  private canSave(saveToHistory: boolean): boolean {
    if (!saveToHistory) return false;
    if (!this.authService.currentUser()) {
      this.toastService.show('Login to save history', 'error');
      return false;
    }
    return true;
  }

  saveConvert(): void {
    const { value, from, to, saveToHistory } = this.convertForm.value;
    const v = parseFloat(value);
    if (isNaN(v)) { this.toastService.show('Enter a value', 'error'); return; }
    const res = this.unitService.convert(v, from, to, this.currentType());
    const desc = `${v} ${from} → ${res.toFixed(4)} ${to}`;
    if (this.canSave(saveToHistory)) {
      this.measurementService.saveOperation({
        operationType: 'Convert', firstValue: v, firstUnit: from,
        firstMeasurementType: this.currentType(), resultValue: res, resultUnit: to, description: desc
      }).subscribe({ next: () => this.toastService.show('Saved ✓', 'success'), error: (e) => this.toastService.show(e.message, 'error') });
    } else if (!saveToHistory) { this.toastService.show(desc); }
  }

  saveAdd(): void {
    const { valueA, unitA, valueB, unitB, resultUnit, saveToHistory } = this.addForm.value;
    const a = parseFloat(valueA), b = parseFloat(valueB);
    if (isNaN(a) || isNaN(b)) return;
    const res = this.unitService.add(a, unitA, b, unitB, resultUnit, this.currentType());
    const desc = `${a}${unitA} + ${b}${unitB} = ${res.toFixed(4)}${resultUnit}`;
    if (this.canSave(saveToHistory)) {
      this.measurementService.saveOperation({
        operationType: 'Add', firstValue: a, firstUnit: unitA,
        secondValue: b, secondUnit: unitB, resultValue: res, resultUnit, description: desc
      }).subscribe({ next: () => this.toastService.show('Saved ✓', 'success'), error: (e) => this.toastService.show(e.message, 'error') });
    } else if (!saveToHistory) { this.toastService.show(desc); }
  }

  saveSubtract(): void {
    const { valueA, unitA, valueB, unitB, resultUnit, saveToHistory } = this.subtractForm.value;
    const a = parseFloat(valueA), b = parseFloat(valueB);
    if (isNaN(a) || isNaN(b)) return;
    const res = this.unitService.subtract(a, unitA, b, unitB, resultUnit, this.currentType());
    const desc = `${a}${unitA} − ${b}${unitB} = ${res.toFixed(4)}${resultUnit}`;
    if (this.canSave(saveToHistory)) {
      this.measurementService.saveOperation({
        operationType: 'Subtract', firstValue: a, firstUnit: unitA,
        secondValue: b, secondUnit: unitB, resultValue: res, resultUnit, description: desc
      }).subscribe({ next: () => this.toastService.show('Saved ✓', 'success'), error: (e) => this.toastService.show(e.message, 'error') });
    } else if (!saveToHistory) { this.toastService.show(desc); }
  }

  saveMultiply(): void {
    const { valueA, unitA, valueB, unitB, resultUnit, saveToHistory } = this.multiplyForm.value;
    const a = parseFloat(valueA), b = parseFloat(valueB);
    if (isNaN(a) || isNaN(b)) return;
    const res = this.unitService.multiply(a, unitA, b, unitB, resultUnit, this.currentType());
    const desc = `${a}${unitA} × ${b}${unitB} = ${res.toFixed(4)}${resultUnit}`;
    if (this.canSave(saveToHistory)) {
      this.measurementService.saveOperation({
        operationType: 'Multiply', firstValue: a, firstUnit: unitA,
        secondValue: b, secondUnit: unitB, resultValue: res, resultUnit, description: desc
      }).subscribe({ next: () => this.toastService.show('Saved ✓', 'success'), error: (e) => this.toastService.show(e.message, 'error') });
    } else if (!saveToHistory) { this.toastService.show(desc); }
  }

  saveDivide(): void {
    const { valueA, unitA, valueB, unitB, saveToHistory } = this.divideForm.value;
    const a = parseFloat(valueA), b = parseFloat(valueB);
    if (isNaN(a) || isNaN(b)) return;
    try {
      const res = this.unitService.divide(a, unitA, b, unitB, this.currentType());
      const desc = `${a}${unitA} ÷ ${b}${unitB} = ${res.toFixed(6)}`;
      if (this.canSave(saveToHistory)) {
        this.measurementService.saveOperation({
          operationType: 'Divide', firstValue: a, firstUnit: unitA,
          secondValue: b, secondUnit: unitB, resultValue: res, description: desc
        }).subscribe({ next: () => this.toastService.show('Saved ✓', 'success'), error: (e) => this.toastService.show(e.message, 'error') });
      } else if (!saveToHistory) { this.toastService.show(desc); }
    } catch (e: any) { this.toastService.show(e.message, 'error'); }
  }

  saveCompare(): void {
    const { valueA, unitA, valueB, unitB, saveToHistory } = this.compareForm.value;
    const a = parseFloat(valueA), b = parseFloat(valueB);
    if (isNaN(a) || isNaN(b)) return;
    const eq = this.unitService.compare(a, unitA, b, unitB, this.currentType());
    const desc = `${a}${unitA} ${eq ? '==' : '!='} ${b}${unitB}`;
    if (this.canSave(saveToHistory)) {
      this.measurementService.saveOperation({
        operationType: 'Compare', firstValue: a, firstUnit: unitA,
        secondValue: b, secondUnit: unitB, resultValue: eq ? 1 : 0, description: desc
      }).subscribe({ next: () => this.toastService.show('Saved ✓', 'success'), error: (e) => this.toastService.show(e.message, 'error') });
    } else if (!saveToHistory) { this.toastService.show(desc); }
  }
}
