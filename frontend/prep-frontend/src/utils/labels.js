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
  boletas_sobrantes: 'Boletas sobrantes',
  lista_nominal: 'Lista nominal',
  total_personas_votaron: 'Total personas que votaron',
  total_votos_urnas: 'Total votos en urnas',
  entidad: 'Entidad',
  municipio: 'Municipio',
  seccion: 'Sección',
}

export const validationLabels = {
  SumOfVotesMatchesTotal: 'La suma de votos coincide con el total declarado',
  TotalVotesMatchUrnas: 'El total de votos coincide con el conteo de urnas',
  PersonasVotaronMatchUrnas: 'Personas que votaron coinciden con votos en urnas',
  TotalVotesDoNotExceedNominal: 'El total no excede la lista nominal',
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

export const fieldOrder = [
  'votos_pan', 'votos_pri', 'votos_morena', 'votos_prd',
  'votos_mc', 'votos_pt', 'votos_pvem',
  'votos_coalicion_pan_pri_prd', 'votos_coalicion_pan_pri',
  'votos_coalicion_pri_prd', 'votos_coalicion_pan_prd',
  'votos_coalicion_pvem_pt_morena', 'votos_coalicion_pt_morena',
  'votos_coalicion_pvem_morena', 'votos_coalicion_pvem_pt',
  'votos_candidatos_no_registrados', 'votos_nulos',
  'total_votos', 'total_votos_urnas', 'total_personas_votaron',
  'boletas_sobrantes', 'lista_nominal',
]