import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {BetterRangeComponent} from './better-range.component';

describe('BetterRangeComponent', () => {
    let component: BetterRangeComponent;
    let fixture: ComponentFixture<BetterRangeComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [BetterRangeComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(BetterRangeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
