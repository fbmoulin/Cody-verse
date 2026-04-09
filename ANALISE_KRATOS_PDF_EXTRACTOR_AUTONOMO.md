# Análise Técnica Profissional — `fbmoulin/kratos-pdf-extractor-autonomo`

## Status da coleta

Não foi possível acessar o repositório solicitado no ambiente atual por falta de credenciais/autorização para leitura do GitHub remoto.

Evidências de execução:

- `git clone https://github.com/fbmoulin/kratos-pdf-extractor-autonomo /tmp/kratos-pdf-extractor-autonomo` → `fatal: could not read Username for 'https://github.com': No such device or address`
- `git ls-remote https://github.com/fbmoulin/kratos-pdf-extractor-autonomo.git` → mesmo erro de autenticação
- `curl https://api.github.com/repos/fbmoulin/kratos-pdf-extractor-autonomo` → `{ "message": "Not Found" }`

---

## O que eu faria (análise profunda e criteriosa), com foco em agentes e prompts

Abaixo está o framework profissional que aplicarei assim que houver acesso ao código-fonte (clone local, tarball ou compartilhamento de arquivos).

## 1) Mapa de arquitetura de agentes

### Objetivo
Entender **quem decide**, **quem executa**, **quem observa** e **quem corrige** no ciclo autônomo.

### Itens de verificação
- Topologia dos agentes (single-agent, planner/executor, hierárquico, swarm).
- Contratos entre agentes (mensagens, schemas, tipos, versionamento).
- Limites de responsabilidade (evitar sobreposição de papéis).
- Estratégia de fallback (quando o agente principal falha).
- Estado e memória (curto prazo, longo prazo, memória vetorial, cache).

### Sinais de maturidade
- Papéis explícitos e estáveis.
- Fluxo de decisão rastreável.
- Isolamento de efeitos colaterais (I/O separado da razão).

### Sinais de risco
- “Agente Deus” com permissões amplas.
- Comunicação textual sem schema (quebra fácil).
- Falta de idempotência em tarefas repetíveis.

---

## 2) Engenharia de prompts (núcleo da confiabilidade)

### Objetivo
Medir robustez semântica, previsibilidade e resistência a prompt-injection.

### Rubrica de avaliação de prompts
1. **Clareza de papel**
   - O prompt define função, escopo e limites?
2. **Objetivo operacional**
   - Entregável está objetivo e testável?
3. **Restrições e políticas**
   - Há regras explícitas de segurança/compliance?
4. **Formato de saída**
   - JSON/schema obrigatório quando necessário?
5. **Critérios de qualidade**
   - Exige validação, autocheck ou critério de aceitação?
6. **Gestão de contexto**
   - Evita contexto excessivo; faz seleção e resumo?
7. **Defesa contra injeção**
   - Delimita instruções confiáveis vs. conteúdo externo?
8. **Controle de ferramentas**
   - Define quando usar tool e quando recusar?

### Antipadrões comuns
- Prompt monolítico com múltiplos papéis conflitantes.
- Ausência de formato estruturado de saída.
- Instruções vagas (“seja inteligente”, “faça o melhor”).
- Dependência de “cadeia de pensamento” sem guardrails.

### Melhorias típicas
- Separar prompts por fase: planejamento, execução, validação.
- Introduzir `output_contract` (schema JSON).
- Adicionar checklist de segurança antes de tool calls.
- Definir linguagem e granularidade por tarefa.

---

## 3) Segurança de agentes e prompts

### Vetores críticos
- Prompt injection via PDF (conteúdo malicioso no documento).
- Exfiltração de dados por tool (HTTP, filesystem, logs).
- Escalada de permissões por instruções indiretas.
- Vazamento de segredos em mensagens e traces.

### Controles mínimos esperados
- Sanitização de entrada (PDF text, OCR, metadados).
- Separação entre dados não confiáveis e instruções de sistema.
- Allowlist de ferramentas, domínios e paths.
- Redação de segredos em logs.
- Política de negação por padrão (default deny).

### Testes de segurança recomendados
- Suite de prompt-injection com casos adversariais.
- Testes de jailbreak de papel e políticas.
- Testes de regressão de políticas em CI.

---

## 4) Observabilidade, avaliação e governança

### O que deve existir
- Traces por etapa (input, decisão, ferramenta, output).
- Métricas: latência, custo, taxa de erro, taxa de retry.
- Métricas de qualidade: precisão de extração, cobertura por campo.
- Dataset de avaliação com ground truth.

### Nível profissional
- Avaliação offline (benchmark fixo) + online (produção).
- Scorecards por versão de prompt.
- Experimentos A/B de prompt e roteamento de agentes.

---

## 5) Qualidade específica para “PDF Extractor”

### Pontos críticos do domínio
- Layout complexo (tabelas, colunas, rodapé/cabeçalho).
- OCR e idioma misto.
- Normalização de entidades (datas, moedas, IDs).
- Ambiguidade semântica entre campos similares.

### Controles de qualidade
- Confiança por campo (`confidence_score`).
- Evidência por campo (trecho/página/origem).
- Validação semântica (regex + regra de negócio).
- Modo humano-no-loop para baixa confiança.

---

## 6) Checklist de auditoria imediata (assim que houver acesso)

1. Inventariar prompts e templates (`system`, `developer`, `task`, `validator`).
2. Mapear agentes e ferramentas por arquivo.
3. Classificar prompts em: robustos / frágeis / críticos.
4. Rodar lint de prompts (consistência de formato e políticas).
5. Executar bateria de testes adversariais (injeção e bypass).
6. Medir qualidade com corpus de PDFs representativos.
7. Propor plano de hardening em 3 ondas:
   - Onda 1: correções de alto risco e baixo esforço.
   - Onda 2: padronização estrutural de prompts.
   - Onda 3: automação de avaliação e governança contínua.

---

## Entregáveis que fornecerei com acesso ao repo

- Relatório técnico com **pontuação por dimensão** (0–5):
  - Arquitetura de agentes
  - Engenharia de prompts
  - Segurança
  - Observabilidade
  - Qualidade de extração
  - Operação/CI/CD
- Matriz de riscos (impacto × probabilidade × esforço de correção).
- Refatorações concretas de prompts (antes/depois).
- Sugestão de suíte de testes automatizados para agentes/prompts.

---

## Como destravar a análise profunda agora

Qualquer uma das opções abaixo resolve:

1. Tornar o repositório público temporariamente.
2. Compartilhar um token de leitura já configurado no ambiente.
3. Enviar um arquivo `.zip`/`.tar.gz` do projeto neste ambiente.
4. Colar os principais arquivos de agentes e prompts para auditoria imediata.

Com acesso, eu devolvo uma análise completa e prescritiva em nível de revisão técnica sênior.
