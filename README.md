Void Arena é um MOBA 4x4 2D desenvolvido com JavaScript puro e HTML5 Canvas.
O projeto foi construído com foco em lógica de jogo, inteligência artificial e organização orientada a objetos, demonstrando domínio de fundamentos de desenvolvimento front-end e modelagem de sistemas interativos.

👉 VISÃO GERAL
O jogo ocorre em uma arena onde duas equipes (aliados vs inimigos) se enfrentam após a seleção do personagem do jogador. Cada equipe possui quatro classes:
- Warrior (dano físico)
- Mage (dano em área)
- Healer (suporte e cura)
- Tank (frontline com dano por contato)

O jogador controla um personagem enquanto os demais atuam com IA estratégica autônoma.

👉 CONCEITOS TÉCNICOS APLICADOS
⏺️ ARQUITETURA
O projeto utiliza estrutura orientada a objetos com as seguintes classes principais:
- Character
- Projectile
- Explosion

Cada entidade encapsula estado, comportamento, renderização e regras de interação.

⏺️ INTELIGÊNCIA ARTIFICIAL
Cada classe possui comportamento específico:
- Tank persegue o inimigo mais próximo e aplica dano por proximidade.
- Healer prioriza aliados com HP abaixo de 80%.
- Mage mantém distância estratégica e aplica dano em área.
- Warrior realiza dano focado com previsão de movimento.

Foi implementado sistema de predição de alvo utilizando cálculo vetorial para antecipar deslocamento do oponente.

⏺️ MECÂNICAS IMPLEMENTADAS
- Sistema de cooldown por personagem
- Cura e dano condicionais por tipo
- Dano em área com efeito visual
- Detecção de colisão via distância euclidiana
- Desvio de projéteis por IA
- Limitação de mapa com bounding box
- Sistema de vitória e derrota
- Loop principal com requestAnimationFrame
