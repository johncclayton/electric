import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PresetChargePage } from './preset-charge.page';

describe('PresetChargePage', () => {
  let component: PresetChargePage;
  let fixture: ComponentFixture<PresetChargePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PresetChargePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PresetChargePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
