import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TempRangeComponent } from './temp-range.component';

describe('TempRangeComponent', () => {
  let component: TempRangeComponent;
  let fixture: ComponentFixture<TempRangeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TempRangeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TempRangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
