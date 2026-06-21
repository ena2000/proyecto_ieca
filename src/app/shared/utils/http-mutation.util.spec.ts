import { of, throwError } from 'rxjs';
import { withMutationTimeout } from './http-mutation.util';

describe('http-mutation.util', () => {
  it('propaga valores cuando la petición responde a tiempo', (done) => {
    withMutationTimeout(of({ ok: true })).subscribe({
      next: v => expect(v).toEqual({ ok: true }),
      complete: () => done()
    });
  });

  it('repropaga errores de la API', (done) => {
    withMutationTimeout(throwError(() => new Error('fallo api'))).subscribe({
      error: err => {
        expect(err.message).toBe('fallo api');
        done();
      }
    });
  });
});
