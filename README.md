iFilas
📌 Visão Geral

O iFilas é um sistema inteligente de gestão de filas e atendimentos, desenvolvido para resolver um problema recorrente em estabelecimentos que atendem o público presencialmente: a espera desorganizada, imprevisível e obrigatoriamente presencial.

A ideia do iFilas surgiu a partir de uma experiência real vivenciada em uma barbearia, onde clientes precisavam aguardar longos períodos para serem atendidos, sem qualquer previsibilidade de horário e com o risco de perder a vez caso se ausentassem do local. A partir desse cenário, nasceu a proposta de um aplicativo que permitisse entrar em filas remotamente, acompanhar a evolução do atendimento em tempo real e ser chamado no momento correto.

Inicialmente focado apenas em filas por ordem de chegada, o iFilas evoluiu para um sistema mais completo, passando a oferecer também agendamento de atendimentos, controle inteligente de tempo, múltiplos atendentes por fila e ampla personalização para estabelecimentos de diferentes segmentos.

🎯 Objetivo do Sistema

O principal objetivo do iFilas é:
Reduzir o tempo de espera presencial dos clientes;
Oferecer previsibilidade de atendimento;
Otimizar a organização interna do estabelecimento;
Melhorar a experiência tanto do cliente quanto do atendente;
Adaptar-se a diferentes modelos de negócio (barbearias, lanchonetes, clínicas, lojas, etc.).

⚙️ Principais Funcionalidades

🧾 Gestão de Serviços e Produtos

Cadastro de serviços ou produtos com:

Tempo médio de execução;
Preço fixo ou variável;
Tempo fixo ou variável.

Esses dados são utilizados pelo sistema para calcular automaticamente a previsão de atendimento.

👥 Gestão de Colaboradores

Associação de colaboradores a um estabelecimento através do ID do usuário (sem necessidade de cadastro completo do funcionário).
Envio de solicitação de vínculo, que deve ser aceita pelo colaborador.

Permissão para que colaboradores vinculados:

Abram filas;
Atendam clientes.
Remoção de colaboradores pelo proprietário.
Possibilidade de o colaborador sair voluntariamente do estabelecimento.

🕒 Filas Inteligentes

Criação e gerenciamento de filas por ordem de chegada.
Estimativa automática do horário de atendimento de cada cliente.
Atendimento fora de ordem, quando necessário.
Atendimento simultâneo (ideal para lanchonetes e cozinhas que produzem vários pedidos ao mesmo tempo).
Remoção automática de clientes após X minutos de ausência.

Compartilhamento de filas:

Uma única fila pode ser atendida por múltiplos colaboradores;
Cada atendente pode “puxar” um atendimento da fila para si.

📅 Agendamento de Atendimentos

Clientes podem agendar seus próprios atendimentos, escolhendo:
Data;
Serviço desejado.
O sistema calcula automaticamente:

Horário estimado de atendimento;
Duração do serviço;
Impacto desse agendamento na fila/agenda do estabelecimento.
Integração entre agenda e filas, garantindo previsibilidade e organização.

🔐 Controle e Segurança

Solicitação de entrada na fila:
O cliente solicita e o estabelecimento aceita (feature de liberação de pedidos).

Geração de QR Code para iniciar atendimento:
Garante que o cliente presente é realmente quem está sendo chamado.

Bloqueio de múltiplas filas:

O estabelecimento pode definir se aceita ou não clientes que já estão em outra fila, evitando ausências e desorganização.

🔔 Comunicação e Notificações

Avisos automáticos via WhatsApp:

Chamadas;
Atualizações de status;

Informações importantes para o cliente.

🤖 Automação (Funcionalidades Premium)

Abertura automática de filas em horários pré-definidos.
Fechamento automático de filas ao final do expediente.

🎨 Personalização do Estabelecimento

Cadastro de destaques da loja:

Frases personalizadas;
Ícones e mensagens promocionais.
Personalização visual:

Logo do estabelecimento;
Papel de parede;
Fotos nos serviços ou produtos.

Cadastro de informações gerais:

Redes sociais;
Telefones;
Informações de contato e apresentação da loja.

🛠️ Tecnologias Utilizadas

O iFilas é desenvolvido utilizando tecnologias modernas e amplamente utilizadas no mercado:

Backend: .NET Core
Frontend: Angular + TypeScript
Arquitetura: API REST

Bibliotecas e ferramentas:
SignalR (comunicação em tempo real)
Outras bibliotecas auxiliares

🚀 Considerações Finais

O iFilas não é apenas um sistema de filas, mas uma plataforma completa de gestão de atendimentos, projetada para ser flexível, escalável e adaptável a diferentes realidades de negócio. Sua proposta central é transformar a experiência de espera em algo previsível, organizado e justo, tanto para clientes quanto para estabelecimentos.
