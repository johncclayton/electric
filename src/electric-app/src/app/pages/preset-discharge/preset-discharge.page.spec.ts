import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PresetDischargePage } from './preset-discharge.page';

describe('PresetDischargePage', () => {
  let component: PresetDischargePage;
  let fixture: ComponentFixture<PresetDischargePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PresetDischargePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PresetDischargePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
