"""Integration checks against the actual FastMCP tool registry (no SDK mocks)."""
import asyncio
import sys
from fastmcp import Client
from fastmcp.exceptions import ToolError
from server import mcp


async def verify(target):
    async with Client(target) as client:
        tools = await client.list_tools()
        assert len(tools) == 7
        assert all(t.annotations.readOnlyHint and not t.annotations.destructiveHint for t in tools)
        async def call(name, args=None):
            result = await client.call_tool(name, args or {})
            assert result.data['synthetic'] is True
            assert result.data['read_only'] is True
            return result.data
        inventory = await call('zabbix_inventory')
        assert inventory['count'] == 7
        assert (await call('zabbix_inventory', {'query': 'no-such-host'}))['count'] == 0
        alerts = await call('zabbix_alerts', {'severity': 'high'})
        assert {a['id'] for a in alerts['records']} == {'ZBX-1041', 'ZBX-1042', 'ZBX-1044'}
        history = await call('zabbix_history', {'host_id': 'san-01', 'metric': 'disk_used_pct', 'hours': 72})
        assert history['count'] == 73
        assert history['records'][0]['value'] == 86.1
        assert history['records'][-1]['value'] == 93.4
        latency = await call('zabbix_history', {'host_id': 'san-01', 'metric': 'write_latency_ms'})
        assert latency['records'][-1]['value'] == 38
        backups = await call('backup_jobs', {'host_id': 'erp-01'})
        job = backups['records'][0]
        assert job['last_success_age_hours'] > job['rpo_target_hours']
        deps = await call('service_dependencies', {'host_id': 'san-01'})
        assert {'erp-01', 'backup-01'} <= {h['id'] for h in deps['direct_dependents']}
        logs = await call('pfsense_logs', {'action': 'block', 'destination_port': 22, 'limit': 2})
        assert logs['count'] == 2 and logs['truncated'] and logs['total_matches'] == 30
        assert (await call('pfsense_logs', {'action': 'pass', 'destination_port': 22}))['count'] == 0
        assert (await call('search_runbooks', {'query': 'RB-BACKUP'}))['count'] == 1
        for args in [{'host_id': 'invalid', 'metric': 'cpu_pct'},
                     {'host_id': 'san-01', 'metric': 'invalid'},
                     {'host_id': 'san-01', 'metric': 'disk_used_pct', 'hours': 1000}]:
            try:
                await client.call_tool('zabbix_history', args)
            except ToolError:
                continue
            raise AssertionError(f'Invalid input accepted: {args}')
        print(f'PASS: 7 read-only tools, inventory, filtered alerts, history, backup RPO, dependencies, firewall pagination, runbooks, invalid inputs ({target if isinstance(target, str) else "in-process"})')


if __name__ == '__main__':
    asyncio.run(verify(sys.argv[1] if len(sys.argv) > 1 else mcp))
