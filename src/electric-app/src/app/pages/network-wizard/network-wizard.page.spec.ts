import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkWizardPage } from './network-wizard.page';

describe('NetworkWizardPage', () => {
  let component: NetworkWizardPage;
  let fixture: ComponentFixture<NetworkWizardPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NetworkWizardPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkWizardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
