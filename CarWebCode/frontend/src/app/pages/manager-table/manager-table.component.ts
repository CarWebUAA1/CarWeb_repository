import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { SiteFooterComponent } from '../../components/site-footer/site-footer.component';
import { MANAGER_TABLES, ManagerTableData } from '../../models/manager-data.model';
import { ManagerDataService } from '../../services/manager-data.service';

@Component({
  selector: 'app-manager-table',
  imports: [RouterLink, SiteFooterComponent],
  templateUrl: './manager-table.component.html',
  styleUrl: './manager-table.component.css',
})
export class ManagerTableComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly managerData = inject(ManagerDataService);

  protected readonly tableData = signal<ManagerTableData | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly tableTitle = signal('');

  constructor() {
    this.route.paramMap.pipe(
      map((params) => params.get('table')),
      distinctUntilChanged(),
      tap((key) => {
        this.tableTitle.set(MANAGER_TABLES.find((table) => table.key === key)?.title ?? 'Database table');
        this.tableData.set(null);
        this.error.set('');
        this.loading.set(true);
      }),
      switchMap((key) => {
        const table = MANAGER_TABLES.find((candidate) => candidate.key === key);
        if (!table) {
          return of({ ok: false as const, message: 'Unknown database table.' });
        }
        return this.managerData.getTable(table.key).pipe(
          map((data) => ({ ok: true as const, data })),
          catchError(() => of({ ok: false as const, message: 'Could not load table data.' })),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((result) => {
      if (result.ok) {
        this.tableData.set(result.data);
      } else {
        this.error.set(result.message);
      }
      this.loading.set(false);
    });
  }

  protected formatColumn(column: string): string {
    return column.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  protected formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
}
