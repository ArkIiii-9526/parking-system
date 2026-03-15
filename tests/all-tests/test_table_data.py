from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    # 导航到权限管理页面
    page.goto('http://localhost:8077/#/system/permission')
    page.wait_for_load_state('networkidle')
    
    # 截图保存
    page.screenshot(path='permission_page.png', full_page=True)
    
    # 检查表格数据
    table_rows = page.locator('.el-table__row').all()
    print(f"权限管理表格行数: {len(table_rows)}")
    
    # 导航到角色管理页面
    page.goto('http://localhost:8077/#/system/role')
    page.wait_for_load_state('networkidle')
    
    # 截图保存
    page.screenshot(path='role_page.png', full_page=True)
    
    # 检查表格数据
    table_rows = page.locator('.el-table__row').all()
    print(f"角色管理表格行数: {len(table_rows)}")
    
    # 导航到用户管理页面
    page.goto('http://localhost:8077/#/system/user')
    page.wait_for_load_state('networkidle')
    
    # 截图保存
    page.screenshot(path='user_page.png', full_page=True)
    
    # 检查表格数据
    table_rows = page.locator('.el-table__row').all()
    print(f"用户管理表格行数: {len(table_rows)}")
    
    # 查看控制台日志
    console_logs = page.evaluate("() => window.console.logs || []")
    if console_logs:
        print("控制台日志:")
        for log in console_logs:
            print(log)
    
    browser.close()