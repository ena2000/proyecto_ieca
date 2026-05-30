import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SlidebarComponent } from './slidebar.component';
import { provideComponentTestBed } from '../../testing/component-test.helpers';

describe('SlidebarComponent', () => {
  let component: SlidebarComponent;
  let fixture: ComponentFixture<SlidebarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SlidebarComponent],
      providers: provideComponentTestBed()
    }).compileComponents();

    fixture = TestBed.createComponent(SlidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
