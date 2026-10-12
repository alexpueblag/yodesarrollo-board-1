# Presentación pública de inversión

URL: https://yodesarrollomx.github.io/yodesarrollo-board/presentacion/

Las láminas 1–3 forman una sola historia por scroll: oportunidad, método y sustento. El SVG conserva el inmueble y mueve al guía sobre una línea temporal compartida; reproducción, pausa, repetición, avance y navegación por capítulos usan ese mismo estado.

El contrato público existente de TEXTOS POTENCIAL conserva inv1_* y agrega inv2_* e inv3_*. Toda narrativa, logo, tema y duración provienen de Sheets. No se incluyen datos de inversionistas, brokers, precios, retornos reales o credenciales en el repositorio. La última sección conecta con un futuro caso concreto y no simula un análisis realizado.

En móvil, el bloque de variables muestra el grupo seleccionado; en escritorio aparecen los tres grupos. Todas las variables están disponibles mediante sus botones de fase. La animación se desactiva con prefers-reduced-motion y la navegación sigue disponible.

Pruebas: node --test tests/brokers*.test.cjs; node tests/brokers-story-browser.cjs. El navegador comprueba los tres capítulos, todas sus fases, la permanencia del mismo SVG, 320/390/1440 px, replay, compartir y lectura de copy real. VERIFY_PUBLISHED_STORY=1 agrega comprobación del sitio publicado en un contexto anónimo, compara el script y obtiene capturas reales. No escribe en CRM.

El enlace desde Material permanece en el tablero del Masterbroker. Publicar esta narrativa no cambia permisos del tablero ni publica la hoja CRM. Las versiones previas quedan conservadas en el historial y en las láminas existentes.

Reversión: revertir el PR frontend. Conservar los nuevos textos aditivos en Sheets y todos los expedientes.
