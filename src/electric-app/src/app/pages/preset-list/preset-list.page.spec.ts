import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PresetListPage } from './preset-list.page';

describe('PresetListPage', () => {
  let component: PresetListPage;
  let fixture: ComponentFixture<PresetListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PresetListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PresetListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
