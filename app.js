// 잠수함 출동 시뮬레이션 게임 - 액션 게임 추가 버전

class SubmarineGame {
    constructor() {
        // 게임 데이터 초기화
        this.gameData = {
            images: {
                training: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/515cc33c-b8e3-4fb6-b9e8-8103bdf6de5c.png",
                maintenance: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/dd199cfa-b29c-4d0f-8a57-4027c6c57561.png",
                rest: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/972addea-d73f-4715-a61f-f6a03ff7633e.png",
                emergency: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/24d3f091-7173-4b1d-99c7-d1a8f63664d2.png",
                background: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/c4210ebf-6969-4be1-a618-f445661b7223.png",
                action_background: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/0d7ff63e-8925-4383-b3b8-40daf551ee48.png",
                torpedo_effects: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/7142d651-ef66-4b6e-9e8e-ae969e981a03.png",
                obstacles_items: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/d0dabb10-30f8-4608-9d23-c2adfd78d3ea.png"
            },
            ranks: {
                "부사관": {
                    description: "하사 - 실무 전문가",
                    stats: { "체력": 70, "정신력": 60, "기술력": 50 },
                    days: 14
                },
                "장교": {
                    description: "대위 - 지휘 장교",
                    stats: { "체력": 60, "정신력": 70, "기술력": 70 },
                    days: 10
                },
                "함장": {
                    description: "중령 - 함정 지휘관",
                    stats: { "체력": 50, "정신력": 80, "기술력": 90 },
                    days: 7
                }
            },
            activities: {
                "훈련": [
                    { name: "소화훈련", effects: { "체력": -10, "기술력": 8 }, image: "training" },
                    { name: "방수훈련", effects: { "체력": -8, "기술력": 6 }, image: "training" },
                    { name: "수중탈출훈련", effects: { "체력": -15, "정신력": 5, "기술력": 10 }, image: "training" },
                    { name: "PQS 시험준비", effects: { "정신력": -10, "기술력": 12 }, image: "training" }
                ],
                "정비": [
                    { name: "장비점검", effects: { "체력": -5, "기술력": 5 }, image: "maintenance" },
                    { name: "체계정비", effects: { "체력": -8, "기술력": 8 }, image: "maintenance" }
                ],
                "브리핑": [
                    { name: "작전브리핑", effects: { "정신력": 5, "기술력": 3 }, image: "rest" },
                    { name: "안전교육", effects: { "정신력": 3, "기술력": 5 }, image: "rest" }
                ],
                "개인정비": [
                    { name: "운동", effects: { "체력": 10, "정신력": 3 }, image: "rest" },
                    { name: "휴식", effects: { "체력": 8, "정신력": 8 }, image: "rest" },
                    { name: "독서", effects: { "정신력": 10, "기술력": 2 }, image: "rest" }
                ]
            },
            missions: [
                {
                    name: "정찰 임무",
                    description: "적 해역에 침투하여 정보를 수집하고 적 잠수함 3대를 격침하세요",
                    objectives: { enemy_subs: 3, survival_time: 60 },
                    difficulty: 1
                },
                {
                    name: "호위 임무", 
                    description: "아군 보급선을 호위하며 적의 공격을 막아내세요",
                    objectives: { enemy_subs: 5, protect_convoy: true, survival_time: 90 },
                    difficulty: 2
                },
                {
                    name: "전략 타격",
                    description: "적 해군기지에 전술 미사일을 발사하여 무력화하세요", 
                    objectives: { destroy_base: 1, enemy_subs: 7, survival_time: 120 },
                    difficulty: 3
                }
            ]
        };

        // 플레이어 상태 초기화
        this.player = {
            rank: "",
            stats: { "체력": 0, "정신력": 0, "기술력": 0 },
            daysRemaining: 0,
            selectedActivities: [],
            score: 0,
            currentShift: 0,
            missionDay: 1
        };

        this.currentScreen = "start";
        this.currentImageType = "rest";
        this.actionGame = null;
        this.init();
    }

    // 게임 초기화
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupGame();
            });
        } else {
            this.setupGame();
        }
    }

    // 게임 설정
    setupGame() {
        console.log('Setting up game...');
        this.changeCharacterImage("rest");
        this.bindEvents();
        this.setupActivityButtons();
        this.showScreen("start-screen");
        console.log('Game setup complete');
    }

    // 캐릭터 이미지 변경 함수
    changeCharacterImage(imageType) {
        const characterImage = document.getElementById('character-image');
        if (!characterImage || !this.gameData.images[imageType]) return;

        characterImage.classList.add('fade-out');
        
        setTimeout(() => {
            characterImage.src = this.gameData.images[imageType];
            characterImage.classList.remove('fade-out');
            characterImage.classList.add('fade-in');
            
            setTimeout(() => {
                characterImage.classList.remove('fade-in');
            }, 300);
        }, 150);

        this.currentImageType = imageType;
    }

    // 능력치 변화 애니메이션
    animateStatChange(stat, change, isMission = false) {
        const prefix = isMission ? 'mission-' : '';
        const statKey = {
            '체력': 'health',
            '정신력': 'mental', 
            '기술력': 'skill'
        }[stat];

        const changeElement = document.getElementById(`${prefix}${statKey}-change`);
        if (changeElement) {
            changeElement.textContent = change > 0 ? `+${change}` : `${change}`;
            changeElement.className = `stat-change ${change > 0 ? 'positive' : 'negative'}`;
            changeElement.style.opacity = '1';
            changeElement.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                changeElement.style.opacity = '0';
                changeElement.style.transform = 'translateY(0)';
            }, 2000);
        }

        this.showFloatingText(`${stat} ${change > 0 ? '+' : ''}${change}`, change > 0 ? 'positive' : 'negative');
    }

    // 부유하는 텍스트 효과
    showFloatingText(text, colorClass) {
        const container = document.getElementById('floating-text-container');
        if (!container) return;

        const floatingText = document.createElement('div');
        floatingText.className = `floating-text ${colorClass}`;
        floatingText.textContent = text;

        const x = Math.random() * (window.innerWidth - 200) + 100;
        const y = Math.random() * (window.innerHeight - 200) + 100;
        
        floatingText.style.left = `${x}px`;
        floatingText.style.top = `${y}px`;

        container.appendChild(floatingText);

        setTimeout(() => {
            if (container.contains(floatingText)) {
                container.removeChild(floatingText);
            }
        }, 2000);
    }

    // 화면 흔들림 효과
    shakeScreen() {
        const body = document.body;
        body.classList.add('shake');
        
        const screens = document.querySelectorAll('.screen.active');
        screens.forEach(screen => {
            screen.classList.add('danger-alert');
        });

        setTimeout(() => {
            body.classList.remove('shake');
            screens.forEach(screen => {
                screen.classList.remove('danger-alert');
            });
        }, 1000);
    }

    // 이벤트 바인딩
    bindEvents() {
        console.log('Binding events...');
        
        // 시작 버튼 이벤트
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Start button clicked - navigating to rank screen');
                this.showScreen("rank-screen");
            });
            console.log('Start button event bound successfully');
        } else {
            console.error('Start button not found!');
        }

        // 계급 선택 버튼들
        document.querySelectorAll('.select-rank-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Rank button clicked:', e.target.dataset.rank);
                this.selectRank(e.target.dataset.rank);
            });
        });

        // 다음 날 버튼
        const nextDayBtn = document.getElementById('next-day-btn');
        if (nextDayBtn) {
            nextDayBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.nextDay();
            });
        }

        // 재시작 버튼
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.restart();
            });
        }

        // 액션 게임 관련 버튼들
        const nextMissionBtn = document.getElementById('next-mission-btn');
        if (nextMissionBtn) {
            nextMissionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.actionGame) {
                    this.actionGame.nextMission();
                }
            });
        }

        const continueGameBtn = document.getElementById('continue-game-btn');
        if (continueGameBtn) {
            continueGameBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.endGame();
            });
        }

        const resumeGameBtn = document.getElementById('resume-game-btn');
        if (resumeGameBtn) {
            resumeGameBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.actionGame) {
                    this.actionGame.togglePause();
                }
            });
        }

        const quitGameBtn = document.getElementById('quit-game-btn');
        if (quitGameBtn) {
            quitGameBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.endGame();
            });
        }

        console.log('Events bound successfully');
    }

    // 화면 전환 함수
    showScreen(screenId) {
        console.log('Showing screen:', screenId);
        
        // 모든 화면 숨기기
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // 선택된 화면 표시
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            targetScreen.classList.add('fade-in');
            
            setTimeout(() => {
                targetScreen.classList.remove('fade-in');
            }, 500);
            
            this.currentScreen = screenId.replace('-screen', '');
            console.log('Screen changed to:', this.currentScreen);
        } else {
            console.error('Screen not found:', screenId);
        }
    }

    // 계급 선택 처리
    selectRank(rank) {
        console.log('Selecting rank:', rank);
        this.player.rank = rank;
        const rankData = this.gameData.ranks[rank];
        
        this.player.stats = { ...rankData.stats };
        this.player.daysRemaining = rankData.days;

        this.changeCharacterImage("rest");
        this.showScreen("preparation-screen");
        this.updatePreparationDisplay();
    }

    // 활동 버튼 설정
    setupActivityButtons() {
        console.log('Setting up activity buttons...');
        const containerMap = {
            "훈련": "training-activities",
            "정비": "maintenance-activities", 
            "브리핑": "briefing-activities",
            "개인정비": "personal-activities"
        };

        Object.keys(this.gameData.activities).forEach(category => {
            const container = document.getElementById(containerMap[category]);
            if (!container) return;

            const activities = this.gameData.activities[category];

            activities.forEach(activity => {
                const btn = document.createElement('button');
                btn.className = 'activity-btn';
                btn.dataset.category = category;
                btn.dataset.activity = activity.name;
                btn.dataset.image = activity.image;
                
                const effectsText = Object.entries(activity.effects)
                    .map(([stat, value]) => `${stat} ${value > 0 ? '+' : ''}${value}`)
                    .join(', ');

                btn.innerHTML = `
                    <div>${activity.name}</div>
                    <div class="effects">${effectsText}</div>
                `;

                btn.addEventListener('mouseenter', () => {
                    this.changeCharacterImage(activity.image);
                });

                btn.addEventListener('mouseleave', () => {
                    if (this.player.selectedActivities.length > 0) {
                        const lastSelected = this.player.selectedActivities[this.player.selectedActivities.length - 1];
                        this.changeCharacterImage(lastSelected.image);
                    } else {
                        this.changeCharacterImage("rest");
                    }
                });

                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.selectActivity(category, activity);
                });

                container.appendChild(btn);
            });
        });
        console.log('Activity buttons setup complete');
    }

    // 활동 선택 처리
    selectActivity(category, activity) {
        const btn = document.querySelector(`[data-activity="${activity.name}"]`);
        if (!btn) return;
        
        if (btn.classList.contains('selected')) {
            btn.classList.remove('selected');
            this.player.selectedActivities = this.player.selectedActivities
                .filter(selected => selected.name !== activity.name);
        } else if (this.player.selectedActivities.length < 3) {
            btn.classList.add('selected');
            this.player.selectedActivities.push({ category, ...activity });
            this.changeCharacterImage(activity.image);
        }

        this.updateActivitySelection();
    }

    // 선택된 활동 표시 업데이트
    updateActivitySelection() {
        const selectedCount = document.getElementById('selected-count');
        const selectedList = document.getElementById('selected-list');
        const nextDayBtn = document.getElementById('next-day-btn');

        if (selectedCount) {
            selectedCount.textContent = this.player.selectedActivities.length;
        }

        if (selectedList) {
            selectedList.innerHTML = this.player.selectedActivities
                .map(activity => activity.name)
                .join(', ') || '선택된 활동이 없습니다';
        }

        if (nextDayBtn) {
            nextDayBtn.disabled = this.player.selectedActivities.length !== 3;
        }
    }

    // 준비 단계 화면 표시 업데이트
    updatePreparationDisplay() {
        const daysElement = document.getElementById('days-remaining');
        if (daysElement) {
            daysElement.textContent = this.player.daysRemaining;
        }
        this.updateStatsDisplay();
    }

    // 능력치 표시 업데이트
    updateStatsDisplay() {
        Object.entries(this.player.stats).forEach(([stat, value]) => {
            const statKey = {
                '체력': 'health',
                '정신력': 'mental', 
                '기술력': 'skill'
            }[stat];

            const bar = document.getElementById(`${statKey}-bar`);
            const valueSpan = document.getElementById(`${statKey}-value`);

            if (bar && valueSpan) {
                const percentage = Math.max(0, Math.min(100, value));
                bar.style.width = `${percentage}%`;
                valueSpan.textContent = value;

                bar.classList.remove('low-stat', 'medium-stat', 'high-stat');
                if (value < 30) {
                    bar.classList.add('low-stat');
                } else if (value < 60) {
                    bar.classList.add('medium-stat');
                } else {
                    bar.classList.add('high-stat');
                }
            }
        });
    }

    // 다음 날 진행
    nextDay() {
        console.log('Next day called, current day:', this.player.daysRemaining);
        
        this.player.selectedActivities.forEach(activity => {
            Object.entries(activity.effects).forEach(([stat, value]) => {
                this.player.stats[stat] += value;
                this.player.stats[stat] = Math.max(0, this.player.stats[stat]);
                this.animateStatChange(stat, value);
            });
        });

        this.player.daysRemaining--;

        const lowStats = Object.entries(this.player.stats)
            .filter(([stat, value]) => value <= 0)
            .map(([stat, value]) => stat);

        if (lowStats.length > 0) {
            this.shakeScreen();
        }

        this.player.selectedActivities = [];
        document.querySelectorAll('.activity-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        this.changeCharacterImage("rest");

        if (this.player.daysRemaining <= 0) {
            console.log('Days remaining is 0, starting action game...');
            setTimeout(() => {
                this.startActionGame();
            }, 1000);
        } else {
            this.updatePreparationDisplay();
            this.updateActivitySelection();
        }
    }

    // 액션 게임 시작
    startActionGame() {
        console.log('Starting action game...');
        this.changeCharacterImage("emergency");
        this.showScreen("action-game-screen");
        
        // 약간의 지연 후 액션 게임 시작 (화면 전환 완료 대기)
        setTimeout(() => {
            this.actionGame = new ActionGame(this.player.stats, this.gameData.missions);
            this.actionGame.onGameComplete = (finalScore) => {
                this.player.score = finalScore;
                this.endGame();
            };
            
            this.actionGame.start();
        }, 500);
    }

    // 게임 종료
    endGame() {
        this.changeCharacterImage("rest");
        this.showScreen("end-screen");
        
        const finalScoreElement = document.getElementById('final-score');
        const finalRankElement = document.getElementById('final-rank');
        const rankDescriptionElement = document.getElementById('rank-description');

        if (finalScoreElement) {
            finalScoreElement.textContent = this.player.score;
        }
        
        let rank, description;
        if (this.player.score >= 1200) {
            rank = "전설의 승조원";
            description = "당신은 잠수함계의 전설입니다! 모든 승조원들이 당신을 존경합니다.";
        } else if (this.player.score >= 800) {
            rank = "베테랑 승조원";
            description = "뛰어난 실력과 경험을 가진 베테랑입니다! 어떤 상황에도 침착하게 대응할 수 있습니다.";
        } else if (this.player.score >= 400) {
            rank = "숙련된 승조원";
            description = "안정적이고 믿을 만한 승조원입니다. 더 많은 경험을 쌓아 베테랑이 되어보세요!";
        } else {
            rank = "신참 승조원";
            description = "아직 경험이 부족하지만 앞으로 성장할 가능성이 무궁무진합니다!";
        }

        if (finalRankElement) {
            finalRankElement.textContent = rank;
        }
        
        if (rankDescriptionElement) {
            rankDescriptionElement.textContent = description;
        }

        if (this.player.score >= 400) {
            this.showFloatingText("축하합니다!", "positive");
        }
    }

    // 게임 재시작
    restart() {
        this.player = {
            rank: "",
            stats: { "체력": 0, "정신력": 0, "기술력": 0 },
            daysRemaining: 0,
            selectedActivities: [],
            score: 0,
            currentShift: 0,
            missionDay: 1
        };

        document.querySelectorAll('.activity-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        const floatingContainer = document.getElementById('floating-text-container');
        if (floatingContainer) {
            floatingContainer.innerHTML = '';
        }

        if (this.actionGame) {
            this.actionGame.destroy();
            this.actionGame = null;
        }

        this.changeCharacterImage("rest");
        this.showScreen("start-screen");
    }
}

// 액션 게임 클래스
class ActionGame {
    constructor(playerStats, missions) {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        
        this.playerStats = { ...playerStats };
        this.missions = missions;
        this.currentMissionIndex = 0;
        this.currentMission = missions[0];
        
        this.player = null;
        this.enemies = [];
        this.torpedoes = [];
        this.obstacles = [];
        this.items = [];
        this.particles = [];
        
        this.keys = {};
        this.gameRunning = false;
        this.paused = false;
        this.score = 0;
        this.gameTime = 0;
        this.missionComplete = false;
        
        this.onGameComplete = null;
        
        this.init();
    }
    
    init() {
        this.setupPlayer();
        this.setupMission();
        this.bindControls();
        this.updateUI();
    }
    
    setupPlayer() {
        this.player = {
            x: 50,
            y: this.canvas.height / 2,
            width: 40,
            height: 20,
            speed: 3 + (this.playerStats['기술력'] / 50),
            health: this.playerStats['체력'],
            maxHealth: this.playerStats['체력'],
            torpedoes: 10 + Math.floor(this.playerStats['기술력'] / 10),
            specialWeapons: Math.floor(this.playerStats['정신력'] / 30),
            angle: 0,
            color: '#32a085'
        };
    }
    
    setupMission() {
        this.enemies = [];
        this.obstacles = [];
        this.items = [];
        this.missionComplete = false;
        
        const mission = this.currentMission;
        const difficulty = mission.difficulty;
        
        // 적 잠수함 생성
        for (let i = 0; i < mission.objectives.enemy_subs; i++) {
            this.enemies.push({
                x: 600 + Math.random() * 400,
                y: Math.random() * (this.canvas.height - 40) + 20,
                width: 35,
                height: 18,
                speed: 1 + difficulty * 0.5,
                health: 50 + difficulty * 25,
                maxHealth: 50 + difficulty * 25,
                lastShot: 0,
                type: 'submarine',
                color: '#c02f47'
            });
        }
        
        // 기뢰 생성
        const mineCount = 3 + difficulty * 2;
        for (let i = 0; i < mineCount; i++) {
            this.obstacles.push({
                x: 200 + Math.random() * 400,
                y: Math.random() * (this.canvas.height - 30) + 15,
                width: 25,
                height: 25,
                damage: 30,
                type: 'mine',
                color: '#db4545',
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
        
        // 암초 생성
        const reefCount = 2 + difficulty;
        for (let i = 0; i < reefCount; i++) {
            this.obstacles.push({
                x: 150 + Math.random() * 500,
                y: Math.random() * (this.canvas.height - 60) + 30,
                width: 40 + Math.random() * 20,
                height: 30 + Math.random() * 15,
                damage: 20,
                type: 'reef',
                color: '#5e5248'
            });
        }
        
        // 아이템 생성
        for (let i = 0; i < 3; i++) {
            this.items.push({
                x: 300 + Math.random() * 300,
                y: Math.random() * (this.canvas.height - 20) + 10,
                width: 20,
                height: 20,
                type: Math.random() < 0.4 ? 'health' : (Math.random() < 0.7 ? 'torpedo' : 'special'),
                collected: false,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
        
        this.updateMissionUI();
    }
    
    bindControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space') {
                e.preventDefault();
                this.fireTorpedo();
            } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                e.preventDefault();
                this.fireSpecialWeapon();
            } else if (e.code === 'KeyP') {
                e.preventDefault();
                this.togglePause();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    start() {
        this.gameRunning = true;
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        if (!this.paused) {
            this.update();
            this.render();
            this.renderMinimap();
            this.gameTime++;
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // 플레이어 이동
        this.updatePlayer();
        
        // 적 업데이트
        this.updateEnemies();
        
        // 어뢰 업데이트
        this.updateTorpedoes();
        
        // 충돌 감지
        this.checkCollisions();
        
        // 파티클 업데이트
        this.updateParticles();
        
        // 아이템 업데이트
        this.updateItems();
        
        // 미션 완료 체크
        this.checkMissionComplete();
        
        // 게임 오버 체크
        this.checkGameOver();
    }
    
    updatePlayer() {
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.player.y -= this.player.speed;
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.player.y += this.player.speed;
        }
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.x += this.player.speed;
        }
        
        // 화면 경계 제한
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.canvas.height - this.player.height, this.player.y));
    }
    
    updateEnemies() {
        this.enemies.forEach((enemy, index) => {
            if (enemy.health <= 0) {
                this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                this.enemies.splice(index, 1);
                this.score += 100;
                return;
            }
            
            // AI 이동
            enemy.x -= enemy.speed;
            
            // 플레이어를 향해 이동
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance > 0) {
                enemy.y += (dy / distance) * enemy.speed * 0.3;
            }
            
            // 화면 밖으로 나가면 다시 오른쪽에서 등장
            if (enemy.x < -enemy.width) {
                enemy.x = this.canvas.width + Math.random() * 200;
                enemy.y = Math.random() * (this.canvas.height - enemy.height);
            }
            
            // 적 미사일 발사
            if (this.gameTime - enemy.lastShot > 120 && distance < 300) {
                this.fireEnemyMissile(enemy);
                enemy.lastShot = this.gameTime;
            }
        });
    }
    
    updateTorpedoes() {
        this.torpedoes.forEach((torpedo, index) => {
            torpedo.x += torpedo.vx;
            torpedo.y += torpedo.vy;
            
            // 화면 밖으로 나가면 제거
            if (torpedo.x > this.canvas.width || torpedo.x < 0 || 
                torpedo.y > this.canvas.height || torpedo.y < 0) {
                this.torpedoes.splice(index, 1);
            }
        });
    }
    
    updateParticles() {
        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }
    
    updateItems() {
        this.items.forEach(item => {
            if (!item.collected) {
                item.pulsePhase += 0.1;
            }
        });
    }
    
    checkCollisions() {
        // 플레이어와 장애물 충돌
        this.obstacles.forEach(obstacle => {
            if (this.checkRectCollision(this.player, obstacle)) {
                this.damagePlayer(obstacle.damage);
                this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2);
            }
        });
        
        // 어뢰와 적 충돌
        this.torpedoes.forEach((torpedo, tIndex) => {
            if (torpedo.owner === 'player') {
                this.enemies.forEach((enemy, eIndex) => {
                    if (this.checkRectCollision(torpedo, enemy)) {
                        enemy.health -= torpedo.damage;
                        this.createExplosion(torpedo.x, torpedo.y);
                        this.torpedoes.splice(tIndex, 1);
                    }
                });
            } else {
                // 적 미사일과 플레이어 충돌
                if (this.checkRectCollision(torpedo, this.player)) {
                    this.damagePlayer(torpedo.damage);
                    this.createExplosion(torpedo.x, torpedo.y);
                    this.torpedoes.splice(tIndex, 1);
                }
            }
        });
        
        // 플레이어와 아이템 충돌
        this.items.forEach(item => {
            if (!item.collected && this.checkRectCollision(this.player, item)) {
                this.collectItem(item);
            }
        });
    }
    
    checkRectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    damagePlayer(damage) {
        this.player.health -= damage;
        this.player.health = Math.max(0, this.player.health);
        this.updateHealthUI();
    }
    
    collectItem(item) {
        item.collected = true;
        this.score += 50;
        
        switch (item.type) {
            case 'health':
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
                break;
            case 'torpedo':
                this.player.torpedoes += 5;
                break;
            case 'special':
                this.player.specialWeapons += 1;
                break;
        }
        
        this.updateUI();
    }
    
    fireTorpedo() {
        if (this.player.torpedoes <= 0) return;
        
        this.player.torpedoes--;
        this.torpedoes.push({
            x: this.player.x + this.player.width,
            y: this.player.y + this.player.height/2,
            width: 8,
            height: 3,
            vx: 8,
            vy: 0,
            damage: 50,
            owner: 'player',
            color: '#1fb8cd'
        });
        
        this.updateUI();
    }
    
    fireSpecialWeapon() {
        if (this.player.specialWeapons <= 0) return;
        
        this.player.specialWeapons--;
        
        // 강력한 전술 미사일
        this.torpedoes.push({
            x: this.player.x + this.player.width,
            y: this.player.y + this.player.height/2,
            width: 12,
            height: 6,
            vx: 6,
            vy: 0,
            damage: 150,
            owner: 'player',
            color: '#db4545'
        });
        
        this.updateUI();
    }
    
    fireEnemyMissile(enemy) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        this.torpedoes.push({
            x: enemy.x,
            y: enemy.y + enemy.height/2,
            width: 6,
            height: 2,
            vx: (dx / distance) * 4,
            vy: (dy / distance) * 4,
            damage: 25,
            owner: 'enemy',
            color: '#ff5459'
        });
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 20,
                maxLife: 20,
                alpha: 1,
                color: Math.random() < 0.5 ? '#ff5459' : '#ffc185'
            });
        }
    }
    
    checkMissionComplete() {
        if (this.missionComplete) return;
        
        const mission = this.currentMission;
        let completed = true;
        
        if (mission.objectives.enemy_subs && this.enemies.length > 0) {
            completed = false;
        }
        
        if (completed) {
            this.missionComplete = true;
            this.score += 500;
            this.showMissionComplete();
        }
    }
    
    checkGameOver() {
        if (this.player.health <= 0) {
            this.gameRunning = false;
            this.showGameOver();
        }
    }
    
    showMissionComplete() {
        const overlay = document.getElementById('game-overlay');
        const title = document.getElementById('overlay-title');
        const message = document.getElementById('overlay-message');
        const nextBtn = document.getElementById('next-mission-btn');
        const continueBtn = document.getElementById('continue-game-btn');
        
        title.textContent = '미션 완료!';
        message.textContent = `${this.currentMission.name}을(를) 성공적으로 완료했습니다!`;
        
        if (this.currentMissionIndex < this.missions.length - 1) {
            nextBtn.style.display = 'inline-flex';
            continueBtn.textContent = '게임 종료';
        } else {
            nextBtn.style.display = 'none';
            continueBtn.textContent = '모든 미션 완료!';
        }
        
        overlay.classList.remove('hidden');
    }
    
    showGameOver() {
        const overlay = document.getElementById('game-overlay');
        const title = document.getElementById('overlay-title');
        const message = document.getElementById('overlay-message');
        const nextBtn = document.getElementById('next-mission-btn');
        const continueBtn = document.getElementById('continue-game-btn');
        
        title.textContent = '임무 실패';
        message.textContent = '잠수함이 격침되었습니다...';
        nextBtn.style.display = 'none';
        continueBtn.textContent = '게임 종료';
        
        overlay.classList.remove('hidden');
    }
    
    nextMission() {
        this.currentMissionIndex++;
        if (this.currentMissionIndex >= this.missions.length) {
            if (this.onGameComplete) {
                this.onGameComplete(this.score);
            }
            return;
        }
        
        this.currentMission = this.missions[this.currentMissionIndex];
        this.setupMission();
        
        const overlay = document.getElementById('game-overlay');
        overlay.classList.add('hidden');
        
        // 체력 일부 회복
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 20);
        this.updateUI();
    }
    
    togglePause() {
        this.paused = !this.paused;
        const pausePopup = document.getElementById('pause-popup');
        
        if (this.paused) {
            pausePopup.classList.remove('hidden');
        } else {
            pausePopup.classList.add('hidden');
        }
    }
    
    render() {
        // 배경 그리기
        this.ctx.fillStyle = '#001122';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 그라디언트 배경
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#001122');
        gradient.addColorStop(1, '#002244');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 플레이어 그리기
        this.renderPlayer();
        
        // 적들 그리기
        this.enemies.forEach(enemy => this.renderEnemy(enemy));
        
        // 장애물 그리기
        this.obstacles.forEach(obstacle => this.renderObstacle(obstacle));
        
        // 아이템 그리기
        this.items.forEach(item => {
            if (!item.collected) this.renderItem(item);
        });
        
        // 어뢰 그리기
        this.torpedoes.forEach(torpedo => this.renderTorpedo(torpedo));
        
        // 파티클 그리기
        this.particles.forEach(particle => this.renderParticle(particle));
    }
    
    renderPlayer() {
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // 플레이어 세부사항
        this.ctx.fillStyle = '#20b2aa';
        this.ctx.fillRect(this.player.x + 5, this.player.y + 5, 30, 10);
    }
    
    renderEnemy(enemy) {
        this.ctx.fillStyle = enemy.color;
        this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // 체력바
        const healthPercentage = enemy.health / enemy.maxHealth;
        this.ctx.fillStyle = 'rgba(255, 84, 89, 0.8)';
        this.ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 4);
        this.ctx.fillStyle = 'rgba(33, 128, 141, 0.8)';
        this.ctx.fillRect(enemy.x, enemy.y - 8, enemy.width * healthPercentage, 4);
    }
    
    renderObstacle(obstacle) {
        if (obstacle.type === 'mine') {
            const pulse = Math.sin(obstacle.pulsePhase + this.gameTime * 0.1) * 0.3 + 0.7;
            this.ctx.fillStyle = `rgba(219, 69, 69, ${pulse})`;
            this.ctx.beginPath();
            this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 
                        obstacle.width/2, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    }
    
    renderItem(item) {
        const pulse = Math.sin(item.pulsePhase) * 0.3 + 0.7;
        let color;
        
        switch (item.type) {
            case 'health':
                color = `rgba(33, 128, 141, ${pulse})`;
                break;
            case 'torpedo':
                color = `rgba(31, 184, 205, ${pulse})`;
                break;
            case 'special':
                color = `rgba(219, 69, 69, ${pulse})`;
                break;
        }
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(item.x, item.y, item.width, item.height);
    }
    
    renderTorpedo(torpedo) {
        this.ctx.fillStyle = torpedo.color;
        this.ctx.fillRect(torpedo.x, torpedo.y, torpedo.width, torpedo.height);
    }
    
    renderParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.alpha;
        this.ctx.fillStyle = particle.color;
        this.ctx.fillRect(particle.x, particle.y, 3, 3);
        this.ctx.restore();
    }
    
    renderMinimap() {
        const scale = 0.1875; // 800x600 -> 150x120
        
        this.minimapCtx.fillStyle = '#001122';
        this.minimapCtx.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
        
        // 플레이어
        this.minimapCtx.fillStyle = '#32a085';
        this.minimapCtx.fillRect(this.player.x * scale, this.player.y * scale, 4, 3);
        
        // 적들
        this.minimapCtx.fillStyle = '#c02f47';
        this.enemies.forEach(enemy => {
            this.minimapCtx.fillRect(enemy.x * scale, enemy.y * scale, 3, 2);
        });
        
        // 아이템
        this.minimapCtx.fillStyle = '#1fb8cd';
        this.items.forEach(item => {
            if (!item.collected) {
                this.minimapCtx.fillRect(item.x * scale, item.y * scale, 2, 2);
            }
        });
    }
    
    updateUI() {
        document.getElementById('torpedo-count').textContent = this.player.torpedoes;
        document.getElementById('action-score').textContent = this.score;
        document.getElementById('special-weapon-count').textContent = this.player.specialWeapons;
        this.updateHealthUI();
    }
    
    updateHealthUI() {
        const healthPercentage = (this.player.health / this.player.maxHealth) * 100;
        const healthFill = document.getElementById('action-health-fill');
        const healthText = document.getElementById('action-health-text');
        
        if (healthFill) {
            healthFill.style.width = `${healthPercentage}%`;
        }
        
        if (healthText) {
            healthText.textContent = this.player.health;
        }
    }
    
    updateMissionUI() {
        document.getElementById('mission-title').textContent = this.currentMission.name;
        document.getElementById('mission-objective').textContent = this.currentMission.description;
    }
    
    destroy() {
        this.gameRunning = false;
    }
}

// 게임 시작
let game;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, creating game...');
        game = new SubmarineGame();
    });
} else {
    console.log('DOM already loaded, creating game...');
    game = new SubmarineGame();
}