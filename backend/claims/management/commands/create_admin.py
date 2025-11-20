from django.core.management.base import BaseCommand, CommandError

from claims.repositories import create_user, get_user_by_email


class Command(BaseCommand):
    help = "Crea un usuario Admin en MongoDB (solo si no existe el email)"

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True, help="Email del admin")
        parser.add_argument("--password", required=True, help="Contraseña del admin")
        parser.add_argument("--full-name", default="", help="Nombre completo (opcional)")

    def handle(self, *args, **options):
        email = options["email"].lower().strip()
        password = options["password"]
        full_name = options.get("full_name", "")

        if get_user_by_email(email):
            raise CommandError("Ya existe un usuario con ese email")

        user = create_user(role="admin", email=email, password=password, full_name=full_name)
        self.stdout.write(self.style.SUCCESS(f"Admin creado con id {user['id']} y email {email}"))
