import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ChargeOptionsPage} from './charge-options.page';

describe('ChargeOptionsPage', () => {
    let component: ChargeOptionsPage;
    let fixture: ComponentFixture<ChargeOptionsPage>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ChargeOptionsPage],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ChargeOptionsPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
