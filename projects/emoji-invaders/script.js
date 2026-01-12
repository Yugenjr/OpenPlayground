// Emoji Invaders Game
class EmojiInvaders {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'start'; // start, playing, paused, gameover
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.isSoundOn = true;
        
        // Player
        this.player = {
            x: this.canvas.width / 2 - 25,
            y: this.canvas.height - 60,
            width: 50,
            height: 40,
            speed: 7,
            color: '#fbbf24',
            isShielded: false
        };
        
        // Bullets
        this.bullets = [];
        this.bulletSpeed = 8;
        this.bulletCooldown = 0;
        this.bulletCooldownMax = 15; // Frames between shots
        this.isRapidFire = false;
        this.rapidFireTimer = 0;
        
        // Enemies
        this.enemies = [];
        this.enemySpeed = 1;
        this.enemyDropDistance = 20;
        this.enemyDirection = 1; // 1 for right, -1 for left
        this.enemyShootChance = 0.005;
        
        // Power-ups
        this.powerUps = [];
        this.activePowerUps = [];
        this.motivationalQuotes = [
            "Focus is the art of ignoring distractions",
            "Small daily improvements lead to stunning results",
            "The secret of getting ahead is getting started",
            "Don't watch the clock; do what it does. Keep going",
            "Your focus determines your reality",
            "Concentrate all your thoughts upon the work at hand",
            "The successful warrior is the average man, with laser-like focus",
            "Focus on being productive instead of busy",
            "The way to get started is to quit talking and begin doing",
            "It's not about having time, it's about making time"
        ];
        
        // Game objects
        this.enemyTypes = [
            { emoji: '😴', color: '#60a5fa', points: 10, speed: 0.8, health: 1 },
            { emoji: '😵', color: '#8b5cf6', points: 15, speed: 1.2, health: 1 },
            { emoji: '🤯', color: '#ef4444', points: 25, speed: 1.5, health: 2 },
            { emoji: '👾', color: '#10b981', points: 50, speed: 1, health: 3 }
        ];
        
        // Input
        this.keys = {};
        this.setupInput();
        
        // Initialize
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createEnemies();
        this.updateUI();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Game control buttons
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resumeGameBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartGameBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('soundToggle').addEventListener('click', () => this.toggleSound());
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.shoot();
                }
            }
            
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            }
            
            if (e.key === 'Enter' && this.gameState === 'start') {
                this.startGame();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    setupInput() {
        // Touch/mobile controls
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleTouch(touch.clientX - this.canvas.offsetLeft);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleTouch(touch.clientX - this.canvas.offsetLeft);
        });
    }
    
    handleTouch(x) {
        if (this.gameState === 'playing') {
            this.player.x = x - this.player.width / 2;
            
            // Keep player in bounds
            if (this.player.x < 0) this.player.x = 0;
            if (this.player.x > this.canvas.width - this.player.width) {
                this.player.x = this.canvas.width - this.player.width;
            }
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.player.x = this.canvas.width / 2 - 25;
        this.player.isShielded = false;
        
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.activePowerUps = [];
        
        this.createEnemies();
        this.updateUI();
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('pauseScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
        
        this.showMotivation("Focus is the art of ignoring distractions");
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseScreen').style.display = 'flex';
            document.getElementById('pauseScore').textContent = this.score;
            document.getElementById('pauseLevel').textContent = this.level;
            document.getElementById('pauseLives').textContent = this.lives;
        } else if (this.gameState === 'paused') {
            this.resumeGame();
        }
    }
    
    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('pauseScreen').style.display = 'none';
    }
    
    restartGame() {
        this.startGame();
    }
    
    toggleSound() {
        this.isSoundOn = !this.isSoundOn;
        const soundBtn = document.getElementById('soundToggle');
        soundBtn.innerHTML = this.isSoundOn ? 
            '<i class="fas fa-volume-up"></i> Sound' : 
            '<i class="fas fa-volume-mute"></i> Sound';
    }
    
    showHelp() {
        alert(`HOW TO PLAY:
• Use LEFT/RIGHT arrows to move
• Press SPACE to shoot
• Destroy emoji invaders
• Collect power-ups for bonuses
• Avoid enemy attacks
• Press P to pause/resume

Power-ups:
⚡ Focus Boost: Faster shooting
🛡️ Shield: Temporary invincibility
💬 Motivation: Bonus points + quote`);
    }
    
    createEnemies() {
        this.enemies = [];
        const rows = 4 + Math.min(this.level - 1, 3); // More rows as level increases
        const cols = 8 + Math.min(this.level - 1, 4); // More columns as level increases
        
        const enemyWidth = 40;
        const enemyHeight = 40;
        const padding = 20;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const enemyType = this.enemyTypes[Math.min(row, this.enemyTypes.length - 1)];
                
                this.enemies.push({
                    x: col * (enemyWidth + padding) + 50,
                    y: row * (enemyHeight + padding) + 50,
                    width: enemyWidth,
                    height: enemyHeight,
                    type: enemyType,
                    health: enemyType.health,
                    speed: enemyType.speed * (1 + (this.level - 1) * 0.2) // Faster with level
                });
            }
        }
        
        this.enemySpeed = 1 + (this.level - 1) * 0.2;
    }
    
    shoot() {
        if (this.bulletCooldown > 0) return;
        
        this.bullets.push({
            x: this.player.x + this.player.width / 2 - 3,
            y: this.player.y,
            width: 6,
            height: 15,
            color: '#fbbf24',
            speed: this.bulletSpeed
        });
        
        if (this.isRapidFire) {
            // Add two extra bullets for rapid fire
            this.bullets.push({
                x: this.player.x + this.player.width / 2 - 8,
                y: this.player.y,
                width: 6,
                height: 15,
                color: '#fbbf24',
                speed: this.bulletSpeed
            });
            
            this.bullets.push({
                x: this.player.x + this.player.width / 2 + 2,
                y: this.player.y,
                width: 6,
                height: 15,
                color: '#fbbf24',
                speed: this.bulletSpeed
            });
        }
        
        this.bulletCooldown = this.isRapidFire ? this.bulletCooldownMax / 2 : this.bulletCooldownMax;
    }
    
    createPowerUp(x, y) {
        const powerUpTypes = [
            {
                type: 'focus',
                color: '#4f46e5',
                emoji: '⚡',
                duration: 10000, // 10 seconds
                effect: () => {
                    this.isRapidFire = true;
                    this.rapidFireTimer = 10000;
                    this.showPowerUp('Focus Boost', 10000);
                }
            },
            {
                type: 'shield',
                color: '#10b981',
                emoji: '🛡️',
                duration: 8000, // 8 seconds
                effect: () => {
                    this.player.isShielded = true;
                    this.showPowerUp('Shield', 8000);
                    setTimeout(() => {
                        this.player.isShielded = false;
                    }, 8000);
                }
            },
            {
                type: 'motivation',
                color: '#f59e0b',
                emoji: '💬',
                effect: () => {
                    const quote = this.motivationalQuotes[Math.floor(Math.random() * this.motivationalQuotes.length)];
                    this.score += 100;
                    this.showMotivation(quote);
                    this.showPowerUp('Motivation +100', 3000);
                }
            }
        ];
        
        const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        
        this.powerUps.push({
            x: x,
            y: y,
            width: 30,
            height: 30,
            type: powerUpType.type,
            color: powerUpType.color,
            emoji: powerUpType.emoji,
            effect: powerUpType.effect,
            duration: powerUpType.duration,
            speed: 2
        });
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Update cooldowns
        if (this.bulletCooldown > 0) this.bulletCooldown--;
        if (this.rapidFireTimer > 0) {
            this.rapidFireTimer -= 16; // ~60fps
            if (this.rapidFireTimer <= 0) {
                this.isRapidFire = false;
            }
        }
        
        // Handle input
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.player.x += this.player.speed;
        }
        
        // Keep player in bounds
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x > this.canvas.width - this.player.width) {
            this.player.x = this.canvas.width - this.player.width;
        }
        
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.y -= bullet.speed;
            
            // Remove bullets that are off screen
            if (bullet.y < 0) {
                this.bullets.splice(i, 1);
            }
        }
        
        // Update enemies
        let shouldDrop = false;
        let hasEnemies = false;
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            hasEnemies = true;
            
            // Move enemy
            enemy.x += enemy.speed * this.enemyDirection;
            
            // Check if enemy hits the edge
            if (enemy.x <= 0 || enemy.x + enemy.width >= this.canvas.width) {
                shouldDrop = true;
            }
            
            // Enemy shooting
            if (Math.random() < this.enemyShootChance) {
                this.enemiesShoot(enemy);
            }
            
            // Check if enemy reached bottom
            if (enemy.y + enemy.height >= this.canvas.height) {
                this.lives--;
                this.enemies.splice(i, 1);
                this.updateUI();
                continue;
            }
            
            // Check bullet collisions
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                const bullet = this.bullets[j];
                
                if (this.checkCollision(bullet, enemy)) {
                    enemy.health--;
                    
                    if (enemy.health <= 0) {
                        // Enemy destroyed
                        this.score += enemy.type.points;
                        
                        // Chance to spawn power-up
                        if (Math.random() < 0.3) { // 30% chance
                            this.createPowerUp(enemy.x, enemy.y);
                        }
                        
                        this.enemies.splice(i, 1);
                        this.updateUI();
                    }
                    
                    this.bullets.splice(j, 1);
                    break;
                }
            }
        }
        
        // If all enemies destroyed, next level
        if (!hasEnemies) {
            this.level++;
            this.createEnemies();
            this.updateUI();
            this.showMotivation("Level complete! Stay focused!");
        }
        
        // Handle enemy dropping
        if (shouldDrop) {
            this.enemyDirection *= -1;
            for (const enemy of this.enemies) {
                enemy.y += this.enemyDropDistance;
            }
        }
        
        // Update power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.y += powerUp.speed;
            
            // Check collision with player
            if (this.checkCollision(powerUp, this.player)) {
                powerUp.effect();
                this.powerUps.splice(i, 1);
                continue;
            }
            
            // Remove if off screen
            if (powerUp.y > this.canvas.height) {
                this.powerUps.splice(i, 1);
            }
        }
        
        // Update active power-ups display
        this.updatePowerUpDisplay();
        
        // Check game over
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    enemiesShoot(enemy) {
        // Create enemy bullet
        const enemyBullet = {
            x: enemy.x + enemy.width / 2 - 3,
            y: enemy.y + enemy.height,
            width: 6,
            height: 15,
            color: '#ef4444',
            speed: 5
        };
        
        // Check collision with player
        if (this.checkCollision(enemyBullet, this.player)) {
            if (!this.player.isShielded) {
                this.lives--;
                this.updateUI();
            }
        } else {
            // Add to bullets array (we'll treat enemy bullets as regular bullets for simplicity)
            this.bullets.push(enemyBullet);
        }
    }
    
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    draw() {
        // Clear canvas with space background
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars
        this.drawStars();
        
        // Draw player
        this.drawPlayer();
        
        // Draw bullets
        for (const bullet of this.bullets) {
            this.ctx.fillStyle = bullet.color;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            
            // Add glow effect
            this.ctx.shadowColor = bullet.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            this.ctx.shadowBlur = 0;
        }
        
        // Draw enemies
        for (const enemy of this.enemies) {
            this.drawEnemy(enemy);
        }
        
        // Draw power-ups
        for (const powerUp of this.powerUps) {
            this.drawPowerUp(powerUp);
        }
        
        // Draw shield if active
        if (this.player.isShielded) {
            this.ctx.strokeStyle = '#10b981';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2,
                this.player.width / 2 + 10,
                0,
                Math.PI * 2
            );
            this.ctx.stroke();
            
            // Add glow
            this.ctx.shadowColor = '#10b981';
            this.ctx.shadowBlur = 15;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
        
        // Draw HUD
        this.drawHUD();
    }
    
    drawStars() {
        this.ctx.fillStyle = 'white';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % this.canvas.width;
            const y = (i * 23) % this.canvas.height;
            const size = Math.random() * 2;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawPlayer() {
        // Draw ship body
        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.width / 2, this.player.y);
        this.ctx.lineTo(this.player.x + this.player.width, this.player.y + this.player.height);
        this.ctx.lineTo(this.player.x, this.player.y + this.player.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw ship details
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.fillRect(this.player.x + this.player.width / 2 - 5, this.player.y + 10, 10, 15);
        
        // Add glow
        this.ctx.shadowColor = this.player.color;
        this.ctx.shadowBlur = 20;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    drawEnemy(enemy) {
        // Draw enemy background
        this.ctx.fillStyle = enemy.type.color;
        this.ctx.beginPath();
        this.ctx.arc(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2,
            enemy.width / 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw emoji
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(
            enemy.type.emoji,
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2
        );
        
        // Add glow
        this.ctx.shadowColor = enemy.type.color;
        this.ctx.shadowBlur = 15;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    drawPowerUp(powerUp) {
        // Draw power-up background
        this.ctx.fillStyle = powerUp.color;
        this.ctx.beginPath();
        this.ctx.arc(
            powerUp.x + powerUp.width / 2,
            powerUp.y + powerUp.height / 2,
            powerUp.width / 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw emoji/symbol
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(
            powerUp.emoji,
            powerUp.x + powerUp.width / 2,
            powerUp.y + powerUp.height / 2
        );
        
        // Add pulsing effect
        this.ctx.shadowColor = powerUp.color;
        this.ctx.shadowBlur = 20;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    drawHUD() {
        // Draw score, lives, level
        this.ctx.font = '16px Orbitron';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`SCORE: ${this.score}`, 20, 30);
        this.ctx.fillText(`LIVES: ${this.lives}`, 20, 60);
        this.ctx.fillText(`LEVEL: ${this.level}`, 20, 90);
        
        // Draw rapid fire indicator
        if (this.isRapidFire) {
            this.ctx.fillStyle = '#4f46e5';
            this.ctx.fillText('RAPID FIRE ACTIVE', this.canvas.width - 200, 30);
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
    }
    
    showPowerUp(name, duration) {
        const container = document.getElementById('currentPowerups');
        const existing = Array.from(container.children).find(child => 
            child.textContent.includes(name)
        );
        
        if (existing) {
            existing.querySelector('.timer').textContent = Math.ceil(duration / 1000) + 's';
            return;
        }
        
        const powerUpEl = document.createElement('div');
        powerUpEl.className = 'powerup-active';
        powerUpEl.style.display = 'flex';
        
        const icon = name.includes('Focus') ? 'fa-bolt' : 
                    name.includes('Shield') ? 'fa-shield-alt' : 'fa-quote-right';
        
        powerUpEl.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${name}: <span class="timer">${Math.ceil(duration / 1000)}s</span></span>
        `;
        
        container.appendChild(powerUpEl);
        
        // Update timer every second
        const timer = powerUpEl.querySelector('.timer');
        const interval = setInterval(() => {
            const currentTime = parseInt(timer.textContent);
            if (currentTime > 1) {
                timer.textContent = (currentTime - 1) + 's';
            } else {
                clearInterval(interval);
                powerUpEl.style.display = 'none';
                setTimeout(() => {
                    if (powerUpEl.parentNode) {
                        powerUpEl.parentNode.removeChild(powerUpEl);
                    }
                }, 1000);
            }
        }, 1000);
    }
    
    updatePowerUpDisplay() {
        const container = document.getElementById('currentPowerups');
        const powerUps = Array.from(container.children);
        
        powerUps.forEach(powerUp => {
            const timer = powerUp.querySelector('.timer');
            if (timer) {
                const currentTime = parseInt(timer.textContent);
                if (currentTime > 1) {
                    timer.textContent = (currentTime - 1) + 's';
                } else {
                    powerUp.style.display = 'none';
                }
            }
        });
    }
    
    showMotivation(quote) {
        const quoteEl = document.getElementById('currentQuote');
        quoteEl.querySelector('span').textContent = quote;
        
        // Add to game over screen if needed
        document.getElementById('motivationQuote').textContent = quote;
    }
    
    gameOver() {
        this.gameState = 'gameover';
        document.getElementById('gameOverScreen').style.display = 'flex';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        
        // Update high scores
        this.updateHighScores();
    }
    
    updateHighScores() {
        // In a real game, you would save to localStorage
        // For now, we'll just update the display
        const scores = [
            { name: 'Focus Master', score: 1250 },
            { name: 'Emoji Hunter', score: 980 },
            { name: 'Laser Pro', score: 750 }
        ];
        
        // Add current score if it's high enough
        if (this.score > scores[2].score) {
            scores.push({ name: 'You!', score: this.score });
            scores.sort((a, b) => b.score - a.score);
            scores.pop(); // Remove lowest
        }
        
        const list = document.getElementById('highscoresList');
        list.innerHTML = '';
        
        scores.forEach((score, index) => {
            const item = document.createElement('div');
            item.className = 'highscore-item';
            item.innerHTML = `
                <span class="rank">${index + 1}</span>
                <span class="player">${score.name}</span>
                <span class="score">${score.score}</span>
            `;
            list.appendChild(item);
        });
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize the game when page loads
window.addEventListener('load', () => {
    const game = new EmojiInvaders();
});