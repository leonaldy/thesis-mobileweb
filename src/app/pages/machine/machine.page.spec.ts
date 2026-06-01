import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MachinePage } from './machine.page';

describe('MachinePage', () => {
  let component: MachinePage;
  let fixture: ComponentFixture<MachinePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MachinePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
