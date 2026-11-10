<?php
declare(strict_types=1);

$config = require __DIR__ . '/config.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name('atelier_admin');
    session_start([
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax',
        'cookie_path' => '/',
    ]);
}

header('X-Content-Type-Options: nosniff');

function db(): PDO
{
    static $pdo = null;
    global $config;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        $config['db_host'],
        $config['db_name'],
        $config['db_charset']
    );
    $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    return $pdo;
}

function json_input(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function json_ok($data = [], int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'data' => $data], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function json_error(string $message, int $code = 400, $extra = null): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    $payload = ['ok' => false, 'error' => $message];
    if ($extra !== null) {
        $payload['details'] = $extra;
    }
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function require_admin(): array
{
    if (empty($_SESSION['admin_id'])) {
        json_error('Please sign in to continue.', 401);
    }
    return [
        'id' => (int) $_SESSION['admin_id'],
        'name' => (string) ($_SESSION['admin_name'] ?? 'Admin'),
        'email' => (string) ($_SESSION['admin_email'] ?? ''),
    ];
}

function decode_json_field($value)
{
    if (is_array($value)) {
        return $value;
    }
    if (!is_string($value) || $value === '') {
        return [];
    }
    $decoded = json_decode($value, true);
    return is_array($decoded) ? $decoded : [];
}

function settings_map(PDO $pdo): array
{
    $rows = $pdo->query('SELECT setting_key, setting_value FROM settings')->fetchAll();
    $out = [];
    foreach ($rows as $row) {
        $out[$row['setting_key']] = $row['setting_value'];
    }
    return $out;
}

function public_payload(PDO $pdo): array
{
    $pages = [];
    foreach ($pdo->query('SELECT * FROM pages')->fetchAll() as $page) {
        $page['extra'] = decode_json_field($page['extra_json'] ?? '');
        unset($page['extra_json']);
        $pages[$page['slug']] = $page;
    }

    $mapList = static function (array $rows, array $jsonFields = []): array {
        return array_map(static function ($row) use ($jsonFields) {
            foreach ($jsonFields as $field) {
                $row[$field] = decode_json_field($row[$field] ?? '');
            }
            return $row;
        }, $rows);
    };

    return [
        'settings' => settings_map($pdo),
        'pages' => $pages,
        'stats' => $pdo->query('SELECT * FROM stats ORDER BY sort_order, id')->fetchAll(),
        'services' => $mapList(
            $pdo->query('SELECT * FROM services ORDER BY sort_order, id')->fetchAll(),
            ['offerings']
        ),
        'process' => $pdo->query('SELECT * FROM process_steps ORDER BY sort_order, id')->fetchAll(),
        'projects' => $mapList(
            $pdo->query('SELECT * FROM projects ORDER BY sort_order, id')->fetchAll(),
            ['features']
        ),
        'testimonials' => $pdo->query('SELECT * FROM testimonials ORDER BY sort_order, id')->fetchAll(),
        'values' => $pdo->query('SELECT * FROM values_items ORDER BY sort_order, id')->fetchAll(),
        'why_choose' => $pdo->query('SELECT * FROM why_choose ORDER BY sort_order, id')->fetchAll(),
        'benefits' => $pdo->query('SELECT * FROM benefits ORDER BY sort_order, id')->fetchAll(),
        'jobs' => $mapList(
            $pdo->query('SELECT * FROM jobs WHERE is_open = 1 ORDER BY sort_order, id')->fetchAll(),
            ['requirements', 'software']
        ),
    ];
}
