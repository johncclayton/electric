import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PresetStoragePage } from './preset-storage.page';

describe('PresetStoragePage', () => {
  let component: PresetStoragePage;
  let fixture: ComponentFixture<PresetStoragePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PresetStoragePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PresetStoragePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
