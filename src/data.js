// ─ PALETA DE TEMPERATURA ────────────────────────────────────────────────────
export const T = {
  HOT: [1.00, 0.08, 0.03],
  W1:  [1.00, 0.40, 0.05],
  W2:  [1.00, 0.68, 0.10],
  W3:  [0.88, 0.98, 0.14],
  M1:  [0.30, 0.98, 0.55],
  M2:  [0.08, 0.88, 0.80],
  C1:  [0.05, 0.52, 1.00],
  C2:  [0.02, 0.20, 0.90],
  C3:  [0.00, 0.06, 0.60],
  C4:  [0.00, 0.03, 0.42],
};

// ─ CORRIENTES MARINAS ────────────────────────────────────────────────────────
// f:'w' = cálida  |  f:'c' = fría
// sv = transporte en Sverdrups  |  tr = rango de temperatura
// proceso: 'afloramiento' | 'hundimiento' | 'convergencia'
export const CURRENTS = [

  // ── GIRO PACÍFICO NORTE ─────────────────────────────────────────────────
  { f:'w', nm:'Corriente Norecuatorial del Pacífico', sv:45, tr:'20–28 °C',
    cA:T.W1, cB:T.HOT, n:55, s:.0013,
    pts:[[14,-106],[14,-128],[14,-152],[14,-175],[14,170],[14,152],[14,137],[14,127]] },

  { f:'w', nm:'Corriente de Kuroshio', sv:42, tr:'18–28 °C',
    cA:T.HOT, cB:T.W2, n:50, s:.0018,
    pts:[[14,127],[23,129],[28,133],[34,138],[37,141],[40,148],[43,154],[45,158]] },

  { f:'w', nm:'Corriente del Pacífico Norte', sv:15, tr:'9–20 °C',
    cA:T.W2, cB:T.M1, n:50, s:.0013,
    pts:[[44,158],[44,170],[44,-175],[44,-162],[44,-150],[44,-137]] },

  { f:'c', nm:'Corriente de Alaska', sv:5, tr:'4–12 °C',
    cA:T.M1, cB:T.M2, n:45, s:.0012,
    pts:[[43,-137],[47,-135],[51,-141],[55,-150],[56,-158],[54,-165],[52,-173]] },

  { f:'c', cA:T.M2, cB:T.C2, n:25, s:.001,
    pts:[[52,-173],[55,177],[57,165]] },

  { f:'c', nm:'Corriente de Oyashio', sv:10, tr:'3–9 °C', proceso:'convergencia',
    cA:T.C2, cB:T.M2, n:45, s:.0015,
    pts:[[57,165],[52,160],[47,152],[42,147],[37,143],[34,141]] },

  { f:'c', nm:'Corriente Subártica del Pacífico Norte', sv:12, tr:'3–9 °C',
    cA:T.C1, cB:T.C1, n:45, s:.001,
    pts:[[34,141],[38,155],[40,175],[40,-170],[40,-150],[44,-137]] },

  { f:'c', nm:'Corriente de California', sv:10, tr:'9–14 °C', proceso:'afloramiento',
    cA:T.C1, cB:T.M2, n:50, s:.0015,
    pts:[[44,-137],[44,-128],[38,-124],[30,-120],[23,-114],[17,-107],[14,-106]] },

  // ── GIRO PACÍFICO SUR ───────────────────────────────────────────────────
  { f:'w', nm:'Corriente Surecuatorial del Pacífico', sv:35, tr:'12–24 °C',
    cA:T.M1, cB:T.W1, n:55, s:.0013,
    pts:[[-5,-82],[-5,-105],[-5,-130],[-5,-155],[-5,-175],[-5,172],[-5,155],[-12,148]] },

  { f:'w', cA:T.HOT, cB:T.W1, n:28, s:.0012,
    pts:[[14,127],[11,130],[8,132]] },

  { f:'w', nm:'Contracorriente Ecuatorial del Pacífico', sv:25, tr:'20–24 °C',
    cA:T.W1, cB:T.W1, n:55, s:.0011,
    pts:[[8,132],[8,150],[8,167],[8,-175],[8,-155],[8,-132],[8,-110],[8,-95]] },

  { f:'w', cA:T.W1, cB:T.W1, n:20, s:.0012,
    pts:[[8,-95],[11,-98],[14,-106]] },

  { f:'w', cA:T.W1, cB:T.M1, n:28, s:.0013,
    pts:[[8,-95],[4,-92],[0,-88],[-3,-85],[-5,-82]] },

  { f:'w', nm:'Corriente de Australia Oriental', sv:30, tr:'16–24 °C',
    cA:T.W1, cB:T.W3, n:45, s:.0015,
    pts:[[-12,148],[-16,157],[-22,156],[-28,155],[-34,152],[-40,151],[-43,149]] },

  { f:'w', cA:T.W1, cB:T.W1, n:30, s:.0012,
    pts:[[-12,148],[-5,147],[0,147],[4,143],[8,132]] },

  { f:'c', nm:'Corriente Subantártica del Pacífico Sur', sv:8, tr:'0–9 °C',
    cA:T.M2, cB:T.C4, n:30, s:.001,
    pts:[[-43,149],[-52,148],[-57,148]] },

  { f:'c', nm:'Corriente de Australia Occidental', sv:5, tr:'15–20 °C',
    cA:T.C1, cB:T.M2, n:40, s:.0012,
    pts:[[-35,115],[-27,113],[-20,113],[-13,116],[-8,118]] },

  { f:'c', nm:'Corriente del Perú (Humboldt)', sv:20, tr:'0–12 °C', proceso:'afloramiento',
    cA:T.C3, cB:T.M1, n:55, s:.0015,
    pts:[[-58,-90],[-52,-80],[-45,-75],[-37,-73],[-28,-72],[-20,-72],[-12,-78],[-4,-81],[-5,-82]] },

  // ── GIRO ATLÁNTICO NORTE ────────────────────────────────────────────────
  { f:'w', nm:'Corriente Norecuatorial del Atlántico', sv:20, tr:'20–28 °C',
    cA:T.W1, cB:T.HOT, n:50, s:.0013,
    pts:[[13,-20],[13,-38],[13,-56],[10,-62]] },

  { f:'w', nm:'Corriente de Guayana', sv:30, tr:'20–28 °C',
    cA:T.W1, cB:T.HOT, n:60, s:.0015,
    pts:[[-5,-38],[0,-45],[2,-50],[4,-55],[7,-57],[10,-62],[11,-65],[12,-72],[13,-77],[15,-82],[18,-87],[21,-86]] },

  { f:'w', nm:'Corriente del Golfo', sv:100, tr:'16–28 °C', proceso:'hundimiento',
    cA:T.HOT, cB:T.W3, n:65, s:.0018,
    pts:[[21,-86],[23,-84],[24,-82],[25,-79],[28,-79],[32,-78],[36,-74],[40,-68],[44,-58],[48,-44],[51,-32],[55,-20],[58,-8],[61,2],[63,5]] },

  { f:'w', nm:'Corriente de Noruega', sv:8, tr:'9–16 °C', proceso:'hundimiento',
    cA:T.W3, cB:T.M2, n:35, s:.0015,
    pts:[[62,5],[65,8],[68,12],[70,15]] },

  { f:'c', nm:'Corriente del Labrador', sv:40, tr:'0–6 °C', proceso:'hundimiento',
    cA:T.C3, cB:T.C1, n:45, s:.0015,
    pts:[[72,-56],[68,-60],[60,-54],[53,-53],[47,-52],[42,-50]] },

  { f:'c', cA:T.M2, cB:T.C3, n:35, s:.0012,
    pts:[[70,15],[73,20],[77,0],[80,-5],[80,-12]] },

  { f:'c', nm:'Corriente de Groenlandia Oriental', sv:15, tr:'-1–0 °C', proceso:'hundimiento',
    cA:T.C4, cB:T.C3, n:40, s:.0014,
    pts:[[80,-12],[73,-20],[67,-23],[61,-28],[56,-36]] },

  { f:'c', nm:'Corriente de Groenlandia Occidental', sv:12, tr:'0–3 °C',
    cA:T.C3, cB:T.C2, n:35, s:.0013,
    pts:[[56,-36],[59,-46],[62,-52],[64,-52],[66,-53],[69,-54],[72,-56]] },

  { f:'c', nm:'Corriente de Canarias', sv:10, tr:'6–12 °C', proceso:'afloramiento',
    cA:T.C1, cB:T.M2, n:50, s:.0014,
    pts:[[55,-20],[50,-14],[43,-12],[36,-12],[28,-15],[20,-18],[13,-20]] },

  { f:'w', cA:T.HOT, cB:T.W1, n:25, s:.0012,
    pts:[[10,-62],[8,-57],[5,-50]] },

  { f:'w', cA:T.HOT, cB:T.W1, n:22, s:.0012,
    pts:[[5,-55],[5,-52],[5,-50]] },

  { f:'w', nm:'Contracorriente Ecuatorial del Atlántico', sv:10, tr:'20–24 °C',
    cA:T.W1, cB:T.W1, n:45, s:.0011,
    pts:[[5,-50],[5,-38],[5,-24],[4,-15]] },

  { f:'w', nm:'Corriente de Guinea', sv:4, tr:'22–28 °C',
    cA:T.W1, cB:T.W1, n:35, s:.001,
    pts:[[4,-15],[3,-8],[2,-2],[1,3],[0,5],[-3,5]] },

  { f:'w', cA:T.W1, cB:T.M2, n:22, s:.0011,
    pts:[[0,5],[-4,8],[-8,10],[-12,10],[-14,10]] },

  // ── GIRO ATLÁNTICO SUR ──────────────────────────────────────────────────
  { f:'w', nm:'Corriente Surecuatorial del Atlántico', sv:16, tr:'20–24 °C',
    cA:T.W1, cB:T.W1, n:45, s:.0012,
    pts:[[-3,5],[-3,-12],[-4,-25],[-5,-38]] },

  { f:'w', nm:'Corriente del Brasil', sv:20, tr:'16–28 °C',
    cA:T.HOT, cB:T.W3, n:50, s:.0015,
    pts:[[-5,-38],[-12,-36],[-20,-38],[-28,-45],[-35,-52],[-38,-52]] },

  { f:'c', nm:'Corriente de las Malvinas', sv:40, tr:'0–6 °C',
    cA:T.C3, cB:T.C1, n:50, s:.0014,
    pts:[[-56,-60],[-50,-61],[-44,-57],[-40,-54],[-38,-52]] },

  { f:'c', nm:'Corriente del Atlántico Sur', sv:25, tr:'6–12 °C',
    cA:T.M1, cB:T.C1, n:70, s:.0013,
    pts:[[-38,-52],[-39,-42],[-40,-30],[-40,-18],[-39,-6],[-38,6],[-38,18]] },

  { f:'c', nm:'Corriente de Benguela', sv:15, tr:'3–9 °C', proceso:'afloramiento',
    cA:T.C2, cB:T.M2, n:45, s:.0013,
    pts:[[-38,18],[-30,14],[-22,12],[-14,10],[-6,9],[-3,5]] },

  // ── GIRO ÍNDICO ─────────────────────────────────────────────────────────
  { f:'w', nm:'Corriente Surecuatorial del Índico', sv:30, tr:'20–24 °C',
    cA:T.W1, cB:T.W1, n:50, s:.0012,
    pts:[[-8,118],[-10,102],[-10,85],[-10,68],[-10,54],[-11,44]] },

  { f:'w', nm:'Corriente de Mozambique', sv:20, tr:'20–24 °C',
    cA:T.W1, cB:T.W2, n:38, s:.0012,
    pts:[[-11,44],[-17,42],[-22,39],[-26,37],[-28,35]] },

  { f:'w', nm:'Corriente de las Agulhas', sv:70, tr:'9–20 °C', proceso:'convergencia',
    cA:T.W2, cB:T.M1, n:45, s:.0015,
    pts:[[-28,35],[-30,33],[-33,29],[-35,25],[-37,22],[-40,21]] },

  { f:'c', cA:T.M1, cB:T.C4, n:30, s:.001,
    pts:[[-40,21],[-50,24],[-57,28]] },

  { f:'w', nm:'Corriente del Índico Sur', sv:15, tr:'9–20 °C',
    cA:T.M1, cB:T.M2, n:55, s:.001,
    pts:[[-40,21],[-40,40],[-40,60],[-40,82],[-40,100],[-36,108],[-35,115]] },

  { f:'w', nm:'Corriente Norecuatorial del Índico', sv:20, tr:'20–24 °C',
    cA:T.W1, cB:T.W1, n:40, s:.0011,
    pts:[[10,85],[5,82],[6,75],[6,65],[6,57],[8,48]] },

  { f:'w', nm:'Corriente de Somalia', sv:30, tr:'20–28 °C', proceso:'afloramiento',
    cA:T.W1, cB:T.W1, n:35, s:.0012,
    pts:[[8,48],[4,46],[1,44],[-3,43],[-7,44],[-11,44]] },

  // ── CIRCUMPOLAR ─────────────────────────────────────────────────────────
  { f:'c', nm:'Corriente Circumpolar Antártica', sv:130, tr:'0–2 °C',
    closed:true, n:130, s:.0007, cA:T.C4, cB:T.C4,
    pts:[[-57,-175],[-55,-148],[-57,-120],[-58,-90],[-56,-60],[-57,-30],[-55,-2],[-57,28],[-55,58],[-57,88],[-55,118],[-57,148],[-55,175]] },
];
