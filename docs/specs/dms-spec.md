# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, consultem e baixem documentos armazenados no filesystem local da aplicação.

## 2. Escopo

### Dentro do escopo

- Envio de documentos por formulário `multipart/form-data`.
- Listagem dos documentos associados ao usuário.
- Download de um documento pelo identificador.
- Registro em memória dos metadados dos documentos.
- Interface web para envio, listagem e download.

### Fora do escopo

- Armazenamento em nuvem ou em serviços externos.
- Versionamento, edição ou exclusão de documentos.
- Persistência durável dos metadados.
- Autenticação e gestão completa de contas.
- Busca, categorias, compartilhamento ou permissões avançadas.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar o envio de um documento em `multipart/form-data`, no campo `file`. |
| RF-02 | O sistema deve exigir o cabeçalho `X-User-Id` nas operações de envio, listagem e download. |
| RF-03 | O arquivo enviado deve ser gravado no filesystem local, em `backend/storage` por padrão. |
| RF-04 | O sistema deve gerar um identificador único para cada documento e um nome físico de arquivo que não dependa do nome original. |
| RF-05 | Após um envio bem-sucedido, o sistema deve registrar os metadados em memória e retornar a representação pública do documento. |
| RF-06 | O usuário deve listar somente documentos associados ao identificador informado na requisição. |
| RF-07 | A listagem deve apresentar os documentos mais recentes primeiro. |
| RF-08 | O usuário deve baixar um documento pelo identificador somente quando o documento estiver associado ao identificador informado. |
| RF-09 | O download deve sugerir o nome original como nome do arquivo. |
| RF-10 | O sistema deve responder apropriadamente quando faltarem dados obrigatórios, o documento não existir, não pertencer ao usuário ou exceder o limite configurado. |
| RF-11 | A interface deve permitir selecionar e enviar um arquivo, apresentar o resultado e atualizar a listagem após o envio. |
| RF-12 | A interface deve permitir baixar cada documento listado e apresentar estados de carregamento e erro. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados localmente usando Multer com `diskStorage`; provedores externos não são permitidos. |
| RNF-02 | Os metadados devem permanecer em memória nesta fase. Reiniciar o processo pode perder os metadados, mesmo que os arquivos permaneçam no disco. |
| RNF-03 | Configurações operacionais devem ser obtidas por variáveis de ambiente, com valores padrão documentados. |
| RNF-04 | O backend deve usar Node.js, Express e CommonJS; o frontend deve usar React e Vite. |
| RNF-05 | O backend deve respeitar o fluxo de dependências `routes -> controllers -> services -> repositories`. |
| RNF-06 | O frontend deve chamar a API com `fetch` pelo prefixo `/api`; em desenvolvimento, o proxy do Vite encaminha as chamadas ao backend. |
| RNF-07 | Erros da API devem ter formato consistente e não devem expor caminhos absolutos ou detalhes internos do filesystem. |
| RNF-08 | O limite padrão de upload deve ser 10 MiB e poderá ser substituído por `MAX_FILE_SIZE_BYTES`. |

## 5. Modelo de dados

### Metadados internos do documento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único do documento, UUID. |
| `originalName` | string | Nome original fornecido pelo cliente, usado para exibição e download. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora do upload em ISO 8601 UTC. |
| `owner` | string | Identificador informado em `X-User-Id`. |
| `storageKey` | string | Nome gerado pelo servidor para localizar o arquivo; campo interno, não retornado pela API. |

O repositório mantém os registros em memória. `storageKey` deve ser gerado pelo servidor e não pode conter caminhos fornecidos pelo cliente. `originalName` não deve ser usado para compor o caminho físico.

### Representação pública

As respostas de envio e listagem incluem `id`, `originalName`, `size`, `uploadedAt` e `owner`. O campo interno `storageKey` nunca deve ser exposto.

## 6. Contratos de API

As rotas são relativas à raiz do backend. No frontend, são acessadas pelo prefixo `/api`, configurado no proxy do Vite. Todas as operações de documentos exigem `X-User-Id`. Esse cabeçalho é somente um contexto de usuário para o protótipo; não autentica a requisição.

### `POST /upload`

Envia um documento.

- Entrada: cabeçalho `X-User-Id` e corpo `multipart/form-data` com o campo obrigatório `file`.
- Sucesso: `201 Created`, com os metadados públicos do documento.

```json
{
  "id": "uuid",
  "originalName": "relatorio.pdf",
  "size": 153600,
  "uploadedAt": "2026-11-04T12:00:00.000Z",
  "owner": "usuario-123"
}
```

- Erros: `400 Bad Request` para usuário ou arquivo ausente ou multipart inválido; `413 Payload Too Large` para arquivo acima do limite; `500 Internal Server Error` para falha inesperada de gravação ou registro.
- Se o registro em memória falhar após a gravação, o arquivo recém-gravado deve ser removido para evitar arquivo órfão.

### `GET /documents`

Lista os documentos associados ao usuário informado.

- Entrada: cabeçalho `X-User-Id`.
- Sucesso: `200 OK`, com uma lista de metadados públicos ordenada por `uploadedAt` decrescente. Sem documentos, retorna `[]`.
- Erros: `400 Bad Request` se o cabeçalho estiver ausente; `500 Internal Server Error` para falha inesperada ao consultar os metadados.

### `GET /documents/:id/download`

Baixa o conteúdo binário de um documento.

- Entrada: cabeçalho `X-User-Id` e parâmetro `id`.
- Sucesso: `200 OK`, conteúdo binário, `Content-Disposition: attachment` com o nome original tratado e `Content-Type` apropriado; usar `application/octet-stream` quando não for possível determiná-lo.
- Erros: `400 Bad Request` para cabeçalho ausente ou identificador inválido; `404 Not Found` para documento inexistente, de outro usuário ou arquivo ausente; `500 Internal Server Error` para falha inesperada de leitura.

### Formato de erro

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

O campo `message` é destinado ao cliente. Detalhes técnicos devem permanecer nos logs do servidor.

## 7. Decisões arquiteturais e riscos

- `routes/` define endpoints e delega aos controllers.
- `controllers/` valida dados HTTP e formata respostas; regras de negócio ficam em `services/`.
- `repositories/` encapsula o registro em memória e o acesso ao filesystem local.
- Multer com `diskStorage` grava arquivos em `backend/storage` por padrão. O diretório pode ser configurado por `STORAGE_DIR`.
- `PORT` configura a porta do backend; o padrão é `3000`.
- `MAX_FILE_SIZE_BYTES` configura o tamanho máximo do upload; o padrão é `10485760`.
- O proxy do Vite encaminha `/api` ao backend e remove esse prefixo antes de encaminhar.
- `X-User-Id` é uma conveniência do protótipo, não autenticação. Um cliente pode declarar outro identificador; portanto, não há isolamento seguro entre usuários para produção.
- Os metadados voláteis podem desaparecer após reinicializações e deixar arquivos sem registro. Persistência durável e reconciliação ficam fora desta fase.
- A política de tipos de arquivo permitidos ainda não está definida; nesta fase, o limite especificado é o tamanho do upload.

## 8. Plano de execução

Este plano descreve fases futuras. Nesta atividade, somente este documento deve ser criado ou alterado; não implementar arquivos de backend ou frontend.

1. **Consolidar a especificação**: manter este documento como referência de escopo, contratos e critérios. Aceite: todos os requisitos, modelo, contratos, decisões e etapas estão documentados.
2. **Implementar o upload no backend**: validar a requisição, gravar com Multer `diskStorage` e registrar metadados em memória, respeitando a separação de camadas. Aceite: upload válido retorna `201`; entradas inválidas, limite excedido e falhas retornam os erros definidos; falha de registro não deixa arquivo órfão.
3. **Implementar listagem e download no backend**: filtrar por usuário, ordenar a listagem e servir o arquivo somente ao proprietário correspondente. Aceite: listagem isolada por usuário; download com conteúdo e nome apropriados; documento indisponível ou não autorizado resulta em `404`.
4. **Implementar a interface e integração**: permitir envio, listagem e download, com estados de carregamento e erro, consumindo `/api` via `fetch`. Aceite: os fluxos podem ser concluídos pela interface e erros são apresentados sem interromper a aplicação.
5. **Verificar os fluxos integrados**: validar contratos, cenários de erro e proxy de desenvolvimento. Aceite: fluxos de sucesso e falha definidos nesta especificação são verificáveis e as chamadas `/api` chegam ao backend corretamente.