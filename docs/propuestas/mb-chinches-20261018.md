# Chinches Master Brokers 298, 299 y 301

Registro previo a implementación. Extensión de CHG-MASTERBROKERS-MINI-CRM del atlas fijado en 18b40fe639092a76dc46f697359bf587e958328f; conserva CHG-MASTERBROKER-PREEVALUATION y el recorrido PR43. No cambia arquitectura ni contratos.

- Orden y etiquetas visuales MD/MB en las carteras existentes: identidad propia primero; Eduardo Lara, Alejandro Franco, Lupita, resto estable. No crea identidades ni concede permisos.
- Beneficios en el menú de cartera: diálogo de consulta de los acuerdos ya visibles, con ausencia explícita de beneficios generales. No inventa condiciones comerciales ni escribe datos.
- Expediente: pregunta orientadora a la derecha en escritorio, debajo del título en móvil; tarjeta del PPP guardado al pie. Sólo lectura del mismo contrato PPP. No interpreta el siguiente compromiso como decisión ya tomada.
- Fuentes: snapshots autorizados brokers.v1, participación registrada y caso PPP guardado. No copiar datos privados al repo.
- Invariantes: aislamiento de broker, sesión Dirección estable, solo lectura en preview, no doble montaje PPP; conserva recuperación/confirmación del evaluador y sus request IDs.
- Pruebas: Node brokers; navegador sintético 320/390/1440 para orden, acuerdos, geometría, PPP único y aislamiento; regresiones recorrido e importación PR43. Cero escrituras de prueba en producción.
- Rollback: revertir sólo este frontend; conservar historial y todos los datos/recibos en Sheets y Drive.

Estado: propuesta; no acredita implementación, despliegue ni cierre de chinches. Publicación coordinada por raíz después de confirmar dueño de PR43.

## Verificación local

Implementación preparada sobre PR43 fd70d603. Node:150/150. Navegador Chromium: workspace174 comprobaciones a320/390/1440, CRM72, evaluador/regreso aprobado; recorrido PR43 completo a320/390/430 conserva cancelación, reintento, ACK, rechazo, revocación y aislamiento. Datos sintéticos; cero escrituras de producción. Capturas escritorio/móvil revisadas. WebKit queda a CI. No acredita publicación ni cierre de issues.
