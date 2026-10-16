# PAC-MAT — V4

Jogo educativo de matemática em HTML, CSS e JavaScript.

## Recursos
- 3 níveis de dificuldade: Fácil, Médio e Difícil.
- 5 vidas por partida.
- Tempo configurável para cada fase.
- Personagem retorna ao centro quando é capturado.
- Fantasmas com velocidades e intensidade de perseguição diferentes por dificuldade.
- 4 saídas A, B, C e D.
- Painel administrativo oculto por atalho: **Ctrl + Shift + M**.
- Usuário e senha do administrador podem ser alterados no próprio painel.
- Quantidade de perguntas por partida configurável.
- Biblioteca para salvar vários conjuntos de perguntas com nomes personalizados.
- É possível carregar ou excluir conjuntos salvos.
- Os dados são armazenados no navegador usando localStorage.

## Primeiro acesso
- Usuário: `Lucas`
- Senha: `11091996`

Depois de entrar, altere o usuário e a senha na seção **Acesso do administrador** se desejar.

## Biblioteca de perguntas
1. Edite/adicione as perguntas do conjunto atual.
2. Digite um nome na seção **Biblioteca de conjuntos**.
3. Clique em **SALVAR CONJUNTO**.
4. Para usar outro conjunto, clique em **CARREGAR**.
5. Para atualizar um conjunto existente, use o mesmo nome e confirme a atualização.

A biblioteca fica salva no navegador do computador/dispositivo. Se os dados do navegador forem apagados, os conjuntos locais também podem ser apagados.

## Publicação
O projeto pode ser publicado gratuitamente no GitHub Pages. Os arquivos devem ser enviados ao repositório e o arquivo `index.html` deve ficar na raiz publicada.

## Observação de segurança
Como este projeto é estático e roda no navegador, usuário, senha e dados administrativos não são segurança de nível servidor. Para impedir tecnicamente que alguém com conhecimento de programação examine o código, seria necessário autenticação com backend.
