import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RepairPage } from './repair.page';

describe('RepairPage', () => {
  let component: RepairPage;
  let fixture: ComponentFixture<RepairPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RepairPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
