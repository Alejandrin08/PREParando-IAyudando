export const fieldLabels = {
  votos_pan: 'PAN',
  votos_pri: 'PRI',
  votos_morena: 'Morena',
  votos_prd: 'PRD',
  votos_mc: 'Movimiento Ciudadano',
  votos_pt: 'Partido del Trabajo',
  votos_pvem: 'PVEM',
  votos_coalicion_pan_pri_prd: 'Coalición PAN-PRI-PRD',
  votos_coalicion_pan_pri: 'Coalición PAN-PRI',
  votos_coalicion_pri_prd: 'Coalición PRI-PRD',
  votos_coalicion_pan_prd: 'Coalición PAN-PRD',
  votos_coalicion_pvem_pt_morena: 'Coalición PVEM-PT-Morena',
  votos_coalicion_pt_morena: 'Coalición PT-Morena',
  votos_coalicion_pvem_morena: 'Coalición PVEM-Morena',
  votos_coalicion_pvem_pt: 'Coalición PVEM-PT',
  votos_candidatos_no_registrados: 'Candidatos no registrados',
  votos_nulos: 'Votos nulos',
  total_votos: 'Total de votos',
  total_votos_urnas: 'Total votos en urnas',
  total_personas_votaron: 'Total personas que votaron',
  boletas_sobrantes: 'Boletas sobrantes',
  lista_nominal: 'Lista nominal',
}

export const partyColors = {
  votos_pan: '#003E7E',
  votos_pri: '#E61E25',
  votos_morena: '#8B1A1A',
  votos_prd: '#FFCC00',
  votos_mc: '#FF6600',
  votos_pt: '#CC0000',
  votos_pvem: '#2E7D32',
  votos_coalicion_pan_pri_prd: '#6B3FA0',
  votos_coalicion_pan_pri: '#5B4FCF',
  votos_coalicion_pri_prd: '#C44040',
  votos_coalicion_pan_prd: '#4A6FA5',
  votos_coalicion_pvem_pt_morena: '#5D7A3E',
  votos_coalicion_pt_morena: '#9B3A3A',
  votos_coalicion_pvem_morena: '#4A7A4A',
  votos_coalicion_pvem_pt: '#6B8C3E',
  votos_candidatos_no_registrados: '#888888',
  votos_nulos: '#AAAAAA',
}

export const partyIcons = {
  votos_pan: '/src/assets/partidos/pan.png',
  votos_pri: '/src/assets/partidos/pri.png',
  votos_morena: '/src/assets/partidos/morena.png',
  votos_prd: '/src/assets/partidos/prd.png',
  votos_mc: '/src/assets/partidos/mc.png',
  votos_pt: '/src/assets/partidos/pt.png',
  votos_pvem: '/src/assets/partidos/pvem.png',
}

export const controlLabels = {
  total_votos: 'Total de votos',
  total_votos_urnas: 'Votos en urnas',
  total_personas_votaron: 'Personas que votaron',
  boletas_sobrantes: 'Boletas sobrantes',
  lista_nominal: 'Lista nominal',
}

export const statusConfig = {
  Approved: {
    label: 'Resultados confirmados',
    color: '#15803d',
    bg: '#dcfce7',
    border: '#86efac',
    dot: '#16a34a'
  },
  InReview: {
    label: 'En verificación',
    color: '#b45309',
    bg: '#fef9c3',
    border: '#fde047',
    dot: '#d97706'
  },
  Pending: {
    label: 'En proceso de captura',
    color: '#1e40af',
    bg: '#dbeafe',
    border: '#93c5fd',
    dot: '#2563eb'
  },
  Rejected: {
    label: 'Incidencia documentada',
    color: '#b91c1c',
    bg: '#fee2e2',
    border: '#fca5a5',
    dot: '#dc2626'
  },
}