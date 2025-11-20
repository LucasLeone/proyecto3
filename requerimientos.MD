# ROL: Desarrollador Full Stack Senior (Arquitecto de Software)

## CONTEXTO
Tienes la tarea de desarrollar un "Sistema de Reclamos" basado en un código base existente. El objetivo es implementar la lógica de negocio y los endpoints/vistas necesarios para cubrir las Historias de Usuario (HU) definidas para la primera entrega (MVP).

## STACK TECNOLÓGICO (Del código base actual)
* **Lenguaje/Framework Backend:** Django
* **Frontend:** Vite
* **Base de Datos Principal:** MongoDb
* **Base de Datos de Auditoría:** MongoDB (Requerido específicamente para la HU-19).

## INSTRUCCIONES GENERALES
1.  Analiza la estructura de archivos actual antes de generar código.
2.  Implementa las funcionalidades de manera modular, respetando las capas del proyecto.
3.  Asegura que las validaciones de negocio se realicen en el Backend.
4.  Sigue los Criterios de Aceptación descritos abajo estrictamente.

---

## ALCANCE FUNCIONAL: HISTORIAS DE USUARIO
El sistema debe manejar tres roles: **Admin, Empleado, Cliente**.

### MÓDULO 0: AUTENTICACIÓN Y ADMINISTRACIÓN
**HU-01: Inicio de Sesión**
* Permitir login con email y contraseña.
* Validar credenciales y redirigir según rol (Admin, Empleado, Cliente).
* Gestionar sesiones seguras.

**HU-02: Gestión de Áreas (Solo Admin)**
* CRUD de Áreas (Nombre, Descripción).
* *Regla de Negocio:* No se puede eliminar un área si tiene reclamos o empleados activos asociados.

**HU-03: Gestión de Empleados (Solo Admin)**
* CRUD de empleados.
* Debe asignarse obligatoriamente un Área (creada en HU-02).
* Soft-delete: Desactivar acceso sin borrar historial.

**HU-04: Gestión de Clientes (Solo Admin)**
* CRUD de clientes (Razón Social, Email, Contraseña).
* Soft-delete disponible.

**HU-05: Cierre de Sesión**
* Destrucción de sesión y redirección al login.

### MÓDULO 1: GESTIÓN DE PROYECTOS
**HU-06: Creación de Proyectos**
* Admin puede registrar proyectos y vincularlos a un Cliente específico.
* *Regla:* No pueden existir proyectos huérfanos (sin cliente).

**HU-07: Consulta de Proyectos**
* **Cliente:** Solo ve sus propios proyectos en "Mis Proyectos".
* **Empleado/Admin:** Buscador de clientes para ver proyectos asociados.
* Mostrar: Nombre, Tipo y Estado.

### MÓDULO 2: REGISTRO DE RECLAMOS
**HU-08: Registro Inicial (Cliente)**
* Crear reclamo seleccionando Proyecto (obligatorio).
* Campos: Tipo, Urgencia (Baja, Media, Alta), Descripción.
* Estado inicial automático: "Ingresado".

**HU-09: Adjuntar Evidencia**
* Permitir subir archivos/imágenes vinculados al ID del reclamo.
* Validar peso y formato.

**HU-10: Confirmación**
* Generar ID único del reclamo y mostrar mensaje de éxito al cliente.

### MÓDULO 3: FLUJO DE TRABAJO
**HU-11: Asignación y Triaje (Empleado/Admin)**
* Ver reclamos nuevos ("Ingresado").
* Asignar Área Principal y establecer Prioridad/Criticidad real.
* Cambiar estado a "En Proceso".

**HU-12: Reasignación/Derivación**
* Transferir reclamo de un Área a otra.
* *Regla:* Motivo de derivación obligatorio.

**HU-13: Sub-Áreas**
* Empleados pueden organizar reclamos en sub-niveles internos (invisible para el cliente).

**HU-14: Lógica de Estados**
* Implementar máquina de estados.
* Ejemplo: Si está "Resuelto", bloquear edición. No permitir saltos de estado ilógicos.

**HU-15: Comentarios Internos**
* Chat/Muro visible solo para Empleados/Admin dentro del reclamo.
* Registrar autor y fecha.

### MÓDULO 4: TRAZABILIDAD Y AUDITORÍA
**HU-16: Vista Estado (Cliente)**
* Cliente ve: ID, Estado actual, Área responsable.

**HU-17: Auditoría Interna (Empleado)**
* Timeline detallado cronológico.
* Mostrar: Fecha/Hora, Usuario, Acción (cambio de área, estado, comentario), Valores anteriores y nuevos.

**HU-18: Historial Simplificado (Cliente)**
* Timeline visual solo con hitos públicos ("Ingresado", "Asignado", "Resuelto").
* *Privacidad:* Ocultar nombres de empleados y notas internas.

**HU-19: Registro Automático (Backend)**
* *Técnico:* Log inmutable en **MongoDB** para cada cambio de estado, área o responsable. Esto alimenta las vistas de HU-17 y HU-18.

### MÓDULO 5: RESOLUCIÓN Y FEEDBACK
**HU-20: Resolución (Empleado)**
* Marcar como "Resuelto".
* Campo obligatorio: "Detalle de Resolución".

**HU-21: Encuesta y Validación (Cliente)**
* Cliente puede Aceptar (Cierra reclamo, califica 1-5).
* Cliente puede Rechazar (Reabre reclamo a "En Proceso", motivo obligatorio).

### MÓDULO 6: REPORTES
**HU-22: Dashboard**
* Gráficos de KPIs (Totales, Tiempos promedio).

**HU-23: Calidad de Servicio**
* Visualizar promedio de calificaciones y feedback.

**HU-24: Filtros Avanzados**
* Filtrar listados por Cliente, Proyecto, Área, Estado, Fechas.

---

## PASOS SUGERIDOS PARA LA IMPLEMENTACIÓN
Por favor, comienza analizando los modelos de datos necesarios para cumplir con el Módulo 0 y 1, y genera el código correspondiente para el Backend y la Base de Datos.