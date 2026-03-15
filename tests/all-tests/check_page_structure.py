from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    # 启动浏览器
    browser = p.chromium.launch(
        headless=True,
        executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    )
    page = browser.new_page()
    
    try:
        # 登录
        page.goto('http://localhost:8077/')
        page.wait_for_load_state('networkidle')
        
        # 输入用户名和密码
        page.fill('input[placeholder="请输入用户名"]', 'admin')
        page.fill('input[placeholder="请输入密码"]', 'admin123')
        
        # 点击登录按钮
        login_button = page.locator('.login-btn')
        login_button.wait_for(state='visible')
        login_button.click()
        page.wait_for_load_state('networkidle')
        
        # 导航到用户管理页面
        page.goto('http://localhost:8077/system/user')
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        
        # 打印页面结构
        print('=== 页面结构 ===')
        print(page.content())
        
    except Exception as e:
        print(f"错误: {e}")
    finally:
        browser.close()