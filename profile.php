<?php
require 'db.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

$user_id = $_SESSION['user_id'];

// load user info
$stmt = $conn->prepare(
    'SELECT email, name, profile_image, role, created_at
     FROM users
     WHERE id = ?'
);
$stmt->bind_param('i', $user_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

// favorites for this user
$favorites = null;
$stmt = $conn->prepare(
    'SELECT aw.id, aw.title, aw.image_path, ar.display_name
     FROM favorites f
     JOIN artworks aw ON f.artwork_id = aw.id
     JOIN artists ar ON aw.artist_id = ar.id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC'
);
$stmt->bind_param('i', $user_id);
$stmt->execute();
$favorites = $stmt->get_result();
$stmt->close();

// if user is artist, load their artworks (same logic as my_artworks.php)
$artworks = null;
if (!empty($_SESSION['role']) && $_SESSION['role'] === 'artist') {
    // get artist id
    $stmt = $conn->prepare('SELECT id FROM artists WHERE user_id = ?');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $artist = $res->fetch_assoc();
    $stmt->close();

    if ($artist) {
        $artist_id = $artist['id'];

        $stmt = $conn->prepare(
            'SELECT id, title, image_path, is_public, created_at
             FROM artworks
             WHERE artist_id = ?
             ORDER BY created_at DESC'
        );
        $stmt->bind_param('i', $artist_id);
        $stmt->execute();
        $artworks = $stmt->get_result();
    }
}

include 'header.php';
?>

<h2>My profile</h2>

<div class="profile-card">
  <div class="profile-edit-icon">
    <a class="profile-edit-button" href="edit_profile.php" title="Edit profile">
      🖌
    </a>
  </div>

  <div class="profile-avatar">
    <?php if (!empty($user['profile_image']) && file_exists($user['profile_image'])): ?>
      <img src="<?php echo htmlspecialchars($user['profile_image']); ?>" alt="Profile picture">
    <?php else: ?>
      <div class="avatar-placeholder">
        <?php
          $initial = strtoupper(substr($user['email'], 0, 1));
          echo htmlspecialchars($initial);
        ?>
      </div>
    <?php endif; ?>
  </div>

  <div class="profile-info">
    <p><strong>Name:</strong> <?php echo htmlspecialchars($user['name'] ?? 'Not set'); ?></p>
    <p><strong>Email:</strong> <?php echo htmlspecialchars($user['email']); ?></p>
    <p><strong>Role:</strong> <?php echo htmlspecialchars($user['role']); ?></p>
    <p><strong>Member since:</strong> <?php echo htmlspecialchars($user['created_at']); ?></p>
  </div>
</div>


<?php if ($favorites && $favorites->num_rows > 0): ?>
  <h2>My favorites</h2>
  <div class="grid">
    <?php while ($fav = $favorites->fetch_assoc()): ?>
      <div class="item">
        <a href="artwork.php?id=<?php echo $fav['id']; ?>">
          <img src="<?php echo htmlspecialchars($fav['image_path']); ?>" alt="">
          <p><?php echo htmlspecialchars($fav['title']); ?></p>
          <p>by <?php echo htmlspecialchars($fav['display_name']); ?></p>
        </a>
      </div>
    <?php endwhile; ?>
  </div>
<?php else: ?>
  <h2>My favorites</h2>
  <p style="text-align:center; color:#9ca3af; margin-bottom:24px;">
    You haven’t favorited any artworks yet.
  </p>
<?php endif; ?>


<?php if (!empty($_SESSION['role']) && $_SESSION['role'] === 'artist' && $artworks): ?>
  <h2>My artworks</h2>

  <ul>
  <?php while ($row = $artworks->fetch_assoc()): ?>
    <li class="artwork-row">
      <div class="artwork-row-left">
        <a href="artwork.php?id=<?php echo $row['id']; ?>">
          <?php echo htmlspecialchars($row['title']); ?>
        </a>
        <span class="artwork-status">
          (<?php echo $row['is_public'] ? 'public' : 'private'; ?>)
        </span>
      </div>

      <div class="artwork-row-actions">
        <a class="edit-link"
           href="edit_artwork.php?id=<?php echo $row['id']; ?>">
          Edit
        </a>

        <a class="delete-link"
           href="delete_artwork.php?id=<?php echo $row['id']; ?>"
           onclick="return confirm('Delete this artwork permanently?');">
          Delete
        </a>
      </div>
    </li>
  <?php endwhile; ?>
  </ul>
<?php endif; ?>
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
<body style="background-image: url('bg1.gif'); background-size: cover; background-attachment: fixed; background-opacity: 60%;">
    
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
