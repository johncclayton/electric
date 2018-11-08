import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ConfigPage} from './config.page';

describe('ConfigPage', () => {
    let component: ConfigPage;
    let fixture: ComponentFixture<ConfigPage>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ConfigPage],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ConfigPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
