import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { IngresosComponent } from './ingresos.component';

describe('IngresosComponent', () => {
  let component: IngresosComponent;
  let fixture: ComponentFixture<IngresosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      // Al ser Standalone, se importa directamente aquí en lugar de usar "declarations"
      imports: [IngresosComponent],
      // Proveemos el entorno de Ionic para componentes Standalone
      providers: [
        provideIonicAngular()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IngresosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.modoEdicion).toBeFalse();
    expect(component.intentoEnvio).toBeFalse();
    expect(component.nuevoIngreso.tipo).toBe('Ofrenda');
    expect(component.nuevoIngreso.ministerio).toBe('General');
  });

  it('should validate form fields correctly', () => {
    // Inicialmente el formulario debería ser inválido porque los campos están vacíos
    expect(component.esFormularioValido).toBeFalse();

    // Llenamos los datos simulando una entrada válida
    component.nuevoIngreso.descripcion = 'Ofrenda dominical';
    component.nuevoIngreso.monto = 150;
    component.fechaManualForm = '17/05/2026'; // Simula los 10 caracteres requeridos

    expect(component.esFormularioValido).toBeTrue();
  });
});