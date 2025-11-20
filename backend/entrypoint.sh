#!/bin/sh

set -o errexit
set -o pipefail

python manage.py collectstatic --noinput

echo "Aplicando migraciones..."
until python manage.py migrate --noinput
do
  echo "Esperando a la base de datos..."
  sleep 2
done

echo "Iniciando servidor Django..."
exec "$@"