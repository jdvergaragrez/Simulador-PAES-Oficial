import { UniversidadesData } from './types';

export const tablasPAES = {
  lectora: {0:100,1:149,2:172,3:193,4:214,5:234,6:253,7:269,8:284,9:298,10:313,11:330,12:347,13:361,14:373,15:383,16:393,17:404,18:417,19:432,20:447,21:461,22:472,23:480,24:487,25:495,26:504,27:516,28:531,29:546,30:560,31:571,32:580,33:587,34:594,35:603,36:614,37:629,38:644,39:659,40:671,41:680,42:689,43:699,44:711,45:725,46:741,47:758,48:772,49:786,50:799,51:814,52:832,53:852,54:871,55:892,56:913,57:936,58:963,59:991,60:1000} as Record<number, number>,
  m1: {0:100,1:173,2:196,3:216,4:236,5:255,6:273,7:290,8:305,9:318,10:331,11:345,12:360,13:375,14:389,15:399,16:408,17:417,18:426,19:438,20:452,21:467,22:480,23:490,24:498,25:504,26:511,27:519,28:530,29:543,30:558,31:571,32:582,33:590,34:597,35:603,36:611,37:622,38:635,39:650,40:664,41:676,42:685,43:694,44:704,45:716,46:730,47:746,48:761,49:775,50:789,51:804,52:821,53:840,54:860,55:880,56:903,57:927,58:955,59:986,60:1000} as Record<number, number>,
  m2: {0:100,1:204,2:231,3:255,4:278,5:298,6:317,7:336,8:354,9:371,10:386,11:399,12:412,13:426,14:441,15:456,16:470,17:481,18:491,19:501,20:512,21:525,22:540,23:553,24:565,25:574,26:583,27:592,28:603,29:616,30:630,31:644,32:656,33:666,34:676,35:687,36:699,37:714,38:729,39:744,40:757,41:770,42:785,43:801,44:819,45:837,46:856,47:876,48:898,49:1000} as Record<number, number>,
  historia: {0:100,1:132,2:158,3:181,4:203,5:224,6:244,7:263,8:279,9:294,10:308,11:324,12:341,13:357,14:372,15:383,16:393,17:402,18:413,19:426,20:441,21:457,22:471,23:482,24:490,25:497,26:504,27:513,28:525,29:539,30:555,31:569,32:581,33:590,34:597,35:604,36:612,37:623,38:637,39:653,40:668,41:681,42:692,43:701,44:711,45:722,46:736,47:753,48:770,49:785,50:799,51:814,52:829,53:848,54:868,55:888,56:910,57:932,58:957,59:985,60:1000} as Record<number, number>,
  ciencias_biologia: {0:100,1:129,2:151,3:172,4:192,5:211,6:227,7:242,8:255,9:270,10:284,11:299,12:311,13:322,14:330,15:339,16:349,17:360,18:374,19:386,20:397,21:405,22:412,23:417,24:422,25:429,26:439,27:450,28:463,29:475,30:485,31:491,32:496,33:500,34:504,35:509,36:516,37:525,38:537,39:550,40:562,41:571,42:577,43:582,44:586,45:590,46:595,47:603,48:613,49:625,50:638,51:649,52:658,53:665,54:670,55:676,56:683,57:692,58:704,59:717,60:730,61:741,62:751,63:760,64:770,65:782,66:796,67:812,68:827,69:842,70:857,71:875,72:895,73:916,74:939,75:1000} as Record<number, number>,
  ciencias_fisica: {0:100,1:126,2:149,3:169,4:189,5:208,6:224,7:239,8:253,9:267,10:281,11:296,12:309,13:320,14:328,15:337,16:346,17:358,18:371,19:384,20:395,21:404,22:410,23:416,24:421,25:427,26:436,27:448,28:460,29:473,30:483,31:490,32:495,33:499,34:503,35:508,36:514,37:523,38:535,39:548,40:560,41:569,42:576,43:581,44:585,45:589,46:594,47:601,48:611,49:623,50:636,51:648,52:657,53:664,54:669,55:675,56:682,57:691,58:703,59:716,60:729,61:740,62:750,63:759,64:769,65:781,66:796,67:811,68:826,69:841,70:857,71:874,72:894,73:915,74:939,75:1000} as Record<number, number>,
  ciencias_quimica: {0:100,1:124,2:147,3:168,4:187,5:206,6:222,7:237,8:250,9:264,10:278,11:293,12:306,13:317,14:326,15:334,16:343,17:353,18:366,19:379,20:391,21:401,22:408,23:413,24:418,25:424,26:432,27:442,28:454,29:467,30:478,31:487,32:493,33:497,34:501,35:505,36:510,37:518,38:528,39:541,40:553,41:564,42:573,43:579,44:583,45:587,46:591,47:597,48:606,49:617,50:629,51:642,52:652,53:660,54:667,55:672,56:679,57:687,58:697,59:710,60:724,61:736,62:746,63:756,64:766,65:777,66:791,67:807,68:822,69:837,70:853,71:871,72:890,73:912,74:935,75:1000} as Record<number, number>
};

export const universidades: UniversidadesData = {
  civil: [
    {nombre:"P. U. Católica (UC)", tier:"verified", corte:898.10, electivaTipo:"ciencias", weights:{nem:20,ranking:20,lectora:10,m1:20,m2:15,electivo:15}},
    {nombre:"U. de Chile (FCFM)", tier:"verified", corte:833.85, electivaTipo:"ciencias", weights:{nem:10,ranking:25,lectora:10,m1:20,m2:20,electivo:15}},
    {nombre:"USACH (Industrial)", tier:"verified", corte:805.90, corteNota:"último matric. 2025", electivaTipo:"mejor", weights:{nem:25,ranking:25,lectora:10,m1:15,m2:15,electivo:10}},
    {nombre:"UdeC (Plan Común)", tier:"verified", corte:700.25, electivaTipo:"mejor", weights:{nem:20,ranking:15,lectora:15,m1:25,m2:15,electivo:10}},
    {nombre:"UTFSM", tier:"nodata", corte:null, weights:null, nota:"Ingreso vía Plan Común (bachillerato 2 años); especialidad se define por ranking interno, no por corte PAES."},
    {nombre:"U. de los Andes", tier:"verified", corte:812.40, electivaTipo:"ciencias", weights:{nem:10,ranking:25,lectora:10,m1:40,m2:5,electivo:10}}
  ],
  comercial: [
    {nombre:"P. U. Católica (UC)", tier:"verified", corte:870.10, electivaTipo:"mejor", weights:{nem:20,ranking:20,lectora:10,m1:30,m2:10,electivo:10}},
    {nombre:"U. de Chile (FEN)", tier:"verified", corte:829.60, electivaTipo:"mejor", weights:{nem:10,ranking:20,lectora:10,m1:35,m2:15,electivo:10}},
    {nombre:"USACH", tier:"verified", corte:741.75, corteNota:"último matric. 2025", electivaTipo:"mejor", weights:{nem:10,ranking:40,lectora:10,m1:25,m2:5,electivo:10}},
    {nombre:"UdeC", tier:"verified", corte:705.15, electivaTipo:"mejor", weights:{nem:15,ranking:25,lectora:15,m1:30,m2:5,electivo:10}},
    {nombre:"U. de los Andes", tier:"verified", corte:797.40, electivaTipo:"mejor", weights:{nem:10,ranking:25,lectora:10,m1:40,m2:5,electivo:10}},
    {nombre:"UDD", tier:"partial", corte:772.30, weights:null, nota:"Corte publicado, ponderaciones bloqueadas por JS en el sitio oficial."},
    {nombre:"UAI", tier:"nodata", corte:null, weights:null, nota:"Sitio oficial renderiza los datos vía JS; no extraíbles."}
  ],
  medicina: [
    {nombre:"P. U. Católica (UC)", tier:"verified", corte:958.35, electivaTipo:"ciencias", weights:{nem:20,ranking:20,lectora:15,m1:20,m2:0,electivo:25}},
    {nombre:"U. de Chile", tier:"verified", corte:931.15, electivaTipo:"ciencias", weights:{nem:10,ranking:20,lectora:15,m1:20,m2:0,electivo:35}},
    {nombre:"USACH", tier:"verified", corte:937.80, corteNota:"último matric. 2025", electivaTipo:"ciencias", weights:{nem:10,ranking:40,lectora:15,m1:15,m2:0,electivo:20}},
    {nombre:"UdeC", tier:"verified", corte:952.15, electivaTipo:"ciencias", weights:{nem:15,ranking:25,lectora:15,m1:35,m2:0,electivo:10}},
    {nombre:"UTFSM", tier:"nodata", corte:null, weights:null, nota:"No dicta Medicina"},
    {nombre:"U. de los Andes", tier:"verified", corte:944.00, electivaTipo:"ciencias", weights:{nem:10,ranking:15,lectora:20,m1:35,m2:0,electivo:20}},
    {nombre:"UDD", tier:"partial", corte:956.40, weights:null, nota:"Corte publicado, ponderaciones bloqueadas por JS."}
  ],
  derecho: [
    {nombre:"P. U. Católica (UC)", tier:"verified", corte:871.90, electivaTipo:"historia", weights:{nem:20,ranking:20,lectora:25,m1:10,m2:0,electivo:25}},
    {nombre:"U. de Chile", tier:"verified", corte:null, electivaTipo:"historia", weights:{nem:20,ranking:20,lectora:25,m1:10,m2:0,electivo:25}},
    {nombre:"UdeC", tier:"verified", corte:803.15, electivaTipo:"historia", weights:{nem:15,ranking:25,lectora:25,m1:25,m2:0,electivo:10}},
    {nombre:"U. de los Andes", tier:"verified", corte:790.40, electivaTipo:"historia", weights:{nem:10,ranking:15,lectora:30,m1:20,m2:0,electivo:25}},
    {nombre:"UDD", tier:"nodata", corte:null, weights:null, nota:"Corte 2026 no publicado (solo alza reportada). Ponderaciones bloqueadas por JS."}
  ],
  psicologia: [
    {nombre:"P. U. Católica (UC)", tier:"verified", corte:871.65, electivaTipo:"mejor", weights:{nem:20,ranking:20,lectora:25,m1:25,m2:0,electivo:10}},
    {nombre:"U. de Chile", tier:"verified", corte:null, electivaTipo:"mejor", weights:{nem:10,ranking:30,lectora:25,m1:20,m2:0,electivo:15}},
    {nombre:"USACH", tier:"partial", corte:null, electivaTipo:"historia", weights:{nem:10,ranking:40,lectora:25,m1:15,m2:0,electivo:10}, nota:"Corte 2026 no publicado. Ponderaciones etiquetadas '2026'."},
    {nombre:"U. de los Andes", tier:"verified", corte:793.15, electivaTipo:"mejor", weights:{nem:20,ranking:25,lectora:20,m1:20,m2:0,electivo:15}}
  ],
  agronomia: [
    {nombre:"P. U. Católica (UC)", tier:"verified", corte:745.60, electivaTipo:"ciencias", weights:{nem:20,ranking:30,lectora:10,m1:30,m2:0,electivo:10}}
  ]
};

export const careerDisplayNames: Record<string, string> = {
  civil: "Ingeniería Civil",
  comercial: "Ingeniería Comercial",
  medicina: "Medicina",
  derecho: "Derecho",
  psicologia: "Psicología",
  agronomia: "Agronomía e Ing. Forestal"
};

const nemAnchors = [[4.0,100],[5.0,450],[6.0,700],[6.4,828],[6.7,914],[6.9,970],[7.0,1000]];

export function nemFromGrade(g: number): number {
  if (isNaN(g) || g < 1.0) return 100;
  if (g <= 4.0) return 100;
  if (g >= 7.0) return 1000;
  for (let i = 0; i < nemAnchors.length - 1; i++) {
    const [g1, p1] = nemAnchors[i];
    const [g2, p2] = nemAnchors[i + 1];
    if (g >= g1 && g <= g2) {
      return Math.round(p1 + ((p2 - p1) * (g - g1)) / (g2 - g1));
    }
  }
  return 100;
}
