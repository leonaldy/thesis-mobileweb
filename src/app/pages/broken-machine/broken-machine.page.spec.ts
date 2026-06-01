import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrokenMachinePage } from './broken-machine.page';

describe('BrokenMachinePage', () => {
  let component: BrokenMachinePage;
  let fixture: ComponentFixture<BrokenMachinePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BrokenMachinePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
