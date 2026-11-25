import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PortalHeaderComponent } from './portal-header.component';

describe('PortalHeaderComponent', () => {
  async function render(portal?: 'employee' | 'manager') {
    TestBed.configureTestingModule({
      imports: [PortalHeaderComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user: () => ({ name: 'Ana Torres' }), logout: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(PortalHeaderComponent);
    if (portal) fixture.componentRef.setInput('portal', portal);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the employee portal by default, with a logo link to /employee', async () => {
    const el = await render();
    expect(el.querySelector('.portal-header__badge')?.textContent).toContain('Employee portal');
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/employee');
    expect(el.querySelector('.portal-header__name')?.textContent).toContain('Ana Torres');
  });

  it('shows the manager portal, with a logo link to /manager', async () => {
    const el = await render('manager');
    expect(el.querySelector('.portal-header__badge')?.textContent).toContain('Manager portal');
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/manager');
    expect(el.querySelector('a')?.getAttribute('aria-label')).toBe('Manager home');
  });

  it('logs out and goes to the login page', async () => {
    const el = await render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    el.querySelector<HTMLButtonElement>('.portal-header__logout')!.click();
    expect(TestBed.inject(AuthService).logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
