import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ChargerStatusComponent} from './charger-status.component';

describe('ChargerStatusComponent', () => {
    let component: ChargerStatusComponent;
    let fixture: ComponentFixture<ChargerStatusComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ChargerStatusComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ChargerStatusComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
