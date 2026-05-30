import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { GastosComponent } from './gastos.component';
import { provideComponentTestBed } from '../../testing/component-test.helpers';

describe('GastosComponent', () => {
  let component: GastosComponent;
  let fixture: ComponentFixture<GastosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [GastosComponent],
      providers: provideComponentTestBed()
    }).compileComponents();

    fixture = TestBed.createComponent(GastosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
