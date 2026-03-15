from playwright.sync_api import sync_playwright
import time
import os
import datetime

class RBACTest:
    def __init__(self):
        self.test_results = []
        self.test_start_time = None
        self.test_end_time = None
        
    def add_test_result(self, test_name, expected, actual, status, error=None):
        result = {
            'test_name': test_name,
            'expected': expected,
            'actual': actual,
            'status': status,
            'error': error,
            'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        self.test_results.append(result)
    
    def generate_test_report(self):
        report_path = 'test_results/test_report.txt'
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write('=========================================\n')
            f.write('RBAC权限管理页面测试报告\n')
            f.write('=========================================\n')
            f.write(f'测试开始时间: {self.test_start_time}\n')
            f.write(f'测试结束时间: {self.test_end_time}\n')
            f.write(f'总测试用例数: {len(self.test_results)}\n')
            
            passed = sum(1 for r in self.test_results if r['status'] == 'PASS')
            failed = sum(1 for r in self.test_results if r['status'] == 'FAIL')
            f.write(f'通过用例数: {passed}\n')
            f.write(f'失败用例数: {failed}\n')
            f.write('=========================================\n')
            f.write('详细测试结果:\n')
            f.write('=========================================\n')
            
            for i, result in enumerate(self.test_results, 1):
                f.write(f'用例 {i}: {result["test_name"]}\n')
                f.write(f'  预期结果: {result["expected"]}\n')
                f.write(f'  实际结果: {result["actual"]}\n')
                f.write(f'  状态: {result["status"]}\n')
                if result["error"]:
                    f.write(f'  错误信息: {result["error"]}\n')
                f.write(f'  测试时间: {result["timestamp"]}\n')
                f.write('----------------------------------------\n')
            
            f.write('=========================================\n')
            f.write('测试总结:\n')
            f.write('=========================================\n')
            if failed == 0:
                f.write('所有测试用例通过，RBAC权限管理功能正常\n')
            else:
                f.write(f'有 {failed} 个测试用例失败，需要进一步检查\n')
            f.write('=========================================\n')
        print(f'测试报告已生成: {report_path}')

def test_system_pages():
    # 创建测试结果目录
    if not os.path.exists('test_results'):
        os.makedirs('test_results')
    
    test = RBACTest()
    test.test_start_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    with sync_playwright() as p:
        # 启动浏览器，使用系统已安装的Chrome
        browser = p.chromium.launch(
            headless=True,  # 使用无头模式避免权限问题
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'  # 指定Chrome浏览器路径
        )
        page = browser.new_page()
        
        try:
            # 访问登录页面
            print("\n1. 测试登录功能")
            page.goto('http://localhost:8077/')
            page.wait_for_load_state('networkidle')
            
            # 检查登录页面是否正确加载
            try:
                login_form = page.locator('form').first
                if login_form.is_visible():
                    test.add_test_result('登录页面加载', '登录表单可见', '登录表单可见', 'PASS')
                    print("登录页面加载成功")
                else:
                    test.add_test_result('登录页面加载', '登录表单可见', '登录表单不可见', 'FAIL')
                    print("登录页面加载失败")
                    page.screenshot(path='test_results/login_error.png')
            except Exception as e:
                test.add_test_result('登录页面加载', '登录表单可见', f'出现错误: {e}', 'FAIL', str(e))
                print(f"检查登录页面时出现错误: {e}")
                page.screenshot(path='test_results/login_error.png')
            
            # 登录操作
            page.fill('input[placeholder="请输入用户名"]', 'admin')  # 输入用户名
            page.fill('input[placeholder="请输入密码"]', 'admin123')  # 输入密码
            # 等待登录按钮出现并点击
            login_button = page.locator('.login-btn')
            login_button.wait_for(state='visible', timeout=60000)
            login_button.click()
            page.wait_for_load_state('networkidle', timeout=60000)
            
            # 检查登录是否成功
            try:
                # 检查是否进入首页（通过系统管理菜单是否存在）
                system_manage_link = page.locator('text=系统管理')
                if system_manage_link.is_visible():
                    test.add_test_result('登录功能', '登录成功并进入系统', '登录成功并进入系统', 'PASS')
                    print("登录成功")
                else:
                    test.add_test_result('登录功能', '登录成功并进入系统', '登录失败，未进入系统', 'FAIL')
                    print("登录失败")
                    page.screenshot(path='test_results/login_failed.png')
            except Exception as e:
                test.add_test_result('登录功能', '登录成功并进入系统', f'出现错误: {e}', 'FAIL', str(e))
                print(f"登录过程中出现错误: {e}")
                page.screenshot(path='test_results/login_failed.png')
            
            # 导航到系统管理菜单
            print("\n2. 测试系统管理菜单")
            # 直接通过URL导航到用户管理页面
            page.goto('http://localhost:8077/system/user')
            page.wait_for_load_state('networkidle', timeout=60000)
            
            # 测试用户管理页面
            print("\n3. 测试用户管理页面")
            
            # 检查用户管理页面是否正常加载
            try:
                user_table = page.locator('table').first
                if user_table.is_visible():
                    test.add_test_result('用户管理页面加载', '表格可见', '表格可见', 'PASS')
                    print("用户管理页面加载成功，表格可见")
                else:
                    test.add_test_result('用户管理页面加载', '表格可见', '表格不可见', 'FAIL')
                    print("用户管理页面加载失败，表格不可见")
                    page.screenshot(path='test_results/user_manage_error.png')
            except Exception as e:
                test.add_test_result('用户管理页面加载', '表格可见', f'出现错误: {e}', 'FAIL', str(e))
                print(f"检查用户管理页面表格时出现错误: {e}")
                page.screenshot(path='test_results/user_manage_error.png')
            
            # 测试用户管理功能
            print("\n4. 测试用户管理功能")
            
            # 测试搜索功能
            try:
                search_input = page.locator('input[placeholder="请输入用户名"]').first
                if search_input.is_visible():
                    search_input.fill('admin')
                    search_button = page.locator('button:has-text("搜索")').first
                    search_button.click()
                    page.wait_for_load_state('networkidle')
                    test.add_test_result('用户搜索功能', '搜索操作执行成功', '搜索操作执行成功', 'PASS')
                    print("用户搜索功能测试成功")
                else:
                    test.add_test_result('用户搜索功能', '搜索输入框可见', '搜索输入框不可见', 'FAIL')
                    print("用户搜索输入框不可见")
            except Exception as e:
                test.add_test_result('用户搜索功能', '搜索操作执行成功', f'出现错误: {e}', 'FAIL', str(e))
                print(f"测试用户搜索功能时出现错误: {e}")
                page.screenshot(path='test_results/user_search_error.png')
            
            # 测试新增用户按钮
            try:
                add_button = page.locator('button:has-text("新增用户")').first
                if add_button.is_visible():
                    test.add_test_result('新增用户按钮', '按钮可见', '按钮可见', 'PASS')
                    print("新增用户按钮可见")
                else:
                    test.add_test_result('新增用户按钮', '按钮可见', '按钮不可见', 'FAIL')
                    print("新增用户按钮不可见")
            except Exception as e:
                test.add_test_result('新增用户按钮', '按钮可见', f'出现错误: {e}', 'FAIL', str(e))
                print(f"检查新增用户按钮时出现错误: {e}")
            
            # 测试角色管理页面
            print("\n5. 测试角色管理页面")
            page.goto('http://localhost:8077/system/role')
            page.wait_for_load_state('networkidle', timeout=60000)
            time.sleep(2)  # 等待页面完全加载
            
            # 检查角色管理页面是否正常加载
            try:
                role_table = page.locator('table').first
                if role_table.is_visible():
                    test.add_test_result('角色管理页面加载', '表格可见', '表格可见', 'PASS')
                    print("角色管理页面加载成功，表格可见")
                else:
                    test.add_test_result('角色管理页面加载', '表格可见', '表格不可见', 'FAIL')
                    print("角色管理页面加载失败，表格不可见")
                    page.screenshot(path='test_results/role_manage_error.png')
            except Exception as e:
                test.add_test_result('角色管理页面加载', '表格可见', f'出现错误: {e}', 'FAIL', str(e))
                print(f"检查角色管理页面表格时出现错误: {e}")
                page.screenshot(path='test_results/role_manage_error.png')
            
            # 测试角色管理功能
            print("\n6. 测试角色管理功能")
            
            # 测试新增角色按钮
            try:
                add_button = page.locator('button:has-text("新增角色")').first
                if add_button.is_visible():
                    test.add_test_result('新增角色按钮', '按钮可见', '按钮可见', 'PASS')
                    print("新增角色按钮可见")
                else:
                    test.add_test_result('新增角色按钮', '按钮可见', '按钮不可见', 'FAIL')
                    print("新增角色按钮不可见")
            except Exception as e:
                test.add_test_result('新增角色按钮', '按钮可见', f'出现错误: {e}', 'FAIL', str(e))
                print(f"检查新增角色按钮时出现错误: {e}")
            
            # 测试权限管理页面
            print("\n7. 测试权限管理页面")
            page.goto('http://localhost:8077/system/permission')
            page.wait_for_load_state('networkidle', timeout=60000)
            time.sleep(2)  # 等待页面完全加载
            
            # 检查权限管理页面是否正常加载
            try:
                permission_table = page.locator('table').first
                if permission_table.is_visible():
                    test.add_test_result('权限管理页面加载', '表格可见', '表格可见', 'PASS')
                    print("权限管理页面加载成功，表格可见")
                else:
                    test.add_test_result('权限管理页面加载', '表格可见', '表格不可见', 'FAIL')
                    print("权限管理页面加载失败，表格不可见")
                    page.screenshot(path='test_results/permission_manage_error.png')
            except Exception as e:
                test.add_test_result('权限管理页面加载', '表格可见', f'出现错误: {e}', 'FAIL', str(e))
                print(f"检查权限管理页面表格时出现错误: {e}")
                page.screenshot(path='test_results/permission_manage_error.png')
            
            # 测试权限管理功能
            print("\n8. 测试权限管理功能")
            
            # 测试新增权限按钮
            try:
                add_button = page.locator('button:has-text("新增权限")').first
                if add_button.is_visible():
                    test.add_test_result('新增权限按钮', '按钮可见', '按钮可见', 'PASS')
                    print("新增权限按钮可见")
                else:
                    test.add_test_result('新增权限按钮', '按钮可见', '按钮不可见', 'FAIL')
                    print("新增权限按钮不可见")
            except Exception as e:
                test.add_test_result('新增权限按钮', '按钮可见', f'出现错误: {e}', 'FAIL', str(e))
                print(f"检查新增权限按钮时出现错误: {e}")
            
            # 测试页面切换是否流畅
            print("\n9. 测试页面切换流畅度")
            start_time = time.time()
            
            # 多次切换页面
            for i in range(3):
                try:
                    page.goto('http://localhost:8077/system/user')
                    page.wait_for_load_state('networkidle', timeout=60000)
                    
                    page.goto('http://localhost:8077/system/role')
                    page.wait_for_load_state('networkidle', timeout=60000)
                    
                    page.goto('http://localhost:8077/system/permission')
                    page.wait_for_load_state('networkidle', timeout=60000)
                except Exception as e:
                    test.add_test_result(f'页面切换测试 {i+1}', '切换成功', f'出现错误: {e}', 'FAIL', str(e))
                    print(f"页面切换时出现错误: {e}")
                    page.screenshot(path=f'test_results/switch_error_{i}.png')
            
            end_time = time.time()
            total_time = end_time - start_time
            print(f"页面切换3次总耗时: {total_time:.2f}秒")
            if total_time < 10:
                test.add_test_result('页面切换流畅度', '切换时间小于10秒', f'切换时间为{total_time:.2f}秒', 'PASS')
                print("页面切换流畅，无明显卡顿")
            else:
                test.add_test_result('页面切换流畅度', '切换时间小于10秒', f'切换时间为{total_time:.2f}秒', 'FAIL')
                print("页面切换可能存在卡顿")
            
            # 检查浏览器控制台是否有错误
            console_errors = []
            def capture_console(message):
                if message.type == 'error':
                    console_errors.append(message.text)
            
            page.on('console', capture_console)
            # 触发一些操作，观察控制台
            try:
                user_manage_link = page.locator('text=用户管理')
                user_manage_link.wait_for(state='visible', timeout=60000)
                user_manage_link.click()
                page.wait_for_load_state('networkidle')
            except Exception as e:
                print(f"触发操作时出现错误: {e}")
            
            if console_errors:
                test.add_test_result('浏览器控制台', '无错误', f'存在{len(console_errors)}个错误', 'FAIL')
                print("\n浏览器控制台错误:")
                for error in console_errors:
                    print(f"- {error}")
                # 保存控制台错误到文件
                with open('test_results/console_errors.txt', 'w') as f:
                    for error in console_errors:
                        f.write(f"- {error}\n")
                print("已保存浏览器控制台错误到文件")
            else:
                test.add_test_result('浏览器控制台', '无错误', '无错误', 'PASS')
                print("\n浏览器控制台无错误")
                
        except Exception as e:
            test.add_test_result('整体测试', '测试完成', f'测试过程中出现错误: {e}', 'FAIL', str(e))
            print(f"测试过程中出现错误: {e}")
            # 保存错误信息到文件
            with open('test_results/test_error.txt', 'w') as f:
                f.write(f"测试过程中出现错误: {e}\n")
            print("已保存测试错误信息到文件")
        finally:
            # 关闭浏览器
            browser.close()
            test.test_end_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            test.generate_test_report()
            print("\n测试完成，浏览器已关闭")
            print("\n测试结果已保存到 test_results 目录")

if __name__ == "__main__":
    test_system_pages()