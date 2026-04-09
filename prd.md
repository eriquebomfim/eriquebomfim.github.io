# PRD - eMesas (Calendario Compacto)

## 1. Visao Geral
Aplicacao web para alocacao de mesas da CDS/MPBA, permitindo reservar e remover reservas de forma simples. A interface principal atual e um calendario compacto mensal, com alternativa de visualizacao classica.

## 2. Escopo Atual (Versao Consolidada)
- Reservar mesa livre em um dia util.
- Remover reserva propria em um dia util.
- Exibir meses em grade de calendario (compacto).
- Alternar entre visao calendario e visao classica.
- Persistir preferencia de visualizacao em localStorage.
- Exibir detalhes completos do dia por pressao longa no card do dia.
- Exibir ocupacao por dia via selo X/Y (livres/ocupadas).
- Exibir etiqueta de estado de ocupacao (Tranquilo, Moderado, Critico, Lotado).
- Aplicar temperatura visual por lotacao sem alterar a cor base do status do dia (apenas overlay com alpha).

## 3. Definicoes e Fontes de Dados
- Ambiente principal de desenvolvimento: /gestaomesas-dev.
- Arquivo de producao espelho: /gestaomesas.
- Usuario atual: nome carregado em runtime e refletido na variavel de estado me.
- Fonte de dados: HTML retornado pelo backend (action=view), contendo blocos por data e ocupantes por mesa.
- Mesa livre: celula com classe livre.
- Reserva propria: celula com classe me.
- Feriado: ocupante contendo texto FERIADO.
- Expediente suspenso: ocupante contendo texto EXPEDIENTE SUSPENSO.

## 4. Regras Funcionais

### 4.1 Disponibilidade por dia
- Dias de fim de semana, feriado ou expediente suspenso sao somente leitura.
- Dia util com reserva propria: status amarelo, permite remover reserva.
- Dia util com ao menos uma mesa livre e sem reserva propria: status verde, permite reservar.
- Dia util sem mesas livres e sem reserva propria: status vermelho, sem acao de reserva.

### 4.2 Acao ao clicar no dia
- Se houver reserva propria: remove reserva.
- Se houver mesa livre: reserva automaticamente a primeira mesa livre do dia.
- Se nao houver vaga: apenas informativo de indisponibilidade.

### 4.3 Contadores e indicadores
- Selo no canto superior direito do card: X/Y.
	- X = quantidade de mesas livres.
	- Y = quantidade de mesas ocupadas.
- Etiqueta textual de ocupacao no rodape do card:
	- Tranquilo: ocupacao < 50%.
	- Moderado: ocupacao >= 50% e < 70%.
	- Critico: ocupacao >= 70% e < 90%.
	- Lotado: ocupacao >= 90%.

## 5. Regras Visuais

### 5.1 Cor base (nao alterada pela lotacao)
- Verde: dia util com vaga.
- Amarelo: dia util com reserva do usuario.
- Vermelho: dia util sem vaga.
- Cinza: fim de semana.
- Vinho: feriado/expediente suspenso.

### 5.2 Temperatura por lotacao
- A temperatura visual nao substitui a cor base do card.
- A temperatura e aplicada por overlay com cor fixa e alpha variavel.
- Quanto maior a ocupacao, maior a opacidade do overlay.

## 6. UX Mobile (Ajustes Consolidados)
- Cards mantidos compactos para evitar overflow horizontal.
- Selo X/Y reduzido em mobile para caber no topo direito sem escapar.
- Etiqueta de ocupacao fixada na base do card (margin-top auto).
- Fontes da etiqueta e do selo reduzidas em telas pequenas.

## 7. Interacoes Avancadas
- Pressao longa (long press) em um dia abre modal de detalhes com todas as mesas e ocupantes da data.
- Clique no backdrop ou no botao Fechar encerra o modal.

## 8. Persistencia de Estado
- Chave localStorage: emesas_view_mode.
- Valores:
	- calendar
	- classic

## 9. Criterios de Aceite
- Calendario renderiza meses e dias corretamente.
- Regras de clique respeitam disponibilidade do dia.
- Selo X/Y aparece apenas quando houver dados de mesas no dia util.
- Etiqueta de ocupacao aparece no rodape do card e segue as faixas definidas.
- Overlay de temperatura muda apenas alpha, sem trocar cor base do status.
- Em mobile, selo e etiqueta permanecem dentro do card sem quebra visual.
- Visao selecionada permanece apos recarregar a pagina.

## 10. Fora de Escopo (Atual)
- Mudancas no backend de origem de dados.
- Motor de regras de alocacao com prioridades por equipe/cargo.
- Relatorios historicos e analytics.