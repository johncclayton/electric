import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PresetCyclePage } from './preset-cycle.page';

describe('PresetCyclePage', () => {
  let component: PresetCyclePage;
  let fixture: ComponentFixture<PresetCyclePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PresetCyclePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PresetCyclePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
