import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchBarComponent } from './search-bar.component';

describe('SearchBarComponent', () => {
  let fixture: ComponentFixture<SearchBarComponent>;
  let el: HTMLElement;
  let emitted: string[];

  function search(value: string) {
    const input = el.querySelector<HTMLInputElement>('input')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchBarComponent);
    emitted = [];
    fixture.componentInstance.searchSubmit.subscribe((term) => emitted.push(term));
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('emits the trimmed search term', () => {
    search('  Toyota Corolla ');
    expect(emitted).toEqual(['Toyota Corolla']);
  });

  it('ignores empty searches', () => {
    search('   ');
    expect(emitted).toEqual([]);
  });

  it('has an accessible label for the input', () => {
    const input = el.querySelector('input')!;
    expect(el.querySelector(`label[for="${input.id}"]`)?.textContent).toContain('Search cars');
  });
});
