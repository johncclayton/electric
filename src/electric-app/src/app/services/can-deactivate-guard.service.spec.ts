import { TestBed, inject } from '@angular/core/testing';

import { CanDeactivatePresetGuard } from './can-deactivate-preset-guard.service';

describe('CanDeactivatePresetGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CanDeactivatePresetGuard]
    });
  });

  it('should be created', inject([CanDeactivatePresetGuard], (service: CanDeactivatePresetGuard) => {
    expect(service).toBeTruthy();
  }));
});
