from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    # 启动浏览器
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    # 启用控制台日志捕获
    page.on('console', lambda msg: print(f"Console: {msg.text}"))
    page.on('pageerror', lambda err: print(f"Page Error: {err}"))
    
    # 测试用户管理页面（正常页面）
    print("\n=== 测试用户管理页面 ===")
    page.goto('http://localhost:8077/#/system/user')
    page.wait_for_load_state('networkidle', timeout=10000)
    print("用户管理页面加载完成")
    
    # 测试角色管理页面（问题页面）
    print("\n=== 测试角色管理页面 ===")
    page.goto('http://localhost:8077/#/system/role')
    page.wait_for_load_state('networkidle', timeout=10000)
    print("角色管理页面加载完成")
    
    # 测试权限管理页面（问题页面）
    print("\n=== 测试权限管理页面 ===")
    page.goto('http://localhost:8077/#/system/permission')
    page.wait_for_load_state('networkidle', timeout=10000)
    print("权限管理页面加载完成")
    
    # 关闭浏览器
    browser.close()
