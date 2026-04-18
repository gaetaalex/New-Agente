export const AGENT_TEMPLATES = [
  {
    id: "medical",
    name: "Consultório Médico",
    description: "Agendamento de consultas e atendimento médico profissional",
    icon: "🏥",
    category: "Saúde e Bem-estar",
    defaultData: {
      role: "Recepcionista",
      field: "Saúde",
      personalities: ["Atenciosa", "Profissional", "Empática"],
      system_prompt: "Você é uma recepcionista de um consultório médico. Seu objetivo é agendar consultas e tirar dúvidas básicas sobre os serviços...",
    },
    flow: {
      nodes: [
        { id: '1', type: 'initial', position: { x: 400, y: 0 }, data: { label: 'Início', nodeId: 'start' } },
        { id: '2', type: 'action', position: { x: 400, y: 150 }, data: { label: 'Saudação & Triagem', nodeId: 'ai', prompt: 'Dê as boas-vindas e pergunte se deseja agendar consulta ou falar sobre um exame.' } },
        { id: '3', type: 'condition', position: { x: 400, y: 350 }, data: { label: 'Verificar Intenção', conditionType: 'intent' } },
        { id: '4', type: 'action', position: { x: 150, y: 550 }, data: { label: 'Checar Especialidade', nodeId: 'ai', prompt: 'Pergunte qual a especialidade (Clínico Geral, Cardial, etc).' } },
        { id: '5', type: 'action', position: { x: 150, y: 750 }, data: { label: 'Verificar Agenda', nodeId: 'availability', color: 'bg-emerald-500' } },
        { id: '6', type: 'action', position: { x: 150, y: 950 }, data: { label: 'Coletar Convênio', nodeId: 'lead', color: 'bg-amber-500' } },
        { id: '7', type: 'action', position: { x: 150, y: 1150 }, data: { label: 'Confirmar Consulta', nodeId: 'booking', color: 'bg-emerald-500' } },
        { id: '8', type: 'action', position: { x: 650, y: 550 }, data: { label: 'Dúvida/Exame', nodeId: 'faq', color: 'bg-[#3b82f6]' } },
        { id: '9', type: 'action', position: { x: 650, y: 750 }, data: { label: 'Instruções Pré-Exame', nodeId: 'ai', prompt: 'Explique que exames de sangue exigem jejum de 8 horas.' } },
        { id: '10', type: 'action', position: { x: 650, y: 950 }, data: { label: 'Transferir Financeiro', nodeId: 'transfer', color: 'bg-red-500' } },
        { id: '11', type: 'action', position: { x: 400, y: 1350 }, data: { label: 'Encerrar', nodeId: 'msg', message: 'Atendimento finalizado. Cuide-se!', color: 'bg-blue-400' } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
        { id: 'e3-4', source: '3', target: '4', sourceHandle: 'yes', animated: true },
        { id: 'e3-8', source: '3', target: '8', sourceHandle: 'no', animated: true },
        { id: 'e4-5', source: '4', target: '5', animated: true },
        { id: 'e5-6', source: '5', target: '6', animated: true },
        { id: 'e6-7', source: '6', target: '7', animated: true },
        { id: 'e7-11', source: '7', target: '11', animated: true },
        { id: 'e8-9', source: '8', target: '9', animated: true },
        { id: 'e9-10', source: '9', target: '10', animated: true },
        { id: 'e10-11', source: '10', target: '11', animated: true }
      ]
    }
  },
  {
    id: "aesthetic",
    name: "Clínica de Estética",
    description: "Atendimento especializado em tratamentos estéticos e bem-estar",
    icon: "✨",
    category: "Saúde e Bem-estar",
    defaultData: {
      role: "Consultora de Estética",
      field: "Estética",
      personalities: ["Calma", "Paciente", "Positiva"],
      system_prompt: "Você é uma consultora de estética especializada em tratamentos faciais e corporais...",
    },
    flow: {
      nodes: [
        { id: '1', type: 'initial', position: { x: 400, y: 0 }, data: { label: 'Início', nodeId: 'start' } },
        { id: '2', type: 'action', position: { x: 400, y: 150 }, data: { label: 'Saudação & Triagem', nodeId: 'ai', prompt: 'Você é a Julia, assistente da Clínica de Estética. Sua função é entender se o cliente quer agendar (limpeza de pele, botox, peeling) ou tirar dúvidas técnicas.' } },
        { id: '3', type: 'condition', position: { x: 400, y: 350 }, data: { label: 'Verificar Intenção', conditionType: 'intent' } },
        { id: '4', type: 'action', position: { x: 150, y: 550 }, data: { label: 'Consultar Agenda', nodeId: 'availability', color: 'bg-emerald-500' } },
        { id: '5', type: 'action', position: { x: 150, y: 750 }, data: { label: 'Capturar Dados', nodeId: 'lead', color: 'bg-amber-500' } },
        { id: '6', type: 'action', position: { x: 150, y: 950 }, data: { label: 'Agendar', nodeId: 'booking', color: 'bg-emerald-500' } },
        { id: '7', type: 'action', position: { x: 650, y: 550 }, data: { label: 'FAQ Procedimentos', nodeId: 'faq', color: 'bg-[#3b82f6]' } },
        { id: '8', type: 'action', position: { x: 650, y: 750 }, data: { label: 'Enviar Foto/Link', nodeId: 'link', url: 'https://clinicaestetica.com/antes-depois', color: 'bg-sky-400' } },
        { id: '9', type: 'action', position: { x: 650, y: 950 }, data: { label: 'Falar com Esteticista', nodeId: 'transfer', color: 'bg-red-500' } },
        { id: '10', type: 'action', position: { x: 400, y: 1200 }, data: { label: 'Fim', nodeId: 'msg', message: 'Sua beleza é nossa prioridade!', color: 'bg-blue-400' } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
        { id: 'e3-4', source: '3', target: '4', sourceHandle: 'yes', animated: true },
        { id: 'e4-5', source: '4', target: '5', animated: true },
        { id: 'e5-6', source: '5', target: '6', animated: true },
        { id: 'e6-10', source: '6', target: '10', animated: true },
        { id: 'e3-7', source: '3', target: '7', sourceHandle: 'no', animated: true },
        { id: 'e7-8', source: '7', target: '8', animated: true },
        { id: 'e8-9', source: '8', target: '9', animated: true },
        { id: 'e9-10', source: '9', target: '10', animated: true }
      ]
    }
  },
  {
    id: "sales",
    name: "Vendas Imobiliárias",
    description: "Qualificação de leads e agendamento de visitas para corretores",
    icon: "🏠",
    category: "Imóveis e Construção",
    defaultData: {
      role: "Assistente de Vendas",
      field: "Imobiliário",
      personalities: ["Energética", "Persuasiva", "Profissional"],
      system_prompt: "Você é um assistente de vendas de uma imobiliária. Seu objetivo é qualificar leads interessados em imóveis...",
    },
    flow: {
      nodes: [
        { id: '1', type: 'initial', position: { x: 400, y: 0 }, data: { label: 'Início', nodeId: 'start' } },
        { id: '2', type: 'action', position: { x: 400, y: 150 }, data: { label: 'Saudação & Perfil', nodeId: 'ai', prompt: 'Dê as boas-vindas e pergunte se busca Comprar ou Alugar.' } },
        { id: '3', type: 'condition', position: { x: 400, y: 350 }, data: { label: 'Filtro Aluguel/Compra', conditionType: 'intent' } },
        { id: '4', type: 'action', position: { x: 150, y: 550 }, data: { label: 'Coletar Budget', nodeId: 'ai', prompt: 'Pergunte qual o valor máximo do imóvel.' } },
        { id: '5', type: 'action', position: { x: 150, y: 750 }, data: { label: 'Área de Interesse', nodeId: 'ai', prompt: 'Pergunte em quais bairros o lead tem preferência.' } },
        { id: '6', type: 'action', position: { x: 150, y: 950 }, data: { label: 'Qualificar Lead', nodeId: 'lead', color: 'bg-amber-500' } },
        { id: '7', type: 'action', position: { x: 150, y: 1150 }, data: { label: 'Agendar Visita', nodeId: 'booking', color: 'bg-emerald-500' } },
        { id: '8', type: 'action', position: { x: 650, y: 550 }, data: { label: 'Dúvidas e Taxas', nodeId: 'faq', color: 'bg-[#3b82f6]' } },
        { id: '9', type: 'action', position: { x: 650, y: 750 }, data: { label: 'Consultar Serasa', nodeId: 'n8n', color: 'bg-[#ff6d5a]' } },
        { id: '10', type: 'action', position: { x: 650, y: 950 }, data: { label: 'Transferir Corretor', nodeId: 'transfer', color: 'bg-red-500' } },
        { id: '11', type: 'action', position: { x: 400, y: 1350 }, data: { label: 'Fim', nodeId: 'msg', message: 'Terei prazer em ajudar na sua busca. Até logo!', color: 'bg-blue-400' } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
        { id: 'e3-4', source: '3', target: '4', sourceHandle: 'yes', animated: true },
        { id: 'e4-5', source: '4', target: '5', animated: true },
        { id: 'e5-6', source: '5', target: '6', animated: true },
        { id: 'e6-7', source: '6', target: '7', animated: true },
        { id: 'e7-11', source: '7', target: '11', animated: true },
        { id: 'e3-8', source: '3', target: '8', sourceHandle: 'no', animated: true },
        { id: 'e8-9', source: '8', target: '9', animated: true },
        { id: 'e9-10', source: '9', target: '10', animated: true },
        { id: 'e10-11', source: '10', target: '11', animated: true }
      ]
    }
  },
  {
    id: "restaurant",
    name: "Restaurante & Delivery",
    description: "Gestão de pedidos, reservas de mesa e dúvidas sobre o cardápio",
    icon: "🍔",
    category: "Alimentação e Hospitalidade",
    defaultData: {
      role: "Atendente de Restaurante",
      field: "Gastronomia",
      personalities: ["Alegre", "Ágil", "Solicito"],
      system_prompt: "Você é o atendente virtual do restaurante. Seu objetivo é ajudar clientes a fazerem pedidos pelo WhatsApp...",
    },
    flow: {
      nodes: [
        { id: '1', type: 'initial', position: { x: 400, y: 0 }, data: { label: 'Início', nodeId: 'start' } },
        { id: '2', type: 'action', position: { x: 400, y: 150 }, data: { label: 'Saudação & Opções', nodeId: 'ai', prompt: 'Boas-vindas! Ofereça: 1. Ver Cardápio, 2. Reserva de Mesa, 3. Status de Pedido.' } },
        { id: '3', type: 'condition', position: { x: 400, y: 350 }, data: { label: 'Verificar Escolha', conditionType: 'intent' } },
        { id: '4', type: 'action', position: { x: 100, y: 550 }, data: { label: 'Enviar Cardápio (PDF)', nodeId: 'link', url: 'https://restaurante.com/menu.pdf', color: 'bg-sky-400' } },
        { id: '5', type: 'action', position: { x: 100, y: 750 }, data: { label: 'Atendente Humano', nodeId: 'transfer', color: 'bg-red-500' } },
        { id: '6', type: 'action', position: { x: 400, y: 550 }, data: { label: 'Disponibilidade Mesa', nodeId: 'availability', color: 'bg-emerald-500' } },
        { id: '7', type: 'action', position: { x: 400, y: 750 }, data: { label: 'Coletar Pessoas', nodeId: 'ai', prompt: 'Pergunte o número de pessoas e horário.' } },
        { id: '8', type: 'action', position: { x: 400, y: 950 }, data: { label: 'Reservar', nodeId: 'booking', color: 'bg-emerald-500' } },
        { id: '9', type: 'action', position: { x: 700, y: 550 }, data: { label: 'Consultar Delivery', nodeId: 'ai', prompt: 'Peça o código do pedido para rastrear.' } },
        { id: '10', type: 'action', position: { x: 700, y: 750 }, data: { label: 'Status Sistema (N8n)', nodeId: 'n8n', color: 'bg-[#ff6d5a]' } },
        { id: '11', type: 'action', position: { x: 400, y: 1200 }, data: { label: 'Fim', nodeId: 'msg', message: 'Atendimento finalizado. Bom apetite!', color: 'bg-blue-400' } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
        { id: 'e3-4', source: '3', target: '4', sourceHandle: 'no', animated: true },
        { id: 'e4-5', source: '4', target: '5', animated: true },
        { id: 'e3-6', source: '3', target: '6', sourceHandle: 'yes', animated: true },
        { id: 'e6-7', source: '6', target: '7', animated: true },
        { id: 'e7-8', source: '7', target: '8', animated: true },
        { id: 'e8-11', source: '8', target: '11', animated: true },
        { id: 'e3-9', source: '3', target: '9', sourceHandle: 'no', animated: true },
        { id: 'e9-10', source: '9', target: '10', animated: true },
        { id: 'e10-11', source: '10', target: '11', animated: true }
      ]
    }
  },
  {
    id: "barber",
    name: "Barbearia / Salão",
    description: "Agendamento de cortes, barbas e lembretes automáticos",
    icon: "✂️",
    category: "Saúde e Bem-estar",
    defaultData: {
      role: "Recepcionista de Barbearia",
      field: "Estética",
      personalities: ["Descontraído", "Ágil", "Amigável"],
      system_prompt: "Você é o recepcionista virtual da barbearia. Seu objetivo é agendar horários para os clientes...",
    },
    flow: {
      nodes: [
        { id: '1', type: 'initial', position: { x: 400, y: 0 }, data: { label: 'Início', nodeId: 'start' } },
        { id: '2', type: 'action', position: { x: 400, y: 150 }, data: { label: 'Saudação & Estilo', nodeId: 'ai', prompt: 'Dê as boas-vindas com estilo. Pergunte se quer Corte, Barba ou Completo.' } },
        { id: '3', type: 'condition', position: { x: 400, y: 350 }, data: { label: 'Verificar Escolha', conditionType: 'intent' } },
        { id: '4', type: 'action', position: { x: 150, y: 550 }, data: { label: 'Consultar Horários', nodeId: 'availability', color: 'bg-emerald-500' } },
        { id: '5', type: 'action', position: { x: 150, y: 750 }, data: { label: 'Barbeiro Favorito?', nodeId: 'ai', prompt: 'Pergunte se o cliente tem preferência por algum profissional.' } },
        { id: '6', type: 'action', position: { x: 150, y: 950 }, data: { label: 'Agendar', nodeId: 'booking', color: 'bg-emerald-500' } },
        { id: '7', type: 'action', position: { x: 650, y: 550 }, data: { label: 'Preços & Dúvidas', nodeId: 'faq', color: 'bg-[#3b82f6]' } },
        { id: '8', type: 'action', position: { x: 650, y: 750 }, data: { label: 'Enviar Portfólio', nodeId: 'link', url: 'https://instagram.com/barbearia', color: 'bg-sky-400' } },
        { id: '9', type: 'action', position: { x: 650, y: 950 }, data: { label: 'WhatsApp Direto', nodeId: 'wa', color: 'bg-green-500' } },
        { id: '10', type: 'action', position: { x: 400, y: 1200 }, data: { label: 'Fim', nodeId: 'msg', message: 'Tamo junto! Até mais.', color: 'bg-blue-400' } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
        { id: 'e3-4', source: '3', target: '4', sourceHandle: 'yes', animated: true },
        { id: 'e4-5', source: '4', target: '5', animated: true },
        { id: 'e5-6', source: '5', target: '6', animated: true },
        { id: 'e6-10', source: '6', target: '10', animated: true },
        { id: 'e3-7', source: '3', target: '7', sourceHandle: 'no', animated: true },
        { id: 'e7-8', source: '7', target: '8', animated: true },
        { id: 'e8-9', source: '8', target: '9', animated: true },
        { id: 'e9-10', source: '9', target: '10', animated: true }
      ]
    }
  }
];
