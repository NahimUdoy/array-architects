<?php
declare(strict_types=1);

$config = require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $root = new PDO(
        sprintf('mysql:host=%s;charset=%s', $config['db_host'], $config['db_charset']),
        $config['db_user'],
        $config['db_pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $dbName = $config['db_name'];
    $root->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $root->exec("USE `$dbName`");

    $root->exec(<<<SQL
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(80) PRIMARY KEY,
    setting_value TEXT
);
CREATE TABLE IF NOT EXISTS pages (
    slug VARCHAR(40) PRIMARY KEY,
    title VARCHAR(200),
    meta_description TEXT,
    meta_keywords VARCHAR(500),
    hero_badge VARCHAR(120),
    hero_title VARCHAR(200),
    hero_tagline VARCHAR(255),
    hero_description TEXT,
    hero_image VARCHAR(500),
    extra_json LONGTEXT
);
CREATE TABLE IF NOT EXISTS stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stat_value VARCHAR(40) NOT NULL,
    stat_label VARCHAR(80) NOT NULL,
    sort_order INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    slug VARCHAR(80) NOT NULL,
    short_text TEXT,
    lead_text TEXT,
    body_text TEXT,
    icon VARCHAR(80) DEFAULT 'fas fa-drafting-compass',
    icon_color VARCHAR(20) DEFAULT '#d4af37',
    image VARCHAR(500),
    offerings TEXT,
    sort_order INT DEFAULT 0,
    show_on_home TINYINT DEFAULT 1
);
CREATE TABLE IF NOT EXISTS process_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    body_text TEXT,
    icon VARCHAR(80) DEFAULT 'fas fa-comments',
    icon_color VARCHAR(20) DEFAULT '#d4af37',
    sort_order INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(40) NOT NULL,
    location VARCHAR(160),
    description TEXT,
    image VARCHAR(500),
    year VARCHAR(20) DEFAULT '2023',
    area VARCHAR(40) DEFAULT '',
    status VARCHAR(40) DEFAULT 'Completed',
    client VARCHAR(120) DEFAULT 'Confidential',
    duration VARCHAR(40) DEFAULT '',
    features TEXT,
    featured TINYINT DEFAULT 0,
    sort_order INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    role VARCHAR(120),
    quote TEXT,
    rating TINYINT DEFAULT 5,
    sort_order INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS values_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    body_text TEXT,
    icon VARCHAR(80) DEFAULT 'fas fa-star',
    icon_color VARCHAR(20) DEFAULT '#d4af37',
    sort_order INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS why_choose (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    body_text TEXT,
    icon VARCHAR(80) DEFAULT 'fas fa-award',
    icon_color VARCHAR(20) DEFAULT '#d4af37',
    sort_order INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS benefits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    body_text TEXT,
    icon VARCHAR(80) DEFAULT 'fas fa-heart',
    icon_color VARCHAR(20) DEFAULT '#d4af37',
    sort_order INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    badge VARCHAR(40) DEFAULT 'Hiring',
    job_type VARCHAR(40) DEFAULT 'Full Time',
    department VARCHAR(120),
    location VARCHAR(120),
    salary VARCHAR(80),
    description TEXT,
    requirements TEXT,
    software TEXT,
    facebook_url VARCHAR(500) DEFAULT '',
    is_open TINYINT DEFAULT 1,
    sort_order INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    email VARCHAR(190) NOT NULL,
    phone VARCHAR(40),
    project_type VARCHAR(80),
    project_location VARCHAR(190),
    budget VARCHAR(80),
    description TEXT,
    contact_method VARCHAR(40),
    status VARCHAR(20) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    email VARCHAR(190) NOT NULL,
    phone VARCHAR(40),
    position VARCHAR(190),
    portfolio VARCHAR(500),
    message TEXT,
    status VARCHAR(20) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(190),
    original_name VARCHAR(255),
    url VARCHAR(500) NOT NULL,
    mime VARCHAR(80),
    size_bytes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SQL);

    $exists = $root->query("SHOW TABLES LIKE 'admins'")->fetch();
    $hasAdmin = false;
    if ($exists) {
        $hasAdmin = (int) $root->query('SELECT COUNT(*) FROM admins')->fetchColumn() > 0;
    }
    if ($hasAdmin && empty($_GET['reset'])) {
        echo json_encode([
            'ok' => true,
            'message' => 'Database already installed. Add ?reset=1 to reinstall.',
            'admin' => ['url' => '../admin/'],
        ]);
        exit;
    }

    $root->exec('DELETE FROM admins');
    $root->exec('DELETE FROM settings');
    $root->exec('DELETE FROM pages');
    $root->exec('DELETE FROM stats');
    $root->exec('DELETE FROM services');
    $root->exec('DELETE FROM process_steps');
    $root->exec('DELETE FROM projects');
    $root->exec('DELETE FROM testimonials');
    $root->exec('DELETE FROM values_items');
    $root->exec('DELETE FROM why_choose');
    $root->exec('DELETE FROM benefits');
    $root->exec('DELETE FROM jobs');
    $root->exec('DELETE FROM media');

    $hash = password_hash('Admin@123', PASSWORD_DEFAULT);
    $stmt = $root->prepare('INSERT INTO admins (name, email, password_hash) VALUES (?,?,?)');
    $stmt->execute(['Studio Admin', 'admin@ateliernova.demo', $hash]);

    $settings = [
        'site_name' => 'Atelier Nova',
        'brand_text' => 'Atelier',
        'brand_accent' => 'Nova',
        'tagline' => 'We turn ideas into works of art.',
        'phone' => '+8801700000000',
        'phone_display' => '01700-000000',
        'email' => 'hello@ateliernova.demo',
        'whatsapp' => '8801700000000',
        'address' => 'Demo Studio, 12 Example Road, Dhaka',
        'hours' => '10:00 AM – 6:00 PM',
        'hours_note' => 'Closed on Friday',
        'hours_detail' => "Thursday – 10:00 AM – 6:00 PM\nFriday – Closed\nSaturday – 10:00 AM – 6:00 PM\nSunday – 10:00 AM – 6:00 PM\nMonday – 10:00 AM – 6:00 PM\nTuesday – 10:00 AM – 6:00 PM\nWednesday – 10:00 AM – 6:00 PM",
        'facebook' => '#',
        'linkedin' => '#',
        'instagram' => '#',
        'map_url' => 'https://www.google.com/maps/search/?api=1&query=Dhaka+Bangladesh',
        'map_embed' => '',
        'footer_text' => 'We turn ideas into works of art. Designing thoughtful, functional, and timeless architectural spaces in Dhaka, Bangladesh.',
        'copyright_year' => '2024',
        'developer_name' => 'Udoy',
        'developer_url' => 'https://udoyweb.netlify.app/',
        'google_rating' => '4.47',
        'google_rating_label' => 'Google Rating',
        'google_rating_sub' => 'Based on client reviews',
        'logo' => '',
        'meta_keywords' => 'architecture, interior design, urban planning, Dhaka, Bangladesh, Atelier Nova',
    ];
    $setStmt = $root->prepare('INSERT INTO settings (setting_key, setting_value) VALUES (?,?)');
    foreach ($settings as $key => $value) {
        $setStmt->execute([$key, $value]);
    }

    $pageStmt = $root->prepare('INSERT INTO pages (slug, title, meta_description, meta_keywords, hero_badge, hero_title, hero_tagline, hero_description, hero_image, extra_json) VALUES (?,?,?,?,?,?,?,?,?,?)');

    $pages = [
        [
            'home',
            'Atelier Nova - We turn ideas into works of art',
            'Atelier Nova - We turn ideas into works of art. Professional architectural design, interior design, and urban planning services in Dhaka, Bangladesh.',
            $settings['meta_keywords'],
            'Architectural Excellence Since 2010',
            "Atelier\nNova",
            'We turn ideas into works of art.',
            'Transforming visions into architectural masterpieces. With over a decade of excellence, we create spaces that inspire, function beautifully, and stand the test of time.',
            'assets/images/banner1.jpg',
            [
                'intro_label' => 'About Us',
                'intro_heading' => 'Excellence in Every Design',
                'intro_lead' => "At Atelier Nova, we believe architecture is more than buildings—it's about creating experiences, shaping communities, and leaving lasting legacies.",
                'intro_text' => "Based in Dhaka, Bangladesh, we've been at the forefront of architectural innovation, combining modern design principles with local context and sustainability. Our team of experienced architects and designers works closely with clients to bring their dreams to life.",
                'intro_image' => 'assets/images/banner2.jpg',
                'intro_badge_number' => '15+',
                'intro_badge_text' => 'Years of Excellence',
                'intro_features' => ['Innovative Design Solutions', 'Sustainable Architecture', 'Client-Focused Approach'],
                'services_label' => 'What We Offer',
                'services_title' => 'Our Services',
                'services_subtitle' => 'Comprehensive architectural solutions tailored to your vision',
                'projects_label' => 'Portfolio',
                'projects_title' => 'Featured Projects',
                'projects_subtitle' => 'Showcasing our finest architectural achievements',
                'testimonials_label' => 'Testimonials',
                'testimonials_title' => 'What Our Clients Say',
                'cta_title' => "Have a project in mind? Let's discuss.",
                'cta_text' => "Ready to bring your architectural vision to life? Get in touch with us today and let's create something extraordinary together.",
            ],
        ],
        [
            'about',
            'About Us - Atelier Nova',
            'Learn about Atelier Nova - Our philosophy, vision, mission, and values. Discover why clients trust us for their architectural projects in Dhaka, Bangladesh.',
            'about Atelier Nova, architecture firm Dhaka, architectural philosophy, design values',
            'Our Story',
            'About Atelier Nova',
            'Crafting architectural excellence since 2010',
            "We are a team of passionate architects and designers dedicated to transforming visions into reality. With over a decade of experience, we've built a reputation for innovative design, sustainable practices, and exceptional client service.",
            'assets/images/banner2.jpg',
            [
                'philosophy_title' => 'Our Philosophy',
                'philosophy_lead' => 'Architecture is the art of creating spaces that inspire, function beautifully, and stand the test of time.',
                'philosophy_text' => "At Atelier Nova, we believe that great architecture emerges from the perfect balance between form and function, innovation and tradition, vision and practicality. Every project we undertake is a unique opportunity to create something meaningful—a space that tells a story, serves a purpose, and enriches lives.\n\nWe approach each design challenge with fresh eyes, listening carefully to our clients' needs, understanding their context, and translating their aspirations into built reality. Our philosophy centers on three core principles: Excellence, Innovation, and Sustainability.",
                'philosophy_image' => 'assets/images/banner3.jpg',
                'vision_title' => 'Our Vision',
                'vision_text' => "To be the leading architectural firm in Bangladesh, recognized for innovative design, sustainable practices, and exceptional client service. We envision a future where architecture seamlessly integrates with the environment, enhances communities, and creates lasting value for generations to come.\n\nWe strive to push the boundaries of architectural design while respecting local culture, climate, and context, creating buildings that are both globally relevant and locally meaningful.",
                'vision_icon' => 'fas fa-eye',
                'mission_title' => 'Our Mission',
                'mission_text' => 'To deliver exceptional architectural solutions that exceed client expectations through creative design, technical excellence, and collaborative partnership. We are committed to:',
                'mission_icon' => 'fas fa-bullseye',
                'mission_points' => [
                    "Understanding and fulfilling our clients' unique needs and aspirations",
                    'Creating sustainable, energy-efficient designs that respect the environment',
                    'Maintaining the highest standards of professionalism and integrity',
                    'Fostering innovation and continuous learning within our team',
                    'Contributing positively to the built environment and communities we serve',
                ],
                'values_title' => 'Our Core Values',
                'why_title' => 'Why Choose Atelier Nova?',
                'cta_title' => 'Ready to work with us?',
                'cta_text' => "Let's discuss how Atelier Nova can bring your architectural vision to life. Get in touch today for a consultation.",
            ],
        ],
        [
            'services',
            'Our Services - Atelier Nova',
            'Atelier Nova offers comprehensive architectural services including design, interior design, urban planning, and project consultation in Dhaka, Bangladesh.',
            'architectural services, interior design, urban planning, project consultation, Dhaka',
            'What We Offer',
            'Our Services',
            'Comprehensive architectural solutions for every need',
            'From initial concept to final construction, we provide end-to-end architectural services that combine innovative design with practical functionality. Our expertise spans residential, commercial, and institutional projects.',
            'assets/images/banner3.jpg',
            [
                'hero_features' => ['Full-Service Architecture', 'Interior Design Excellence', 'Urban Planning Solutions'],
                'process_title' => 'Our Design Process',
                'cta_title' => 'Ready to start your project?',
                'cta_text' => "Let's discuss how our services can help bring your architectural vision to life. Contact us today for a free consultation.",
            ],
        ],
        [
            'projects',
            'Our Projects - Atelier Nova',
            'View our portfolio of architectural projects. Explore our completed residential, commercial, and institutional projects in Dhaka, Bangladesh.',
            'architecture portfolio, architectural projects, completed projects, Dhaka architecture',
            'Our Portfolio',
            'Our Projects',
            'Showcasing our architectural excellence',
            'Explore our diverse portfolio of completed projects. Each design tells a unique story of innovation, functionality, and aesthetic excellence.',
            'assets/images/banner4.jpg',
            [
                'cta_title' => 'Have a project in mind?',
                'cta_text' => "Let's discuss how we can bring your architectural vision to life. Contact us today to start your project.",
            ],
        ],
        [
            'contact',
            'Contact - Atelier Nova',
            'Contact Atelier Nova in Dhaka, Bangladesh. Get a free quote for your architectural project. Call 01700-000000 or fill out our project inquiry form.',
            'contact Atelier Nova, architecture consultation, Dhaka architects, project inquiry',
            'Start Your Project',
            'Get In Touch',
            "Let's discuss your project",
            "Ready to bring your architectural vision to life? Contact us today for a free consultation. We're here to answer your questions and help you take the first step toward your dream project.",
            'assets/images/banner1.jpg',
            [
                'form_title' => 'Project Inquiry Form',
                'form_intro' => "Fill out the form below and we'll get back to you within 24 hours. All fields marked with * are required.",
                'cta_title' => "Have a project in mind? Let's discuss.",
                'cta_text' => "Ready to bring your architectural vision to life? Get in touch with us today and let's create something extraordinary together.",
            ],
        ],
        [
            'careers',
            'Careers - Atelier Nova',
            'Join Atelier Nova. Explore open architecture and interior design roles in Dhaka, Bangladesh.',
            'architecture jobs Dhaka, interior design careers, Atelier Nova careers',
            'Join Our Team',
            'Careers at Atelier Nova',
            'Build Your Future With Us',
            "We're always looking for talented, passionate individuals who share our vision of creating exceptional architectural spaces. Join our team and be part of innovative projects that shape the future of architecture in Bangladesh.",
            'assets/images/banner3.jpg',
            [
                'openings_label' => 'Open Positions',
                'openings_title' => 'Current Job Openings',
                'openings_subtitle' => 'Explore exciting career opportunities with Atelier Nova',
                'apply_label' => 'Apply Now',
                'apply_title' => 'Send Your Application',
                'apply_subtitle' => "Tell us about yourself and the role you're interested in. We'll respond quickly.",
                'benefits_label' => 'Benefits',
                'benefits_title' => 'Why Join Atelier Nova?',
                'benefits_subtitle' => 'We offer a dynamic work environment and opportunities for professional growth',
                'cta_title' => "Don't See a Position That Fits?",
                'cta_text' => "We're always interested in connecting with talented professionals. Send us your resume and portfolio, and we'll keep you in mind for future opportunities.",
            ],
        ],
    ];

    foreach ($pages as $page) {
        $page[9] = json_encode($page[9], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $pageStmt->execute($page);
    }

    $statStmt = $root->prepare('INSERT INTO stats (stat_value, stat_label, sort_order) VALUES (?,?,?)');
    $statStmt->execute(['500+', 'Projects Completed', 1]);
    $statStmt->execute(['15+', 'Years Experience', 2]);
    $statStmt->execute(['98%', 'Client Satisfaction', 3]);

    $serviceStmt = $root->prepare('INSERT INTO services (title, slug, short_text, lead_text, body_text, icon, icon_color, image, offerings, sort_order, show_on_home) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    $services = [
        ['Architectural Design', 'architectural-design', 'Comprehensive architectural solutions from concept to completion, ensuring functionality meets aesthetics.', 'From concept to construction, we deliver comprehensive architectural design services that blend creativity with functionality.', 'Our architectural design process begins with a deep understanding of your needs, site conditions, and project goals. We create innovative designs that are not only aesthetically pleasing but also practical, sustainable, and cost-effective.', 'fas fa-drafting-compass', '#d4af37', 'assets/images/project1.jpg', ['Conceptual design and feasibility studies', 'Schematic design and design development', 'Construction documents and specifications', '3D visualization and renderings', 'Building code compliance and permit assistance', 'Construction administration and site supervision'], 1],
        ['Interior Design', 'interior-design', 'Transform interior spaces into beautiful, functional environments that reflect your style and needs.', 'Transform your interior spaces into beautiful, functional environments that reflect your style and enhance your lifestyle.', 'Our interior design services focus on creating spaces that are both visually stunning and highly functional. We work closely with clients to understand their preferences, lifestyle, and budget, delivering designs that exceed expectations.', 'fas fa-couch', '#d4af37', 'assets/images/project2_1.jpg', ['Space planning and layout design', 'Color schemes and material selection', 'Furniture selection and custom design', 'Lighting design and electrical planning', 'Kitchen and bathroom design', 'Project management and coordination'], 2],
        ['Urban Planning', 'urban-planning', 'Strategic urban planning services that create sustainable, livable communities for the future.', 'Strategic urban planning services that create sustainable, livable communities for the future.', 'We provide comprehensive urban planning services that address the complex challenges of modern city development. Our approach integrates sustainability, community needs, and economic viability to create master plans that benefit all stakeholders.', 'fas fa-city', '#d4af37', 'assets/images/project2_2.jpg', ['Master planning and site development', 'Zoning analysis and land use planning', 'Transportation and infrastructure planning', 'Sustainable development strategies', 'Community engagement and public consultation', 'Regulatory compliance and approval assistance'], 3],
        ['Project Consultation', 'project-consultation', 'Expert consultation services to guide your project from initial concept through final execution.', 'Expert consultation services to guide your project from initial concept through final execution.', "Whether you're just starting to explore a project idea or need guidance on an existing project, our consultation services provide the expertise and insights you need to make informed decisions.", 'fas fa-handshake', '#d4af37', 'assets/images/banner4.jpg', ['Project feasibility analysis', 'Site evaluation and assessment', 'Budget estimation and cost planning', 'Design review and recommendations', 'Construction methodology advice', 'Second opinion and peer review services'], 4],
    ];
    foreach ($services as $i => $service) {
        $serviceStmt->execute([
            $service[0], $service[1], $service[2], $service[3], $service[4], $service[5], $service[6], $service[7],
            json_encode($service[8]), $service[9], 1,
        ]);
    }

    $procStmt = $root->prepare('INSERT INTO process_steps (title, body_text, icon, icon_color, sort_order) VALUES (?,?,?,?,?)');
    $procStmt->execute(['1. Consultation', 'We begin with a detailed consultation to understand your vision, needs, budget, and timeline.', 'fas fa-comments', '#d4af37', 1]);
    $procStmt->execute(['2. Design Development', 'Our team creates initial concepts and refines them based on your feedback until we achieve the perfect design.', 'fas fa-pencil-ruler', '#d4af37', 2]);
    $procStmt->execute(['3. Documentation', 'We prepare comprehensive construction documents, specifications, and all necessary permits and approvals.', 'fas fa-file-alt', '#d4af37', 3]);
    $procStmt->execute(['4. Construction', 'Throughout construction, we provide site supervision and administration to ensure quality and adherence to design.', 'fas fa-hard-hat', '#d4af37', 4]);

    $features = ['Modern architectural design', 'Sustainable building practices', 'Energy-efficient systems', 'Premium materials and finishes', 'Comprehensive project management', 'Client-focused approach'];
    $projStmt = $root->prepare('INSERT INTO projects (title, category, location, description, image, year, area, status, client, duration, features, featured, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
    $projects = [
        ['Modern Residential Complex', 'residential', 'Dhaka, Bangladesh', 'A contemporary residential development featuring sustainable design and modern amenities in the heart of Dhaka.', 'assets/images/project1.jpg', 1],
        ['Luxury Villa Design', 'residential', 'Gulshan, Dhaka', 'A stunning villa project showcasing elegant design, premium materials, and seamless indoor-outdoor living spaces.', 'assets/images/project2_1.jpg', 1],
        ['Apartment Building', 'residential', 'Banani, Dhaka', 'A refined apartment building designed for comfort, daylight, and efficient living in a dense urban setting.', 'assets/images/project2_2.jpg', 0],
        ['Corporate Headquarters', 'commercial', 'Dhanmondi, Dhaka', 'An innovative office space designed to foster collaboration and productivity while maintaining aesthetic excellence.', 'assets/images/project2.jpg', 1],
        ['Retail Complex', 'commercial', 'Uttara, Dhaka', 'A retail destination with a strong street presence, clear circulation, and flexible tenant spaces.', 'assets/images/banner1.jpg', 0],
        ['Boutique Hotel', 'commercial', 'Gulshan, Dhaka', 'An intimate hospitality project that balances atmosphere, material richness, and guest comfort.', 'assets/images/banner2.jpg', 0],
        ['Educational Campus', 'institutional', 'Mirpur, Dhaka', 'A campus plan focused on learning landscapes, shaded courtyards, and community gathering spaces.', 'assets/images/banner3.jpg', 0],
        ['Medical Facility', 'institutional', 'Dhanmondi, Dhaka', 'A calm, efficient healthcare environment designed around patient flow and staff wellbeing.', 'assets/images/banner4.jpg', 0],
        ['Modern Office Interior', 'interior', 'Gulshan, Dhaka', 'A workplace interior that supports collaboration, focus, and a distinctive brand identity.', 'assets/images/project2_1.jpg', 0],
        ['Luxury Residence Interior', 'interior', 'Banani, Dhaka', 'A residential interior with tailored millwork, layered lighting, and a quiet luxury palette.', 'assets/images/project2_2.jpg', 0],
        ['Restaurant Design', 'interior', 'Dhanmondi, Dhaka', 'A dining interior that pairs atmosphere with practical kitchen and service planning.', 'assets/images/project1.jpg', 0],
    ];
    foreach ($projects as $i => $p) {
        $projStmt->execute([
            $p[0], $p[1], $p[2], $p[3], $p[4], '2023', '5,000 sq ft', 'Completed', 'Confidential', '12 months',
            json_encode($features), $p[5], $i + 1,
        ]);
    }

    $tStmt = $root->prepare('INSERT INTO testimonials (name, role, quote, rating, sort_order) VALUES (?,?,?,?,?)');
    $tStmt->execute(['Ahmed Rahman', 'Project Manager', 'Atelier Nova transformed our vision into reality. Their attention to detail and creative solutions exceeded our expectations. The entire process was smooth and professional.', 5, 1]);
    $tStmt->execute(['Fatima Khan', 'Business Owner', 'Working with Atelier Nova was a pleasure. They understood our needs perfectly and delivered a design that is both beautiful and functional. Highly recommended!', 5, 2]);

    $vStmt = $root->prepare('INSERT INTO values_items (title, body_text, icon, icon_color, sort_order) VALUES (?,?,?,?,?)');
    $vStmt->execute(['Excellence', 'We pursue excellence in every aspect of our work, from initial concept to final execution, ensuring the highest quality standards.', 'fas fa-star', '#d4af37', 1]);
    $vStmt->execute(['Innovation', 'We embrace innovative design solutions and cutting-edge technologies to create forward-thinking architectural spaces.', 'fas fa-lightbulb', '#d4af37', 2]);
    $vStmt->execute(['Sustainability', 'We are committed to sustainable design practices that minimize environmental impact and create healthy, efficient buildings.', 'fas fa-leaf', '#d4af37', 3]);
    $vStmt->execute(['Integrity', 'We conduct our business with honesty, transparency, and ethical practices, building trust with every client relationship.', 'fas fa-handshake', '#d4af37', 4]);

    $wStmt = $root->prepare('INSERT INTO why_choose (title, body_text, icon, icon_color, sort_order) VALUES (?,?,?,?,?)');
    $wStmt->execute(['Proven Track Record', 'Over a decade of successful projects across residential, commercial, and institutional sectors. Our portfolio speaks to our expertise and reliability.', 'fas fa-award', '#d4af37', 1]);
    $wStmt->execute(['Expert Team', 'Our team of licensed architects, designers, and consultants brings decades of combined experience and diverse expertise to every project.', 'fas fa-users', '#d4af37', 2]);
    $wStmt->execute(['Client-Centric Approach', 'We prioritize clear communication, active listening, and collaborative partnership throughout the entire design and construction process.', 'fas fa-comments', '#d4af37', 3]);
    $wStmt->execute(['Comprehensive Services', 'From initial concept to project completion, we offer end-to-end architectural services, ensuring seamless project delivery.', 'fas fa-tools', '#d4af37', 4]);
    $wStmt->execute(['Value-Driven Solutions', 'We deliver exceptional value by optimizing design efficiency, material selection, and construction methods without compromising quality.', 'fas fa-dollar-sign', '#d4af37', 5]);
    $wStmt->execute(['Timely Delivery', 'We understand the importance of deadlines and work diligently to deliver projects on time and within budget, every time.', 'fas fa-clock', '#d4af37', 6]);

    $bStmt = $root->prepare('INSERT INTO benefits (title, body_text, icon, icon_color, sort_order) VALUES (?,?,?,?,?)');
    $bStmt->execute(['Innovative Projects', 'Work on diverse and challenging projects that push the boundaries of architectural design and innovation.', 'fas fa-lightbulb', '#d4af37', 1]);
    $bStmt->execute(['Collaborative Team', 'Join a team of passionate professionals who value creativity, collaboration, and excellence.', 'fas fa-users', '#d4af37', 2]);
    $bStmt->execute(['Professional Growth', 'Continuous learning opportunities and career development programs to help you grow professionally.', 'fas fa-graduation-cap', '#d4af37', 3]);
    $bStmt->execute(['Modern Tools', 'Access to the latest software and technology including Lumion, AutoCAD, 3D Studio Max, and SketchUp.', 'fas fa-tools', '#d4af37', 4]);
    $bStmt->execute(['Competitive Salary', 'We offer competitive, negotiable salaries based on experience and expertise.', 'fas fa-handshake', '#d4af37', 5]);
    $bStmt->execute(['Work-Life Balance', 'We believe in maintaining a healthy work-life balance for all our team members.', 'fas fa-heart', '#d4af37', 6]);

    $jobStmt = $root->prepare('INSERT INTO jobs (title, badge, job_type, department, location, salary, description, requirements, software, facebook_url, is_open, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
    $jobStmt->execute([
        'Architect - Lumion Animation & Rendering Specialist', 'Urgent', 'Full Time', 'Architecture & Interior Design', 'Dhaka, Bangladesh', 'Salary: Negotiable',
        'Atelier Nova is looking for an efficient Architect who has sound knowledge of Architecture and Interior design. The ideal candidate must be an expert in Lumion Animation & Rendering.',
        json_encode(['Educational Qualification: B.Arch from a prestigious university', 'Experience: Candidates with work experience will get preference']),
        json_encode(['Lumion (Expert level - Animation & Rendering)', 'AutoCAD', '3D Studio Max', 'SketchUp']),
        '', 1, 1,
    ]);
    $jobStmt->execute([
        'Architect - Architecture & Interior Design', 'Hiring', 'Full Time', 'Architecture & Interior Design', 'Dhaka, Bangladesh', 'Salary: Negotiable',
        'Atelier Nova is looking for an efficient Architect who has sound knowledge of Architecture and Interior design.',
        json_encode(['Educational Qualification: B.Arch from a prestigious university', 'Experience: Candidates with work experience will get preference']),
        json_encode(['Lumion', 'AutoCAD', '3D Studio Max', 'SketchUp']),
        '', 1, 2,
    ]);

    $mediaStmt = $root->prepare('INSERT INTO media (filename, original_name, url, mime, size_bytes) VALUES (?,?,?,?,?)');
    foreach (['banner1.jpg','banner2.jpg','banner3.jpg','banner4.jpg','project1.jpg','project2.jpg','project2_1.jpg','project2_2.jpg'] as $file) {
        $path = dirname(__DIR__) . '/assets/images/' . $file;
        $mediaStmt->execute([$file, $file, 'assets/images/' . $file, 'image/jpeg', is_file($path) ? filesize($path) : 0]);
    }

    $uploadDir = $config['upload_dir'];
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    file_put_contents($uploadDir . '/.htaccess', "php_flag engine off\n");

    echo json_encode([
        'ok' => true,
        'message' => 'Database installed and seeded.',
        'admin' => [
            'email' => 'admin@ateliernova.demo',
            'password' => 'Admin@123',
            'url' => '../admin/',
        ],
    ], JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
