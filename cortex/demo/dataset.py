"""Fixed, invented telemetry. Nothing in this module describes a real V2S system."""
from datetime import datetime, timedelta

SNAPSHOT = '2026-10-20T09:00:00Z'
HOSTS = [
    {'id': 'san-01', 'name': 'V2S-LAB-SAN01', 'site': 'Barcelona · laboratorio', 'kind': 'storage', 'service': 'Datastore compartido', 'ip': '10.42.10.10', 'status': 'warning', 'dependencies': [], 'owner': 'Infraestructura', 'metrics': ['disk_used_pct', 'read_latency_ms', 'write_latency_ms', 'temperature_c']},
    {'id': 'hv-01', 'name': 'V2S-LAB-HV01', 'site': 'Barcelona · laboratorio', 'kind': 'hypervisor', 'service': 'Virtualización', 'ip': '10.42.10.20', 'status': 'warning', 'dependencies': ['san-01'], 'owner': 'Infraestructura', 'metrics': ['cpu_pct', 'memory_pct', 'datastore_latency_ms']},
    {'id': 'erp-01', 'name': 'CLIENTE-DEMO-ERP01', 'site': 'Barcelona · laboratorio', 'kind': 'vm', 'service': 'ERP del cliente ficticio Atlas', 'ip': '10.42.20.31', 'status': 'warning', 'dependencies': ['hv-01', 'san-01', 'dc-01'], 'owner': 'Aplicaciones', 'metrics': ['cpu_pct', 'memory_pct', 'response_time_ms']},
    {'id': 'dc-01', 'name': 'CLIENTE-DEMO-DC01', 'site': 'Barcelona · laboratorio', 'kind': 'vm', 'service': 'Directorio y DNS', 'ip': '10.42.20.10', 'status': 'healthy', 'dependencies': ['hv-01', 'san-01'], 'owner': 'Sistemas', 'metrics': ['cpu_pct', 'memory_pct', 'dns_response_ms']},
    {'id': 'backup-01', 'name': 'V2S-LAB-BACKUP01', 'site': 'Barcelona · laboratorio', 'kind': 'backup', 'service': 'Repositorio de copias', 'ip': '10.42.30.10', 'status': 'warning', 'dependencies': ['san-01', 'fw-01'], 'owner': 'Continuidad', 'metrics': ['disk_used_pct', 'backup_duration_min', 'last_success_age_hours']},
    {'id': 'fw-01', 'name': 'V2S-LAB-PFSENSE01', 'site': 'Barcelona · laboratorio', 'kind': 'firewall', 'service': 'Perímetro y VPN', 'ip': '10.42.0.1', 'status': 'warning', 'dependencies': [], 'owner': 'Seguridad', 'metrics': ['cpu_pct', 'blocked_connections', 'vpn_sessions']},
    {'id': 'sw-01', 'name': 'V2S-LAB-SW01', 'site': 'Barcelona · laboratorio', 'kind': 'switch', 'service': 'Red de almacenamiento', 'ip': '10.42.10.2', 'status': 'healthy', 'dependencies': [], 'owner': 'Redes', 'metrics': ['port_utilization_pct', 'packet_loss_pct']},
]

ALERTS = [
    {'id': 'ZBX-1041', 'host_id': 'san-01', 'severity': 'high', 'started_at': '2026-10-20T08:10:00Z', 'title': 'Datastore por encima del 90 %', 'observed': '93.4 % ocupado; umbral configurado 90 %', 'status': 'open', 'runbook_id': 'RB-STORAGE'},
    {'id': 'ZBX-1042', 'host_id': 'san-01', 'severity': 'high', 'started_at': '2026-10-20T08:20:00Z', 'title': 'Latencia de escritura elevada', 'observed': '38 ms durante 40 minutos; umbral 20 ms', 'status': 'open', 'runbook_id': 'RB-STORAGE'},
    {'id': 'ZBX-1043', 'host_id': 'erp-01', 'severity': 'warning', 'started_at': '2026-10-20T08:25:00Z', 'title': 'ERP con respuesta lenta', 'observed': '1 450 ms frente a referencia de 280 ms', 'status': 'open', 'runbook_id': 'RB-ERP'},
    {'id': 'ZBX-1044', 'host_id': 'backup-01', 'severity': 'high', 'started_at': '2026-10-20T06:10:00Z', 'title': 'Copia del ERP no completada', 'observed': 'Job BK-ERP-DAILY: timeout leyendo disco origen; último éxito hace 30 h; RPO objetivo 24 h', 'status': 'open', 'runbook_id': 'RB-BACKUP'},
    {'id': 'ZBX-1045', 'host_id': 'fw-01', 'severity': 'warning', 'started_at': '2026-10-20T08:30:00Z', 'title': 'Aumento de conexiones bloqueadas en WAN', 'observed': '326 bloqueos/5 min a TCP/22 frente a referencia de 12; ninguna sesión permitida en esta muestra', 'status': 'open', 'runbook_id': 'RB-FIREWALL'},
]

METRIC_PROFILES = {
    'san-01': {'disk_used_pct': (86.1, 93.4, '%'), 'read_latency_ms': (4.2, 21.0, 'ms'), 'write_latency_ms': (5.1, 38.0, 'ms'), 'temperature_c': (41.0, 44.0, '°C')},
    'hv-01': {'cpu_pct': (29.0, 36.0, '%'), 'memory_pct': (68.0, 72.0, '%'), 'datastore_latency_ms': (4.0, 34.0, 'ms')},
    'erp-01': {'cpu_pct': (28.0, 31.0, '%'), 'memory_pct': (61.0, 64.0, '%'), 'response_time_ms': (280.0, 1450.0, 'ms')},
    'dc-01': {'cpu_pct': (12.0, 14.0, '%'), 'memory_pct': (48.0, 49.0, '%'), 'dns_response_ms': (7.0, 8.0, 'ms')},
    'backup-01': {'disk_used_pct': (71.0, 75.0, '%'), 'backup_duration_min': (42.0, 96.0, 'min'), 'last_success_age_hours': (6.0, 30.0, 'h')},
    'fw-01': {'cpu_pct': (15.0, 19.0, '%'), 'blocked_connections': (12.0, 326.0, 'connections/5min'), 'vpn_sessions': (18.0, 20.0, 'sessions')},
    'sw-01': {'port_utilization_pct': (32.0, 43.0, '%'), 'packet_loss_pct': (0.0, 0.0, '%')},
}

BACKUPS = [
    {'id': 'BK-ERP-DAILY', 'host_id': 'erp-01', 'repository_id': 'backup-01', 'status': 'failed', 'started_at': '2026-10-20T04:34:00Z', 'finished_at': '2026-10-20T06:10:00Z', 'last_success': '2026-10-19T03:00:00Z', 'last_success_age_hours': 30, 'rpo_target_hours': 24, 'error': 'Timeout leyendo disco origen en datastore san-01', 'restore_test': '2026-09-20 · correcto'},
    {'id': 'BK-DC-DAILY', 'host_id': 'dc-01', 'repository_id': 'backup-01', 'status': 'success', 'started_at': '2026-10-20T02:00:00Z', 'finished_at': '2026-10-20T02:18:00Z', 'last_success': '2026-10-20T02:18:00Z', 'last_success_age_hours': 6.7, 'rpo_target_hours': 24, 'error': None, 'restore_test': '2026-10-12 · correcto'},
]

FIREWALL_LOGS = [
    {'id': f'PF-{i:04}', 'timestamp': f'2026-10-20T08:{30 + i // 6:02}:{(i % 6) * 10:02}Z', 'host_id': 'fw-01', 'interface': 'WAN', 'action': 'block', 'source_ip': '203.0.113.42' if i % 3 else '198.51.100.24', 'destination_ip': '192.0.2.10', 'destination_port': 22, 'protocol': 'TCP', 'rule': 'WAN-default-deny', 'count': 11 if i < 26 else 10}
    for i in range(30)
] + [
    {'id': 'PF-0030', 'timestamp': '2026-10-20T08:45:00Z', 'host_id': 'fw-01', 'interface': 'VPN', 'action': 'pass', 'source_ip': '10.42.99.12', 'destination_ip': '10.42.20.31', 'destination_port': 443, 'protocol': 'TCP', 'rule': 'VPN-to-ERP-HTTPS', 'count': 4},
    {'id': 'PF-0031', 'timestamp': '2026-10-20T08:50:00Z', 'host_id': 'fw-01', 'interface': 'BACKUP', 'action': 'pass', 'source_ip': '10.42.30.10', 'destination_ip': '10.42.20.31', 'destination_port': 443, 'protocol': 'TCP', 'rule': 'BACKUP-to-VM', 'count': 8},
]

RUNBOOKS = [
    {'id': 'RB-STORAGE', 'title': 'Datastore lleno y latencia elevada', 'tags': ['storage', 'san', 'latencia', 'disco'], 'steps': ['Confirmar capacidad y latencia en consola del almacenamiento y Zabbix.', 'Revisar snapshots, crecimiento por VM y tareas de backup coincidentes; no borrar snapshots.', 'Comprobar errores de disco/controladora y red SAN antes de atribuir una causa.', 'Preparar propuesta de ampliación o limpieza con propietario, impacto y aprobación de cambio.'], 'evidence_to_collect': ['ZBX-1041', 'ZBX-1042', 'san-01/disk_used_pct', 'san-01/write_latency_ms'], 'escalate_to': 'Infraestructura · guardia de almacenamiento'},
    {'id': 'RB-ERP', 'title': 'Respuesta lenta del ERP', 'tags': ['erp', 'vm', 'rendimiento'], 'steps': ['Comparar tiempos de respuesta con CPU, memoria y latencia del datastore.', 'Verificar logs de aplicación y consultas de base de datos.', 'Comunicar degradación observada; el solapamiento temporal no demuestra causa raíz.'], 'evidence_to_collect': ['ZBX-1043', 'erp-01/response_time_ms', 'hv-01/datastore_latency_ms'], 'escalate_to': 'Aplicaciones e Infraestructura'},
    {'id': 'RB-BACKUP', 'title': 'Copia fallida y RPO excedido', 'tags': ['backup', 'rpo', 'copia', 'continuidad'], 'steps': ['Confirmar último punto recuperable y estado del repositorio.', 'Revisar el timeout del job y latencia del origen; verificar conectividad sin modificar firewall.', 'Notificar incumplimiento del RPO objetivo y acordar ventana para reintento.', 'Proponer prueba de restauración aislada con aprobación; no afirmar recuperabilidad sin probar.'], 'evidence_to_collect': ['BK-ERP-DAILY', 'ZBX-1044', 'PF-0031'], 'escalate_to': 'Continuidad y propietario del ERP'},
    {'id': 'RB-FIREWALL', 'title': 'Pico de bloqueos SSH en WAN', 'tags': ['firewall', 'pfsense', 'seguridad', 'ssh'], 'steps': ['Comparar IP origen, destino, puerto, reglas y volumen con línea base.', 'Buscar conexiones permitidas y evidencias en destino; un bloqueo no demuestra intrusión.', 'Comprobar si el origen corresponde a un escáner autorizado.', 'Escalar al responsable de seguridad si aparecen sesiones no autorizadas; proponer cambios para revisión humana.'], 'evidence_to_collect': ['ZBX-1045', 'PF-0000', 'PF-0001'], 'escalate_to': 'Seguridad · revisión humana'},
]


def history(host_id: str, metric: str, hours: int) -> tuple[str, list[dict]]:
    baseline, latest, unit = METRIC_PROFILES[host_id][metric]
    end = datetime.fromisoformat(SNAPSHOT.replace('Z', '+00:00'))
    points = []
    for offset in range(hours, -1, -1):
        timestamp = end - timedelta(hours=offset)
        progress = (72 - offset) / 72
        value = baseline + (latest - baseline) * max(0, progress)
        if metric.endswith('latency_ms') or metric == 'response_time_ms':
            value = baseline if offset > 1 else baseline + (latest - baseline) * (1 - offset / 2)
        if metric == 'blocked_connections':
            value = baseline if offset > 0 else latest
        points.append({'timestamp': timestamp.isoformat().replace('+00:00', 'Z'), 'value': round(value, 2)})
    return unit, points
