import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextBasedManagerComponent } from './text-based-manager.component';

describe('TextBasedManagerComponent', () => {
  let component: TextBasedManagerComponent;
  let fixture: ComponentFixture<TextBasedManagerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextBasedManagerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextBasedManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
