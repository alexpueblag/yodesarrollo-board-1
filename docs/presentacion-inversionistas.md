# Presentación pública · apertura desde la ciudad

La URL existente conserva el borrador de siete láminas. Antes aparece el recorrido por ocho momentos: ciudad, uso mixto buscado, población y empleo buscados, barrios consolidados, dos oportunidades, costo, viviendas y saldo.

El trazado de vialidades reales se obtiene de OpenStreetMap con parámetros de Sheets, se simplifica y se guarda en el contrato editorial público hunt_*. Las áreas naranja e iconos son criterios ilustrativos, no capas municipales ni establecimientos acreditados. La transición a dos cuadras/predios es un esquema, sin afirmar ubicación o propiedad real.

Cada casa representa una vivienda; las monedas son unidades abstractas de valor. Los casos y conteos viven en Sheets. Costo = valor del inmueble + ejecución; saldo = venta − costo. La aportación no elimina el valor del inmueble y el saldo del proyecto no se ofrece como reparto al inversionista. No son pesos ni un pronóstico de rentabilidad.

La apertura tiene scroll, ocho botones, reproducción, pausa, replay, comparación y continuación al borrador. Prefers-reduced-motion conserva controles sin movimiento automático. Usa un único fetch editorial; no pide datos ni credenciales ni consulta servicios cartográficos en cada visita.

Pruebas: node --test tests/brokers*.test.cjs; node tests/brokers-story-browser.cjs; node tests/brokers-hunt-browser.cjs. Publicación anónima y capturas reales se comprueban con VERIFY_PUBLISHED_STORY=1 después del despliegue. Las consultas cartográficas son lecturas, no pruebas de escrituras de negocio.

Reversión por PR: retirar la apertura conservando el borrador de siete láminas y todo el contenido/historial de Sheets. Sin cambios al Portero del Masterbroker.

La obtención de vialidades es una preparación manual con workflow_dispatch; no se repite en cada visita ni cambio del frontend. Las consultas cartográficas sólo recuperan datos públicos. Guardar la salida atribuida en las celdas editoriales y revisar antes de publicarla.
