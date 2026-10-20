# Cortex · V2S

Demo de Cortex construida desde el código de LibreChat (fork ESJavadex/cortex-v2s), con identidad propia, interfaz en español, firma «Hecho por Javadex» y dos copilotos: operaciones Zabbix y seguridad pfSense. Nace de las reuniones de V2S del Centro de Mando: ampliar sus servicios de infraestructura con una capa conversacional sobre monitorización. No contiene infraestructura, contactos ni registros reales del cliente.

## Arranque

```bash
# Desde la raíz del repositorio
cp cortex/.env.example cortex/.env
# Completa OPENROUTER_KEY y sustituye replace-me por secretos únicos.
# CREDS_KEY: openssl rand -hex 32; CREDS_IV: openssl rand -hex 16.
# JWT_SECRET, JWT_REFRESH_SECRET y DEMO_PASSWORD: valores aleatorios diferentes.
./cortex/scripts/start.sh
```

Acceso local: http://localhost:3082. Acceso tailnet: http://100.119.129.71:3082 (cambia el binding de compose.yaml si despliegas en otro host). Credenciales locales en `cortex/.env`: `DEMO_EMAIL` y `DEMO_PASSWORD`. Registro público deshabilitado. El usuario inicial es administrador del laboratorio. La demo se limita al host y Tailscale; no se configura exposición pública.

```bash
cd cortex
docker compose ps
docker compose logs --tail=100 chat v2s-mock
docker compose stop
# Datos persistentes en volúmenes nombrados; stop/up conserva cuentas y conversaciones.
```

## Recorrido de demo (5 minutos)

1. Entrar en Cortex. En la bienvenida se muestran tres entradas a consultas reales.
2. Con **Cortex · Operaciones V2S**, preguntar: «Revisa las alertas críticas y correlaciona el problema de almacenamiento con las copias de seguridad. Cita IDs y recomienda próximos pasos».
3. Abrir las llamadas a herramientas: inventario, alertas, series de Zabbix y backup son consultas MCP sobre un dataset sintético. Pedir un informe de turno y el runbook recomendado.
4. Cambiar a **Cortex · Seguridad V2S**. Preguntar: «Analiza los eventos del firewall y distingue tráfico bloqueado de señales que habría que investigar. Cita evidencias y próximos pasos».
5. Mostrar que no hay herramientas de escritura: Cortex consulta, propone y facilita evidencias al operador.

Los eventos, nombres, direcciones de documentación y métricas son simulados. El modelo genera una respuesta real por OpenRouter y las llamadas tienen coste. Ninguna integración conecta con el Zabbix o pfSense de V2S. No se promete detección predictiva ni causa raíz a partir de una simple correlación. OpenRouter es un proveedor externo: esta demo no implica residencia europea ni inferencia exclusivamente local.

## Arquitectura y configuración

- `Dockerfile`: dependencias, compilación de los paquetes y React, runtime Node 24.16.0 sin privilegios. No usa una imagen precompilada del chat.
- `compose.yaml`: chat, MongoDB sin puerto publicado y mock MCP sin puerto publicado, con healthchecks y volúmenes independientes del Cortex anterior.
- `librechat.yaml`: perfiles, instrucciones y herramientas MCP; GPT-6 Luna (`openai/gpt-6-luna`) vía OpenRouter para ambos perfiles. `reasoning_effort: none` habilita llamadas a herramientas en Chat Completions; se omiten temperatura y parámetros no soportados. Subida de archivos desactivada: este laboratorio consulta herramientas y no incluye servicio RAG.
- `demo/`: dataset y servidor MCP «Zabbix V2S» de solo lectura; sustituible por un adaptador Zabbix real manteniendo las herramientas.
- `../client/`: branding y componentes Cortex editados en código fuente (login, bienvenida, cabecera, paleta, favicon).
- `tests/`: verificación en navegador y capturas; ver su README para pruebas con/sin generación.

El fork conserva la licencia y los nombres internos necesarios para compatibilidad upstream. Los cambios de marca afectan la experiencia visible. Base upstream actualizada: [LibreChat v0.8.8](https://github.com/LibreChat-AI/LibreChat/releases/tag/v0.8.8), commit `e8f3be08623663d4ad7f7241e693c94469b63bb0` (backend y frontend del mismo tag). Configuración `1.3.17`. Se conserva la personalización Cortex sobre esa base. Remote `upstream`: LibreChat-AI/LibreChat; remote `origin`: ESJavadex/cortex-v2s.

## Siguiente integración real

Reunir con Ismael: versión/API Zabbix, token de lectura acotado, grupo de hosts autorizado, ventana histórica, exportación de eventos y runbooks. Para pfSense: acceso a copia de logs con retención y campos acordados. Validar el proveedor/modelo y el tratamiento de datos antes de conectar información real. El mock no ejecuta cambios, bloqueos ni automatizaciones.

El logotipo del conector Zabbix procede del [repositorio oficial de Zabbix](https://github.com/zabbix/zabbix). Compatibilidad de herramientas del modelo: [OpenAI Docs · GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna).

## Actualizaciones

La actualización a v0.8.8 conserva la identidad Cortex, el español predeterminado y las preferencias guardadas, la firma Javadex, los perfiles y el MCP Zabbix V2S. La clave interna del MCP sigue siendo `v2s` para conservar compatibilidad con conversaciones existentes. Antes de desplegar se guardó una copia local de MongoDB y la configuración en `~/.local/state/cortex-v2s/before-088/`; rama de respaldo `backup/cortex-before-upstream-088` e imagen `cortex-v2s:before-088`. Los respaldos no se publican en Git.
