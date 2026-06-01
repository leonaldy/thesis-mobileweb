import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SparepartPage } from './sparepart.page';

describe('SparepartPage', () => {
  let component: SparepartPage;
  let fixture: ComponentFixture<SparepartPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SparepartPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
