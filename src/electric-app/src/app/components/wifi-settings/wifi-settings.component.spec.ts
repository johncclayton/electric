import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WifiSettingsComponent } from './wifi-settings.component';

describe('WifiSettingsComponent', () => {
  let component: WifiSettingsComponent;
  let fixture: ComponentFixture<WifiSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WifiSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WifiSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
