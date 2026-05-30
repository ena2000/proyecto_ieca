import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ModalFormComponent } from './modal-form.component';
import { provideComponentTestBed } from '../../testing/component-test.helpers';

describe('ModalFormComponent', () => {
  let component: ModalFormComponent;
  let fixture: ComponentFixture<ModalFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ModalFormComponent],
      providers: provideComponentTestBed()
    }).compileComponents();

    fixture = TestBed.createComponent(ModalFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
