const entradaUrlServidor = document.getElementById('serverUrl');
const botaoConectar = document.getElementById('connectBtn');
const elementoStatus = document.getElementById('status');
const listaMusicasEl = document.getElementById('songList');
const audioEl = document.getElementById('audio');
const songTitleEl = document.getElementById('songTitle');
const artistNameEl = document.getElementById('artistName');
const albumArtEl = document.getElementById('albumArt');
const progressFillEl = document.getElementById('progressFill');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const menu = document.getElementById('menu');
const searchBtn = document.getElementById('searchBtn');

// Estado da aplicação
let musicasDisponiveis = [];
let indiceAtual = -1;
let urlBase = '';
let historicoMusicas = []; // Array para armazenar o histórico

// Carrega URL salva do localStorage
const urlSalva = localStorage.getItem('urlServidor') ?? localStorage.getItem('serverUrl');
if (urlSalva) entradaUrlServidor.value = urlSalva;

// Função auxiliar para juntar URLs
function juntarUrl(base, relativo) {
  try {
    return new URL(relativo, base).href;
  } catch {
    return base.replace(/\/+$/, '') + '/' + relativo.replace(/^\/+/, '');
  }
}

// Função auxiliar para buscar JSON
async function buscarJSON(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}

// Função para exibir status temporário
function definirStatus(mensagem, duracao = 3000) {
  elementoStatus.textContent = mensagem;
  elementoStatus.classList.add('show');
  setTimeout(() => {
    elementoStatus.classList.remove('show');
  }, duracao);
}

botaoConectar.addEventListener('click', async () => {
  const base = entradaUrlServidor.value.trim().replace(/\/$/, '');
  if (!base) {
    definirStatus('Informe a URL do servidor.');
    return;
  }

  localStorage.setItem('urlServidor', base);
  localStorage.setItem('serverUrl', base);
  urlBase = base;

  definirStatus('Conectando…');
  try {
    const saude = await buscarJSON(juntarUrl(base, '/api/saude'));
    definirStatus(`Conectado. ${saude.count} músicas disponíveis.`);
    const musicas = await buscarJSON(juntarUrl(base, '/api/musicas'));
    musicasDisponiveis = musicas;
    renderizarMusicas(musicas);
    // Fecha o menu após conectar
    menu.classList.remove('active');
  } catch (erro) {
    definirStatus('Falha ao conectar. Verifique a URL e a rede.');
    console.error(erro);
  }
});

// Renderiza lista de músicas
function renderizarMusicas(musicas) {
  listaMusicasEl.innerHTML = '';
  if (!musicas.length) {
    listaMusicasEl.innerHTML = '<li>Nenhuma música encontrada no servidor.</li>';
    return;
  }

  musicas.forEach((musica, index) => {
    const li = document.createElement('li');

    const conteudo = document.createElement('div');
    conteudo.className = 'song-item-content';

    const numero = document.createElement('span');
    numero.className = 'song-number';
    numero.textContent = `${index + 1}.`;

    const meta = document.createElement('div');
    meta.className = 'song-meta';

    const titulo = document.createElement('div');
    titulo.className = 'title';
    titulo.textContent = musica.title || '(Sem título)';

    const artista = document.createElement('div');
    artista.className = 'artist';
    artista.textContent = musica.artist || 'Desconhecido';

    meta.appendChild(titulo);
    meta.appendChild(artista);

    conteudo.appendChild(numero);
    conteudo.appendChild(meta);

    const botaoTocar = document.createElement('button');
    botaoTocar.className = 'play-song-btn';
    botaoTocar.textContent = 'Tocar';
    botaoTocar.addEventListener('click', () => tocarMusica(index));

    li.appendChild(conteudo);
    li.appendChild(botaoTocar);
    listaMusicasEl.appendChild(li);
  });
}

// Toca uma música pelo índice
function tocarMusica(index) {
  if (index < 0 || index >= musicasDisponiveis.length) return;

  indiceAtual = index;
  const musica = musicasDisponiveis[index];
  const url = musica.url?.startsWith('http' ) ? musica.url : juntarUrl(urlBase, musica.url);

  audioEl.src = url;
  audioEl.play().catch(console.error);

  // Atualiza o histórico com a música atual
  atualizarHistorico(musica);

  // Atualiza interface
  songTitleEl.textContent = musica.title || '';
  artistNameEl.textContent = musica.artist || '';
  // Atualiza capa do álbum se disponível
  if (musica.cover) {
    albumArtEl.src = musica.cover;
  }

  // Atualiza ícone do botão play
  atualizarIconePlay(true);
}

// Atualiza ícone do botão play/pause
function atualizarIconePlay(tocando) {
  if (tocando) {
    playBtn.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
</svg>
    `;
  } else {
    playBtn.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
<path d="M8 5v14l11-7z"/>
</svg>
    `;
  }
}

// Botão play/pause
playBtn.addEventListener('click', ( ) => {
  if (audioEl.paused) {
    if (indiceAtual === -1 && musicasDisponiveis.length > 0) {
      tocarMusica(0);
    } else {
      audioEl.play().catch(console.error);
    }
  } else {
    audioEl.pause();
  }
});

// Botão anterior
prevBtn.addEventListener('click', () => {
  if (indiceAtual > 0) {
    tocarMusica(indiceAtual - 1);
  }
});

// Botão próxima
nextBtn.addEventListener('click', () => {
  if (indiceAtual < musicasDisponiveis.length - 1) {
    tocarMusica(indiceAtual + 1);
  }
});

// Atualiza barra de progresso
audioEl.addEventListener('timeupdate', () => {
  if (audioEl.duration) {
    const progresso = (audioEl.currentTime / audioEl.duration) * 100;
    progressFillEl.style.width = `${progresso}%`;
  }
});

// Atualiza ícone quando a música toca/pausa
audioEl.addEventListener('play', () => atualizarIconePlay(true));
audioEl.addEventListener('pause', () => atualizarIconePlay(false));

// Toca próxima música automaticamente ao terminar
audioEl.addEventListener('ended', () => {
  if (indiceAtual < musicasDisponiveis.length - 1) {
    tocarMusica(indiceAtual + 1);
  }
});

// Menu lateral - abre/fecha ao clicar na lupa
searchBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  menu.classList.toggle('active');
});

// Fecha menu ao clicar fora
document.addEventListener('click', (e) => {
  if (menu.classList.contains('active') && !menu.contains(e.target) && e.target !== searchBtn) {
    menu.classList.remove('active');
  }
});

// --- Atualizar Histórico ---
function atualizarHistorico(musica) {
    console.log('atualizarHistorico chamada para:', musica);
    if (historicoMusicas.length > 0 && historicoMusicas[0].url === musica.url) {
        console.log('Mesma música consecutiva — não adiciona ao histórico');
        return;
    }

    historicoMusicas.unshift(musica);
    if (historicoMusicas.length > 20) historicoMusicas.pop();

    const lista = document.getElementById('song-history');
    if (!lista) {
        console.warn('Elemento #song-history não encontrado');
        return;
    }

    lista.innerHTML = '';

    historicoMusicas.forEach((item, idx) => {
        const li = document.createElement('li');
        li.textContent = `${item.title || '(Sem título)'} - ${item.artist || 'Desconhecido'}`;
        lista.appendChild(li);
    });

    console.log('Histórico atualizado:', historicoMusicas);
}
