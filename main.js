const API_URL = 'https://script.google.com/macros/s/AKfycbxKZNmXDRbYqcbxCymBBODz1HA4IPA3MrcGTP7SwjA/dev';

let results = [];
let editarId = null;

const form = document.getElementById('resultForm');
const tableBody = document.querySelector('#resultsTable tbody');
const statsDiv = document.getElementById('stats');
const lucroCanvas = document.getElementById('lucroChart');

const inputFiltroTipo = document.getElementById('filtroTipo');
const inputFiltroDataInicio = document.getElementById('filtroDataInicio');
const inputFiltroDataFim = document.getElementById('filtroDataFim');
const botaoFiltrar = document.getElementById('botaoFiltrar');
const botaoLimparFiltro = document.getElementById('botaoLimparFiltro');
const botaoExportarCSV = document.getElementById('botaoExportarCSV');

const tabs = document.querySelectorAll('.tabbutton');
const tabContents = document.querySelectorAll('.tabcontent');

async function carregarResultados() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Erro ao carregar dados');
    results = await response.json();
    renderResults();
    renderStats();
    renderChart();
    renderResumoGeral();
  } catch (error) {
    alert('Falha ao carregar dados do servidor: ' + error.message);
  }
}

async function salvarResultado(data, action = 'add') {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action, ...data }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Erro ao salvar dados');
    return await response.json();
  } catch (error) {
    alert('Falha ao salvar dados no servidor: ' + error.message);
    throw error;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = form.data.value;
  const tipo = form.tipo.value;
  const stake = parseFloat(form.stake.value);
  const posicao = parseInt(form.posicao.value);
  const lucro = parseFloat(form.lucro.value);

  try {
    if (editarId) {
      await salvarResultado({ id: editarId, data, tipo, stake, posicao, lucro }, 'edit');
      editarId = null;
    } else {
      await salvarResultado({ data, tipo, stake, posicao, lucro }, 'add');
    }
    form.reset();
    await carregarResultados();
  } catch {}
});

botaoFiltrar.addEventListener('click', () => {
  const tipoFiltro = inputFiltroTipo.value.toLowerCase();
  const dataInicio = inputFiltroDataInicio.value;
  const dataFim = inputFiltroDataFim.value;

  const filteredResults = results.filter((r) => {
    const tipoMatch = !tipoFiltro || r.tipo.toLowerCase().includes(tipoFiltro);
    const dataMatch = (!dataInicio || r.data >= dataInicio) && (!dataFim || r.data <= dataFim);
    return tipoMatch && dataMatch;
  });

  renderResults(filteredResults);
});

botaoLimparFiltro.addEventListener('click', () => {
  inputFiltroTipo.value = '';
  inputFiltroDataInicio.value = '';
  inputFiltroDataFim.value = '';
  renderResults(results);
});

botaoExportarCSV.addEventListener('click', () => {
  if (results.length === 0) {
    alert('Nenhum resultado para exportar.');
    return;
  }
  const csvContent = gerarCSV(results);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'resultados_poker.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

function gerarCSV(data) {
  const cabecalho = ['Data', 'Tipo', 'Stake', 'Posição', 'Lucro'];
  const linhas = data.map((r) => [r.data, r.tipo, r.stake.toFixed(2), r.posicao, r.lucro.toFixed(2)].join(','));
  return cabecalho.join(',') + '\n' + linhas.join('\n');
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    tabContents.forEach((tc) => (tc.style.display = tc.id === target ? 'block' : 'none'));

    if (target === 'torneios') renderResults();
    if (target === 'estatisticas') renderStats();
    if (target === 'graficos') renderChart();
  });
});

function renderResults(dataToRender = results) {
  tableBody.innerHTML = dataToRender
    .map((r, index) => {
      const roi = ((r.lucro / r.stake) * 100).toFixed(2);
      const lucroHora = (r.lucro / 1).toFixed(2);
      const capacidade = 60;
      return `
        <tr>
          <td>${r.data}</td>
          <td>${r.tipo}</td>
          <td>${r.stake.toFixed(2)}</td>
          <td>${r.posicao}</td>
          <td style="color:${r.lucro < 0 ? '#e53e3e' : '#2b6cb0'}">${r.lucro.toFixed(2)}</td>
          <td>${roi}%</td>
          <td>${r.stake.toFixed(2)}</td>
          <td>${lucroHora}</td>
          <td>${capacidade}</td>
          <td>
            <button onclick="editarRegistro(${index})">Editar</button>
            <button onclick="excluirRegistro(${index})">Excluir</button>
          </td>
        </tr>
      `;
    })
    .join('');
}

async function excluirRegistro(index) {
  const registro = results[index];
  if (confirm('Deseja excluir este registro?')) {
    await salvarResultado({ id: registro.id }, 'delete');
    await carregarResultados();
  }
}

function editarRegistro(index) {
  const registro = results[index];
  editarId = registro.id;
  form.data.value = registro.data;
  form.tipo.value = registro.tipo;
  form.stake.value = registro.stake;
  form.posicao.value = registro.posicao;
  form.lucro.value = registro.lucro;

  tabs.forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === 'form');
    tabContents.forEach((tc) => {
      tc.style.display = tc.id === 'form' ? 'block' : 'none';
    });
  });

  form.data.focus();
}

function renderStats() {
  const jogos = results.length;
  const lucroTotal = results.reduce((acc, r) => acc + r.lucro, 0);
  const stakeTotal = results.reduce((acc, r) => acc + r.stake, 0);
  const lucroMedio = jogos ? lucroTotal / jogos : 0;
  const stakeMedio = jogos ? stakeTotal / jogos : 0;
  const roiMedio = stakeTotal ? (lucroTotal / stakeTotal) * 100 : 0;
  const itmPercent = resultadosITM();
  const vitorias = resultadosVitoria();
  const series = calcularSeries();
  const diasAtivos = calcularDiasAtivos();

  statsDiv.innerHTML = `
    <p>Contagem de jogos: ${jogos}</p>
    <p>Lucro médio: ${lucroMedio.toFixed(2)}</p>
    <p>Stake médio: ${stakeMedio.toFixed(2)}</p>
    <p>ROI médio: ${roiMedio.toFixed(2)}%</p>
    <p>ITM %: ${itmPercent.toFixed(2)}%</p>
    <p>Vitórias: ${vitorias}</p>
    <p>Série máxima de vitórias: ${series.maxVitorias}</p>
    <p>Série máxima de derrotas: ${series.maxDerrotas}</p>
    <p>Dias ativos: ${diasAtivos}</p>
  `;
}

function resultadosITM() {
  const itm = results.filter((r) => r.posicao <= 3).length;
  return results.length ? (itm * 100) / results.length : 0;
}

function resultadosVitoria() {
  return results.filter((r) => r.lucro > 0).length;
}

function calcularSeries() {
  let maxVitorias = 0,
    maxDerrotas = 0,
    atualVitorias = 0,
    atualDerrotas = 0;

  for (const r of results) {
    if (r.lucro > 0) {
      atualVitorias++;
      atualDerrotas = 0;
    } else {
      atualDerrotas++;
      atualVitorias = 0;
    }
    if (atualVitorias > maxVitorias) maxVitorias = atualVitorias;
    if (atualDerrotas > maxDerrotas) maxDerrotas = atualDerrotas;
  }
  return { maxVitorias, maxDerrotas };
}

function calcularDiasAtivos() {
  const datas = new Set(results.map((r) => r.data));
  return datas.size;
}

function renderResumoGeral() {
  const jogador = 'Anónisnumhave<br /><span style="color:#4299e1; font-size:0.93em;">PokerStars</span>';
  const contagem = results.length;
  const lucroTotal = results.reduce((acc, r) => acc + r.lucro, 0);
  const lucroMedio = contagem ? lucroTotal / contagem : 0;
  const stakeTotal = results.reduce((acc, r) => acc + r.stake, 0);
  const stakeMedio = contagem ? stakeTotal / contagem : 0;
  const roiMedio = stakeTotal ? (lucroTotal / stakeTotal) * 100 : 0;
  const capacidade = 55;

  document.getElementById('resumoBody').innerHTML = `
    <tr>
      <td style="text-align:left;">${jogador}</td>
      <td>${contagem}</td>
      <td style="color:${lucroMedio < 0 ? '#e53e3e' : '#2b6cb0'}">${lucroMedio.toFixed(2)}</td>
      <td>${stakeMedio.toFixed(2)}</td>
      <td style="color:${roiMedio < 0 ? '#e53e3e' : '#2b6cb0'}">${roiMedio.toFixed(1)}%</td>
      <td style="color:${lucroTotal < 0 ? '#e53e3e' : '#2b6cb0'}">${lucroTotal.toFixed(2)}</td>
      <td>${capacidade}</td>
    </tr>
  `;
}

function renderChart() {
  const labels = results.map((_, i) => i + 1);
  let lucroAcum = 0;
  const data = [];
  const markers = [];

  results.forEach((r) => {
    lucroAcum += r.lucro;
    data.push(lucroAcum);
    if (r.lucro > 2 * r.stake) {
      markers.push({ x: labels[data.length - 1], y: lucroAcum });
    }
  });

  if (window.lucroChartInstance) window.lucroChartInstance.destroy();

  const ctx = lucroCanvas.getContext('2d');
  window.lucroChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Lucro Acumulado',
          data,
          borderColor: '#2b6cb0',
          backgroundColor: '#63b3ed44',
          fill: false,
        },
        {
          label: 'Vitórias Significativas',
          data: markers,
          type: 'scatter',
          backgroundColor: '#f6e05e',
          pointRadius: 8,
          showLine: false,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: true },
      },
      responsive: false,
      scales: {
        x: { title: { display: true, text: 'Nº de Jogos' } },
        y: { title: { display: true, text: 'Lucro Total (USD)' } },
      },
    },
  });
}

// Inicializa carregando dados da planilha
carregarResultados();


