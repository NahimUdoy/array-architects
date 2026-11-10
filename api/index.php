<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$route = trim((string) ($_GET['r'] ?? 'public'), '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$resources = [
    'stats' => ['table' => 'stats', 'fields' => ['stat_value', 'stat_label', 'sort_order']],
    'services' => ['table' => 'services', 'fields' => ['title', 'slug', 'short_text', 'lead_text', 'body_text', 'icon', 'icon_color', 'image', 'offerings', 'sort_order', 'show_on_home'], 'json' => ['offerings']],
    'process' => ['table' => 'process_steps', 'fields' => ['title', 'body_text', 'icon', 'icon_color', 'sort_order']],
    'projects' => ['table' => 'projects', 'fields' => ['title', 'category', 'location', 'description', 'image', 'year', 'area', 'status', 'client', 'duration', 'features', 'featured', 'sort_order'], 'json' => ['features']],
    'testimonials' => ['table' => 'testimonials', 'fields' => ['name', 'role', 'quote', 'rating', 'sort_order']],
    'values' => ['table' => 'values_items', 'fields' => ['title', 'body_text', 'icon', 'icon_color', 'sort_order']],
    'why-choose' => ['table' => 'why_choose', 'fields' => ['title', 'body_text', 'icon', 'icon_color', 'sort_order']],
    'benefits' => ['table' => 'benefits', 'fields' => ['title', 'body_text', 'icon', 'icon_color', 'sort_order']],
    'jobs' => ['table' => 'jobs', 'fields' => ['title', 'badge', 'job_type', 'department', 'location', 'salary', 'description', 'requirements', 'software', 'facebook_url', 'is_open', 'sort_order'], 'json' => ['requirements', 'software']],
];

try {
    if ($route === 'public' && $method === 'GET') {
        json_ok(public_payload(db()));
    }

    if ($route === 'inquiry' && $method === 'POST') {
        $in = json_input();
        $required = ['name', 'email', 'phone', 'project_type', 'project_location', 'description', 'contact_method'];
        foreach ($required as $field) {
            if (trim((string) ($in[$field] ?? '')) === '') {
                json_error('Please complete all required fields.');
            }
        }
        if (!filter_var($in['email'], FILTER_VALIDATE_EMAIL)) {
            json_error('Please enter a valid email address.');
        }
        $stmt = db()->prepare('INSERT INTO inquiries (name, email, phone, project_type, project_location, budget, description, contact_method) VALUES (?,?,?,?,?,?,?,?)');
        $stmt->execute([
            trim($in['name']),
            trim($in['email']),
            trim($in['phone']),
            trim($in['project_type']),
            trim($in['project_location']),
            trim((string) ($in['budget'] ?? '')),
            trim($in['description']),
            trim($in['contact_method']),
        ]);
        json_ok(['id' => (int) db()->lastInsertId()], 201);
    }

    if ($route === 'apply' && $method === 'POST') {
        $in = json_input();
        foreach (['name', 'email', 'phone', 'position', 'message'] as $field) {
            if (trim((string) ($in[$field] ?? '')) === '') {
                json_error('Please complete all required fields.');
            }
        }
        if (!filter_var($in['email'], FILTER_VALIDATE_EMAIL)) {
            json_error('Please enter a valid email address.');
        }
        $stmt = db()->prepare('INSERT INTO applications (name, email, phone, position, portfolio, message) VALUES (?,?,?,?,?,?)');
        $stmt->execute([
            trim($in['name']),
            trim($in['email']),
            trim($in['phone']),
            trim($in['position']),
            trim((string) ($in['portfolio'] ?? '')),
            trim($in['message']),
        ]);
        json_ok(['id' => (int) db()->lastInsertId()], 201);
    }

    if ($route === 'login' && $method === 'POST') {
        $in = json_input();
        $email = trim((string) ($in['email'] ?? ''));
        $password = (string) ($in['password'] ?? '');
        $stmt = db()->prepare('SELECT * FROM admins WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $admin = $stmt->fetch();
        if (!$admin || !password_verify($password, $admin['password_hash'])) {
            json_error('Invalid email or password.', 401);
        }
        $_SESSION['admin_id'] = (int) $admin['id'];
        $_SESSION['admin_name'] = $admin['name'];
        $_SESSION['admin_email'] = $admin['email'];
        json_ok(['name' => $admin['name'], 'email' => $admin['email']]);
    }

    if ($route === 'logout' && $method === 'POST') {
        $_SESSION = [];
        session_destroy();
        json_ok(['logged_out' => true]);
    }

    $admin = require_admin();

    if ($route === 'me' && $method === 'GET') {
        json_ok($admin);
    }

    if ($route === 'dashboard' && $method === 'GET') {
        $pdo = db();
        json_ok([
            'admin' => $admin,
            'counts' => [
                'projects' => (int) $pdo->query('SELECT COUNT(*) FROM projects')->fetchColumn(),
                'services' => (int) $pdo->query('SELECT COUNT(*) FROM services')->fetchColumn(),
                'jobs' => (int) $pdo->query('SELECT COUNT(*) FROM jobs')->fetchColumn(),
                'inquiries' => (int) $pdo->query("SELECT COUNT(*) FROM inquiries WHERE status = 'new'")->fetchColumn(),
                'applications' => (int) $pdo->query("SELECT COUNT(*) FROM applications WHERE status = 'new'")->fetchColumn(),
                'media' => (int) $pdo->query('SELECT COUNT(*) FROM media')->fetchColumn(),
            ],
            'recent_inquiries' => $pdo->query('SELECT id, name, email, project_type, status, created_at FROM inquiries ORDER BY id DESC LIMIT 6')->fetchAll(),
            'recent_applications' => $pdo->query('SELECT id, name, email, position, status, created_at FROM applications ORDER BY id DESC LIMIT 6')->fetchAll(),
        ]);
    }

    if ($route === 'settings' && $method === 'GET') {
        json_ok(settings_map(db()));
    }

    if ($route === 'settings' && $method === 'PUT') {
        $in = json_input();
        $stmt = db()->prepare('INSERT INTO settings (setting_key, setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)');
        foreach ($in as $key => $value) {
            if (!is_string($key) || !preg_match('/^[a-z0-9_]+$/', $key)) {
                continue;
            }
            $stmt->execute([$key, is_scalar($value) ? (string) $value : json_encode($value)]);
        }
        json_ok(settings_map(db()));
    }

    if ($route === 'pages' && $method === 'GET') {
        json_ok(public_payload(db())['pages']);
    }

    if (preg_match('#^pages/([a-z]+)$#', $route, $m) && $method === 'PUT') {
        $slug = $m[1];
        $in = json_input();
        $stmt = db()->prepare('UPDATE pages SET title=?, meta_description=?, meta_keywords=?, hero_badge=?, hero_title=?, hero_tagline=?, hero_description=?, hero_image=?, extra_json=? WHERE slug=?');
        $stmt->execute([
            $in['title'] ?? '',
            $in['meta_description'] ?? '',
            $in['meta_keywords'] ?? '',
            $in['hero_badge'] ?? '',
            $in['hero_title'] ?? '',
            $in['hero_tagline'] ?? '',
            $in['hero_description'] ?? '',
            $in['hero_image'] ?? '',
            json_encode($in['extra'] ?? new stdClass(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            $slug,
        ]);
        json_ok(['slug' => $slug]);
    }

    if ($route === 'media' && $method === 'GET') {
        json_ok(db()->query('SELECT * FROM media ORDER BY id DESC')->fetchAll());
    }

    if ($route === 'upload' && $method === 'POST') {
        global $config;
        if (empty($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
            json_error('Please choose an image to upload.');
        }
        $file = $_FILES['file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            json_error('Upload failed. Try a smaller image.');
        }
        if ($file['size'] > $config['max_upload_bytes']) {
            json_error('Image is too large. Max size is 8 MB.');
        }
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        $allowed = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
        ];
        if (!isset($allowed[$mime])) {
            json_error('Please upload a JPG, PNG, WEBP, or GIF image.');
        }
        $dir = $config['upload_dir'];
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $name = 'img_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $allowed[$mime];
        $dest = $dir . '/' . $name;
        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            json_error('Could not save the uploaded image.', 500);
        }
        $url = $config['upload_url'] . '/' . $name;
        $stmt = db()->prepare('INSERT INTO media (filename, original_name, url, mime, size_bytes) VALUES (?,?,?,?,?)');
        $stmt->execute([$name, $file['name'], $url, $mime, (int) $file['size']]);
        json_ok([
            'id' => (int) db()->lastInsertId(),
            'url' => $url,
            'original_name' => $file['name'],
        ], 201);
    }

    if (preg_match('#^media/(\d+)$#', $route, $m) && $method === 'DELETE') {
        $id = (int) $m[1];
        $stmt = db()->prepare('SELECT * FROM media WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) {
            json_error('Image not found.', 404);
        }
        db()->prepare('DELETE FROM media WHERE id = ?')->execute([$id]);
        json_ok(['deleted' => $id]);
    }

    if ($route === 'inquiries' && $method === 'GET') {
        json_ok(db()->query('SELECT * FROM inquiries ORDER BY id DESC')->fetchAll());
    }
    if (preg_match('#^inquiries/(\d+)$#', $route, $m) && $method === 'PUT') {
        $in = json_input();
        db()->prepare('UPDATE inquiries SET status = ? WHERE id = ?')->execute([$in['status'] ?? 'new', (int) $m[1]]);
        json_ok(['id' => (int) $m[1]]);
    }
    if (preg_match('#^inquiries/(\d+)$#', $route, $m) && $method === 'DELETE') {
        db()->prepare('DELETE FROM inquiries WHERE id = ?')->execute([(int) $m[1]]);
        json_ok(['deleted' => (int) $m[1]]);
    }

    if ($route === 'applications' && $method === 'GET') {
        json_ok(db()->query('SELECT * FROM applications ORDER BY id DESC')->fetchAll());
    }
    if (preg_match('#^applications/(\d+)$#', $route, $m) && $method === 'PUT') {
        $in = json_input();
        db()->prepare('UPDATE applications SET status = ? WHERE id = ?')->execute([$in['status'] ?? 'new', (int) $m[1]]);
        json_ok(['id' => (int) $m[1]]);
    }
    if (preg_match('#^applications/(\d+)$#', $route, $m) && $method === 'DELETE') {
        db()->prepare('DELETE FROM applications WHERE id = ?')->execute([(int) $m[1]]);
        json_ok(['deleted' => (int) $m[1]]);
    }

    foreach ($resources as $name => $meta) {
        if ($route === $name && $method === 'GET') {
            json_ok(db()->query('SELECT * FROM `' . $meta['table'] . '` ORDER BY sort_order, id')->fetchAll());
        }
        if ($route === $name && $method === 'POST') {
            $row = normalize_row(json_input(), $meta);
            $fields = array_keys($row);
            $sql = 'INSERT INTO `' . $meta['table'] . '` (`' . implode('`,`', $fields) . '`) VALUES (' . implode(',', array_fill(0, count($fields), '?')) . ')';
            db()->prepare($sql)->execute(array_values($row));
            json_ok(['id' => (int) db()->lastInsertId()], 201);
        }
        if (preg_match('#^' . preg_quote($name, '#') . '/(\d+)$#', $route, $m) && $method === 'PUT') {
            $row = normalize_row(json_input(), $meta);
            $sets = implode(',', array_map(static fn($f) => "`$f` = ?", array_keys($row)));
            $values = array_values($row);
            $values[] = (int) $m[1];
            db()->prepare('UPDATE `' . $meta['table'] . '` SET ' . $sets . ' WHERE id = ?')->execute($values);
            json_ok(['id' => (int) $m[1]]);
        }
        if (preg_match('#^' . preg_quote($name, '#') . '/(\d+)$#', $route, $m) && $method === 'DELETE') {
            db()->prepare('DELETE FROM `' . $meta['table'] . '` WHERE id = ?')->execute([(int) $m[1]]);
            json_ok(['deleted' => (int) $m[1]]);
        }
    }

    json_error('Not found.', 404);
} catch (Throwable $e) {
    json_error($e->getMessage(), 500);
}

function normalize_row(array $in, array $meta): array
{
    $out = [];
    foreach ($meta['fields'] as $field) {
        if (!array_key_exists($field, $in)) {
            continue;
        }
        $value = $in[$field];
        if (in_array($field, $meta['json'] ?? [], true)) {
            $out[$field] = is_string($value) ? $value : json_encode(array_values((array) $value), JSON_UNESCAPED_UNICODE);
        } else {
            $out[$field] = is_bool($value) ? (int) $value : $value;
        }
    }
    return $out;
}
