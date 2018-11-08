import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelVoltsComponent } from './channel-volts.component';

describe('ChannelVoltsComponent', () => {
  let component: ChannelVoltsComponent;
  let fixture: ComponentFixture<ChannelVoltsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelVoltsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelVoltsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
