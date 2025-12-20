<?php
require 'db.php';
include 'header.php';

$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $name = trim($_POST['name'] ?? '');
    $password = $_POST['password'] ?? '';
    $password2 = $_POST['password2'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Invalid email';
    }
    if (empty($name)) {
        $errors[] = 'Name is required';
    }
    if (strlen($password) < 6) {
        $errors[] = 'Password must be at least 6 characters';
    }
    if ($password !== $password2) {
        $errors[] = 'Passwords do not match';
    }

    // Handle profile image upload
    $profile_image = null;
    if (!empty($_FILES['profile_image']['name'])) {
        $upload_dir = 'uploads/';
        $filename = time() . '_profile_' . basename($_FILES['profile_image']['name']);
        $target = $upload_dir . $filename;

        if (!move_uploaded_file($_FILES['profile_image']['tmp_name'], $target)) {
            $errors[] = 'Failed to upload profile image';
        } else {
            $profile_image = $target;
        }
    }

    if (!$errors) {
        $stmt = $conn->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows > 0) {
            $errors[] = 'Email already registered';
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $conn->prepare(
                'INSERT INTO users (email, name, profile_image, password_hash) VALUES (?, ?, ?, ?)'
            );
            $stmt->bind_param('ssss', $email, $name, $profile_image, $hash);
            if ($stmt->execute()) {
                // auto‑login: get new user id and set session
                $new_user_id = $conn->insert_id;
                $_SESSION['user_id'] = $new_user_id;
                $_SESSION['role'] = 'user';

                // redirect straight to gallery
                header('Location: index.php');
                exit;
            } else {
                $errors[] = 'DB error';
            }
        }
    }
}
?>


<?php foreach ($errors as $e) echo '<p style="color:red">'.htmlspecialchars($e).'</p>'; ?>

<form method="post" enctype="multipart/form-data">
    <legend style="
    padding: 3px 6px;
    text-align: center;
    font-size: 50px;
    color: #1b0043;
    font-family:serif;
    margin:auto;
    ;">Register</legend>
  <label>Name</label>
  <input type="text" name="name" required>
  <br>
  <label>Email</label>
  <input type="email" name="email" required>
  <br>
  <label>Profile Image (optional)</label>
  <input type="file" name="profile_image" accept="image/*">
  <br>
  <label>Password</label>
  <input type="password" name="password" required>
  <br>
  <label>Repeat password</label>
  <input type="password" name="password2" required>
  <br>
  <button type="submit">Register</button>
</form>



  <title>Starry Night Background</title>
    <style>
        body {
            margin: 0;
            overflow-x: hidden;
            font-family: system-ui, -apple-system, sans-serif;
        }

        #bg-image {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: -2;
        }

        #canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
        }

        .demo-content {
            position: relative;
            z-index: 1;
            padding: 100px 40px;
            max-width: 900px;
            margin: 0 auto;
            color: #e5e7eb;
            min-height: 100vh;
        }

        .demo-content h1 {
            font-size: 3.5rem;
            margin-bottom: 20px;
            text-shadow: 0 0 20px rgba(56, 189, 248, 0.5),
                         0 0 40px rgba(99, 102, 241, 0.3);
            color: #fff;
        }

        .demo-content p {
            font-size: 1.3rem;
            line-height: 1.8;
            text-shadow: 0 2px 10px rgba(0,0,0,0.8);
            margin-bottom: 20px;
        }

        .card {
            background: rgba(17, 24, 39, 0.6);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(56, 189, 248, 0.2);
            border-radius: 12px;
            padding: 30px;
            margin: 40px 0;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
    </style>
</head>
<body>
    <img id="bg-image" src="starry.gif" alt="Starry background">
    <canvas id="canvas"></canvas>

    

    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        let width, height;
        let stars = [];
        let sparkles = [];
        let mouseX = 0;
        let mouseY = 0;
        let time = 0;

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        window.addEventListener('resize', resize);
        resize();

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            // Create sparkles on mouse move
            if (Math.random() < 0.3) {
                sparkles.push(new Sparkle(mouseX, mouseY));
            }
        });

        // Twinkling star overlay
        class Star {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 2 + 0.5;
                this.baseOpacity = Math.random() * 0.5 + 0.3;
                this.twinkleSpeed = Math.random() * 0.03 + 0.01;
                this.twinkleOffset = Math.random() * Math.PI * 2;
                
                // Color - mostly white and gold
                const colorChoice = Math.random();
                if (colorChoice < 0.7) {
                    this.color = '#ffffff';
                } else if (colorChoice < 0.85) {
                    this.color = '#fffc3bff';
                } else {
                    this.color = '#000dffff';
                }
            }

            update() {
                // Twinkle effect
                const twinkle = Math.sin(time * this.twinkleSpeed + this.twinkleOffset);
                this.opacity = this.baseOpacity + twinkle * 0.3;
                
                // Gentle drift
                this.y += 0.1;
                if (this.y > height) {
                    this.y = 0;
                    this.x = Math.random() * width;
                }
            }

            draw() {
                ctx.save();
                ctx.globalAlpha = this.opacity;
                
                // Glow
                const gradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.size * 3
                );
                gradient.addColorStop(0, this.color);
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Star center
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        }

        // Sparkle effect for mouse interaction
        class Sparkle {
            constructor(x, y) {
                this.x = x + (Math.random() - 0.5) * 40;
                this.y = y + (Math.random() - 0.5) * 40;
                this.size = Math.random() * 3 + 1;
                this.life = 1;
                this.decay = Math.random() * 0.02 + 0.01;
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = (Math.random() - 0.5) * 2;
                
                const colors = ['#00004dff', '#ffffff', '#f8f838ff'];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life -= this.decay;
                this.vy += 0.1; // Gravity
            }

            draw() {
                if (this.life <= 0) return;
                
                ctx.save();
                ctx.globalAlpha = this.life;
                
                // Draw star shape
                ctx.fillStyle = this.color;
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                    const x = this.x + Math.cos(angle) * this.size;
                    const y = this.y + Math.sin(angle) * this.size;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.fill();
                
                // Glow
                const gradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.size * 4
                );
                gradient.addColorStop(0, this.color);
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        }

        // Initialize stars
        for (let i = 0; i < 150; i++) {
            stars.push(new Star());
        }

        // Animation loop
        function animate() {
            time += 0.01;
            
            // Clear canvas
            ctx.clearRect(0, 0, width, height);
            
            // Update and draw stars
            stars.forEach(star => {
                star.update();
                star.draw();
            });
            
            // Update and draw sparkles
            sparkles = sparkles.filter(sparkle => sparkle.life > 0);
            sparkles.forEach(sparkle => {
                sparkle.update();
                sparkle.draw();
            });
            
            requestAnimationFrame(animate);
        }

        animate();
    </script>
</body>
<?php include 'footer.php'; ?>
<div style="text-align: center;
padding:2px;" class="logo1" id="logo1" ><img src="logo.png"></div>

