# Full & Deep App Analysis Review — `fbmoulin/kratos-pdf-extractor-autonomo`

## 1) Executive status (objective)

No estado atual deste ambiente, o repositório `kratos-pdf-extractor-autonomo` **não está acessível para leitura**. Sem código-fonte, não é tecnicamente possível emitir uma revisão factual da implementação interna (agentes, prompts, pipelines, segurança e testes) sem especulação.

### Evidências técnicas reproduzíveis

- `git clone https://github.com/fbmoulin/kratos-pdf-extractor-autonomo /tmp/kratos-pdf-extractor-autonomo`
  - retorno: `fatal: could not read Username for 'https://github.com': No such device or address`
- `git ls-remote https://github.com/fbmoulin/kratos-pdf-extractor-autonomo.git`
  - retorno: mesmo erro de autenticação
- `curl https://api.github.com/repos/fbmoulin/kratos-pdf-extractor-autonomo`
  - retorno: `{ "message": "Not Found" }`
- `curl https://codeload.github.com/fbmoulin/kratos-pdf-extractor-autonomo/zip/refs/heads/main`
  - retorno HTTP: `404`

> Interpretação: o repositório está privado, inexistente ou com nome/owner divergente do informado.

---

## 2) O que já foi feito para avançar mesmo sem acesso

Para não bloquear sua entrega, preparei um **playbook profissional completo** de auditoria de app e adicionei uma automação local para executar o diagnóstico imediatamente assim que o código ficar disponível.

### Entregáveis adicionados

1. Este relatório com estrutura de auditoria em profundidade.
2. Script `tools/audit_agents_prompts.sh` para inventário técnico e varredura inicial de agentes/prompts/segurança/model tooling.

---

## 3) Metodologia de análise profissional (nível sênior)

## 3.1 Arquitetura de agentes

### Objetivo
Avaliar se o sistema multiagente (ou agente único) possui desenho robusto, rastreável e seguro.

### Critérios de revisão
- **Topologia**: planner/executor/critic/router/validator claramente definidos.
- **Contrato**: mensagens estruturadas (schema), versionamento e compatibilidade.
- **Determinismo operacional**: idempotência, reprocessamento e retries.
- **Controle de estado**: memória de sessão vs. memória persistente; TTL; invalidação.
- **Limites de responsabilidade**: cada agente responde por uma classe de decisão.

### Red flags
- Agente central sem limitação de escopo (“God agent”).
- Mensagens livres sem contrato forte.
- Falta de fallback e ausência de estratégia de degradação.

---

## 3.2 Engenharia de prompts (foco principal solicitado)

### Rubrica de qualidade (0–5 por item)
1. **Papel e missão**: prompt define persona operacional sem ambiguidade.
2. **Escopo e não-escopo**: tarefas permitidas/proibidas explícitas.
3. **Formato de saída**: JSON/schema obrigatório quando aplicável.
4. **Critérios de aceite**: validações mínimas e autocheck.
5. **Ferramentas**: regras de uso/recusa por categoria de tool.
6. **Dados não confiáveis**: delimitação clara para evitar injection.
7. **Context window discipline**: seleção/sumarização de contexto.
8. **Políticas de segurança**: exfiltração, segredos, dados pessoais.

### Antipadrões recorrentes
- Prompt monolítico com múltiplos papéis conflitantes.
- Falta de contrato de output (resposta textual livre para consumo automatizado).
- Regras de segurança implícitas e não testáveis.
- Ausência de instruções de “quando parar” e “quando escalar para humano”.

### Hardening recomendado
- Separar prompts por fase: **plan → execute → validate**.
- Adotar schemas versionados (`v1`, `v1.1`) e validação em runtime.
- Inserir “policy gate” antes de qualquer tool call.
- Implementar prompt unit tests (casos normais + adversariais).

---

## 3.3 Segurança (aplicada a agentes + PDF parsing)

### Vetores críticos
- Prompt injection embutida no conteúdo do PDF.
- Instruções maliciosas em metadados/OCR.
- Exfiltração por tools de rede/shell.
- Vazamento de segredos em logs e traces.

### Controles mínimos esperados
- Trust boundary explícito: “document content is untrusted input”.
- Sanitização e canonicalização de texto OCR.
- Allowlist de domínios/comandos/caminhos.
- Masking de segredos e PII em logs.
- Política de negação por padrão para ferramentas perigosas.

---

## 3.4 Qualidade de extração (domínio PDF)

### O que deve ser medido
- Precisão por campo (ex.: número do processo, CPF/CNPJ, datas).
- Recall por tipo documental.
- Taxa de erro por layout (tabela, colunas, rodapé, carimbo).
- Taxa de “baixa confiança” que exige revisão humana.

### Requisitos de saída robusta
- `confidence_score` por campo.
- evidência (`page`, `bbox`, `snippet`) por campo extraído.
- validação semântica (regex + regras de negócio).
- trilha de auditoria por documento.

---

## 3.5 Observabilidade e governança

### Sinais de maturidade
- Tracing ponta a ponta por etapa de decisão.
- Métricas de custo/latência/taxa de retry/taxa de fallback.
- Scorecard por versão de prompt/agente.
- Avaliação contínua em CI com dataset fixo.

### Lacunas comuns
- Logs sem correlação entre etapas.
- Ausência de baseline para comparação entre versões.
- Falta de SLO para qualidade de extração.

---

## 4) Plano prático de auditoria (assim que o repo for acessível)

## Onda 1 (0–2 dias) — risco alto / esforço baixo
- Inventário de todos os prompts e fluxos de agente.
- Mapeamento de permissões de ferramentas.
- Correções emergenciais de injection/exfiltração.

## Onda 2 (2–5 dias) — padronização e previsibilidade
- Refatoração para contratos de output estruturado.
- Split de prompts por fase e papel.
- Testes adversariais automatizados mínimos.

## Onda 3 (5–10 dias) — operação de excelência
- Harness de avaliação contínua.
- Dashboards de qualidade/custo/latência.
- Governança de mudanças em prompts (review + versionamento).

---

## 5) Como executar a análise automaticamente

Com o repositório local disponível, rode:

```bash
./tools/audit_agents_prompts.sh /caminho/do/repo
```

Saídas geradas:
- `files.txt` (inventário)
- `agent_prompt_hits.txt` (ocorrências relevantes)
- `candidate_files.txt` (candidatos de prompts/agentes)
- `security_hits.txt` (riscos e segredos)
- `model_tool_hits.txt` (stack de modelos/tools)
- `quality_files.txt` (testes e CI)
- `summary.md` (sumário executivo)

---

## 6) Requisitos para liberar a revisão factual completa

Para eu entregar a **análise profunda real do código** (com findings por arquivo, severidade e plano de correção), preciso de uma destas opções:

1. Tornar o repo público temporariamente.
2. Disponibilizar token de leitura no ambiente.
3. Enviar `.zip`/`.tar.gz` do projeto.
4. Confirmar owner/nome exato caso haja divergência.

---

## 7) Resultado esperado após liberação de acesso

Você receberá:
- Matriz de riscos (Impacto × Probabilidade × Esforço).
- Score de maturidade por dimensão (0–5).
- Revisão linha-a-linha dos prompts críticos.
- Plano de refatoração com exemplos antes/depois.
- Backlog priorizado para 30/60/90 dias.

Sem acesso ao código, qualquer “análise profunda do app” seria especulativa. Com acesso, consigo entregar uma revisão técnica objetiva e auditável em ciclo curto.
