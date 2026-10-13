# Nombre de la historia de usuario

**Como un** <user, tipo de usuario or stakeholder>
**Quiero** <poder hacer/obtener (una feature)>
**Tal que** <cumplir objetivo (valor de negocio)>

[Cada historia de usuario tiene una razón de ser, un valor que justifica su existencia y,
si bien eso puede deducirse de la parte "**Tal que**", muchas veces se requiere contexto
extra y eso debe agregarse aquí.]

## Criterio de aceptación

* El sistema debe validar que los rangos de fechas sean válidos.
* El sistema no muestra en ningún caso registros de tipo X.
* El sistema muestra la pantalla en menos de 10 segundos.
* El sistema registra log de reportes con datos: fecha (localtime, usuario_id, ..)

[El criterio de aceptación es una herramienta de entendimiento, negociación y testing por 
lo que es importante no dejar criterios importantes fuera. Los requerimientos no funcionales
tales como performance, seguridad, manejo de errores van aquí.]


## Criterio de finalización
[Checklist que indica los quality gates por los que debe pasar la feature]

* El cliente ha revisado y aprobado la historia de usuario luego de la etapa de entendimiento.
* El cliente ha visto y aceptado los mocks de las pantallas. 
* El código se ha revisado en su totalidad durante los sucesivos commits.
* El análisis estático de código no encuentra errores de criticidad grave (definir).
* Los unit test pasan todos en verde.
* El analista funcional (internal product owner, TL o focal point) ha aprobado la funcionalidad.
* Se ha creado al menos un test automático para esta funcionalidad y el mismo pasa verde (cuando aplique).
* El servidor de integración continua no reporta error alguno.
