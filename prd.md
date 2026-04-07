# overview

uma aplicação de alocação de mesas para os servidores da cds do mpba. Permite adicionar ou remover uma alocação de mesa.

# definições
- para o desenvolvimento, atue somente nos arquivos em /gestaomesas-dev;
- usuário atual: tem o nome definido pela constante *me*;
- o arquivo /gestaomesas-dev/resp contém uma tabela que é gerada no backend contendo todas as aloções ;por data, nome da pessoa e a mesa alocada;
- quando uma mesa não está alocada, ela é sinalizada com a class "livre";
- na aplicação atual, é possível efetuar uma alocação ou remover (isso está funcionando);
- a interface atual continuará em funcionamento, mas não será mais a principal;
- a interface principal será uma interface mais compacta:
- mesa: um espaço para execução de atividades quando o servidor estiver presencialmente no setor;
e.g. "Mesa 24"
-- os meses serão renderizados na forma de calendário e.g.
Janeiro/2026
Fevereiro/2026
Março/2026
- calendário: um widget de calendário, contendo todos os dias, mas *disabled* em finais de semana ou feriados:
-- cada dia do calendário (exceto finais de semana e feriados) terão background-color "verde-claro" se, segundo o conteudo em resp naquela data exista pelo menos 1 mesa livre;
-- caso não exista mesa livre nem mesa ocupada pelo usuário logado, a data terá um background-color "vermelho" e deve ser read-only (ou seja, não é possível fazer ou desfazer uma alocação);
-- caso exista mesa livre e nenhuma mesa ocupada pelo usuário logado naquela data, background-color do dia "verde-claro" e é permitido ao usuário logado efetuar uma alocação;
-- caso exista uma alocação para o usuário logado em uma data, o background será amarelo (idem a interface autal) e é permitido ao usuário logado desfazer sua alocação;
-- quando o usuário logado clicar numa data com mesa livre, execute o mesmo comando disponivel na interface atual; neste caso, utilize os parâmetros da primeira mesa livre naquela data;

# estratégia de execução
- step 1: faça uma leitura do arquivo resp contendo dados de exemplo que são gerados pelo backend;
- step 2: monte uma estrutura de dados para facilitar no desenvolvimento da solução;
- step 3: separe todas as datas contidos em 'resp' que contenha uma mesa com texto 'FERIADO';
- step 4: separe todas as mesas livres: armazene data e numero da mesa e.g. ["dd/mm/yyyy","mesa-"]
- step 5: separe todas as mesas com o nome do usuário atual
- step 6: crie a interface de calendário; 
- step 7: adicione um toggle onde o usuario possa alterar entre a interface atual e a interface de calendários (implemente feature onde armazene no localStorage o último estado do toggle)