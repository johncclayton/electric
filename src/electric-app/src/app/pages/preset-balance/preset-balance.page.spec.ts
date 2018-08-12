import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PresetBalancePage } from './preset-balance.page';

describe('PresetBalancePage', () => {
  let component: PresetBalancePage;
  let fixture: ComponentFixture<PresetBalancePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PresetBalancePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PresetBalancePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
