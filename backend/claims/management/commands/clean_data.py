from django.core.management.base import BaseCommand
from claims.db import get_main_db


class Command(BaseCommand):
    help = "Limpia todos los datos excepto el usuario admin"

    def handle(self, *args, **options):
        self.stdout.write("🧹 Iniciando limpieza de base de datos...")

        try:
            db = get_main_db()
            
            # Eliminar todos los reclamos
            result = db.claims.delete_many({})
            self.stdout.write(f"  ✓ {result.deleted_count} reclamos eliminados")
            
            # Eliminar todos los eventos de reclamos
            result = db.claim_events.delete_many({})
            self.stdout.write(f"  ✓ {result.deleted_count} eventos de reclamos eliminados")
            
            # Eliminar todos los mensajes de feedback
            result = db.client_feedback_messages.delete_many({})
            self.stdout.write(f"  ✓ {result.deleted_count} mensajes de feedback eliminados")
            
            # Eliminar todos los proyectos
            result = db.projects.delete_many({})
            self.stdout.write(f"  ✓ {result.deleted_count} proyectos eliminados")
            
            # Eliminar todas las áreas
            result = db.areas.delete_many({})
            self.stdout.write(f"  ✓ {result.deleted_count} áreas eliminadas")
            
            # Eliminar todos los usuarios excepto admin
            result = db.users.delete_many({"email": {"$ne": "admin@example.com"}})
            self.stdout.write(f"  ✓ {result.deleted_count} usuarios eliminados (admin conservado)")
            
            self.stdout.write(self.style.SUCCESS("\n✅ Limpieza completada exitosamente!"))
            self.stdout.write("Ahora puedes ejecutar: python manage.py populate_db")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n❌ Error: {str(e)}"))
            raise
