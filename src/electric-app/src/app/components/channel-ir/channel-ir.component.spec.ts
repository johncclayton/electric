import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelIRComponent } from './channel-ir.component';

describe('ChannelIRComponent', () => {
  let component: ChannelIRComponent;
  let fixture: ComponentFixture<ChannelIRComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelIRComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelIRComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
