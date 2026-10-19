# Laboratorio V2S para Cortex

Servidor MCP auxiliar independiente de LibreChat. **Todos los hosts, IP, alertas, jobs, runbooks y valores son inventados.** La instantánea está fijada en `2026-10-20T09:00:00Z`; no consulta V2S, no incorpora datos personales del Centro de Mando y no modifica infraestructura.

El caso sigue los temas de la reunión: monitorización Zabbix, copias y análisis de logs de firewall. Un datastore compartido con 93,4 % de ocupación y latencia de escritura elevada coincide con lentitud de una VM ERP y un backup fallido. CPU, DNS y red aportan controles para evitar atribuir todo a una sola causa. El último backup del ERP supera el RPO objetivo. Los bloqueos SSH WAN son un segundo incidente independiente: no hay evidencia de intrusión en la muestra. Las dependencias y el solapamiento temporal permiten formular hipótesis, no demostrar causas ni predecir averías.

## Arranque

Desde la raíz del repositorio:

```bash
docker build -t cortex-v2s-mock cortex/demo
docker run --rm -p 127.0.0.1:8000:8000 cortex-v2s-mock
```

En la red de Compose el endpoint es `http://v2s-mock:8000/mcp`, transporte **streamable HTTP**. Salud: `GET /health`. No necesita claves externas. Debe permanecer en la red interna del stack o enlazado a localhost.

Desarrollo y comprobación:

```bash
cd cortex/demo
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python test_demo.py
.venv/bin/python server.py
# En otra terminal, prueba el transporte HTTP real:
.venv/bin/python test_demo.py http://127.0.0.1:8000/mcp
```

FastMCP y todas las dependencias transitivas están fijadas en `requirements.txt`. Documentación del transporte: [FastMCP HTTP](https://github.com/PrefectHQ/fastmcp/blob/main/docs/deployment/http.mdx).

## Herramientas

| Herramienta | Evidencia |
| --- | --- |
| `zabbix_inventory` | 7 hosts con servicios, dependencias y métricas |
| `zabbix_alerts` | Alertas abiertas con ID, fecha, valor y umbral |
| `zabbix_history` | Serie horaria de 1–72 horas, unidades y cambio observado |
| `backup_jobs` | Último éxito, RPO objetivo y pruebas de restauración |
| `pfsense_logs` | Logs filtrables por acción, origen y puerto, con límites explícitos |
| `service_dependencies` | Dependencias directas, afectados potenciales y alertas |
| `search_runbooks` | Pasos de revisión, evidencias e interlocutor de escalado |

Todas declaran `readOnlyHint=true` y `destructiveHint=false`. No existen herramientas para ejecutar comandos, cambiar firewall, borrar snapshots, lanzar backups o cerrar alertas.

## Guion sugerido

1. «Resume las alertas críticas y prioriza por servicio afectado. Cita IDs y distingue observaciones de hipótesis.»
2. «¿Qué relación podría haber entre almacenamiento, lentitud del ERP y copia fallida? Consulta histórico, dependencias y RPO. ¿Qué falta verificar?»
3. «Analiza los bloqueos SSH del firewall. ¿Hay conexiones permitidas? ¿Podemos afirmar que hubo intrusión?»
4. «Prepara un plan de revisión para el técnico usando los runbooks, sin ejecutar cambios.»

El scaffold TypeScript que existía sin fuentes se conserva en `legacy-scaffold/` como referencia. No forma parte de la imagen ni se usa en ejecución.
