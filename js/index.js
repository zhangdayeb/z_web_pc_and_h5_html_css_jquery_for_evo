// js/index.js
// 首页完整功能：登录状态管理 + 游戏系统

$(document).ready(function() {
    
    // ========== 全局变量 ==========
    window.currentUser = null;  // 用户信息（全局变量，供游戏系统使用）
    const API_BASE = base_url;  // 使用conf.js中的base_url
    const IMAGE_BASE = 'https://cg9898.com';  // 图片基础域名
    let systemConfig = null;
    let gameData = {
        casino: [],
        slot: [],
        sports: [],
        hot: []
    };
    
    // ========== 登录状态管理 ==========
    
    // 检查登录状态
    function checkLoginStatus() {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
            // 已登录状态
            try {
                const user = JSON.parse(userStr);
                showLoggedInState(user);
                // 验证 token 是否有效（可选）
                validateToken(token);
            } catch (e) {
                console.error('用户信息解析失败:', e);
                showLoggedOutState();
            }
        } else {
            // 未登录状态
            showLoggedOutState();
        }
    }
    
    // 显示已登录状态
    function showLoggedInState(user) {
        // 设置全局 currentUser 变量，供游戏系统使用
        window.currentUser = user;
        
        // 隐藏登录/注册按钮
        $('#loginMenu').hide();
        
        // 显示用户信息和登出菜单
        $('#loggedInMenu').show();
        
        // 更新用户名显示
        if (user.name) {
            $('#userNameLink').text(user.name);
            $('#userNameLink').attr('title', user.name);
        }
        
        // 更新用户余额（如果有）
        if (user.money !== undefined) {
            $('#userBalance').text(formatMoney(user.money || 0));
        }
        
        // 更新VIP等级（如果需要显示）
        if (user.vip_grade !== undefined && $('#level').length) {
            $('#level').text('VIP ' + user.vip_grade);
        }
        
        // 更新用户中心链接
        const rootDomain = getRootDomain();
        const token = localStorage.getItem('token');
        const userCenterUrl = `https://userh5.${rootDomain}/?lang=ko-KR&token=${token}`;
        
        $('#userNameLink').attr('href', userCenterUrl);
        $('#personalCenterBtn').attr('href', userCenterUrl);
    }
    
    // 显示未登录状态
    function showLoggedOutState() {
        // 清除全局 currentUser 变量
        window.currentUser = null;
        
        // 显示登录/注册按钮
        $('#loginMenu').show();
        
        // 隐藏用户信息和登出菜单
        $('#loggedInMenu').hide();
    }
    
    // 验证 Token 有效性（可选）
    function validateToken(token) {
        $.ajax({
            url: base_url + '/user/user_info',
            type: 'GET',
            headers: {
                'X-Token': token
            },
            success: function(response) {
                if (response.code === 200 || response.code === 0) {
                    // Token 有效，更新用户信息
                    if (response.data) {
                        localStorage.setItem('user', JSON.stringify(response.data));
                        // 更新全局 currentUser 变量
                        window.currentUser = response.data;
                        showLoggedInState(response.data);
                    }
                } else {
                    // Token 无效，清除登录状态
                    handleLogout();
                }
            },
            error: function() {
                // 验证失败，但不强制登出（可能是网络问题）
                console.log('Token 验证失败，保持当前状态');
            }
        });
    }
    
    // 处理登出
    function handleLogout() {
        const token = localStorage.getItem('token');
        
        if (token) {
            // 显示加载状态
            $('body').append('<div id="logoutLoading" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;"><div style="color:white;">로그아웃 중...</div></div>');
            
            // 调用后端登出接口
            $.ajax({
                url: base_url + '/user/out',
                type: 'POST',
                headers: {
                    'X-Token': token
                },
                complete: function() {
                    // 无论成功失败都清除本地存储
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    
                    // 清除全局 currentUser 变量
                    window.currentUser = null;
                    
                    // 移除加载提示
                    $('#logoutLoading').remove();
                    
                    // 显示未登录状态
                    showLoggedOutState();
                    
                    // 提示并跳转到登录页
                    alert('로그아웃되었습니다.');
                    window.location.href = 'login.html';
                }
            });
        } else {
            // 没有 token，直接跳转
            localStorage.removeItem('user');
            window.currentUser = null;
            window.location.href = 'login.html';
        }
    }
    
    // ========== 游戏系统 ==========
    
    // 앱 초기化
    async function initApp() {
        console.log('앱 초기화 시작...');
        try {
            await loadSystemConfig();
            await loadGamesData();
            console.log('앱 초기화 완료');
        } catch (error) {
            console.error('앱 초기화 실패:', error);
        }
    }
    
    // 시스템 설정 로드
    async function loadSystemConfig() {
        try {
            const currentUrl = encodeURIComponent(window.location.origin + '/');
            const configUrl = `${API_BASE}/config/sys_config?group=system&is_mobile=1&url=${currentUrl}&lang=ko-KR`;
            
            console.log('시스템 설정 로드 중...', configUrl);
            
            const response = await fetch(configUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            const data = await response.json();
            console.log('시스템 설정 응답:', data);
            
            if (data.code === 200) {
                systemConfig = data.data;
                
                if (systemConfig.group_prefix) {
                    localStorage.setItem('group_prefix', systemConfig.group_prefix);
                }
                if (systemConfig.token) {
                    localStorage.setItem('X-Token', systemConfig.token);
                }
                
                localStorage.setItem('system_config', JSON.stringify(systemConfig));
                console.log('시스템 설정 로드 성공');
            }
        } catch (error) {
            console.error('시스템 설정 로드 오류:', error);
        }
    }
    
    // 공통 헤더 생성
    function getCommonHeaders() {
        const token = localStorage.getItem('token');  // 使用Simple Token
        const groupPrefix = localStorage.getItem('group_prefix');
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (token) {
            headers['X-Token'] = token;  // 使用Simple Token作为X-Token
        }
        if (groupPrefix) {
            headers['Group-Prefix'] = groupPrefix;
        }
        
        return headers;
    }
    
    // 게임 데이터 로드
    async function loadGamesData() {
        console.log('게임 데이터 로드 시작...');
        
        const headers = getCommonHeaders();
        
        try {
            const requests = [
                fetch(`${API_BASE}/game/game_hot_list?lang=ko-KR&page=1&limit=20`, { 
                    method: 'GET',
                    headers: headers 
                }),
                fetch(`${API_BASE}/game/game_list?lang=ko-KR&game_type=LIVE&page=1&limit=100`, { 
                    method: 'GET',
                    headers: headers 
                }),
                fetch(`${API_BASE}/game/game_list?lang=ko-KR&game_type=SLOTS&page=1&limit=100`, { 
                    method: 'GET',
                    headers: headers 
                }),
                fetch(`${API_BASE}/game/game_list?lang=ko-KR&game_type=SPORTS&page=1&limit=100`, { 
                    method: 'GET',
                    headers: headers 
                })
            ];
            
            const [hotResponse, casinoResponse, slotResponse, sportsResponse] = await Promise.all(requests);
            
            await processApiResponse(hotResponse, 'hot', '인기 게임');
            await processApiResponse(casinoResponse, 'casino', '카지노 게임');
            await processApiResponse(slotResponse, 'slot', '슬롯 게임');
            await processApiResponse(sportsResponse, 'sports', '스포츠 게임');
            
            renderHotGames();
            renderAllGames();
            
            console.log('게임 데이터 로드 완료');
            
        } catch (error) {
            console.error('게임 데이터 로드 실패:', error);
            renderDefaultContent();
        }
    }
    
    // API 응답 처리
    async function processApiResponse(response, dataKey, gameName) {
        try {
            if (response.ok) {
                const data = await response.json();
                
                if (data.code === 200) {
                    gameData[dataKey] = data.data?.list || data.data || [];
                    console.log(`${gameName} 로드 성공:`, gameData[dataKey].length);
                } else {
                    gameData[dataKey] = [];
                }
            } else {
                gameData[dataKey] = [];
            }
        } catch (error) {
            console.error(`${gameName} 처리 오류:`, error);
            gameData[dataKey] = [];
        }
    }
    
    // 인기 게임 렌더링
    function renderHotGames() {
        const container = document.getElementById('hotGamesContainer');
        if (!container) return;
        
        if (gameData.hot.length === 0) {
            container.innerHTML = '<div class="no-games">인기 게임이 없습니다</div>';
            return;
        }
        
        const swiperWrapper = document.createElement('div');
        swiperWrapper.className = 'swiper-wrapper';
        
        const gamesPerSlide = 4;
        for (let i = 0; i < gameData.hot.length; i += gamesPerSlide) {
            const slideGames = gameData.hot.slice(i, i + gamesPerSlide);
            const slide = createHotGameSlide(slideGames);
            swiperWrapper.appendChild(slide);
        }
        
        const pagination = document.createElement('div');
        pagination.className = 'swiper-pagination';
        
        container.innerHTML = '';
        container.appendChild(swiperWrapper);
        container.appendChild(pagination);
        
        setTimeout(() => {
            if (typeof Swiper !== 'undefined') {
                new Swiper(".hotSwiper", {
                    slidesPerView: 1,
                    grid: { rows: 1 },
                    spaceBetween: 10,
                    pagination: {
                        el: ".hotSwiper .swiper-pagination",
                        clickable: true,
                    },
                });
            }
        }, 100);
    }
    
    // 인기 게임 슬라이드 생성
    function createHotGameSlide(games) {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        
        const ul = document.createElement('ul');
        
        games.forEach(game => {
            const li = document.createElement('li');
            li.className = 'game-card';
            
            const gameImageUrl = getFullImageUrl(game.img_url || game.game_img_url);
            
            li.innerHTML = `
                <div class="img_wrap">
                    <img src="${gameImageUrl}" 
                         alt="${game.game_code}" 
                         onerror="this.onerror=null; this.src='images/default-game.png'">
                </div>
                <strong>${game.game_name || '게임'}</strong>
                <span>${game.supplier_code || ''}</span>
            `;
            
            li.style.cursor = 'pointer';
            li.addEventListener('click', function() {
                if (game.is_can_run === 1) {
                    launchGame(game.game_code, game.supplier_code, game.id);
                } else {
                    showGameUnavailable();
                }
            });
            
            ul.appendChild(li);
        });
        
        slide.appendChild(ul);
        return slide;
    }
    
    // 모든 게임 렌더링
    function renderAllGames() {
        renderGamesSection('casinoGamesContainer', gameData.casino, 'casino');
        renderGamesSection('slotGamesContainer', gameData.slot, 'slot');
        renderGamesSection('sportsGamesContainer', gameData.sports, 'sports');
    }
    
    // 게임 섹션 렌더링
    function renderGamesSection(containerId, games, type) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (games.length === 0) {
            container.innerHTML = '<div class="no-games">게임이 없습니다</div>';
            return;
        }
        
        const gameElements = games.slice(0, 20).map(game => createGameElement(game, type));
        container.innerHTML = gameElements.join('');
    }
    
    // 게임 요소 생성
    function createGameElement(game, type) {
        const gameImg = getFullImageUrl(game.img_url || game.game_img_url);
        const isCanRun = game.is_can_run === 1;
        const gameName = game.game_name || game.game_code || '알 수 없는 게임';
        const supplierCode = game.supplier_code || '';
        const gameId = game.id || '1';
        
        const logoSection = game.supplier_logo 
            ? `<img src="${getFullImageUrl(game.supplier_logo)}" 
                    onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='block';"
                    alt="${supplierCode}">
               <h2 style="display:none;">${supplierCode || gameName}</h2>`
            : `<h2>${supplierCode || gameName}</h2>`;
        
        return `
            <a href="#" class="slot-btn game-card ${!isCanRun ? 'auth-required' : ''}" 
               onclick="event.preventDefault(); ${isCanRun ? `launchGame('${game.game_code}', '${supplierCode}', '${gameId}')` : 'showGameUnavailable()'}; return false;">
                <div class="g-panel w-ba">
                    <div class="g-cont w-ba">
                        <img class="g-glow" src="images/slot-glow.png" 
                             onerror="this.onerror=null; this.style.display='none';">
                        <div class="g-inner">
                            <img class="g-img" src="${gameImg}" 
                                 onerror="this.onerror=null; this.src='images/default-game.png'">
                            <button class="play-btn w-b">${isCanRun ? '게임입장' : '준비중'}</button>
                        </div>
                    </div>
                </div>
                <div class="g-logo dflex-ac-jc">
                    ${logoSection}
                </div>
                <span class="g-name">${gameName}</span>
            </a>
        `;
    }
    
    // 기본 콘텐츠 렌더링
    function renderDefaultContent() {
        console.log('기본 콘텐츠 렌더링');
        
        const defaultCasino = `
            <a href="#" class="slot-btn" onclick="showGameUnavailable(); return false;">
                <div class="g-panel w-ba">
                    <div class="g-cont w-ba">
                        <img class="g-glow" src="images/slot-glow.png">
                        <div class="g-inner">
                            <img class="g-img" src="images/evolution.png" 
                                 onerror="this.onerror=null; this.src='images/default-game.png';">
                            <button class="play-btn w-b">게임입장</button>
                        </div>
                    </div>
                </div>
                <div class="g-logo dflex-ac-jc">
                    <h2>에볼루션 카지노</h2>
                </div>
                <span class="g-name">에볼루션 카지노</span>
            </a>
        `;
        
        const defaultSlot = `
            <a href="#" class="slot-btn" onclick="showGameUnavailable(); return false;">
                <div class="g-panel w-ba">
                    <div class="g-cont w-ba">
                        <img class="g-glow" src="images/slot-glow.png">
                        <div class="g-inner">
                            <img class="g-img" src="images/1_slot.png" 
                                 onerror="this.onerror=null; this.src='images/default-game.png';">
                            <button class="play-btn w-b">게임입장</button>
                        </div>
                    </div>
                </div>
                <div class="g-logo dflex-ac-jc">
                    <h2>프라그마틱 슬롯</h2>
                </div>
                <span class="g-name">프라그마틱 슬롯</span>
            </a>
        `;
        
        const defaultSports = `
            <a href="#" class="slot-btn" onclick="showGameUnavailable(); return false;">
                <div class="g-panel w-ba">
                    <div class="g-cont w-ba">
                        <img class="g-glow" src="images/slot-glow.png">
                        <div class="g-inner">
                            <img class="g-img" src="images/1_sports.png" 
                                 onerror="this.onerror=null; this.src='images/default-game.png';">
                            <button class="play-btn w-b">게임입장</button>
                        </div>
                    </div>
                </div>
                <div class="g-logo dflex-ac-jc">
                    <h2>축구</h2>
                </div>
                <span class="g-name">축구 베팅</span>
            </a>
        `;
        
        const casinoContainer = document.getElementById('casinoGamesContainer');
        const slotContainer = document.getElementById('slotGamesContainer');
        const sportsContainer = document.getElementById('sportsGamesContainer');
        
        if (casinoContainer) casinoContainer.innerHTML = defaultCasino;
        if (slotContainer) slotContainer.innerHTML = defaultSlot;
        if (sportsContainer) sportsContainer.innerHTML = defaultSports;
    }
    
    // ========== 全局函数（供外部调用） ==========
    
    // 게임 실행
    window.launchGame = function(gameCode, supplierCode, supplierId) {
        console.log('게임 실행:', { gameCode, supplierCode, supplierId });
        
        if (!window.currentUser) {
            alert('로그인이 필요합니다.');
            window.location.href = 'login.html';
            return;
        }
        
        const gameUrl = `/to_game.html?game_code=${gameCode}&supplier_code=${supplierCode}&supplier_id=${supplierId || '1'}`;
        window.open(gameUrl, '_blank');
    };
    
    // 게임 이용 불가
    window.showGameUnavailable = function() {
        alert('현재 이 게임은 이용할 수 없습니다.');
    };
    
    // ========== 工具函数 ==========
    
    // 완전한 이미지 URL 생성
    function getFullImageUrl(imgPath) {
        if (!imgPath) return 'images/default-game.png';
        
        if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
            return imgPath;
        }
        
        if (imgPath.startsWith('/')) {
            return IMAGE_BASE + imgPath;
        }
        
        return 'images/default-game.png';
    }
    
    // 金额格式化
    function formatMoney(amount) {
        return parseFloat(amount || 0).toLocaleString();
    }
    
    // 获取根域名
    function getRootDomain() {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        
        if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
            return hostname;
        }
        
        if (parts.length >= 2) {
            return parts.slice(-2).join('.');
        }
        
        return hostname;
    }
    
    // ========== 事件绑定 ==========
    
    // 绑定登出按钮点击事件
    $(document).on('click', '#logoutBtn, .logout-btn, [href*="logout"]', function(e) {
        e.preventDefault();
        if (confirm('로그아웃 하시겠습니까?')) {
            handleLogout();
        }
    });
    
    // 处理需要登录才能访问的链接
    $(document).on('click', '.auth-required', function(e) {
        const token = localStorage.getItem('token');
        if (!token) {
            e.preventDefault();
            alert('로그인이 필요합니다.');
            window.location.href = 'login.html';
        }
    });
    
    // Bootstrap 모달 처理
    $(document).on('show.bs.modal hidden.bs.modal', function() {
        $('body').css('padding-right', '');
    });
    
    // ========== AJAX 全局设置 ==========
    
    // 为所有 AJAX 请求添加 Token（如果有）
    $.ajaxSetup({
        beforeSend: function(xhr) {
            const token = localStorage.getItem('token');
            if (token) {
                xhr.setRequestHeader('X-Token', token);
            }
        }
    });
    
    // 处理 AJAX 全局错误（401 未授权）
    $(document).ajaxError(function(event, xhr, settings, error) {
        if (xhr.status === 401) {
            // Token 过期或无效
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // 清除全局 currentUser 变量
            window.currentUser = null;
            alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
            window.location.href = 'login.html';
        }
    });
    
    // ========== 初始化 ==========
    
    // 页面加载时检查登录状态
    checkLoginStatus();
    
    // 初始化游戏系统
    initApp();
    
    // 初始化品牌 Swiper
    setTimeout(() => {
        if (typeof Swiper !== 'undefined') {
            new Swiper(".brandSwiper", {
                slidesPerView: 1,
                grid: { rows: 1 },
                spaceBetween: 10,
                pagination: {
                    el: ".brandSwiper .swiper-pagination",
                    clickable: true,
                },
            });
        }
    }, 500);
    
    // 定期检查登录状态（每5分钟）
    setInterval(function() {
        const token = localStorage.getItem('token');
        if (token) {
            validateToken(token);
        }
    }, 5 * 60 * 1000);
    
    // 监听其他标签页的 localStorage 变化
    window.addEventListener('storage', function(e) {
        if (e.key === 'token' || e.key === 'user') {
            checkLoginStatus();
        }
    });
});