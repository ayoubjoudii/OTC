<?php
require 'db.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

$user_id = $_SESSION['user_id'];
$success = '';
$error = '';

// load current data
$stmt = $conn->prepare(
    'SELECT email, name, profile_image, password_hash
     FROM users WHERE id = ?'
);
$stmt->bind_param('i', $user_id);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
$stmt->close();

if (!$user) {
    echo 'User not found.';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $current_password = $_POST['current_password'] ?? '';
    $new_password = $_POST['new_password'] ?? '';
    $new_password2 = $_POST['new_password2'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Invalid email.';
    } elseif ($name === '') {
        $error = 'Name is required.';
    } else {
        // handle profile image upload (optional)
        $profile_image = $user['profile_image'];

        if (!empty($_FILES['profile_image']['name'])) {
            $upload_dir = 'uploads/';
            $filename = time() . '_profile_' . basename($_FILES['profile_image']['name']);
            $target = $upload_dir . $filename;

            if (move_uploaded_file($_FILES['profile_image']['tmp_name'], $target)) {
                // delete old image if exists
                if ($profile_image && file_exists($profile_image)) {
                    @unlink($profile_image);
                }
                $profile_image = $target;
            } else {
                $error = 'Failed to upload profile image.';
            }
        }

        // optional password change
        $update_password_sql = '';
        $params = [];
        $types = '';

        if (!$error && $new_password !== '' ) {
            if (strlen($new_password) < 6) {
                $error = 'New password must be at least 6 characters.';
            } elseif ($new_password !== $new_password2) {
                $error = 'New passwords do not match.';
            } elseif (!password_verify($current_password, $user['password_hash'])) {
                $error = 'Current password is incorrect.';
            } else {
                $new_hash = password_hash($new_password, PASSWORD_DEFAULT);
                $update_password_sql = ', password_hash = ?';
                $params[] = $new_hash;
                $types .= 's';
            }
        }

        if (!$error) {
            // update name, email, profile_image (+ maybe password)
            $sql = 'UPDATE users
                    SET name = ?, email = ?, profile_image = ?'
                    . $update_password_sql .
                   ' WHERE id = ?';

            $params = array_merge([$name, $email, $profile_image], $params, [$user_id]);
            $types = 'sssi' . ($update_password_sql ? 's' : '');

            // build dynamic bind
            $stmt = $conn->prepare($sql);
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $stmt->close();

            $_SESSION['success_message'] = 'Profile updated.';
            header('Location: profile.php');
            exit;
        }
    }
}

include 'header.php';
?>

<h2>Edit my profile</h2>

<?php if ($error): ?>
  <p style="color:#f87171;"><?php echo htmlspecialchars($error); ?></p>
<?php endif; ?>

<form method="post" enctype="multipart/form-data">
  <label>Name</label>
  <input type="text" name="name"
         value="<?php echo htmlspecialchars($user['name']); ?>" required>

  <label>Email</label>
  <input type="email" name="email"
         value="<?php echo htmlspecialchars($user['email']); ?>" required>

  <label>Profile image (optional)</label>
  <input type="file" name="profile_image" accept="image/*">

  <p style="margin-top:8px; font-size:0.85rem; color:#9ca3af;">
    Leave password fields empty if you do not want to change your password.
  </p>

  <label>Current password</label>
  <input type="password" name="current_password">

  <label>New password</label>
  <input type="password" name="new_password">

  <label>Repeat new password</label>
  <input type="password" name="new_password2">

  <button type="submit">Save profile</button>
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
<body style="background-image: url('bg2.gif'); background-size: cover; background-attachment: fixed; background-opacity: 60%;">
    
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
