import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TablaGeneralComponent } from './tabla-general.component';
import { provideComponentTestBed } from '../../testing/component-test.helpers';

describe('TablaGeneralComponent', () => {
  let component: TablaGeneralComponent;
  let fixture: ComponentFixture<TablaGeneralComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TablaGeneralComponent],
      providers: provideComponentTestBed()
    }).compileComponents();

    fixture = TestBed.createComponent(TablaGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
