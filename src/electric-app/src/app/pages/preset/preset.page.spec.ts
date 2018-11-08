import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PresetPage } from './preset.page';

describe('PresetPage', () => {
  let component: PresetPage;
  let fixture: ComponentFixture<PresetPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PresetPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PresetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
