import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SiteHeaderComponent } from './site-header.component';

describe('SiteHeaderComponent', () => {
  let fixture: ComponentFixture<SiteHeaderComponent>;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(SiteHeaderComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('shows logo, search bar, Catalog, employee access and quick access in that order', () => {
    const order = Array.from(el.querySelector('header')!.children).map(
      (child) => child.getAttribute('aria-label') ?? child.tagName.toLowerCase(),
    );
    expect(order).toEqual(['CarWeb home', 'app-search-bar', 'Main', 'app-quick-access-sidebar']);
    const buttons = Array.from(el.querySelectorAll('.site-header__nav a')).map((a) => a.textContent?.trim());
    expect(buttons).toEqual(['Catalog', 'Employee access']);
  });

  it('has an employee access button with the user-tie icon that opens the employee home', () => {
    const employee = el.querySelector<HTMLAnchorElement>('.site-header__btn--icon')!;
    expect(employee.getAttribute('href')).toBe('/employee');
    expect(employee.querySelector('i.fa-solid.fa-user-tie')).not.toBeNull();
    expect(employee.querySelector('i')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('no longer has a Log in button', () => {
    const texts = Array.from(el.querySelectorAll('a')).map((a) => a.textContent?.trim());
    expect(texts).not.toContain('Log in');
  });

  it('opens the catalog with the search term', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const input = el.querySelector<HTMLInputElement>('app-search-bar input')!;
    input.value = 'Mazda';
    input.dispatchEvent(new Event('input'));
    el.querySelector('app-search-bar form')!.dispatchEvent(new Event('submit'));
    expect(navigate).toHaveBeenCalledWith(['/cars'], { queryParams: { search: 'Mazda' } });
  });

  it('ignores the native "search" event of <input type="search">', () => {
    // Chromium fires a bubbling `search` DOM event on Enter; it must not be taken as the search term.
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const input = el.querySelector<HTMLInputElement>('app-search-bar input')!;
    input.dispatchEvent(new Event('search', { bubbles: true }));
    expect(navigate).not.toHaveBeenCalled();
  });
});
