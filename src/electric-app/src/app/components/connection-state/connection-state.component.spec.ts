import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ConnectionStateComponent} from './connection-state.component';

describe('ConnectionStateComponent', () => {
    let component: ConnectionStateComponent;
    let fixture: ComponentFixture<ConnectionStateComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ConnectionStateComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ConnectionStateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
