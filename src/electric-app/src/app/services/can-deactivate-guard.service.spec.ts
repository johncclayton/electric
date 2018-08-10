import { TestBed, inject } from '@angular/core/testing';

import { CanDeactivateGuardService } from './can-deactivate-guard.service';

describe('CanDeactivateGuardService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CanDeactivateGuardService]
    });
  });

  it('should be created', inject([CanDeactivateGuardService], (service: CanDeactivateGuardService) => {
    expect(service).toBeTruthy();
  }));
});
