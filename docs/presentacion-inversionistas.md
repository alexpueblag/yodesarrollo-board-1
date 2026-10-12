# Introducción animada para inversionistas

Primera escena pública independiente bajo `presentacion/`, enlazada desde Material de Masterbrokers. El inmueble conceptual se conserva al entrar en el puente a la evaluación; no se desarrolla todavía el segundo capítulo.

El contenido y parámetros visuales salen de las claves `inv1_*` del contrato público `recurso=textos` existente de Plan de Potencial. Se leen mediante `source.js`; el código no copia textos comerciales, identidades, cartera, precios ni supuestos financieros. No se añade una escritura pública ni un backend.

Scroll y reproducción comparten un progreso. Reproducir/Pausar, Repetir, Ver completa, momentos y Compartir no necesitan sesión. Al regresar de otra pestaña se pausa. Movimiento reducido muestra la composición final sin desplazamiento automático. Una falla de contenido deja reintento visible, sin recuperar datos privados del tablero.

Material consulta los mismos textos públicos sólo tras una sesión de Brokers válida. El enlace compartido no contiene broker, token ni parámetros de revisión. La presentación no activa perfiles ni concede derechos en otros módulos.

Verificación prevista: contratos con datos sintéticos, navegador móvil/escritorio, movimiento reducido, controles y copia en Material; lectura pública y publicación se registran por separado. No afirmar que el acceso individual está activo sin contrastarlo con el registro privado.

Reversión: revertir el PR de frontend. Conservar textos en Sheets, expedientes y presentaciones anteriores.
