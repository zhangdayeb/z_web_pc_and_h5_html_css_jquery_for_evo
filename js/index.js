// js/index.js
// 首页登录状态管理和交互逻辑

$(document).ready(function() {
    
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
            $('#userMoney').text('₩' + parseFloat(user.money).toFixed(2));
        }
        
        // 更新VIP等级（如果需要显示）
        if (user.vip_grade !== undefined && $('#level').length) {
            $('#level').text('VIP ' + user.vip_grade);
        }
    }
    
    // 显示未登录状态
    function showLoggedOutState() {
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
            window.location.href = 'login.html';
        }
    }
    
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
            alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
            window.location.href = 'login.html';
        }
    });
    
    // 页面加载时检查登录状态
    checkLoginStatus();
    
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