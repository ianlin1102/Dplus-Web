/**
 * 卡项购买 API 测试页面
 * 测试 cardService.js 中的 createPurchaseOrder 函数
 *
 * 访问: /test/purchase-api
 */

import { useState, useCallback } from 'react';
import { createPurchaseOrder, getPurchaseDetail } from '../../services/cardService';
import { initDatabase, getDatabase } from '../../services/databaseService';

// 测试数据
const TEST_DATA = {
  cardId: 'test_card_001',
  paymentMethod: 'zelle',
  cardInfo: {
    CARD_TITLE: '测试卡项',
    CARD_PRICE: 100,
    CARD_TYPE: 1
  }
};

export default function PurchaseApiTest() {
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState({});

  // 添加日志
  const addLog = useCallback((type, message, detail = '') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, type, message, detail }]);
  }, []);

  // 清空日志
  const clearLogs = () => {
    setLogs([]);
    setResults({});
  };

  // 测试 1: 数据库连接
  const testDatabaseConnection = async () => {
    addLog('info', '测试 1: 数据库连接测试开始...');
    try {
      await initDatabase();
      const db = getDatabase();

      // 测试查询
      const result = await db.collection('ax_card_item').limit(1).get();

      addLog('success', '数据库连接成功!', `查询 ax_card_item 返回 ${result.data?.length || 0} 条记录`);
      return { success: true, db };
    } catch (error) {
      addLog('error', '数据库连接失败', error.message);
      return { success: false, error };
    }
  };

  // 测试 2: 创建购买订单
  const testCreatePurchaseOrder = async () => {
    addLog('info', '测试 2: 创建购买订单测试开始...');
    addLog('info', '测试数据:', JSON.stringify(TEST_DATA, null, 2));

    try {
      const result = await createPurchaseOrder({
        cardId: TEST_DATA.cardId,
        userId: 'test_user_' + Date.now(),
        userName: '测试用户',
        userPhone: '1234567890',
        paymentMethod: TEST_DATA.paymentMethod,
        cardInfo: TEST_DATA.cardInfo
      });

      addLog('success', '购买订单创建成功!', JSON.stringify(result, null, 2));
      // 打印完整结果以调试 recordId
      console.log('createPurchaseOrder 完整返回结果:', result);
      return { success: true, result };
    } catch (error) {
      addLog('error', '创建购买订单失败', error.message);
      return { success: false, error };
    }
  };

  // 测试 3: 验证购买记录
  const testVerifyPurchaseRecord = async (purchaseId, recordId) => {
    addLog('info', '测试 3: 验证购买记录...');
    addLog('info', `查询购买识别码: ${purchaseId}`);
    addLog('info', `记录 ID: ${recordId}`);
    addLog('info', '等待 2 秒让数据库同步...');

    // 等待一段时间让数据库同步
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const db = getDatabase();

      // 方法 1: 通过 PURCHASE_ID 查询
      addLog('info', '尝试通过 PURCHASE_ID 查询...');
      let res = await db.collection('ax_purchase_history')
        .where({
          PURCHASE_ID: purchaseId
        })
        .get();

      if (res.data && res.data.length > 0) {
        addLog('success', '购买记录验证成功! (通过 PURCHASE_ID 查询)', JSON.stringify(res.data[0], null, 2));
        return { success: true, record: res.data[0] };
      }

      // 方法 2: 通过 recordId 查询 (如果 PURCHASE_ID 查询失败)
      addLog('info', '通过 PURCHASE_ID 未找到，尝试通过 _id 查询...');
      if (recordId) {
        res = await db.collection('ax_purchase_history')
          .doc(recordId)
          .get();

        if (res.data && res.data.length > 0) {
          addLog('success', '购买记录验证成功! (通过 _id 查询)', JSON.stringify(res.data[0], null, 2));
          return { success: true, record: res.data[0] };
        }
      }

      // 方法 3: 查询所有测试数据
      addLog('info', '尝试查询所有测试订单...');
      res = await db.collection('ax_purchase_history')
        .where({
          PURCHASE_REMARK: '测试订单 - 可删除'
        })
        .orderBy('PURCHASE_ADD_TIME', 'desc')
        .limit(5)
        .get();

      if (res.data && res.data.length > 0) {
        addLog('success', `找到 ${res.data.length} 条测试记录`, JSON.stringify(res.data, null, 2));
        // 检查是否包含刚创建的记录
        const found = res.data.find(r => r.PURCHASE_ID === purchaseId);
        if (found) {
          addLog('success', '购买记录验证成功!');
          return { success: true, record: found };
        }
      }

      addLog('error', '验证失败: 无法找到购买记录', '可能是数据库安全规则限制了读取权限');
      return { success: false };
    } catch (error) {
      addLog('error', '验证购买记录失败', error.message);
      return { success: false, error };
    }
  };

  // 测试 4: 清理测试数据
  const testCleanupData = async (purchaseId) => {
    addLog('info', '测试 4: 清理测试数据...');

    try {
      const db = getDatabase();
      const result = await db.collection('ax_purchase_history')
        .where({ PURCHASE_ID: purchaseId })
        .remove();

      addLog('success', '测试数据清理成功!', `删除 ${result.deleted || 0} 条记录`);
      return { success: true };
    } catch (error) {
      addLog('warning', '清理测试数据失败 (可手动清理)', error.message);
      return { success: false, error };
    }
  };

  // 运行所有测试
  const runAllTests = async () => {
    setIsRunning(true);
    clearLogs();

    addLog('info', '========================================');
    addLog('info', '  卡项购买 API 测试开始');
    addLog('info', '  smartbeauty-web');
    addLog('info', '========================================');

    const testResults = {
      dbConnection: false,
      createOrder: false,
      verifyRecord: false,
      cleanup: false
    };

    try {
      // 测试 1: 数据库连接
      const dbResult = await testDatabaseConnection();
      testResults.dbConnection = dbResult.success;

      if (!dbResult.success) {
        throw new Error('数据库连接失败，终止测试');
      }

      // 测试 2: 创建购买订单
      const orderResult = await testCreatePurchaseOrder();
      testResults.createOrder = orderResult.success;

      if (!orderResult.success) {
        throw new Error('创建订单失败，终止测试');
      }

      const { purchaseId, recordId } = orderResult.result;

      // 测试 3: 验证购买记录
      const verifyResult = await testVerifyPurchaseRecord(purchaseId, recordId);
      testResults.verifyRecord = verifyResult.success;

      // 测试 4: 清理测试数据
      const cleanupResult = await testCleanupData(purchaseId);
      testResults.cleanup = cleanupResult.success;

    } catch (error) {
      addLog('error', '测试过程中发生错误', error.message);
    }

    // 输出测试报告
    addLog('info', '========================================');
    addLog('info', '  测试报告');
    addLog('info', '========================================');

    const passCount = Object.values(testResults).filter(v => v).length;
    const totalCount = Object.keys(testResults).length;

    addLog('info', `测试结果: ${passCount}/${totalCount} 通过`);

    if (passCount >= 3) {
      addLog('success', '卡项购买 API 功能正常! createPurchaseOrder 可以正常工作。');
    } else {
      addLog('warning', '部分测试未通过，请检查错误信息。');
    }

    setResults(testResults);
    setIsRunning(false);
  };

  // 获取日志样式
  const getLogStyle = (type) => {
    switch (type) {
      case 'success':
        return { color: '#22c55e', fontWeight: 'bold' };
      case 'error':
        return { color: '#ef4444', fontWeight: 'bold' };
      case 'warning':
        return { color: '#f59e0b' };
      default:
        return { color: '#6b7280' };
    }
  };

  // 获取日志前缀
  const getLogPrefix = (type) => {
    switch (type) {
      case 'success':
        return '[PASS]';
      case 'error':
        return '[FAIL]';
      case 'warning':
        return '[WARN]';
      default:
        return '[INFO]';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ marginBottom: '20px', color: '#1f2937' }}>
        卡项购买 API 测试
      </h1>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>测试说明</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280' }}>
          <li>测试 cardService.js 中的 createPurchaseOrder 函数</li>
          <li>检查数据库连接是否正常</li>
          <li>验证购买记录是否能正确保存到 ax_purchase_history 集合</li>
        </ul>

        <h3 style={{ margin: '15px 0 10px 0', color: '#374151' }}>测试数据</h3>
        <pre style={{
          backgroundColor: '#1f2937',
          color: '#e5e7eb',
          padding: '10px',
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '13px'
        }}>
          {JSON.stringify(TEST_DATA, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={runAllTests}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            backgroundColor: isRunning ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {isRunning ? '测试中...' : '运行测试'}
        </button>

        <button
          onClick={clearLogs}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          清空日志
        </button>
      </div>

      {/* 测试结果汇总 */}
      {Object.keys(results).length > 0 && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: Object.values(results).every(v => v) ? '#dcfce7' : '#fef3c7',
          borderRadius: '8px',
          border: `1px solid ${Object.values(results).every(v => v) ? '#86efac' : '#fcd34d'}`
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>测试结果汇总</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <div>1. 数据库连接: <span style={{ color: results.dbConnection ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
              {results.dbConnection ? 'PASS' : 'FAIL'}
            </span></div>
            <div>2. 创建购买订单: <span style={{ color: results.createOrder ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
              {results.createOrder ? 'PASS' : 'FAIL'}
            </span></div>
            <div>3. 验证购买记录: <span style={{ color: results.verifyRecord ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
              {results.verifyRecord ? 'PASS' : 'FAIL'}
            </span></div>
            <div>4. 清理测试数据: <span style={{ color: results.cleanup ? '#22c55e' : '#f59e0b', fontWeight: 'bold' }}>
              {results.cleanup ? 'PASS' : 'SKIP'}
            </span></div>
          </div>
        </div>
      )}

      {/* 测试日志 */}
      <div style={{
        backgroundColor: '#1f2937',
        borderRadius: '8px',
        padding: '15px',
        minHeight: '300px',
        maxHeight: '500px',
        overflow: 'auto'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#e5e7eb' }}>测试日志</h3>
        {logs.length === 0 ? (
          <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>
            点击 "运行测试" 开始测试...
          </div>
        ) : (
          <div style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6' }}>
            {logs.map((log, index) => (
              <div key={index}>
                <span style={{ color: '#9ca3af' }}>[{log.timestamp}]</span>
                <span style={getLogStyle(log.type)}> {getLogPrefix(log.type)} </span>
                <span style={{ color: '#e5e7eb' }}>{log.message}</span>
                {log.detail && (
                  <pre style={{
                    marginLeft: '80px',
                    marginTop: '5px',
                    marginBottom: '10px',
                    color: '#9ca3af',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}>
                    {log.detail}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
