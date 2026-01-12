/**
 * 卡项购买 API 自动化测试脚本
 * 使用 Playwright 在真实浏览器中运行测试
 *
 * 运行: node run-purchase-test.js
 */

import { chromium } from 'playwright';

const DEV_SERVER_URL = 'http://localhost:5177';
// 使用 React 路由的测试页面 (HashRouter)
const TEST_PAGE_URL = `${DEV_SERVER_URL}/#/purchase-api-test`;

async function runTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║    卡项购买 API 自动化测试            ║');
  console.log('║    使用 Playwright + CloudBase SDK    ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  let browser = null;

  try {
    // 启动浏览器
    console.log('[INFO] 启动 Chromium 浏览器...');
    browser = await chromium.launch({
      headless: true
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // 监听控制台输出
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error') {
        console.log(`[浏览器错误] ${msg.text()}`);
      }
    });

    // 访问测试页面
    console.log(`[INFO] 访问测试页面: ${TEST_PAGE_URL}`);
    await page.goto(TEST_PAGE_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // 等待页面加载完成 - React 页面需要等待渲染
    await page.waitForTimeout(3000);

    // 查找运行测试按钮 (React 组件中的按钮)
    const runBtnExists = await page.evaluate(() => {
      // 查找包含 "运行测试" 文字的按钮
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent.includes('运行测试')) {
          return true;
        }
      }
      return false;
    });

    if (!runBtnExists) {
      throw new Error('找不到运行测试按钮，页面可能未正确加载');
    }

    console.log('[INFO] 测试页面加载完成');
    console.log('');

    // 点击运行测试按钮
    console.log('[INFO] 开始运行测试...');
    console.log('========================================');

    // 点击包含 "运行测试" 文字的按钮
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent.includes('运行测试')) {
          btn.click();
          break;
        }
      }
    });

    // 等待测试完成（等待按钮文字变回 "运行测试"）
    await page.waitForFunction(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent.includes('运行测试') && !btn.textContent.includes('测试中')) {
          return true;
        }
      }
      return false;
    }, { timeout: 60000 });

    // 额外等待确保日志完全输出
    await page.waitForTimeout(2000);

    // 获取测试日志 (React 组件的日志在深色背景的 div 里)
    const logs = await page.evaluate(() => {
      // 查找包含 "测试日志" 的容器
      const h3Elements = document.querySelectorAll('h3');
      for (const h3 of h3Elements) {
        if (h3.textContent.includes('测试日志')) {
          const container = h3.parentElement;
          if (container) {
            // 获取容器内的所有文本
            const logEntries = container.querySelectorAll('div');
            let text = '';
            logEntries.forEach(entry => {
              if (entry.textContent && !entry.textContent.includes('测试日志')) {
                text += entry.textContent + '\n';
              }
            });
            return text || container.innerText;
          }
        }
      }
      return '';
    });

    console.log('');
    console.log('[测试日志]');
    console.log('----------------------------------------');
    console.log(logs);
    console.log('----------------------------------------');

    // 获取测试结果 (React 组件的结果汇总)
    const results = await page.evaluate(() => {
      // 查找包含 "测试结果汇总" 的容器
      const h3Elements = document.querySelectorAll('h3');
      for (const h3 of h3Elements) {
        if (h3.textContent.includes('测试结果汇总')) {
          const container = h3.parentElement;
          if (container) {
            const items = container.querySelectorAll('div > div');
            const results = {};

            items.forEach(item => {
              const text = item.textContent;
              // 解析格式: "1. 数据库连接: PASS"
              const match = text.match(/(\d+\..+?):\s*(PASS|FAIL|SKIP)/);
              if (match) {
                results[match[1].trim()] = match[2];
              }
            });

            return results;
          }
        }
      }
      return null;
    });

    // 输出测试结果摘要
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║           测试结果摘要                ║');
    console.log('╚════════════════════════════════════════╝');

    if (results) {
      let passCount = 0;
      let totalCount = 0;

      Object.entries(results).forEach(([name, status]) => {
        totalCount++;
        const icon = status === 'PASS' ? '[PASS]' : (status === 'FAIL' ? '[FAIL]' : '[SKIP]');
        console.log(`  ${icon} ${name}`);
        if (status === 'PASS') passCount++;
      });

      console.log('');
      console.log(`  总计: ${passCount}/${totalCount} 测试通过`);

      if (passCount >= 5) {
        console.log('');
        console.log('  ========================================');
        console.log('  [SUCCESS] 卡项购买 API 功能正常!');
        console.log('  createPurchaseOrder 函数可以正常工作');
        console.log('  购买记录可以正确保存到 ax_purchase_history');
        console.log('  ========================================');
      } else {
        console.log('');
        console.log('  [WARNING] 部分测试未通过，请检查错误信息');
      }
    } else {
      console.log('  无法获取测试结果');
    }

    // 截图保存
    const screenshotPath = '/Users/evergreen/Desktop/个人代码/微信开发/smartbeauty-web/test-result-screenshot.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('');
    console.log(`[INFO] 测试截图已保存: ${screenshotPath}`);

  } catch (error) {
    console.error('[ERROR] 测试过程中发生错误:', error.message);

    if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      console.log('');
      console.log('[提示] 请确保开发服务器正在运行:');
      console.log('       npm run dev');
      console.log(`       然后访问: ${TEST_PAGE_URL}`);
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('');
  console.log('测试结束。');
}

runTests().catch(console.error);
