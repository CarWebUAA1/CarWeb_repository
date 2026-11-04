import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QuickAccessSidebarComponent } from './quick-access-sidebar.component';

describe('QuickAccessSidebarComponent', () => {
  let fixture: ComponentFixture<QuickAccessSidebarComponent>;
  let el: HTMLElement;

  const toggle = () => el.querySelector<HTMLButtonElement>('.sidebar-toggle')!;
  const panel = () => el.querySelector('.sidebar');

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(QuickAccessSidebarComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('is closed by default', () => {
    expect(panel()).toBeNull();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('opens with the toggle and shows the quick links', () => {
    toggle().click();
    fixture.detectChanges();
    expect(panel()).not.toBeNull();
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    const links = Array.from(el.querySelectorAll('a.sidebar__link')).map((a) => a.textContent?.trim());
    expect(links).toEqual(['Home', 'Catalog', 'Log in', 'Sign up']);
    expect(el.querySelectorAll('.sidebar__link--soon').length).toBe(3);
  });

  it('closes with Escape and with the backdrop', () => {
    toggle().click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(panel()).toBeNull();

    toggle().click();
    fixture.detectChanges();
    el.querySelector<HTMLElement>('.sidebar-backdrop')!.click();
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });
});
