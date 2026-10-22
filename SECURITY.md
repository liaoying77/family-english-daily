# Security

- Never commit API keys, local environment files, personal recordings or backups.
- The AI endpoint calls OpenAI from the server; browser code must never contain the API key.
- Exposing the server beyond localhost requires an application password. Use HTTPS and configure PUBLIC_ORIGIN for remote hosting.
- Same-origin POST validation and a short request cooldown are included. The cooldown is per process, not a durable billing limit. Add host-level usage controls for public or multi-tenant deployment.
- The standalone release uses a shared application password, not individual accounts. Browser data remains local and is not synchronized.
- Do not put sensitive data in public issues. Report bugs with redacted examples and no credentials or private recordings.
