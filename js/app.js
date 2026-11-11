/**
 * ERGOS PROJECT - LÓGICA DE INTERACCIÓN Y NAVEGACIÓN
 */

// Navegación fluida entre pestañas
function showSection(sectionId) {
  const viewInicio = document.getElementById('view-inicio');
  const viewQuienes = document.getElementById('view-quienes-somos');
  const viewServicios = document.getElementById('view-servicios');

  const btnInicio = document.getElementById('btn-nav-inicio');
  const btnQuienes = document.getElementById('btn-nav-quienes');
  const btnServicios = document.getElementById('btn-nav-servicios');

  const mBtnInicio = document.getElementById('m-btn-inicio');
  const mBtnQuienes = document.getElementById('m-btn-quienes');
  const mBtnServicios = document.getElementById('m-btn-servicios');

  if (!viewInicio || !viewQuienes || !viewServicios) return;

  // Ocultar todas las vistas
  viewInicio.classList.add('hidden');
  viewQuienes.classList.add('hidden');
  viewServicios.classList.add('hidden');

  // Resetear estados de escritorio
  [btnInicio, btnQuienes, btnServicios].forEach(btn => {
    if (btn) {
      btn.classList.remove('bg-gray-100', 'text-gray-900', 'active');
      btn.classList.add('text-gray-600');
    }
  });

  // Resetear estados móviles
  [mBtnInicio, mBtnQuienes, mBtnServicios].forEach(btn => {
    if (btn) {
      btn.classList.remove('active');
    }
  });

  // Activar la vista correspondiente
  if (sectionId === 'quienes-somos') {
    viewQuienes.classList.remove('hidden');
    if (btnQuienes) btnQuienes.classList.add('bg-gray-100', 'text-gray-900', 'active');
    if (mBtnQuienes) mBtnQuienes.classList.add('active');
  } else if (sectionId === 'servicios') {
    viewServicios.classList.remove('hidden');
    if (btnServicios) btnServicios.classList.add('bg-gray-100', 'text-gray-900', 'active');
    if (mBtnServicios) mBtnServicios.classList.add('active');
  } else {
    viewInicio.classList.remove('hidden');
    if (btnInicio) btnInicio.classList.add('bg-gray-100', 'text-gray-900', 'active');
    if (mBtnInicio) mBtnInicio.classList.add('active');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Desplazamiento a canales de colaboración
function irAColaboracion() {
  const viewInicio = document.getElementById('view-inicio');
  if (viewInicio && viewInicio.classList.contains('hidden')) {
    showSection('inicio');
  }
  setTimeout(() => {
    const target = document.getElementById('colaboracion');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 80);
}

// Control del menú lateral en móviles
function toggleMobileMenu(abrir) {
  const container = document.getElementById('drawer-container');
  if (!container) return;

  if (abrir) {
    container.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  } else {
    container.classList.remove('is-open');
    document.body.style.overflow = '';
  }
}

// Sincronización transparente en segundo plano (Zero-flicker & Anti-bloqueo)
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR1ikLUsI2BQIuZy8TX8B_vdrjNxMCX_QJoEb64ggNQLDMneQzPFj2syzQQo5SO7wJh1qU-QNZZNDEv/pub?gid=0&single=true&output=csv";
const SHEET_GVIZ_URL = "https://docs.google.com/spreadsheets/d/1BLJJaoYRZSuFmsMlM6fCOWwi_tjFhtKGDzfZ6i-gbgY/gviz/tq?tqx=out:csv";

async function sincronizarCifrasRecaudacion() {
  const elRec = document.getElementById('stat-recaudado');
  const elInv = document.getElementById('stat-invertido');
  const elDisp = document.getElementById('stat-disponible');

  if (!elRec || !elInv || !elDisp) return;

  // Cargar inmediatamente desde caché si existe (0 milisegundos)
  try {
    const cached = JSON.parse(localStorage.getItem('ergos_cifras_cache') || 'null');
    if (cached) {
      if (cached.rec) elRec.textContent = cached.rec;
      if (cached.inv) elInv.textContent = cached.inv;
      if (cached.disp) elDisp.textContent = cached.disp;
    }
  } catch(e) {}

  // Consulta en segundo plano con límite de tiempo de 3.5 segundos
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    let csvText = null;

    // Intento 1: URL publicada
    try {
      const res = await fetch(SHEET_CSV_URL, { signal: controller.signal, cache: 'no-cache' });
      if (res.ok) csvText = await res.text();
    } catch(err) {}

    // Intento 2: GViz API si falló el primero
    if (!csvText) {
      try {
        const res2 = await fetch(SHEET_GVIZ_URL, { signal: controller.signal, cache: 'no-cache' });
        if (res2.ok) csvText = await res2.text();
      } catch(err) {}
    }

    clearTimeout(timeoutId);

    if (!csvText) return;

    const rows = parseCSV(csvText);
    if (rows.length < 2) return;

    let headerIdx = -1, cRec = -1, cInv = -1, cDisp = -1;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r].map(c => (c || '').toUpperCase().trim());
      const idx = row.lastIndexOf('DISPONIBLE');
      if (idx !== -1) {
        headerIdx = r;
        cDisp = idx;
        cInv = row.lastIndexOf('INVERTIDO');
        cRec = row.lastIndexOf('RECAUDADO');
        break;
      }
    }

    if (headerIdx !== -1 && cDisp !== -1) {
      for (let r = rows.length - 1; r > headerIdx; r--) {
        const row = rows[r];
        const vDisp = row[cDisp]?.trim();
        const vInv = row[cInv]?.trim();
        const vRec = row[cRec]?.trim();

        if (vDisp || vRec) {
          const nRec = formatearMonto(vRec || '');
          const nInv = formatearMonto(vInv || '');
          const nDisp = formatearMonto(vDisp || '');

          if (nRec && elRec.textContent !== nRec) elRec.textContent = nRec;
          if (nInv && elInv.textContent !== nInv) elInv.textContent = nInv;
          if (nDisp && elDisp.textContent !== nDisp) elDisp.textContent = nDisp;

          try {
            localStorage.setItem('ergos_cifras_cache', JSON.stringify({ rec: nRec, inv: nInv, disp: nDisp }));
          } catch(e) {}
          break;
        }
      }
    }
  } catch(e) {
    // Falla silenciosa: mantiene valores vigentes
  }
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  return lines.map(line => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

function formatearMonto(valor) {
  return valor.replace(/"/g, '').trim();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', sincronizarCifrasRecaudacion);
} else {
  sincronizarCifrasRecaudacion();
}
