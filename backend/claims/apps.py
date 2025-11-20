from django.apps import AppConfig


class ClaimsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'claims'

    def ready(self):
        # Ensure indexes are present when the app starts
        try:
            from .db import ensure_indexes

            ensure_indexes()
        except Exception:
            # Avoid startup failures if DB is unavailable; logs can be added later
            pass
