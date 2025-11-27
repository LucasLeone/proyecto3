from django.core.management.base import BaseCommand
from datetime import datetime, timedelta
import random
import os
from dotenv import load_dotenv

from claims.repositories import (
    create_area,
    create_user,
    create_project,
    create_claim,
    add_sub_area,
    update_claim_with_rules,
    add_claim_comment,
    add_claim_action,
    submit_client_feedback,
    get_user_by_email,
    get_user_by_id,
    get_area,
)

# Cargar variables de entorno
load_dotenv()


class Command(BaseCommand):
    help = "Pobla la base de datos con datos de prueba realistas distribuidos en 2 años"

    def handle(self, *args, **options):
        self.stdout.write("🚀 Iniciando población de base de datos...")

        # Limpiar datos anteriores sería peligroso, así que solo agregamos
        
        try:
            # 1. Crear 3 áreas con sub-áreas
            self.stdout.write("\n📁 Creando áreas y sub-áreas...")
            areas_data = [
                {
                    "name": "Soporte Técnico",
                    "description": "Área encargada de resolver problemas técnicos y de infraestructura",
                    "sub_areas": ["Redes", "Servidores", "Base de Datos"]
                },
                {
                    "name": "Desarrollo",
                    "description": "Área de desarrollo de software y nuevas funcionalidades",
                    "sub_areas": ["Frontend", "Backend", "Mobile"]
                },
                {
                    "name": "Seguridad",
                    "description": "Área de seguridad informática y protección de datos",
                    "sub_areas": ["Auditoría", "Penetration Testing", "Compliance"]
                }
            ]
            
            from claims.db import get_main_db
            db = get_main_db()
            
            areas = []
            for area_data in areas_data:
                # Verificar si el área ya existe
                existing_area = db.areas.find_one({"name": area_data["name"]})
                
                if existing_area:
                    area = get_area(str(existing_area["_id"]))
                    self.stdout.write(f"  ⚠ Área existente: {area['name']}")
                else:
                    area = create_area(
                        name=area_data["name"],
                        description=area_data["description"]
                    )
                    self.stdout.write(f"  ✓ Área creada: {area['name']}")
                
                # Agregar sub-áreas si no existen
                existing_sub_areas = [sa.get("name") for sa in area.get("sub_areas", [])]
                for sub_area_name in area_data["sub_areas"]:
                    if sub_area_name not in existing_sub_areas:
                        add_sub_area(area["id"], sub_area_name)
                        self.stdout.write(f"    ✓ Sub-área agregada: {sub_area_name}")
                    
                # Recargar área con sub-áreas
                area = get_area(area["id"])
                areas.append(area)

            # 2. Crear 3 empleados (uno por área)
            self.stdout.write("\n👥 Creando empleados...")
            employee_password = os.getenv("EMPLOYEE_PASSWORD", "empleado123")
            employees_data = [
                {
                    "email": "juan.perez@empresa.com",
                    "password": employee_password,
                    "full_name": "Juan Pérez",
                    "area_id": areas[0]["id"]
                },
                {
                    "email": "maria.gonzalez@empresa.com",
                    "password": employee_password,
                    "full_name": "María González",
                    "area_id": areas[1]["id"]
                },
                {
                    "email": "carlos.rodriguez@empresa.com",
                    "password": employee_password,
                    "full_name": "Carlos Rodríguez",
                    "area_id": areas[2]["id"]
                }
            ]
            
            employees = []
            for emp_data in employees_data:
                # Verificar si el empleado ya existe
                existing_user = db.users.find_one({"email": emp_data["email"]})
                
                if existing_user:
                    employee = get_user_by_id(str(existing_user["_id"]))
                    self.stdout.write(f"  ⚠ Empleado existente: {employee['full_name']} - {employee['email']}")
                else:
                    employee = create_user(
                        role="employee",
                        email=emp_data["email"],
                        password=emp_data["password"],
                        full_name=emp_data["full_name"],
                        area_id=emp_data["area_id"]
                    )
                    self.stdout.write(f"  ✓ Empleado creado: {employee['full_name']} - {employee['email']}")
                    
                employees.append(employee)

            # 3. Crear 3 clientes
            self.stdout.write("\n🏢 Creando clientes...")
            client_password = os.getenv("CLIENT_PASSWORD", "cliente123")
            clients_data = [
                {
                    "email": "contacto@tecnosolutions.com",
                    "password": client_password,
                    "full_name": "Roberto Martínez",
                    "company_name": "TecnoSolutions SA"
                },
                {
                    "email": "admin@innovatech.com",
                    "password": client_password,
                    "full_name": "Laura Fernández",
                    "company_name": "InnovaTech Corp"
                },
                {
                    "email": "soporte@digitalplus.com",
                    "password": client_password,
                    "full_name": "Diego Sánchez",
                    "company_name": "Digital Plus SRL"
                }
            ]
            
            clients = []
            for client_data in clients_data:
                # Verificar si el cliente ya existe
                existing_user = db.users.find_one({"email": client_data["email"]})
                
                if existing_user:
                    client = get_user_by_id(str(existing_user["_id"]))
                    self.stdout.write(f"  ⚠ Cliente existente: {client.get('company_name', client['full_name'])} - {client['email']}")
                else:
                    client = create_user(
                        role="client",
                        email=client_data["email"],
                        password=client_data["password"],
                        full_name=client_data["full_name"],
                        company_name=client_data["company_name"]
                    )
                    self.stdout.write(f"  ✓ Cliente creado: {client['company_name']} - {client['email']}")
                    
                clients.append(client)

            # 4. Crear 2 proyectos por cliente (6 proyectos total)
            self.stdout.write("\n📊 Creando proyectos...")
            projects_data = [
                # Cliente 1
                {"name": "Sistema ERP", "project_type": "Desarrollo de Software", "client_id": clients[0]["id"]},
                {"name": "Portal Web", "project_type": "Desarrollo Web", "client_id": clients[0]["id"]},
                # Cliente 2
                {"name": "App Mobile", "project_type": "Desarrollo Mobile", "client_id": clients[1]["id"]},
                {"name": "Dashboard Analytics", "project_type": "Business Intelligence", "client_id": clients[1]["id"]},
                # Cliente 3
                {"name": "Migración Cloud", "project_type": "Infraestructura", "client_id": clients[2]["id"]},
                {"name": "API Gateway", "project_type": "Integración", "client_id": clients[2]["id"]},
            ]
            
            from claims.repositories import get_project
            from bson import ObjectId
            
            projects = []
            for proj_data in projects_data:
                # Verificar si el proyecto ya existe (por nombre y cliente)
                existing_project = db.projects.find_one({
                    "name": proj_data["name"],
                    "client_id": ObjectId(proj_data["client_id"])
                })
                
                if existing_project:
                    project = get_project(str(existing_project["_id"]))
                    self.stdout.write(f"  ⚠ Proyecto existente: {project['name']}")
                else:
                    project = create_project(
                        name=proj_data["name"],
                        project_type=proj_data["project_type"],
                        client_id=proj_data["client_id"]
                    )
                    self.stdout.write(f"  ✓ Proyecto creado: {project['name']}")
                    
                projects.append(project)

            # 5. Crear reclamos con flujo completo distribuidos en 2 años
            self.stdout.write("\n🎫 Creando reclamos con flujo completo...")
            
            # Base de tiempo: hace 2 años
            base_date = datetime.utcnow() - timedelta(days=730)
            
            claims_data = [
                # Cliente 1 - 4 reclamos
                {
                    "client": clients[0],
                    "project": projects[0],
                    "claim_type": "Error en módulo de facturación",
                    "priority": "Alta",
                    "severity": "S2 - Alto",
                    "description": "El sistema no está generando correctamente las facturas. Los totales no coinciden con los productos.",
                    "created_offset_days": 0,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 1, "action": "assign_area", "area_idx": 0, "sub_area": "Base de Datos"},
                        {"days": 2, "action": "status", "status": "En Proceso"},
                        {"days": 2, "action": "comment", "employee_idx": 0, "text": "Revisando logs de base de datos"},
                        {"days": 3, "action": "client_feedback", "text": "¿Cuándo estará resuelto? Es urgente"},
                        {"days": 5, "action": "action", "employee_idx": 0, "text": "Encontrado error en trigger de cálculo de totales"},
                        {"days": 6, "action": "client_feedback", "text": "Gracias por la actualización"},
                        {"days": 8, "action": "status", "status": "Resuelto", "resolution": "Se corrigió el trigger de la base de datos que calculaba incorrectamente los totales. Se aplicó un script de corrección para las facturas afectadas y se implementó un test automatizado para prevenir futuros errores."},
                        {"days": 9, "action": "final_feedback", "text": "Excelente trabajo, todo funciona correctamente", "rating": 5}
                    ]
                },
                {
                    "client": clients[0],
                    "project": projects[1],
                    "claim_type": "Problema de rendimiento",
                    "priority": "Media",
                    "severity": "S3 - Medio",
                    "description": "El portal web carga muy lento, especialmente en horas pico.",
                    "created_offset_days": 30,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 1, "action": "assign_area", "area_idx": 1, "sub_area": "Backend"},
                        {"days": 2, "action": "comment", "employee_idx": 1, "text": "Analizando métricas de rendimiento"},
                        {"days": 4, "action": "status", "status": "En Proceso"},
                        {"days": 5, "action": "change_area", "area_idx": 0, "reason": "Requiere optimización de infraestructura", "sub_area": "Servidores"},
                        {"days": 6, "action": "comment", "employee_idx": 0, "text": "Implementando caché y optimización de queries"},
                        {"days": 7, "action": "client_feedback", "text": "Noto mejoras, pero aún hay lentitud en algunos módulos"},
                        {"days": 10, "action": "action", "employee_idx": 0, "text": "Implementado CDN y compresión de assets"},
                        {"days": 12, "action": "status", "status": "Resuelto", "resolution": "Se implementó un sistema de caché Redis, se optimizaron las queries más pesadas, se configuró un CDN para assets estáticos y se habilitó compresión GZIP. El tiempo de carga se redujo en un 70%."},
                        {"days": 13, "action": "final_feedback", "text": "Muy buen resultado, el sitio ahora carga rápido", "rating": 4}
                    ]
                },
                {
                    "client": clients[0],
                    "project": projects[0],
                    "claim_type": "Falla en integración con API externa",
                    "priority": "Alta",
                    "severity": "S1 - Crítico",
                    "description": "La integración con el servicio de pagos está fallando intermitentemente.",
                    "created_offset_days": 90,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 0.5, "action": "assign_area", "area_idx": 1, "sub_area": "Backend"},
                        {"days": 1, "action": "status", "status": "En Proceso"},
                        {"days": 1, "action": "comment", "employee_idx": 1, "text": "Investigando logs de errores de integración"},
                        {"days": 2, "action": "client_feedback", "text": "Esto está afectando las ventas, necesitamos solución urgente"},
                        {"days": 3, "action": "action", "employee_idx": 1, "text": "Implementado reintentos automáticos y mejor manejo de errores"},
                        {"days": 4, "action": "client_feedback", "text": "Parece estar mejor, pero aún veo algunos errores"},
                        {"days": 5, "action": "comment", "employee_idx": 1, "text": "El proveedor de pagos reportó problemas en su infraestructura"},
                        {"days": 7, "action": "status", "status": "Resuelto", "resolution": "Se implementó un sistema de reintentos con backoff exponencial, se agregó un sistema de fallback a un proveedor secundario, y se configuraron alertas en tiempo real para detectar problemas de conectividad. El proveedor también resolvió sus problemas de infraestructura."},
                        {"days": 8, "action": "final_feedback", "text": "Problema resuelto completamente", "rating": 5}
                    ]
                },
                {
                    "client": clients[0],
                    "project": projects[1],
                    "claim_type": "Error en formulario de contacto",
                    "priority": "Baja",
                    "severity": "S4 - Bajo",
                    "description": "El formulario de contacto no valida correctamente los emails.",
                    "created_offset_days": 180,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 2, "action": "assign_area", "area_idx": 1, "sub_area": "Frontend"},
                        {"days": 5, "action": "status", "status": "En Proceso"},
                        {"days": 6, "action": "action", "employee_idx": 1, "text": "Actualizada librería de validación de formularios"},
                        {"days": 8, "action": "status", "status": "Resuelto", "resolution": "Se actualizó la librería de validación a la última versión y se agregaron validaciones adicionales del lado del servidor para mayor seguridad."},
                        {"days": 9, "action": "final_feedback", "text": "Funciona bien ahora", "rating": 4}
                    ]
                },
                
                # Cliente 2 - 3 reclamos
                {
                    "client": clients[1],
                    "project": projects[2],
                    "claim_type": "Crash en dispositivos Android antiguos",
                    "priority": "Alta",
                    "severity": "S2 - Alto",
                    "description": "La aplicación se cierra inesperadamente en dispositivos con Android 8 o inferior.",
                    "created_offset_days": 120,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 1, "action": "assign_area", "area_idx": 1, "sub_area": "Mobile"},
                        {"days": 2, "action": "status", "status": "En Proceso"},
                        {"days": 2, "action": "comment", "employee_idx": 1, "text": "Reproduciendo el error en dispositivos de prueba"},
                        {"days": 3, "action": "client_feedback", "text": "Varios clientes reportan el mismo problema"},
                        {"days": 5, "action": "action", "employee_idx": 1, "text": "Identificada incompatibilidad con librería de imágenes"},
                        {"days": 7, "action": "comment", "employee_idx": 1, "text": "Probando solución en diferentes versiones de Android"},
                        {"days": 10, "action": "status", "status": "Resuelto", "resolution": "Se reemplazó la librería de procesamiento de imágenes por una versión compatible con Android 6+. Se realizaron pruebas exhaustivas en múltiples dispositivos y versiones del sistema operativo."},
                        {"days": 11, "action": "final_feedback", "text": "La app funciona perfectamente en todos los dispositivos", "rating": 5}
                    ]
                },
                {
                    "client": clients[1],
                    "project": projects[3],
                    "claim_type": "Datos desactualizados en dashboard",
                    "priority": "Media",
                    "severity": "S3 - Medio",
                    "description": "Los gráficos muestran información con 24 horas de retraso.",
                    "created_offset_days": 240,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 1, "action": "assign_area", "area_idx": 1, "sub_area": "Backend"},
                        {"days": 3, "action": "status", "status": "En Proceso"},
                        {"days": 4, "action": "action", "employee_idx": 1, "text": "Configurado proceso de sincronización en tiempo real"},
                        {"days": 6, "action": "client_feedback", "text": "Los datos ahora se actualizan cada hora, mucho mejor"},
                        {"days": 7, "action": "status", "status": "Resuelto", "resolution": "Se implementó un sistema de sincronización en tiempo real usando WebSockets y se configuró un proceso de actualización incremental cada 5 minutos para datos históricos."},
                        {"days": 8, "action": "final_feedback", "text": "Perfecto, ahora tenemos información actualizada", "rating": 4}
                    ]
                },
                {
                    "client": clients[1],
                    "project": projects[2],
                    "claim_type": "Problema con notificaciones push",
                    "priority": "Media",
                    "severity": "S3 - Medio",
                    "description": "Las notificaciones no llegan en iOS.",
                    "created_offset_days": 360,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 1, "action": "assign_area", "area_idx": 1, "sub_area": "Mobile"},
                        {"days": 2, "action": "status", "status": "En Proceso"},
                        {"days": 3, "action": "comment", "employee_idx": 1, "text": "Revisando certificados de Apple Push Notification"},
                        {"days": 4, "action": "action", "employee_idx": 1, "text": "Renovados certificados y actualizada configuración"},
                        {"days": 5, "action": "client_feedback", "text": "Funcionando correctamente ahora"},
                        {"days": 6, "action": "status", "status": "Resuelto", "resolution": "Se renovaron los certificados de Apple Push Notification Service (APNS) que habían expirado y se configuró un sistema de monitoreo para alertar 30 días antes de futuras expiraciones."},
                        {"days": 7, "action": "final_feedback", "text": "Todo en orden", "rating": 4}
                    ]
                },
                
                # Cliente 3 - 4 reclamos
                {
                    "client": clients[2],
                    "project": projects[4],
                    "claim_type": "Error en migración de base de datos",
                    "priority": "Alta",
                    "severity": "S1 - Crítico",
                    "description": "Algunos registros se perdieron durante la migración a la nube.",
                    "created_offset_days": 420,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 0.2, "action": "assign_area", "area_idx": 0, "sub_area": "Base de Datos"},
                        {"days": 0.5, "action": "status", "status": "En Proceso"},
                        {"days": 1, "action": "comment", "employee_idx": 0, "text": "URGENTE: Analizando backups y logs de migración"},
                        {"days": 1, "action": "client_feedback", "text": "Esto es crítico, necesitamos los datos recuperados YA"},
                        {"days": 2, "action": "action", "employee_idx": 0, "text": "Recuperando datos del backup y verificando integridad"},
                        {"days": 3, "action": "client_feedback", "text": "¿Cuántos registros faltan exactamente?"},
                        {"days": 3, "action": "comment", "employee_idx": 0, "text": "Identificados 1,247 registros faltantes. Proceso de recuperación al 60%"},
                        {"days": 4, "action": "action", "employee_idx": 0, "text": "Datos recuperados exitosamente. Ejecutando verificaciones de integridad"},
                        {"days": 5, "action": "status", "status": "Resuelto", "resolution": "Se recuperaron todos los 1,247 registros faltantes del backup del día anterior. Se identificó un problema en el script de migración que no manejaba correctamente registros con caracteres especiales. Se corrigió el script, se re-ejecutó la migración para los registros faltantes y se implementaron validaciones adicionales de integridad referencial."},
                        {"days": 6, "action": "final_feedback", "text": "Datos recuperados correctamente, pero fue muy estresante", "rating": 3}
                    ]
                },
                {
                    "client": clients[2],
                    "project": projects[5],
                    "claim_type": "Vulnerabilidad de seguridad detectada",
                    "priority": "Alta",
                    "severity": "S1 - Crítico",
                    "description": "Escáner de seguridad detectó vulnerabilidad SQL injection en endpoint de búsqueda.",
                    "created_offset_days": 500,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 0.1, "action": "assign_area", "area_idx": 2, "sub_area": "Auditoría"},
                        {"days": 0.5, "action": "status", "status": "En Proceso"},
                        {"days": 1, "action": "comment", "employee_idx": 2, "text": "Confirmada vulnerabilidad. Aplicando parche de emergencia"},
                        {"days": 1, "action": "action", "employee_idx": 2, "text": "Endpoint vulnerable deshabilitado temporalmente"},
                        {"days": 2, "action": "client_feedback", "text": "¿Hubo algún acceso no autorizado?"},
                        {"days": 2, "action": "comment", "employee_idx": 2, "text": "Revisando logs. No se detectaron intentos de explotación"},
                        {"days": 3, "action": "action", "employee_idx": 2, "text": "Implementadas consultas parametrizadas y validación de entrada"},
                        {"days": 4, "action": "status", "status": "Resuelto", "resolution": "Se corrigió la vulnerabilidad SQL injection implementando consultas parametrizadas (prepared statements) en todos los endpoints. Se realizó una auditoría completa del código y no se encontraron evidencias de explotación. Se implementó un WAF (Web Application Firewall) adicional y se configuraron alertas de seguridad."},
                        {"days": 5, "action": "final_feedback", "text": "Respuesta rápida y profesional, gracias", "rating": 5}
                    ]
                },
                {
                    "client": clients[2],
                    "project": projects[4],
                    "claim_type": "Latencia alta en consultas",
                    "priority": "Media",
                    "severity": "S2 - Alto",
                    "description": "Después de la migración, las consultas tardan mucho más.",
                    "created_offset_days": 600,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 1, "action": "assign_area", "area_idx": 0, "sub_area": "Servidores"},
                        {"days": 2, "action": "status", "status": "En Proceso"},
                        {"days": 3, "action": "comment", "employee_idx": 0, "text": "Analizando métricas de rendimiento del servidor"},
                        {"days": 4, "action": "change_area", "area_idx": 0, "reason": "Requiere optimización de base de datos", "sub_area": "Base de Datos"},
                        {"days": 5, "action": "action", "employee_idx": 0, "text": "Creando índices faltantes y optimizando queries"},
                        {"days": 7, "action": "client_feedback", "text": "Veo mejoras significativas"},
                        {"days": 8, "action": "status", "status": "Resuelto", "resolution": "Se identificó que faltaban índices críticos después de la migración. Se crearon 15 índices optimizados, se ajustó el pool de conexiones y se habilitó el query caching. El tiempo de respuesta promedio mejoró en un 85%."},
                        {"days": 9, "action": "final_feedback", "text": "Excelente optimización", "rating": 5}
                    ]
                },
                {
                    "client": clients[2],
                    "project": projects[5],
                    "claim_type": "Timeout en autenticación OAuth",
                    "priority": "Baja",
                    "severity": "S4 - Bajo",
                    "description": "Ocasionalmente el login con proveedores externos falla por timeout.",
                    "created_offset_days": 680,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 2, "action": "assign_area", "area_idx": 2, "sub_area": "Compliance"},
                        {"days": 4, "action": "status", "status": "En Proceso"},
                        {"days": 5, "action": "action", "employee_idx": 2, "text": "Aumentado timeout y agregado reintentos"},
                        {"days": 7, "action": "status", "status": "Resuelto", "resolution": "Se incrementó el timeout de 30s a 60s y se implementó un sistema de reintentos automáticos con backoff exponencial. También se agregó una UI de carga para mejorar la experiencia del usuario durante la autenticación."},
                        {"days": 8, "action": "final_feedback", "text": "Problema solucionado", "rating": 4}
                    ]
                },
                
                # Reclamos EN PROCESO (sin resolver)
                {
                    "client": clients[0],
                    "project": projects[0],
                    "claim_type": "Bug en módulo de reportes",
                    "priority": "Alta",
                    "severity": "S2 - Alto",
                    "description": "Los reportes generados muestran información incorrecta en algunas secciones. Datos de ventas no coinciden con registros.",
                    "created_offset_days": 720,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 1, "action": "assign_area", "area_idx": 1, "sub_area": "Backend"},
                        {"days": 2, "action": "status", "status": "En Proceso"},
                        {"days": 3, "action": "comment", "employee_idx": 1, "text": "Investigando origen de los datos incorrectos"},
                        {"days": 5, "action": "client_feedback", "text": "El problema persiste, necesitamos los reportes correctos urgente"},
                        {"days": 7, "action": "action", "employee_idx": 1, "text": "Identificado problema en agregación de datos. Trabajando en la corrección"}
                    ]
                },
                {
                    "client": clients[0],
                    "project": projects[1],
                    "claim_type": "Falla en módulo de pagos",
                    "priority": "Alta",
                    "severity": "S1 - Crítico",
                    "description": "El sistema rechaza algunos pagos válidos. Los clientes reportan que sus tarjetas son rechazadas sin motivo.",
                    "created_offset_days": 725,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 0.5, "action": "assign_area", "area_idx": 2, "sub_area": "Auditoría"},
                        {"days": 1, "action": "status", "status": "En Proceso"},
                        {"days": 1, "action": "comment", "employee_idx": 2, "text": "Revisando logs de transacciones y reglas de validación"},
                        {"days": 2, "action": "client_feedback", "text": "Esto es crítico, estamos perdiendo ventas"},
                        {"days": 3, "action": "action", "employee_idx": 2, "text": "Encontrado regex mal configurado en validación de tarjetas. Preparando fix"}
                    ]
                },
                {
                    "client": clients[1],
                    "project": projects[2],
                    "claim_type": "App se congela al subir imágenes grandes",
                    "priority": "Media",
                    "severity": "S3 - Medio",
                    "description": "Cuando los usuarios intentan subir fotos de más de 5MB la aplicación se congela y hay que reiniciarla.",
                    "created_offset_days": 715,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 1, "action": "assign_area", "area_idx": 1, "sub_area": "Mobile"},
                        {"days": 2, "action": "status", "status": "En Proceso"},
                        {"days": 3, "action": "comment", "employee_idx": 1, "text": "Reproducido el error. Problema en proceso de compresión"},
                        {"days": 5, "action": "action", "employee_idx": 1, "text": "Implementando compresión progresiva y límite de tamaño"},
                        {"days": 8, "action": "client_feedback", "text": "¿Tienen alguna actualización? Los usuarios siguen reportando el problema"}
                    ]
                },
                {
                    "client": clients[1],
                    "project": projects[3],
                    "claim_type": "Gráficos no se actualizan en tiempo real",
                    "priority": "Media",
                    "severity": "S3 - Medio",
                    "description": "Los gráficos del dashboard no reflejan cambios hasta refrescar manualmente la página.",
                    "created_offset_days": 710,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 2, "action": "assign_area", "area_idx": 1, "sub_area": "Frontend"},
                        {"days": 3, "action": "status", "status": "En Proceso"},
                        {"days": 4, "action": "comment", "employee_idx": 1, "text": "Revisando implementación de WebSocket"},
                        {"days": 6, "action": "action", "employee_idx": 1, "text": "Encontrado problema en reconexión de WebSocket. Aplicando fix"}
                    ]
                },
                {
                    "client": clients[2],
                    "project": projects[4],
                    "claim_type": "Backup automático falla intermitentemente",
                    "priority": "Alta",
                    "severity": "S2 - Alto",
                    "description": "Los backups automáticos programados a veces no se ejecutan. Preocupación por pérdida de datos.",
                    "created_offset_days": 728,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 0.5, "action": "assign_area", "area_idx": 0, "sub_area": "Servidores"},
                        {"days": 1, "action": "status", "status": "En Proceso"},
                        {"days": 1, "action": "comment", "employee_idx": 0, "text": "URGENTE: Revisando configuración de cron jobs y logs del sistema"},
                        {"days": 2, "action": "client_feedback", "text": "Esto es muy preocupante, necesitamos garantía de nuestros datos"}
                    ]
                },
                {
                    "client": clients[2],
                    "project": projects[5],
                    "claim_type": "Rate limiting muy agresivo en API",
                    "priority": "Media",
                    "severity": "S3 - Medio",
                    "description": "El rate limiting de la API bloquea peticiones legítimas. Usuarios reportan errores 429 frecuentemente.",
                    "created_offset_days": 722,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 1, "action": "assign_area", "area_idx": 1, "sub_area": "Backend"},
                        {"days": 2, "action": "status", "status": "En Proceso"},
                        {"days": 3, "action": "comment", "employee_idx": 1, "text": "Analizando patrones de uso y configuración actual de límites"},
                        {"days": 5, "action": "action", "employee_idx": 1, "text": "Ajustando límites según análisis de tráfico real"},
                        {"days": 6, "action": "client_feedback", "text": "Seguimos teniendo problemas en horas pico"}
                    ]
                },
                {
                    "client": clients[0],
                    "project": projects[0],
                    "claim_type": "Error al exportar datos a Excel",
                    "priority": "Baja",
                    "severity": "S4 - Bajo",
                    "description": "La función de exportar a Excel genera archivos corruptos cuando hay caracteres especiales.",
                    "created_offset_days": 705,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 2, "action": "assign_area", "area_idx": 1, "sub_area": "Backend"},
                        {"days": 4, "action": "status", "status": "En Proceso"},
                        {"days": 5, "action": "comment", "employee_idx": 1, "text": "Reproducido el problema. Issue con encoding de caracteres especiales"}
                    ]
                },
                
                # Reclamos INGRESADOS (recién creados, sin asignar)
                {
                    "client": clients[0],
                    "project": projects[1],
                    "claim_type": "Botón de guardar no responde",
                    "priority": "Media",
                    "severity": "S3 - Medio",
                    "description": "En el módulo de configuración, el botón guardar no responde al hacer clic. Hay que refrescar la página.",
                    "created_offset_days": 729,
                    "flow": [
                        {"days": 0, "action": "created"}
                    ]
                },
                {
                    "client": clients[1],
                    "project": projects[2],
                    "claim_type": "Error 404 en página de perfil",
                    "priority": "Alta",
                    "severity": "S2 - Alto",
                    "description": "Los usuarios no pueden acceder a su página de perfil. Muestra error 404 constantemente.",
                    "created_offset_days": 729,
                    "flow": [
                        {"days": 0, "action": "created"}
                    ]
                },
                {
                    "client": clients[2],
                    "project": projects[4],
                    "claim_type": "Logs de auditoría incompletos",
                    "priority": "Alta",
                    "severity": "S2 - Alto",
                    "description": "Los logs de auditoría no están registrando todas las acciones de los usuarios. Faltan registros críticos.",
                    "created_offset_days": 729,
                    "flow": [
                        {"days": 0, "action": "created"}
                    ]
                },
                {
                    "client": clients[1],
                    "project": projects[3],
                    "claim_type": "Filtros del dashboard no funcionan",
                    "priority": "Baja",
                    "severity": "S4 - Bajo",
                    "description": "Los filtros de fecha en el dashboard no se aplican correctamente. Muestran datos sin filtrar.",
                    "created_offset_days": 728,
                    "flow": [
                        {"days": 0, "action": "created"}
                    ]
                },
                
                # Más reclamos EN PROCESO con diferentes niveles de avance
                {
                    "client": clients[0],
                    "project": projects[0],
                    "claim_type": "Performance degradado en búsquedas",
                    "priority": "Media",
                    "severity": "S3 - Medio",
                    "description": "Las búsquedas en el sistema tardan más de 10 segundos en responder con grandes volúmenes de datos.",
                    "created_offset_days": 718,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 1, "action": "assign_area", "area_idx": 0, "sub_area": "Base de Datos"},
                        {"days": 2, "action": "status", "status": "En Proceso"},
                        {"days": 3, "action": "comment", "employee_idx": 0, "text": "Analizando queries lentas y plan de ejecución"},
                        {"days": 5, "action": "action", "employee_idx": 0, "text": "Agregando índices y optimizando queries"},
                        {"days": 7, "action": "client_feedback", "text": "Veo mejoras pero aún hay lentitud en algunas búsquedas"},
                        {"days": 9, "action": "comment", "employee_idx": 0, "text": "Implementando paginación y caché de resultados"}
                    ]
                },
                {
                    "client": clients[1],
                    "project": projects[2],
                    "claim_type": "Notificaciones duplicadas",
                    "priority": "Baja",
                    "severity": "S4 - Bajo",
                    "description": "Los usuarios reciben notificaciones duplicadas para el mismo evento.",
                    "created_offset_days": 712,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 1, "action": "assign_area", "area_idx": 1, "sub_area": "Backend"},
                        {"days": 3, "action": "status", "status": "En Proceso"},
                        {"days": 4, "action": "comment", "employee_idx": 1, "text": "Identificado problema en el queue de notificaciones"}
                    ]
                },
                {
                    "client": clients[2],
                    "project": projects[5],
                    "claim_type": "Validación de formularios inconsistente",
                    "priority": "Media",
                    "severity": "S3 - Medio",
                    "description": "Algunos formularios validan en el frontend pero no en el backend, permitiendo datos inválidos.",
                    "created_offset_days": 724,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 1, "action": "assign_area", "area_idx": 1, "sub_area": "Backend"},
                        {"days": 1, "action": "status", "status": "En Proceso"},
                        {"days": 2, "action": "comment", "employee_idx": 1, "text": "Revisando todas las validaciones del backend"},
                        {"days": 3, "action": "action", "employee_idx": 1, "text": "Implementando validaciones faltantes"},
                        {"days": 4, "action": "client_feedback", "text": "Aún veo algunos campos sin validar correctamente"}
                    ]
                },
                
                # Más reclamos RESUELTOS con diferentes calificaciones
                {
                    "client": clients[0],
                    "project": projects[1],
                    "claim_type": "Error en cálculo de impuestos",
                    "priority": "Alta",
                    "severity": "S1 - Crítico",
                    "description": "El sistema calcula incorrectamente los impuestos en algunas transacciones específicas.",
                    "created_offset_days": 650,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 0.5, "action": "assign_area", "area_idx": 1, "sub_area": "Backend"},
                        {"days": 1, "action": "status", "status": "En Proceso"},
                        {"days": 1, "action": "comment", "employee_idx": 1, "text": "URGENTE: Revisando lógica de cálculo de impuestos"},
                        {"days": 2, "action": "action", "employee_idx": 1, "text": "Identificado error en regla de impuestos especiales"},
                        {"days": 2, "action": "client_feedback", "text": "Esto está afectando nuestras facturas, necesitamos solución YA"},
                        {"days": 3, "action": "action", "employee_idx": 1, "text": "Corrección aplicada y testeada con todos los escenarios"},
                        {"days": 4, "action": "status", "status": "Resuelto", "resolution": "Se corrigió el error en la regla de cálculo de impuestos especiales para transacciones con descuentos aplicados. Se ejecutó un script para recalcular las facturas afectadas del último mes y se agregaron tests automatizados para prevenir regresiones."},
                        {"days": 5, "action": "final_feedback", "text": "Problema resuelto rápidamente, excelente", "rating": 5}
                    ]
                },
                {
                    "client": clients[1],
                    "project": projects[3],
                    "claim_type": "Memoria del servidor se llena",
                    "priority": "Alta",
                    "severity": "S2 - Alto",
                    "description": "El servidor alcanza el 100% de uso de memoria y requiere reinicio cada pocos días.",
                    "created_offset_days": 550,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 1, "action": "assign_area", "area_idx": 0, "sub_area": "Servidores"},
                        {"days": 2, "action": "status", "status": "En Proceso"},
                        {"days": 2, "action": "comment", "employee_idx": 0, "text": "Monitoreando uso de memoria y analizando posibles memory leaks"},
                        {"days": 3, "action": "action", "employee_idx": 0, "text": "Identificado memory leak en proceso de generación de reportes"},
                        {"days": 4, "action": "client_feedback", "text": "El servidor se cayó nuevamente esta madrugada"},
                        {"days": 5, "action": "action", "employee_idx": 0, "text": "Aplicado fix y aumentada memoria disponible temporalmente"},
                        {"days": 7, "action": "status", "status": "Resuelto", "resolution": "Se corrigió el memory leak en el módulo de reportes que no liberaba memoria correctamente. Se aumentó la RAM del servidor de 8GB a 16GB como medida preventiva y se configuró monitoreo automático con alertas."},
                        {"days": 8, "action": "final_feedback", "text": "Lleva 3 días estable, parece resuelto", "rating": 4}
                    ]
                },
                {
                    "client": clients[2],
                    "project": projects[4],
                    "claim_type": "Sincronización de datos falla",
                    "priority": "Media",
                    "severity": "S3 - Medio",
                    "description": "La sincronización automática entre sistemas falla ocasionalmente dejando datos desactualizados.",
                    "created_offset_days": 620,
                    "flow": [
                        {"days": 0, "action": "created"},
                        {"days": 1, "action": "assign_area", "area_idx": 1, "sub_area": "Backend"},
                        {"days": 2, "action": "status", "status": "En Proceso"},
                        {"days": 3, "action": "comment", "employee_idx": 1, "text": "Revisando logs de sincronización"},
                        {"days": 4, "action": "action", "employee_idx": 1, "text": "Encontrados errores de timeout en la sincronización"},
                        {"days": 5, "action": "client_feedback", "text": "¿Cuándo estará solucionado? Los datos no coinciden"},
                        {"days": 6, "action": "action", "employee_idx": 1, "text": "Implementando reintentos y mejor manejo de errores"},
                        {"days": 8, "action": "status", "status": "Resuelto", "resolution": "Se implementó un sistema de reintentos con backoff exponencial, se aumentó el timeout de 30s a 60s y se agregó un mecanismo de cola para reintentar sincronizaciones fallidas. También se implementó logging detallado y alertas en tiempo real."},
                        {"days": 9, "action": "final_feedback", "text": "Funciona correctamente ahora", "rating": 4}
                    ]
                }
            ]
            
            # Procesar cada reclamo
            for idx, claim_data in enumerate(claims_data, 1):
                self.stdout.write(f"\n  📋 Procesando reclamo {idx}/{len(claims_data)}: {claim_data['claim_type']}")
                
                # Crear reclamo con fecha ajustada
                created_date = base_date + timedelta(days=claim_data["created_offset_days"])
                
                claim = create_claim(
                    project_id=claim_data["project"]["id"],
                    claim_type=claim_data["claim_type"],
                    priority=claim_data["priority"],
                    severity=claim_data["severity"],
                    description=claim_data["description"],
                    created_by=claim_data["client"]["id"]
                )
                
                # Actualizar fecha de creación manualmente
                from claims.db import get_main_db, get_audit_db
                from claims.repositories import to_object_id
                get_main_db().claims.update_one(
                    {"_id": to_object_id(claim["id"])},
                    {"$set": {
                        "created_at": created_date,
                        "updated_at": created_date
                    }}
                )
                
                # Actualizar también el evento "created" (en la base de datos de auditoría)
                created_event = get_audit_db().claim_events.find_one(
                    {"claim_id": to_object_id(claim["id"]), "action": "created"}
                )
                if created_event:
                    get_audit_db().claim_events.update_one(
                        {"_id": created_event["_id"]},
                        {"$set": {"created_at": created_date}}
                    )
                
                # Recargar el reclamo actualizado
                claim_doc = get_main_db().claims.find_one({"_id": to_object_id(claim["id"])})
                claim_doc["id"] = str(claim_doc.pop("_id"))
                claim = claim_doc
                
                self.stdout.write(f"    ✓ Reclamo creado: {claim['id']}")
                
                # Procesar flujo de eventos
                for event in claim_data["flow"]:
                    event_date = created_date + timedelta(days=event["days"])
                    
                    # Recargar claim antes de cada operación para evitar problemas
                    claim_doc = get_main_db().claims.find_one({"_id": to_object_id(claim["id"])})
                    if claim_doc:
                        claim_doc["id"] = str(claim_doc.pop("_id"))
                        claim = claim_doc
                    
                    if event["action"] == "assign_area":
                        area = areas[event["area_idx"]]
                        sub_area = event.get("sub_area", "")
                        
                        admin = get_user_by_email("admin@example.com")
                        updated_claim = update_claim_with_rules(
                            claim=claim,
                            actor_id=admin["id"],
                            actor_role="admin",
                            area_id=area["id"],
                            sub_area=sub_area
                        )
                        claim = updated_claim
                        
                        # Actualizar fechas de los eventos de asignación de área
                        # Puede crear area_changed y/o sub_area_changed
                        area_events = list(get_audit_db().claim_events.find(
                            {
                                "claim_id": to_object_id(claim["id"]), 
                                "action": {"$in": ["area_changed", "sub_area_changed", "area_assigned"]}
                            }
                        ).sort("created_at", -1).limit(2))
                        
                        for evt in area_events:
                            get_audit_db().claim_events.update_one(
                                {"_id": evt["_id"]},
                                {"$set": {"created_at": event_date}}
                            )
                        
                        # Actualizar última modificación del reclamo
                        get_main_db().claims.update_one(
                            {"_id": to_object_id(claim["id"])},
                            {"$set": {"updated_at": event_date}}
                        )
                        
                        self.stdout.write(f"    ✓ Área asignada: {area['name']} / {sub_area}")
                        
                    elif event["action"] == "change_area":
                        area = areas[event["area_idx"]]
                        sub_area = event.get("sub_area", "")
                        reason = event.get("reason", "")
                        
                        admin = get_user_by_email("admin@example.com")
                        updated_claim = update_claim_with_rules(
                            claim=claim,
                            actor_id=admin["id"],
                            actor_role="admin",
                            area_id=area["id"],
                            sub_area=sub_area,
                            reason=reason
                        )
                        claim = updated_claim
                        
                        # Actualizar fecha del evento de cambio de área
                        last_event = get_audit_db().claim_events.find_one(
                            {"claim_id": to_object_id(claim["id"]), "action": "area_changed"},
                            sort=[("created_at", -1)]
                        )
                        if last_event:
                            get_audit_db().claim_events.update_one(
                                {"_id": last_event["_id"]},
                                {"$set": {"created_at": event_date}}
                            )
                        
                        # También actualizar sub_area_changed si existe
                        last_sub_area_event = get_audit_db().claim_events.find_one(
                            {"claim_id": to_object_id(claim["id"]), "action": "sub_area_changed"},
                            sort=[("created_at", -1)]
                        )
                        if last_sub_area_event:
                            get_audit_db().claim_events.update_one(
                                {"_id": last_sub_area_event["_id"]},
                                {"$set": {"created_at": event_date}}
                            )
                        
                        # Actualizar última modificación del reclamo
                        get_main_db().claims.update_one(
                            {"_id": to_object_id(claim["id"])},
                            {"$set": {"updated_at": event_date}}
                        )
                        
                        self.stdout.write(f"    ✓ Área cambiada a: {area['name']} / {sub_area}")
                        
                    elif event["action"] == "status":
                        admin = get_user_by_email("admin@example.com")
                        resolution_desc = event.get("resolution")
                        
                        updated_claim = update_claim_with_rules(
                            claim=claim,
                            actor_id=admin["id"],
                            actor_role="admin",
                            status=event["status"],
                            resolution_description=resolution_desc
                        )
                        claim = updated_claim
                        
                        # Actualizar fecha del evento de cambio de estado
                        last_event = get_audit_db().claim_events.find_one(
                            {"claim_id": to_object_id(claim["id"]), "action": "status_changed"},
                            sort=[("created_at", -1)]
                        )
                        if last_event:
                            get_audit_db().claim_events.update_one(
                                {"_id": last_event["_id"]},
                                {"$set": {"created_at": event_date}}
                            )
                        
                        # Actualizar última modificación del reclamo
                        get_main_db().claims.update_one(
                            {"_id": to_object_id(claim["id"])},
                            {"$set": {"updated_at": event_date}}
                        )
                        
                        # Si es resuelto, actualizar también resolved_at
                        if event["status"] == "Resuelto":
                            get_main_db().claims.update_one(
                                {"_id": to_object_id(claim["id"])},
                                {"$set": {"resolved_at": event_date}}
                            )
                        
                        self.stdout.write(f"    ✓ Estado cambiado a: {event['status']}")
                        
                    elif event["action"] == "comment":
                        employee = employees[event["employee_idx"]]
                        add_claim_comment(
                            claim_id=claim["id"],
                            actor_id=employee["id"],
                            actor_role="employee",
                            comment=event["text"]
                        )
                        # Actualizar fecha del comentario
                        last_comment = get_audit_db().claim_events.find_one(
                            {"claim_id": to_object_id(claim["id"]), "action": "comment"},
                            sort=[("created_at", -1)]
                        )
                        if last_comment:
                            get_audit_db().claim_events.update_one(
                                {"_id": last_comment["_id"]},
                                {"$set": {"created_at": event_date}}
                            )
                        self.stdout.write(f"    ✓ Comentario agregado")
                        
                    elif event["action"] == "action":
                        employee = employees[event["employee_idx"]]
                        add_claim_action(
                            claim_id=claim["id"],
                            actor_id=employee["id"],
                            actor_role="employee",
                            action_description=event["text"]
                        )
                        # Actualizar fecha de la acción
                        last_action = get_audit_db().claim_events.find_one(
                            {"claim_id": to_object_id(claim["id"]), "action": "action_logged"},
                            sort=[("created_at", -1)]
                        )
                        if last_action:
                            get_audit_db().claim_events.update_one(
                                {"_id": last_action["_id"]},
                                {"$set": {"created_at": event_date}}
                            )
                        self.stdout.write(f"    ✓ Acción registrada")
                        
                    elif event["action"] == "client_feedback":
                        submit_client_feedback(
                            claim_id=claim["id"],
                            client_id=claim_data["client"]["id"],
                            rating=None,
                            feedback=event["text"]
                        )
                        # Actualizar fecha del mensaje
                        last_message = get_main_db().client_feedback_messages.find_one(
                            {"claim_id": to_object_id(claim["id"]), "type": "progress"},
                            sort=[("created_at", -1)]
                        )
                        if last_message:
                            get_main_db().client_feedback_messages.update_one(
                                {"_id": last_message["_id"]},
                                {"$set": {"created_at": event_date}}
                            )
                        self.stdout.write(f"    ✓ Mensaje del cliente")
                        
                    elif event["action"] == "final_feedback":
                        submit_client_feedback(
                            claim_id=claim["id"],
                            client_id=claim_data["client"]["id"],
                            rating=event["rating"],
                            feedback=event["text"]
                        )
                        # Actualizar fecha del mensaje final
                        last_final = get_main_db().client_feedback_messages.find_one(
                            {"claim_id": to_object_id(claim["id"]), "type": "final"},
                            sort=[("created_at", -1)]
                        )
                        if last_final:
                            get_main_db().client_feedback_messages.update_one(
                                {"_id": last_final["_id"]},
                                {"$set": {"created_at": event_date}}
                            )
                        self.stdout.write(f"    ✓ Feedback final con calificación: {event['rating']} estrellas")

            self.stdout.write(self.style.SUCCESS("\n\n✅ Base de datos poblada exitosamente!"))
            self.stdout.write("\n📊 Resumen:")
            self.stdout.write(f"  • {len(areas)} áreas creadas")
            self.stdout.write(f"  • {len(employees)} empleados creados")
            self.stdout.write(f"  • {len(clients)} clientes creados")
            self.stdout.write(f"  • {len(projects)} proyectos creados")
            self.stdout.write(f"  • {len(claims_data)} reclamos con flujo completo")
            self.stdout.write("\n🔐 Credenciales de acceso:")
            self.stdout.write("  Admin: admin@example.com / admin123")
            self.stdout.write("  Empleados: [nombre]@empresa.com / empleado123")
            self.stdout.write("  Clientes: Ver emails arriba / cliente123")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n❌ Error: {str(e)}"))
            raise
