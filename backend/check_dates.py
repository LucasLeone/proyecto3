import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from claims.db import get_main_db

db = get_main_db()

print("\n📋 Primeros 3 reclamos:")
claims = list(db.claims.find().sort("created_at", 1).limit(3))
for claim in claims:
    print(f"  ID: {claim['_id']}")
    print(f"  Tipo: {claim['claim_type']}")
    print(f"  Created at: {claim['created_at']}")
    print(f"  Updated at: {claim['updated_at']}")
    print()

print("\n📅 Eventos del primer reclamo:")
if claims:
    first_claim_id = claims[0]['_id']
    print(f"  Buscando eventos para claim_id: {first_claim_id}")
    
    # Verificar en qué base de datos están los eventos
    from claims.db import get_audit_db
    audit_db = get_audit_db()
    
    events = list(audit_db.claim_events.find({"claim_id": first_claim_id}).sort("created_at", 1))
    print(f"  Total eventos encontrados: {len(events)}")
    
    for event in events:
        print(f"  Acción: {event['action']}")
        print(f"  Created at: {event.get('created_at', 'NO TIENE')}")
        print()
