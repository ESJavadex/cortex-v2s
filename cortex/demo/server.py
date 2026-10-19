"""Read-only synthetic infrastructure MCP for the Cortex / V2S demonstration."""
import os
from typing import Annotated, Literal

from fastmcp import FastMCP
from pydantic import Field
from starlette.requests import Request
from starlette.responses import JSONResponse

from dataset import ALERTS, BACKUPS, FIREWALL_LOGS, HOSTS, METRIC_PROFILES, RUNBOOKS, SNAPSHOT, history

mcp = FastMCP(
    'Cortex · V2S laboratorio',
    instructions='DEMO: todos los datos son sintéticos, no son infraestructura real de V2S. '
    'Solo lectura. Cita IDs, fechas y valores. No presentes correlaciones como causas probadas, '
    'ni tendencias históricas como predicciones de fallo. No puedes ejecutar cambios ni resolver alertas. '
    f'Instantánea fija: {SNAPSHOT}; no representa el estado actual.',
)
READ_ONLY = {'readOnlyHint': True, 'destructiveHint': False, 'idempotentHint': True, 'openWorldHint': False}


def envelope(source: str, records: list, **extra) -> dict:
    return {'synthetic': True, 'environment': 'V2S · laboratorio ficticio', 'snapshot_at': SNAPSHOT,
            'source': source, 'read_only': True, 'count': len(records), 'records': records,
            'limitations': 'Muestra sintética fija. No demuestra causa raíz, intrusión ni fallo futuro.', **extra}


def require_host(host_id: str) -> dict:
    host = next((host for host in HOSTS if host['id'] == host_id), None)
    if host is None:
        raise ValueError(f'Host desconocido: {host_id}. Consulta zabbix_inventory para IDs válidos.')
    return host


@mcp.tool(annotations=READ_ONLY)
def zabbix_inventory(query: str = '') -> dict:
    """Inventario sintético: hosts, servicios, dependencias y nombres de métricas consultables."""
    query = query.casefold()
    return envelope('Zabbix mock · host.get', [host for host in HOSTS if query in str(host).casefold()])


@mcp.tool(annotations=READ_ONLY)
def zabbix_alerts(host_id: str = '', severity: Literal['all', 'high', 'warning'] = 'all') -> dict:
    """Alertas abiertas de la instantánea; incluye IDs, umbrales y runbook. Vacío = todos los hosts."""
    if host_id:
        require_host(host_id)
    return envelope('Zabbix mock · problem.get', [a for a in ALERTS if (not host_id or a['host_id'] == host_id) and (severity == 'all' or a['severity'] == severity)])


@mcp.tool(annotations=READ_ONLY)
def zabbix_history(host_id: str, metric: str, hours: Annotated[int, Field(ge=1, le=72)] = 24) -> dict:
    """Serie horaria sintética hasta snapshot_at (1–72 h). No extrapola ni predice. Métricas en inventario."""
    host = require_host(host_id)
    if metric not in METRIC_PROFILES[host_id]:
        raise ValueError(f'Métrica desconocida. Disponibles en {host_id}: {", ".join(host["metrics"])}')
    unit, points = history(host_id, metric, hours)
    return envelope('Zabbix mock · history.get', points, host_id=host_id, metric=metric, unit=unit,
                    resolution='1h · datos generados para demostración',
                    observed_change=round(points[-1]['value'] - points[0]['value'], 2))


@mcp.tool(annotations=READ_ONLY)
def backup_jobs(host_id: str = '') -> dict:
    """Estado sintético de copias, último éxito, RPO objetivo y prueba de restauración. No lanza jobs."""
    if host_id:
        require_host(host_id)
    return envelope('Monitor de copias mock', [b for b in BACKUPS if not host_id or b['host_id'] == host_id])


@mcp.tool(annotations=READ_ONLY)
def pfsense_logs(action: Literal['all', 'block', 'pass'] = 'all', source_ip: str = '',
                 destination_port: Annotated[int, Field(ge=0, le=65535)] = 0,
                 limit: Annotated[int, Field(ge=1, le=100)] = 50) -> dict:
    """Logs sintéticos pfSense de 08:30–08:50 UTC. IPs públicas reservadas para documentación. 0 = cualquier puerto."""
    matches = [log for log in FIREWALL_LOGS if (action == 'all' or log['action'] == action)
               and (not source_ip or log['source_ip'] == source_ip)
               and (not destination_port or log['destination_port'] == destination_port)]
    return envelope('pfSense mock · filterlog', matches[:limit], total_matches=len(matches),
                    truncated=len(matches) > limit, collection_window='2026-10-20T08:30:00Z/2026-10-20T08:50:00Z')


@mcp.tool(annotations=READ_ONLY)
def service_dependencies(host_id: str) -> dict:
    """Relaciones directas del inventario para evaluar alcance. Relación de dependencia no implica incidente causal."""
    host = require_host(host_id)
    upstream = [h for h in HOSTS if h['id'] in host['dependencies']]
    downstream = [h for h in HOSTS if host_id in h['dependencies']]
    return envelope('CMDB mock', [host], depends_on=upstream, direct_dependents=downstream,
                    related_alerts=[a for a in ALERTS if a['host_id'] in {host_id, *(h['id'] for h in downstream)}])


@mcp.tool(annotations=READ_ONLY)
def search_runbooks(query: str = '') -> dict:
    """Busca procedimientos sintéticos por ID, síntoma o tema; propone revisiones humanas, sin ejecutar acciones."""
    terms = query.casefold().split()
    return envelope('Base de conocimiento mock', [r for r in RUNBOOKS if all(term in str(r).casefold() for term in terms)])


@mcp.custom_route('/health', methods=['GET'])
async def health(request: Request) -> JSONResponse:
    return JSONResponse({'status': 'ok', 'synthetic': True, 'snapshot_at': SNAPSHOT, 'tools': 7})


if __name__ == '__main__':
    mcp.run(transport='http', host='0.0.0.0', port=int(os.environ.get('PORT', '8000')), path='/mcp')
