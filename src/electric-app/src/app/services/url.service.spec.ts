import {inject, TestBed} from '@angular/core/testing';

import {URLService} from './url.service';

describe('URLService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [URLService]
        });
    });

    it('should be created', inject([URLService], (service: URLService) => {
        expect(service).toBeTruthy();
    }));
});
