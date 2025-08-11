// 잠수함 액션 게임 - 모바일 최적화 버전

class SubmarineActionGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameState = 'menu'; // menu, playing, paused, gameover
        this.lastTime = 0;
        
        // 게임 설정
        this.config = {
            canvas: { width: 800, height: 600 },
            player: { 
                width: 64, height: 32, speed: 4, maxHealth: 100,
                fireRate: 300, // 밀리초
                torpedoSpeed: 8
            },
            enemy: { width: 60, height: 30, speed: 2, health: 50 },
            fps: 60,
            spawnRate: 2000 // 적 생성 간격 (밀리초)
        };

        // 게임 데이터
        this.gameData = {
            ranks: {
                beginner: { health: 100, torpedoes: 20, speed: 4, name: '신병' },
                veteran: { health: 80, torpedoes: 15, speed: 5, name: '베테랑' },
                ace: { health: 60, torpedoes: 10, speed: 6, name: '에이스' }
            },
            missions: [
                { name: '생존 훈련', duration: 30, enemies: 3, description: '적 잠수함을 격침하고 생존하세요' },
                { name: '호위 작전', duration: 45, enemies: 5, description: '보급선을 보호하며 임무를 수행하세요' },
                { name: '섬멸 작전', duration: 60, enemies: 8, description: '적 기지를 파괴하고 모든 적을 격침하세요' }
            ]
        };

        // 플레이어 상태
        this.player = {
            x: 100, y: 300, dx: 0, dy: 0,
            health: 100, maxHealth: 100,
            torpedoes: 20, maxTorpedoes: 20,
            speed: 4, lastFired: 0,
            sprite: null
        };

        // 게임 객체들
        this.enemies = [];
        this.torpedoes = [];
        this.enemyTorpedoes = [];
        this.particles = [];
        this.powerUps = [];

        // 게임 상태
        this.score = 0;
        this.currentMission = 0;
        this.missionTime = 30;
        this.enemiesKilled = 0;
        this.selectedRank = 'beginner';

        // 터치 컨트롤
        this.joystick = {
            active: false, x: 0, y: 0,
            centerX: 60, centerY: 0, // 화면 하단에서 계산됨
            radius: 40, knobRadius: 15,
            inputX: 0, inputY: 0
        };

        // 키 입력 상태
        this.keys = {
            up: false, down: false, left: false, right: false, space: false
        };

        // 스프라이트 로드
        this.sprites = {
            player: new Image(),
            enemy: new Image()
        };

        this.init();
    }

    // 게임 초기화
    async init() {
        console.log('게임 초기화 시작...');
        
        // 모바일 스크롤 방지
        this.preventMobileScroll();
        
        // 스프라이트 로드 시작 (비동기)
        this.loadSprites();
        
        // DOM 요소 바인딩
        this.bindEvents();
        
        console.log('게임 초기화 완료');
    }

    // 모바일 스크롤 완전 방지
    preventMobileScroll() {
        // 바디 스크롤 방지
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';

        // 터치 이벤트 방지
        const preventTouch = (e) => {
            // 게임 조작 요소가 아닌 경우에만 방지
            if (!e.target.closest('.mobile-controls') && 
                !e.target.closest('.btn') && 
                !e.target.closest('.rank-card') &&
                !e.target.closest('.mission-card') &&
                !e.target.closest('.overlay-content')) {
                e.preventDefault();
            }
        };

        document.addEventListener('touchstart', preventTouch, { passive: false });
        document.addEventListener('touchmove', preventTouch, { passive: false });

        // 드래그 방지
        document.addEventListener('dragstart', (e) => {
            e.preventDefault();
        });

        // 컨텍스트 메뉴 방지
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        console.log('모바일 스크롤 방지 적용 완료');
    }

    // 스프라이트 로드
    loadSprites() {
        const loadImage = (img, src) => {
            img.onload = () => console.log(`스프라이트 로드 완료: ${src}`);
            img.onerror = () => console.warn(`스프라이트 로드 실패: ${src}`);
            img.src = src;
        };

        loadImage(this.sprites.player, 'https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/2491ad48-f84e-421c-a3df-57a9fe9e7010.png');
        loadImage(this.sprites.enemy, 'https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/33ff757e-0e90-4ec8-aa78-c29a50f64f89.png');
    }

    // 이벤트 바인딩
    bindEvents() {
        console.log('이벤트 바인딩 시작...');
        
        // 시작 버튼
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            console.log('시작 버튼 발견, 이벤트 바인딩...');
            startBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('시작 버튼 클릭됨!');
                this.showRankScreen();
            });
            
            // 터치 이벤트도 추가
            startBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                console.log('시작 버튼 터치됨!');
                this.showRankScreen();
            });
        } else {
            console.error('시작 버튼을 찾을 수 없습니다!');
        }

        // 계급 선택 버튼들
        document.querySelectorAll('.select-rank-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('계급 선택:', e.target.dataset.rank);
                this.selectRank(e.target.dataset.rank);
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.selectRank(e.target.dataset.rank);
            });
        });

        // 임무 시작 버튼들
        document.querySelectorAll('.start-mission-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('임무 시작:', e.target.dataset.mission);
                this.startMission(parseInt(e.target.dataset.mission));
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.startMission(parseInt(e.target.dataset.mission));
            });
        });

        // 오버레이 버튼들
        const restartBtn = document.getElementById('restart-btn');
        const menuBtn = document.getElementById('menu-btn');
        
        if (restartBtn) {
            restartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.restartGame();
            });
        }
        
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showMainMenu();
            });
        }

        // 키보드 컨트롤 (PC용)
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        console.log('이벤트 바인딩 완료');
    }

    // 터치 컨트롤 바인딩
    bindTouchControls() {
        console.log('터치 컨트롤 바인딩 시작...');
        
        const joystick = document.getElementById('joystick');
        const fireBtn = document.getElementById('fire-btn');
        const specialBtn = document.getElementById('special-btn');

        if (joystick) {
            // 조이스틱 위치 설정
            const updateJoystickPosition = () => {
                const rect = joystick.getBoundingClientRect();
                this.joystick.centerX = rect.left + rect.width / 2;
                this.joystick.centerY = rect.top + rect.height / 2;
            };
            
            updateJoystickPosition();
            window.addEventListener('resize', updateJoystickPosition);

            // 조이스틱 터치 이벤트
            joystick.addEventListener('touchstart', (e) => this.handleJoystickStart(e), { passive: false });
            document.addEventListener('touchmove', (e) => this.handleJoystickMove(e), { passive: false });
            document.addEventListener('touchend', (e) => this.handleJoystickEnd(e), { passive: false });
        }

        if (fireBtn) {
            fireBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.fireTorpedo();
            }, { passive: false });
        }

        if (specialBtn) {
            specialBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.useSpecialWeapon();
            }, { passive: false });
        }

        console.log('터치 컨트롤 바인딩 완료');
    }

    // 조이스틱 터치 시작
    handleJoystickStart(e) {
        if (e.target.closest('#joystick')) {
            e.preventDefault();
            this.joystick.active = true;
            this.handleJoystickMove(e);
        }
    }

    // 조이스틱 터치 이동
    handleJoystickMove(e) {
        if (!this.joystick.active) return;
        e.preventDefault();

        const touch = e.touches[0];
        if (!touch) return;
        
        const deltaX = touch.clientX - this.joystick.centerX;
        const deltaY = touch.clientY - this.joystick.centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance <= this.joystick.radius) {
            this.joystick.x = deltaX;
            this.joystick.y = deltaY;
        } else {
            this.joystick.x = deltaX * this.joystick.radius / distance;
            this.joystick.y = deltaY * this.joystick.radius / distance;
        }

        // 정규화된 입력값 계산 (-1 ~ 1)
        this.joystick.inputX = this.joystick.x / this.joystick.radius;
        this.joystick.inputY = this.joystick.y / this.joystick.radius;

        // 조이스틱 노브 위치 업데이트
        const knob = document.getElementById('joystick-knob');
        if (knob) {
            knob.style.transform = `translate(${this.joystick.x}px, ${this.joystick.y}px)`;
        }
    }

    // 조이스틱 터치 종료
    handleJoystickEnd(e) {
        if (this.joystick.active) {
            e.preventDefault();
            this.joystick.active = false;
            this.joystick.x = 0;
            this.joystick.y = 0;
            this.joystick.inputX = 0;
            this.joystick.inputY = 0;

            // 조이스틱 노브 중앙으로 복귀
            const knob = document.getElementById('joystick-knob');
            if (knob) {
                knob.style.transform = 'translate(0px, 0px)';
            }
        }
    }

    // 어뢰 발사
    fireTorpedo() {
        if (this.gameState !== 'playing') return;
        
        const currentTime = Date.now();
        if (currentTime - this.player.lastFired < this.config.player.fireRate) return;
        if (this.player.torpedoes <= 0) return;

        this.player.lastFired = currentTime;
        this.player.torpedoes--;

        // 어뢰 생성
        this.torpedoes.push({
            x: this.player.x + this.config.player.width,
            y: this.player.y + this.config.player.height / 2,
            dx: this.config.player.torpedoSpeed,
            dy: 0,
            width: 20,
            height: 4
        });

        console.log('어뢰 발사! 남은 어뢰:', this.player.torpedoes);
        
        // UI 업데이트
        this.updateUI();
    }

    // 특수 무기 사용
    useSpecialWeapon() {
        if (this.gameState !== 'playing') return;
        
        // 스프레드 어뢰 발사
        const currentTime = Date.now();
        if (currentTime - this.player.lastFired < this.config.player.fireRate * 2) return;
        if (this.player.torpedoes < 3) return;

        this.player.lastFired = currentTime;
        this.player.torpedoes -= 3;

        // 3발의 어뢰를 다른 각도로 발사
        for (let i = -1; i <= 1; i++) {
            this.torpedoes.push({
                x: this.player.x + this.config.player.width,
                y: this.player.y + this.config.player.height / 2,
                dx: this.config.player.torpedoSpeed,
                dy: i * 2,
                width: 20,
                height: 4
            });
        }

        console.log('특수 무기 발사! 남은 어뢰:', this.player.torpedoes);
        this.updateUI();
    }

    // 키보드 입력 처리 (PC용)
    handleKeyDown(e) {
        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.space = true;
                this.fireTorpedo();
                e.preventDefault();
                break;
        }
    }

    // 키보드 입력 해제 (PC용)
    handleKeyUp(e) {
        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.space = false;
                break;
        }
    }

    // 화면 전환
    showScreen(screenId) {
        console.log('화면 전환:', screenId);
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            console.log('화면 전환 완료:', screenId);
        } else {
            console.error('화면을 찾을 수 없습니다:', screenId);
        }
    }

    // 메인 메뉴 표시
    showMainMenu() {
        this.gameState = 'menu';
        this.showScreen('start-screen');
    }

    // 계급 선택 화면 표시
    showRankScreen() {
        console.log('계급 선택 화면으로 이동');
        this.showScreen('rank-screen');
    }

    // 계급 선택
    selectRank(rank) {
        console.log('계급 선택됨:', rank);
        this.selectedRank = rank;
        const rankData = this.gameData.ranks[rank];
        
        // 플레이어 능력치 설정
        this.player.maxHealth = rankData.health;
        this.player.health = rankData.health;
        this.player.maxTorpedoes = rankData.torpedoes;
        this.player.torpedoes = rankData.torpedoes;
        this.player.speed = rankData.speed;
        
        console.log('플레이어 능력치 설정:', rankData);
        this.showScreen('mission-screen');
    }

    // 임무 시작
    startMission(missionIndex) {
        console.log('임무 시작:', missionIndex);
        this.currentMission = missionIndex;
        const mission = this.gameData.missions[missionIndex];
        
        this.missionTime = mission.duration;
        this.enemiesKilled = 0;
        this.score = 0;
        
        // 게임 화면으로 전환
        this.showScreen('game-screen');
        
        // 캔버스 초기화
        this.initCanvas();
        
        // 터치 컨트롤 바인딩
        this.bindTouchControls();
        
        // 게임 시작
        this.startGame();
    }

    // 캔버스 초기화
    initCanvas() {
        console.log('캔버스 초기화 시작...');
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 캔버스 크기 설정
        this.resizeCanvas();
        
        // 리사이즈 이벤트 바인딩
        window.addEventListener('resize', () => this.resizeCanvas());
        
        console.log('캔버스 초기화 완료');
    }

    // 캔버스 크기 조정
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // 게임 좌표계 스케일링
        this.scaleX = this.canvas.width / this.config.canvas.width;
        this.scaleY = this.canvas.height / this.config.canvas.height;
        
        console.log(`캔버스 크기: ${this.canvas.width}x${this.canvas.height}, 스케일: ${this.scaleX.toFixed(2)}x${this.scaleY.toFixed(2)}`);
    }

    // 게임 시작
    startGame() {
        console.log('게임 시작!');
        this.gameState = 'playing';
        
        // 플레이어 초기 위치
        this.player.x = 50;
        this.player.y = this.config.canvas.height / 2 - this.config.player.height / 2;
        this.player.dx = 0;
        this.player.dy = 0;
        
        // 게임 객체 초기화
        this.enemies = [];
        this.torpedoes = [];
        this.enemyTorpedoes = [];
        this.particles = [];
        
        // 타이머 시작
        this.startTime = Date.now();
        this.lastEnemySpawn = 0;
        
        // UI 업데이트
        this.updateUI();
        
        // 게임 루프 시작
        this.lastTime = 0;
        this.gameLoop(0);
        
        console.log('게임 루프 시작됨');
    }

    // 게임 루프
    gameLoop(currentTime) {
        if (this.gameState !== 'playing') return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // 게임 업데이트
        this.update(deltaTime);
        
        // 렌더링
        this.render();
        
        // 다음 프레임 요청
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    // 게임 업데이트
    update(deltaTime) {
        const currentTime = Date.now();
        
        // 미션 시간 체크
        const elapsedTime = (currentTime - this.startTime) / 1000;
        this.missionTime = Math.max(0, this.gameData.missions[this.currentMission].duration - elapsedTime);
        
        if (this.missionTime <= 0) {
            this.checkMissionComplete();
            return;
        }

        // 플레이어 이동 (터치 또는 키보드)
        this.player.dx = 0;
        this.player.dy = 0;
        
        if (this.joystick.active) {
            this.player.dx = this.joystick.inputX * this.player.speed;
            this.player.dy = this.joystick.inputY * this.player.speed;
        } else {
            // 키보드 입력
            if (this.keys.left) this.player.dx -= this.player.speed;
            if (this.keys.right) this.player.dx += this.player.speed;
            if (this.keys.up) this.player.dy -= this.player.speed;
            if (this.keys.down) this.player.dy += this.player.speed;
        }
        
        this.player.x += this.player.dx;
        this.player.y += this.player.dy;
        
        // 플레이어 경계 체크
        this.player.x = Math.max(0, Math.min(this.config.canvas.width - this.config.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.config.canvas.height - this.config.player.height, this.player.y));

        // 적 생성
        if (currentTime - this.lastEnemySpawn > this.config.spawnRate) {
            this.spawnEnemy();
            this.lastEnemySpawn = currentTime;
        }

        // 적 이동 및 업데이트
        this.enemies.forEach(enemy => {
            enemy.x -= enemy.speed;
            
            // 적 어뢰 발사 (간헐적으로)
            if (Math.random() < 0.005) {
                this.enemyTorpedoes.push({
                    x: enemy.x,
                    y: enemy.y + enemy.height / 2,
                    dx: -4,
                    dy: 0,
                    width: 15,
                    height: 3
                });
            }
        });

        // 어뢰 이동
        this.torpedoes.forEach(torpedo => {
            torpedo.x += torpedo.dx;
            torpedo.y += torpedo.dy;
        });

        this.enemyTorpedoes.forEach(torpedo => {
            torpedo.x += torpedo.dx;
            torpedo.y += torpedo.dy;
        });

        // 파티클 업데이트
        this.particles.forEach(particle => {
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.life--;
        });

        // 충돌 검사
        this.checkCollisions();

        // 화면 밖 객체 제거
        this.cleanupObjects();

        // UI 업데이트
        this.updateUI();
    }

    // 적 생성
    spawnEnemy() {
        if (this.enemies.length >= 3) return; // 최대 적 수 제한

        this.enemies.push({
            x: this.config.canvas.width,
            y: Math.random() * (this.config.canvas.height - this.config.enemy.height),
            speed: this.config.enemy.speed + Math.random(),
            health: this.config.enemy.health,
            width: this.config.enemy.width,
            height: this.config.enemy.height
        });
    }

    // 충돌 검사
    checkCollisions() {
        // 플레이어 어뢰 vs 적
        for (let i = this.torpedoes.length - 1; i >= 0; i--) {
            const torpedo = this.torpedoes[i];
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (this.checkCollision(torpedo, enemy)) {
                    // 적 파괴
                    this.destroyEnemy(j);
                    this.torpedoes.splice(i, 1);
                    this.score += 100;
                    this.enemiesKilled++;
                    break;
                }
            }
        }

        // 적 어뢰 vs 플레이어
        for (let i = this.enemyTorpedoes.length - 1; i >= 0; i--) {
            const torpedo = this.enemyTorpedoes[i];
            
            if (this.checkCollision(torpedo, this.player)) {
                this.enemyTorpedoes.splice(i, 1);
                this.player.health -= 20;
                
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
        }

        // 플레이어 vs 적 (충돌)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (this.checkCollision(this.player, enemy)) {
                this.destroyEnemy(i);
                this.player.health -= 30;
                
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
        }
    }

    // 충돌 검사 헬퍼 함수
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    // 적 파괴
    destroyEnemy(index) {
        const enemy = this.enemies[index];
        
        // 파괴 이펙트 생성
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                dx: (Math.random() - 0.5) * 6,
                dy: (Math.random() - 0.5) * 6,
                life: 30,
                maxLife: 30,
                color: '#ff6b35'
            });
        }
        
        this.enemies.splice(index, 1);
    }

    // 화면 밖 객체 제거
    cleanupObjects() {
        this.torpedoes = this.torpedoes.filter(torpedo => 
            torpedo.x > -torpedo.width && torpedo.x < this.config.canvas.width + torpedo.width &&
            torpedo.y > -torpedo.height && torpedo.y < this.config.canvas.height + torpedo.height
        );
        
        this.enemyTorpedoes = this.enemyTorpedoes.filter(torpedo => 
            torpedo.x > -torpedo.width && torpedo.x < this.config.canvas.width + torpedo.width
        );
        
        this.enemies = this.enemies.filter(enemy => 
            enemy.x > -enemy.width
        );

        this.particles = this.particles.filter(particle => particle.life > 0);
    }

    // 렌더링
    render() {
        // 화면 클리어
        this.ctx.fillStyle = 'rgba(0, 17, 34, 1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 바다 물결 효과
        this.ctx.fillStyle = 'rgba(0, 51, 102, 0.3)';
        for (let i = 0; i < 5; i++) {
            const y = (this.canvas.height / 5) * i + Math.sin(Date.now() * 0.001 + i) * 10;
            this.ctx.fillRect(0, y, this.canvas.width, 20);
        }

        this.ctx.save();
        this.ctx.scale(this.scaleX, this.scaleY);

        // 플레이어 렌더링
        this.renderPlayer();

        // 적 렌더링
        this.enemies.forEach(enemy => this.renderEnemy(enemy));

        // 어뢰 렌더링
        this.torpedoes.forEach(torpedo => this.renderTorpedo(torpedo));
        this.enemyTorpedoes.forEach(torpedo => this.renderEnemyTorpedo(torpedo));

        // 파티클 렌더링
        this.particles.forEach(particle => this.renderParticle(particle));

        this.ctx.restore();
    }

    // 플레이어 렌더링
    renderPlayer() {
        if (this.sprites.player && this.sprites.player.complete) {
            this.ctx.drawImage(
                this.sprites.player,
                this.player.x, this.player.y,
                this.config.player.width, this.config.player.height
            );
        } else {
            // 스프라이트 로드 실패 시 기본 도형
            this.ctx.fillStyle = '#32a0cb';
            this.ctx.fillRect(
                this.player.x, this.player.y,
                this.config.player.width, this.config.player.height
            );
        }
    }

    // 적 렌더링
    renderEnemy(enemy) {
        if (this.sprites.enemy && this.sprites.enemy.complete) {
            this.ctx.drawImage(
                this.sprites.enemy,
                enemy.x, enemy.y,
                enemy.width, enemy.height
            );
        } else {
            // 스프라이트 로드 실패 시 기본 도형
            this.ctx.fillStyle = '#c0152f';
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }

        // 체력바
        const healthPercent = enemy.health / this.config.enemy.health;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 4);
        this.ctx.fillStyle = healthPercent > 0.5 ? '#4ade80' : '#f87171';
        this.ctx.fillRect(enemy.x, enemy.y - 8, enemy.width * healthPercent, 4);
    }

    // 어뢰 렌더링
    renderTorpedo(torpedo) {
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.fillRect(torpedo.x, torpedo.y, torpedo.width, torpedo.height);
    }

    // 적 어뢰 렌더링
    renderEnemyTorpedo(torpedo) {
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillRect(torpedo.x, torpedo.y, torpedo.width, torpedo.height);
    }

    // 파티클 렌더링
    renderParticle(particle) {
        const alpha = particle.life / particle.maxLife;
        this.ctx.fillStyle = `rgba(255, 107, 53, ${alpha})`;
        this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
    }

    // UI 업데이트
    updateUI() {
        // 체력
        const healthFill = document.getElementById('health-fill');
        const healthText = document.getElementById('health-text');
        if (healthFill && healthText) {
            const healthPercent = Math.max(0, (this.player.health / this.player.maxHealth) * 100);
            healthFill.style.width = `${healthPercent}%`;
            healthText.textContent = Math.max(0, this.player.health);
        }

        // 점수
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }

        // 어뢰 개수
        const torpedoCount = document.getElementById('torpedo-count');
        if (torpedoCount) {
            torpedoCount.textContent = this.player.torpedoes;
        }

        // 타이머
        const timer = document.getElementById('timer');
        if (timer) {
            timer.textContent = Math.ceil(this.missionTime);
        }
    }

    // 미션 완료 체크
    checkMissionComplete() {
        const mission = this.gameData.missions[this.currentMission];
        const success = this.enemiesKilled >= mission.enemies && this.player.health > 0;
        
        if (success) {
            this.missionComplete();
        } else {
            this.gameOver();
        }
    }

    // 미션 완료
    missionComplete() {
        this.gameState = 'gameover';
        
        const overlay = document.getElementById('game-overlay');
        const title = document.getElementById('overlay-title');
        const message = document.getElementById('overlay-message');
        const finalScore = document.getElementById('final-score');
        
        if (title) title.textContent = '미션 완료!';
        if (message) message.textContent = '성공적으로 임무를 완수했습니다!';
        if (finalScore) finalScore.textContent = `최종 점수: ${this.score}`;
        
        if (overlay) overlay.classList.remove('hidden');
    }

    // 게임 오버
    gameOver() {
        this.gameState = 'gameover';
        
        const overlay = document.getElementById('game-overlay');
        const title = document.getElementById('overlay-title');
        const message = document.getElementById('overlay-message');
        const finalScore = document.getElementById('final-score');
        
        if (title) title.textContent = '게임 오버';
        if (message) message.textContent = '미션에 실패했습니다.';
        if (finalScore) finalScore.textContent = `최종 점수: ${this.score}`;
        
        if (overlay) overlay.classList.remove('hidden');
    }

    // 게임 재시작
    restartGame() {
        const overlay = document.getElementById('game-overlay');
        if (overlay) overlay.classList.add('hidden');
        
        // 게임 상태 리셋
        this.score = 0;
        this.enemiesKilled = 0;
        
        // 플레이어 상태 리셋
        const rankData = this.gameData.ranks[this.selectedRank];
        this.player.health = rankData.health;
        this.player.torpedoes = rankData.torpedoes;
        
        // 게임 재시작
        this.startGame();
    }
}

// 게임 시작
let game;

// DOM 완전 로드 후 게임 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM 로드 완료, 게임 초기화 중...');
        game = new SubmarineActionGame();
    });
} else {
    console.log('DOM 이미 로드됨, 게임 즉시 초기화...');
    game = new SubmarineActionGame();
}