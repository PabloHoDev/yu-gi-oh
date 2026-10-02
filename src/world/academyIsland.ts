import type { MapDef } from './maps';

const SEA = '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~';
const LAWN = '~~T..........::............T~~';
const CROSSROAD = '~~T...::::::::::::::::.....T~~';
const SIDE_PATHS = '~~T...:......::......:.....T~~';
const DORM_ROOFS = '~~T.RRRR.....::.....BBBB...T~~';

/** Pátio da Academia de Duelos: prédio principal ao norte, dormitórios a oeste e leste, píer ao sul. */
export const ACADEMY_ISLAND: MapDef = {
  id: 'academy-island',
  name: 'Ilha da Academia',
  rows: [
    SEA,
    SEA,
    '~~TTTTTTTTTTTTTTTTTTTTTTTTTT~~',
    '~~T......AAAAAAAAAA........T~~',
    '~~T......AAAAAAAAAA........T~~',
    '~~T......WWWWDDWWWW........T~~',
    LAWN,
    '~~T.F........::.........F..T~~',
    LAWN,
    CROSSROAD,
    SIDE_PATHS,
    DORM_ROOFS,
    DORM_ROOFS,
    '~~T.SSDS.....::.....ODOO...T~~',
    SIDE_PATHS,
    CROSSROAD,
    LAWN,
    '~~TTTTTTTTTTT::TTTTTTTTTTTTT~~',
    '~~~~~~~~~~~~~PP~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~PP~~~~~~~~~~~~~~~',
  ],
  start: { x: 13, y: 18, facing: 'up' },
  npcs: [
    {
      id: 'syrus',
      x: 12,
      y: 7,
      facing: 'right',
      sprite: 'npcRed',
      dialog:
        'Oi! Você também é calouro do Slifer Vermelho? Eu sou o Syrus. Dizem que o dormitório vermelho é o pior da ilha... mas a gente ainda vai mostrar do que é capaz!',
    },
    {
      id: 'ra-student',
      x: 22,
      y: 16,
      facing: 'left',
      sprite: 'npcYellow',
      dialog:
        'Dica de veterano: use as SETAS para andar, Z para falar e confirmar, e X para cancelar. No duelo, monstros de nível 5 ou mais exigem tributos.',
    },
    {
      id: 'obelisk-student',
      x: 15,
      y: 12,
      facing: 'left',
      sprite: 'npcBlue',
      dialog: 'Um Slifer andando perto do dormitório Obelisk Azul? Que ousadia. Vamos ver se você sabe duelar!',
      duel: {
        name: 'OBELISK',
        deck: 'obeliskStudent',
        startingLP: 4000,
        winText: 'Impossível... perdi para um Slifer?! Isso não vai ficar assim!',
        loseText: 'Como esperado. Volte quando aprender a duelar, calouro.',
      },
    },
  ],
  signs: [
    { x: 13, y: 5, text: 'ACADEMIA DE DUELOS. As portas estão trancadas: as aulas ainda não começaram.' },
    { x: 14, y: 5, text: 'ACADEMIA DE DUELOS. As portas estão trancadas: as aulas ainda não começaram.' },
    { x: 6, y: 13, text: 'Dormitório SLIFER VERMELHO. Seu quarto ainda está sendo preparado.' },
    { x: 21, y: 13, text: 'Dormitório OBELISK AZUL. Somente alunos da elite.' },
  ],
};
