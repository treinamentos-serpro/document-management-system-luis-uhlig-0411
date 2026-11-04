---
description: Implementa um endpoint do backend a partir da especificação usando TDD e Clean Architecture simples.
name: implementar-endpoint
argument-hint: recurso e endpoint (ex. documents, POST /upload)
agent: tdd
---

# Implementar endpoint do backend

Implemente o endpoint `${input:endpoint:método e rota}` para o recurso `${input:recurso:nome do recurso}`.

Antes de editar, consulte `docs/specs/dms-spec.md`, as rotas e camadas relacionadas em `backend/src` e os testes próximos em `backend/test`. Use os contratos da especificação como fonte de verdade; se faltar uma decisão, siga o padrão mais simples já usado no projeto e registre a suposição no resultado.

Siga o ciclo Red-Green-Refactor:

1. Escreva primeiro testes focados com `node:test` e `node:assert`, cobrindo o cenário de sucesso e os erros relevantes do endpoint.
2. Execute o teste novo e confirme que ele falha pelo comportamento ainda não implementado.
3. Implemente o mínimo necessário nas camadas apropriadas, sem alterar os testes para fazê-los passar.
4. Execute novamente o teste focado e a suíte do backend; refatore apenas se os testes permanecerem verdes.

Restrições do projeto:

- Preserve o fluxo `routes -> controllers -> services -> repositories`.
- Mantenha validação HTTP nos controllers, regras de negócio nos services e persistência nos repositories.
- Para endpoints de upload, use Multer com `diskStorage` e grave exclusivamente no filesystem local em `backend/storage`; mantenha metadados em memória.
- Não adicione provedores externos, dependências ou alterações de frontend para implementar este endpoint.
- Preserve os contratos e funcionalidades existentes e mantenha a mudança limitada ao recurso solicitado.
- Ao final, informe arquivos alterados, testes executados e qualquer suposição relevante.