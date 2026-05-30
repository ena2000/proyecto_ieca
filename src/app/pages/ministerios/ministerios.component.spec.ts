import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MinisteriosComponent } from './ministerios.component';
import { provideComponentTestBed } from '../../testing/component-test.helpers';

describe('MinisteriosComponent', () => {
  let component: MinisteriosComponent;
  let fixture: ComponentFixture<MinisteriosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MinisteriosComponent],
      providers: provideComponentTestBed()
    }).compileComponents();

    fixture = TestBed.createComponent(MinisteriosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
