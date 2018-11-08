import { TestBed, inject } from '@angular/core/testing';

import { CaseFanService } from './case-fan.service';

describe('CaseFanService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CaseFanService]
    });
  });

  it('should be created', inject([CaseFanService], (service: CaseFanService) => {
    expect(service).toBeTruthy();
  }));
});
