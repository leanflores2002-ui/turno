import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DoctorsService } from './doctors.service';
import { API_BASE_URL } from '../config/api.config';
import { DoctorDto } from '../models/user';

describe('DoctorsService', () => {
  let service: DoctorsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(DoctorsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should retrieve the list of doctors', () => {
    let response: DoctorDto[] | undefined;

    service.listDoctors().subscribe((doctors) => (response = doctors));

    const request = httpMock.expectOne(`${API_BASE_URL}/doctors/`);
    expect(request.request.method).toBe('GET');

    const payload: DoctorDto[] = [
      {
        id: 1,
        email: 'doctor@example.com',
        password: '***',
        is_active: true,
        is_superuser: false,
        full_name: 'Doctor Demo',
        specialty: 'Clínica',
        license_number: 'MN1234',
        years_experience: 5
      }
    ];

    request.flush(payload);
    expect(response).toEqual(payload);
  });
});
