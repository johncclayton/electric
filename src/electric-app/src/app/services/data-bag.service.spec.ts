import { TestBed, inject } from '@angular/core/testing';

import { DataBagService } from './data-bag.service';

describe('DataBagService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataBagService]
    });
  });

  it('should be created', inject([DataBagService], (service: DataBagService) => {
    expect(service).toBeTruthy();
  }));
});
