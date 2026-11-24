import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import ManagerHomeComponent from './manager-home.component';

describe('ManagerHomeComponent', () => {
  let fixture: ComponentFixture<ManagerHomeComponent>;
  let el: HTMLElement;

  beforeEach(() => {
    sessionStorage.setItem(
      'carweb.user',
      JSON.stringify({ id: 2, name: 'Luis', email: 'luis@carweb.com', role: 'manager' }),
    );
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
    fixture = TestBed.createComponent(ManagerHomeComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  afterEach(() => sessionStorage.clear());

  it('greets the logged-in manager and links to the spare parts catalog and registration', () => {
    expect(el.querySelector('h1')?.textContent).toContain('Welcome, Luis');
    expect(el.querySelector('.manager-header__badge')?.textContent).toContain('Manager portal');

    const sparePartsLinks = Array.from(el.querySelectorAll<HTMLAnchorElement>('.task__link'));
    const catalogLink = sparePartsLinks.find((link) => link.getAttribute('href') === '/spare-parts');
    const registrationLink = sparePartsLinks.find((link) => link.getAttribute('href') === '/spare-parts/register');
    const staffLink = sparePartsLinks.find((link) => link.getAttribute('href') === '/manager/staff');
    expect(catalogLink?.textContent).toContain('Spare parts catalog');
    expect(registrationLink?.textContent).toContain('Register a spare part');
    expect(staffLink?.textContent).toContain('Staff');
    expect(staffLink?.textContent).toContain('Manage staff');
  });

  it('links to every additional database table without duplicating existing catalog cards', () => {
    const tableLinks = Array.from(el.querySelectorAll<HTMLAnchorElement>('.task__link'))
      .filter((link) => link.getAttribute('href')?.startsWith('/manager/data/'));

    expect(tableLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/manager/data/stock-movements',
      '/manager/data/appointments',
      '/manager/data/test-drives',
      '/manager/data/inspections',
      '/manager/data/trades',
      '/manager/data/documents',
      '/manager/data/contracts',
      '/manager/data/receipts',
    ]);
  });
});
