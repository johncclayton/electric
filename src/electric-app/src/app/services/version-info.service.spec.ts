import { TestBed, inject } from '@angular/core/testing';

import { VersionInfoService } from './version-info.service';

describe('VersionInfoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VersionInfoService]
    });
  });

  it('should be created', inject([VersionInfoService], (service: VersionInfoService) => {
    expect(service).toBeTruthy();
  }));
});
