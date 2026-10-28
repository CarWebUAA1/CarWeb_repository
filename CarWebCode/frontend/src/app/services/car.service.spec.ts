import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CarService } from './car.service';

describe('CarService', () => {
  let service: CarService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CarService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the given catalog page', () => {
    service.getCars(2).subscribe();
    const req = http.expectOne('/api/v1/cars?page=2');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], page: 2, pageSize: 20, total: 0, totalPages: 0 });
  });

  it('emits null when the car does not exist', () => {
    let result: unknown = 'not emitted';
    service.getCar(7).subscribe((car) => (result = car));
    http.expectOne('/api/v1/cars/7').flush({ error: 'Car not found' }, { status: 404, statusText: 'Not Found' });
    expect(result).toBeNull();
  });

  it('propagates other errors', () => {
    let failed = false;
    service.getCar(7).subscribe({ error: () => (failed = true) });
    http.expectOne('/api/v1/cars/7').flush(null, { status: 500, statusText: 'Server Error' });
    expect(failed).toBe(true);
  });
});
