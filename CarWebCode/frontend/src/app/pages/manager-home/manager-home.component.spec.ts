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
    expect(catalogLink?.textContent).toContain('Spare parts catalog');
    expect(registrationLink?.textContent).toContain('Register a spare part');
  });
});
