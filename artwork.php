<?php
require 'db.php';

// optional: require login to see artwork + comments
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

$id = intval($_GET['id'] ?? 0);

$stmt = $conn->prepare(
    'SELECT aw.*, ar.display_name, ar.bio, ar.website
     FROM artworks aw
     JOIN artists ar ON aw.artist_id = ar.id
     WHERE aw.id = ? AND aw.is_public = 1'
);
$stmt->bind_param('i', $id);
$stmt->execute();
$result = $stmt->get_result();
$art = $result->fetch_assoc();
$stmt->close();



if (!$art) {
    include 'header.php';
    echo '<h2>Artwork not found.</h2>';
    include 'footer.php';
    exit;
}

// ----- handle new comment submission -----
$comment_error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['comment_content'])) {
    $content = trim($_POST['comment_content']);

    if ($content === '') {
        $comment_error = 'Comment cannot be empty.';
    } else {
        $user_id = $_SESSION['user_id'];

        $stmt = $conn->prepare(
            'INSERT INTO comments (user_id, artwork_id, content)
             VALUES (?,?,?)'
        );
        $stmt->bind_param('iis', $user_id, $id, $content);
        $stmt->execute();
        $stmt->close();

        // simple redirect to avoid form resubmission
        header('Location: artwork.php?id=' . $id);
        exit;
    }
}

// ----- fetch comments for this artwork -----
$stmt = $conn->prepare(
    'SELECT c.content, c.created_at, u.email
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.artwork_id = ?
     ORDER BY c.created_at DESC'
);
$stmt->bind_param('i', $id);
$stmt->execute();
$comments = $stmt->get_result();
$stmt->close();

$is_favorited = false;

if (isset($_SESSION['user_id'])) {
    $stmt = $conn->prepare(
        'SELECT 1 FROM favorites WHERE user_id = ? AND artwork_id = ?'
    );
    $stmt->bind_param('ii', $_SESSION['user_id'], $id);
    $stmt->execute();
    $stmt->store_result();
    $is_favorited = $stmt->num_rows > 0;
    $stmt->close();
}


include 'header.php';
?>

<div class="artwork-page">
  <div class="artwork-image">
    <img
      class="artwork-large"
      src="<?php echo htmlspecialchars($art['image_path']); ?>"
      alt="<?php echo htmlspecialchars($art['title']); ?>"
    >
  </div>

  <div class="artwork-info">
    <h2><?php echo htmlspecialchars($art['title']); ?></h2>

    <?php if (!empty($art['description'])): ?>
      <p class="artwork-description">
        <?php echo nl2br(htmlspecialchars($art['description'])); ?>
      </p>
    <?php endif; ?>

    <?php if (!empty($art['year'])): ?>
      <p class="artwork-artist">
        Year: <?php echo htmlspecialchars($art['year']); ?>
      </p>
    <?php endif; ?>

    <?php if (!empty($art['medium'])): ?>
      <p class="artwork-artist">
        Medium: <?php echo htmlspecialchars($art['medium']); ?>
      </p>
    <?php endif; ?>

    <?php if (!empty($art['style'])): ?>
      <p class="artwork-artist">
        Style: <?php echo htmlspecialchars($art['style']); ?>
      </p>
    <?php endif; ?>

    <p class="artwork-artist">
      Artist: <?php echo htmlspecialchars($art['display_name']); ?>
    </p>

    <?php if (!empty($art['website'])): ?>
      <p class="artwork-website">
        Website:
        <a href="<?php echo htmlspecialchars($art['website']); ?>" target="_blank">
          <?php echo htmlspecialchars($art['website']); ?>
        </a>
      </p>
    <?php endif; ?>
      <?php if (isset($_SESSION['user_id'])): ?>
        <p class="artwork-website">
          <a class="fav-button"
            href="toggle_favorite.php?artwork_id=<?php echo $id; ?>">
            <?php echo $is_favorited ? '★ Remove from favorites' : '☆ Add to favorites'; ?>
          </a>
        </p>
      <?php endif; ?>
  </div>
</div>



<div class="comments-wrapper">
  <h2>Comments</h2>

  <?php if ($comment_error): ?>
    <p class="comment-error"><?php echo htmlspecialchars($comment_error); ?></p>
  <?php endif; ?>

  <form method="post" class="comment-form">
    <label for="comment_content">Add a comment</label>
    <textarea id="comment_content" name="comment_content" required></textarea>
    <button type="submit">Post comment</button>
  </form>

  <div class="comments-list">
    <?php if ($comments->num_rows === 0): ?>
      <p class="no-comments">No comments yet. Be the first.</p>
    <?php else: ?>
      <?php while ($c = $comments->fetch_assoc()): ?>
        <div class="comment">
          <p class="comment-meta">
            <?php echo htmlspecialchars($c['email']); ?>
            •
            <?php echo htmlspecialchars($c['created_at']); ?>
          </p>
          <p class="comment-content">
            <?php echo nl2br(htmlspecialchars($c['content'])); ?>
          </p>
        </div>
      <?php endwhile; ?>
    <?php endif; ?>
  </div>
</div>
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
