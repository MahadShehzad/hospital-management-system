import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Slot } from '../../core/models';

export interface SlotRange {
  from: string;
  to: string;
}

interface DayColumn {
  date: string; // yyyy-mm-dd
  jsDate: Date;
  count: number;
}

interface SlotGroup {
  label: string;
  slots: Slot[];
}

const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Plain-language slot picker: pick a day from the strip, then tap a time.
 * Replaces the week-grid calendar which patients found confusing.
 */
@Component({
  selector: 'app-slot-picker',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slot-picker.component.html',
})
export class SlotPickerComponent {
  readonly slots = input.required<Slot[]>();
  readonly loading = input(false);
  /** How many days ahead to offer. */
  readonly days = input(14);

  readonly slotSelected = output<Slot>();
  readonly rangeChanged = output<SlotRange>();

  readonly selectedDate = signal<string | null>(null);
  /** Set once the patient picks a day themselves, so we stop auto-selecting. */
  private readonly userPicked = signal(false);

  constructor() {
    // Announce the range we want covered, once.
    effect(() => {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setDate(to.getDate() + this.days() - 1);
      this.rangeChanged.emit({ from: localDate(from), to: localDate(to) });
    });

    // Auto-select the first day that actually has slots. Re-evaluated when the
    // slots arrive, so an empty "today" (e.g. a weekend) doesn't stay selected.
    effect(() => {
      const cols = this.columns();
      const selected = this.selectedDate();
      const current = cols.find((c) => c.date === selected);
      if (current && (current.count > 0 || this.userPicked())) return;
      const target = (cols.find((c) => c.count > 0) ?? cols[0])?.date ?? null;
      if (target !== selected) this.selectedDate.set(target);
    });
  }

  private readonly byDate = computed(() => {
    const map = new Map<string, Slot[]>();
    for (const s of this.slots()) {
      const key = localDate(new Date(s.start));
      const arr = map.get(key);
      if (arr) arr.push(s);
      else map.set(key, [s]);
    }
    return map;
  });

  readonly columns = computed<DayColumn[]>(() => {
    const out: DayColumn[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < this.days(); i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const key = localDate(d);
      out.push({ date: key, jsDate: d, count: this.byDate().get(key)?.length ?? 0 });
    }
    return out;
  });

  readonly groups = computed<SlotGroup[]>(() => {
    const date = this.selectedDate();
    if (!date) return [];
    const daySlots = (this.byDate().get(date) ?? [])
      .slice()
      .sort((a, b) => a.start.localeCompare(b.start));

    const buckets: Record<string, Slot[]> = { Morning: [], Afternoon: [], Evening: [] };
    for (const s of daySlots) {
      const h = new Date(s.start).getHours();
      if (h < 12) buckets['Morning'].push(s);
      else if (h < 17) buckets['Afternoon'].push(s);
      else buckets['Evening'].push(s);
    }
    return Object.entries(buckets)
      .filter(([, arr]) => arr.length > 0)
      .map(([label, arr]) => ({ label, slots: arr }));
  });

  readonly selectedHasSlots = computed(() => this.groups().some((g) => g.slots.length > 0));

  pick(date: string) {
    this.userPicked.set(true);
    this.selectedDate.set(date);
  }

  choose(slot: Slot) {
    this.slotSelected.emit(slot);
  }
}
