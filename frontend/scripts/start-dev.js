/**
 * Единый скрипт запуска разработки: бэкенд (FastAPI) + фронтенд (Expo).
 *
 * Почему не concurrently: он перехватывает вывод дочерних процессов, и Expo
 * считает терминал неинтерактивным — тогда не рисуется QR-код и не работают
 * горячие клавиши. Здесь Expo запускается в foreground с наследованием TTY,
 * а вывод бэкенда помечается префиксом [backend].
 *
 * Заодно фиксируется LAN-адрес: если на ПК есть виртуальные адаптеры
 * (Wi-Fi Direct и т.п. с адресами 169.254.x.x), Expo может выбрать не тот
 * интерфейс, и телефон не сможет подключиться. Реальный IP передаётся через
 * REACT_NATIVE_PACKAGER_HOSTNAME.
 */
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const FRONTEND_ROOT = path.join(__dirname, '..');
const EXPO_CLI = path.join(
  FRONTEND_ROOT,
  'node_modules',
  'expo',
  'node_modules',
  '@expo',
  'cli',
  'build',
  'bin',
  'cli'
);
const isWin = process.platform === 'win32';

const ENV_PATH = path.join(FRONTEND_ROOT, '.env');
const ENV_BACKUP_PATH = path.join(FRONTEND_ROOT, '.env.backup');
const API_VAR_NAME = 'EXPO_PUBLIC_API_URL';

// Адаптеры, которые НЕ являются локальной Wi-Fi сетью (VPN, туннели, виртуалки).
// Их адреса игнорируем при выборе IP — но сами адаптеры и VPN не трогаем.
const VIRTUAL_IFACE_PATTERNS = [
  'vpn',
  'tun',
  'tap',
  'sing-tun',
  'happ-tun',
  'wireguard',
  'openvpn',
  'docker',
  'veth',
  'wsl',
  'hyper-v',
  'vmware',
  'virtualbox',
  'virtual',
  'zerotier',
  'tailscale',
  'radmin',
  'bluetooth',
  'loopback',
  'wintun',
];

// Признаки Wi-Fi адаптера — у него высший приоритет.
const WIFI_IFACE_PATTERNS = ['wi-fi', 'wifi', 'wireless', 'беспроводная', 'wlan'];

function isVirtualInterface(name) {
  const lower = name.toLowerCase();
  return VIRTUAL_IFACE_PATTERNS.some((pattern) => lower.includes(pattern));
}

function isWifiInterface(name) {
  const lower = name.toLowerCase();
  return WIFI_IFACE_PATTERNS.some((pattern) => lower.includes(pattern));
}

/** Приватные диапазоны IPv4 (RFC 1918). */
function isPrivateIp(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

/**
 * Определяет локальный IPv4 в Wi-Fi сети.
 * Исключает loopback, link-local и адреса виртуальных адаптеров/VPN.
 * Возвращает { ip, iface } или null.
 */
function getLanIp() {
  const candidates = [];
  for (const [name, addresses] of Object.entries(os.networkInterfaces())) {
    if (isVirtualInterface(name)) continue; // VPN/туннели/виртуалки — мимо
    for (const addr of addresses || []) {
      if (addr.family !== 'IPv4' || addr.internal) continue;
      if (addr.address.startsWith('127.')) continue; // loopback
      if (addr.address.startsWith('169.254.')) continue; // link-local
      if (!isPrivateIp(addr.address)) continue;

      let score = 0;
      if (isWifiInterface(name)) score += 1000; // Wi-Fi — главный приоритет
      if (addr.address.startsWith('192.168.')) score += 100;
      else if (addr.address.startsWith('10.')) score += 50;
      else if (addr.address.startsWith('172.')) score += 5; // Docker/VPN — понижено
      else score += 20;

      candidates.push({ ip: addr.address, iface: name, score });
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return { ip: candidates[0].ip, iface: candidates[0].iface };
}

/**
 * Точечно обновляет значение EXPO_PUBLIC_API_URL в .env.
 * Остальные строки, комментарии, порядок и тип переноса не меняются.
 * Перед первой правкой создаёт .env.backup.
 * Возвращает { changed, added, url } либо { error }.
 */
function updateEnvApiUrl(ip) {
  const url = `http://${ip}:8000`;

  let content;
  try {
    content = fs.readFileSync(ENV_PATH, 'utf8');
  } catch (err) {
    return { error: `Не удалось прочитать .env: ${err.message}` };
  }

  // Резервная копия — только если её ещё нет.
  if (!fs.existsSync(ENV_BACKUP_PATH)) {
    try {
      fs.copyFileSync(ENV_PATH, ENV_BACKUP_PATH);
    } catch (err) {
      console.warn(`[dev] Не удалось создать .env.backup: ${err.message}`);
    }
  }

  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const lines = content.split(eol);

  let found = false;
  let changed = false;

  const updatedLines = lines.map((line) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('#')) return line; // комментарий не трогаем
    const eq = trimmed.indexOf('=');
    if (eq === -1) return line;
    if (trimmed.slice(0, eq).trim() !== API_VAR_NAME) return line;

    found = true;
    if (trimmed.slice(eq + 1).trim() === url) return line; // уже актуально
    changed = true;
    const leading = line.slice(0, line.length - trimmed.length);
    return `${leading}${trimmed.slice(0, eq + 1)}${url}`;
  });

  if (!found) {
    const hasTrailingEol = /\r?\n$/.test(content);
    const separator = content.length === 0 || hasTrailingEol ? '' : eol;
    const newContent = `${content}${separator}${API_VAR_NAME}=${url}${eol}`;
    try {
      fs.writeFileSync(ENV_PATH, newContent, 'utf8');
    } catch (err) {
      return { error: `Не удалось записать .env: ${err.message}` };
    }
    return { changed: true, added: true, url };
  }

  if (!changed) return { changed: false, added: false, url };

  try {
    fs.writeFileSync(ENV_PATH, updatedLines.join(eol), 'utf8');
  } catch (err) {
    return { error: `Не удалось записать .env: ${err.message}` };
  }
  return { changed: true, added: false, url };
}

const env = { ...process.env };
const lan = getLanIp();
if (!lan) {
  console.error(
    '[dev] Ошибка: не удалось определить локальный IPv4-адрес в Wi-Fi сети.'
  );
  console.error(
    '[dev] Проверьте, что Wi-Fi подключён и у адаптера есть адрес 192.168.x.x / 10.x.x.x.'
  );
  process.exit(1);
}

const envUpdate = updateEnvApiUrl(lan.ip);
if (envUpdate.error) {
  console.error(`[dev] Ошибка обновления .env: ${envUpdate.error}`);
  process.exit(1);
}
if (envUpdate.added) {
  console.warn(
    `[dev] ВНИМАНИЕ: переменной ${API_VAR_NAME} не было в .env — добавлена в конец.`
  );
} else if (envUpdate.changed) {
  console.log(`[dev] .env: ${API_VAR_NAME} обновлён на ${envUpdate.url}`);
} else {
  console.log(`[dev] .env: ${API_VAR_NAME} уже актуален.`);
}

env.REACT_NATIVE_PACKAGER_HOSTNAME = lan.ip;
console.log(
  `[dev] LAN IP: ${lan.ip} (адаптер: ${lan.iface}) | exp://${lan.ip}:8081 | backend: http://${lan.ip}:8000\n`
);

/** Убивает процесс вместе со всеми дочерними (важно для uvicorn --reload на Windows). */
function killTree(child) {
  if (!child || child.pid == null || child.exitCode !== null) return;
  if (isWin) {
    try {
      execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: 'ignore' });
    } catch {
      /* процесс уже завершился */
    }
  } else {
    child.kill('SIGTERM');
  }
}

/** Помечает строки из потока префиксом вида [backend]. */
function prefixStream(stream, tag) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop(); // незавершённая строка ждёт продолжения
    for (const line of lines) {
      if (line.trim()) process.stdout.write(`[${tag}] ${line}\n`);
    }
  });
}

// --- Бэкенд: uvicorn из папки ../backend ---
const backend = spawn('npm run backend', {
  cwd: FRONTEND_ROOT,
  env,
  shell: isWin,
});
prefixStream(backend.stdout, 'backend');
prefixStream(backend.stderr, 'backend');
backend.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`[dev] Бэкенд завершился с кодом ${code} (порт 8000 занят?)`);
  }
});

// Дополнительные аргументы прокидываются в Expo:
// node scripts/start-dev.js --port 8082
const extraArgs = process.argv.slice(2);

// --- Фронтенд: Expo в foreground с наследованием терминала (TTY) ---
const expo = fs.existsSync(EXPO_CLI)
  ? spawn(process.execPath, [EXPO_CLI, 'start', '-c', '--lan', ...extraArgs], {
      cwd: FRONTEND_ROOT,
      env,
      stdio: 'inherit', // ВАЖНО: без этого Expo не покажет QR-код
    })
  : spawn(`npx expo start -c --lan ${extraArgs.join(' ')}`, {
      cwd: FRONTEND_ROOT,
      env,
      stdio: 'inherit',
      shell: isWin,
    });

expo.on('exit', (code) => {
  killTree(backend);
  process.exit(code ?? 0);
});

process.on('SIGINT', () => {
  killTree(backend);
  killTree(expo);
  process.exit(0);
});
process.on('exit', () => killTree(backend));
